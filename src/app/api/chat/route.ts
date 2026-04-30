import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { visitor_id, message } = body;

    if (!visitor_id || typeof visitor_id !== 'string') {
      return NextResponse.json({ error: 'visitor_id inválido' }, { status: 400 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Mensagem muito longa (máximo 500 caracteres)' },
        { status: 400 }
      );
    }

    if (isRateLimited(`ip:${ip}`) || isRateLimited(`visitor:${visitor_id}`)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Por favor, aguarde um momento.' },
        { status: 429 }
      );
    }

    const { data: user } = await supabaseServer
      .from('public_users')
      .select('id')
      .eq('visitor_id', visitor_id)
      .single();

    const user_id = user?.id || null;

    const { data: contents } = await supabaseServer
      .from('public_content')
      .select('id, title, embed_url, primary_url, short_summary, tags')
      .eq('published', true);

    const apiKey = process.env.GEMINI_API_KEY;
    let answer = '';
    let recommended_content: any[] = [];
    let sources: string[] = [];

    if (!apiKey || apiKey === 'sua_chave_aqui') {
      answer = 'Olá! Sou o Brisinha. No momento estou sem minha conexão cerebral (API Key), mas posso te dizer que a Mar Brasil foca em climatização de escolas públicas!';
    } else {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

      const cultureContext = `
        Você é o "Brisinha", o embaixador inteligente da Mar Brasil Climatização.
        Sua personalidade: Amigável, técnico, inspirador e muito orgulhoso da empresa.
        
        CONHECIMENTO BASE (Manual de Cultura):
        - Foco: Climatização com Autossuficiência Energética para Escolas Públicas.
        - Missão: Melhorar a educação no Brasil através do ar puro e conforto térmico.
        - Valores: Meritocracia Afetiva (mérito + empatia), Doutrina Operacional (Respeito, Disciplina, Técnica, Limpeza, Segurança).
        - Símbolo: O Hexágono (União e Resistência).
        - Lema: "O nosso compromisso é com a qualidade do ar que você respira".

        REGRAS DE RESPOSTA:
        1. Se o usuário disser "Ola", "Oi" ou saudações, responda de forma calorosa e convide-o a conhecer a cultura.
        2. Responda sempre com base nos valores da Mar Brasil.
        3. Mantenha as respostas curtas e diretas (máximo 3 parágrafos).
        4. NÃO use o tema "mar/oceano" literalmente, foque em climatização e educação.
      `;

      const prompt = `
        Contexto: ${cultureContext}
        Mensagem do Usuário: "${message}"
        
        Responda como o Brisinha:
      `;

      const result = await model.generateContent(prompt);
      answer = result.response.text().trim();
    }

    await supabaseServer.from('chat_history').insert({
      visitor_id,
      user_id,
      message_user: message,
      message_brisinha: answer,
      sources: sources,
    });

    await supabaseServer.from('events').insert({
      visitor_id,
      user_id,
      event_name: 'chat_message',
      event_payload: { message_length: message.length },
    });

    return NextResponse.json({
      answer,
      recommended_content,
      sources,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
