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

    const lowerMessage = message.toLowerCase();
    let answer = '';
    let recommended_content: any[] = [];
    let sources: string[] = [];

    const restrictedKeywords = ['salario', 'faturamento', 'senha', 'interno', 'restrito', 'documento', 'contrato'];
    const isRestricted = restrictedKeywords.some((kw) => lowerMessage.includes(kw));

    if (isRestricted) {
      answer = 'O MVP do Brisinha cobre apenas materiais públicos. Para informações internas ou restritas, por favor utilize os canais oficiais da empresa.';
    } else {
      const matchingContent = contents?.find((item: any) => {
        const titleMatch = item.title.toLowerCase().includes(lowerMessage);
        let tagsMatch = false;
        try {
          const tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
          tagsMatch = Array.isArray(tags) && tags.some((t: string) => lowerMessage.includes(t.toLowerCase()));
        } catch {}
        
        const isCulturaQuery = lowerMessage.includes('cultura') || lowerMessage.includes('onboarding') || lowerMessage.includes('institucional');
        const isCulturaItem = item.title.includes('Cultura Mar Brasil');

        return titleMatch || tagsMatch || (isCulturaQuery && isCulturaItem);
      });

      if (matchingContent) {
        answer = `Encontrei um conteúdo relevante para você: **${matchingContent.title}**.`;
        recommended_content.push({
          title: matchingContent.title,
          embed_url: matchingContent.embed_url,
          primary_url: matchingContent.primary_url,
          short_summary: matchingContent.short_summary,
        });
        sources.push(matchingContent.primary_url);
      } else {
        answer = 'No momento, não encontrei materiais públicos específicos sobre esse assunto na minha base de dados.';
      }
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
