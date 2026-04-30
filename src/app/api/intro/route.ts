import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Cache em memória — evita chamar Gemini a cada primeiro acesso
let cachedIntro: { short: string; long: string } | null = null;

const VIDEO_URL = 'https://youtu.be/KcCJkbBKNdM';
const CULTURA_PAGE_URL = 'https://marbr.com.br/cultura.html';

// Contexto fixo usado quando o fetch da página falhar
const CULTURA_FALLBACK_TEXT = `
Mar Brasil Climatização é especialista em Climatização com Autossuficiência Energética para Escolas Públicas.
Nossa missão é levar conforto térmico e máxima qualidade do ar para alunos e professores em todo o Brasil.
Nossa cultura é baseada na Meritocracia Afetiva e na Doutrina Operacional (Respeito, Disciplina, Técnica, Limpeza e Segurança).
Nosso símbolo é o Hexágono, representando nossa união, inteligência coletiva e resistência.
Lema: "O nosso compromisso é com a qualidade do ar que você respira".
`;

const FALLBACK_RESPONSE = {
  short: 'Bem-vindo! Sou o Brisinha. Vamos transformar a educação no Brasil através da climatização sustentável!',
  long: 'A Mar Brasil é movida pelo propósito de levar conforto térmico e ar puro para as escolas públicas do nosso país. Nossa essência é técnica, humana e sustentável. Aqui você vai descobrir como o nosso Hexágono nos une em torno da Meritocracia Afetiva. Que tal começar pelo nosso vídeo de cultura?',
  videoUrl: VIDEO_URL,
  culturaUrl: CULTURA_PAGE_URL,
};

export async function GET() {
  // Retorna cache se disponível
  if (cachedIntro) {
    return NextResponse.json({ ...cachedIntro, videoUrl: VIDEO_URL, culturaUrl: CULTURA_PAGE_URL });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'sua_chave_aqui') {
    console.warn('[/api/intro] GEMINI_API_KEY não configurada — usando fallback');
    return NextResponse.json(FALLBACK_RESPONSE);
  }

  // Tenta buscar o HTML da página de cultura (timeout 5s)
  let culturaText = CULTURA_FALLBACK_TEXT;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(CULTURA_PAGE_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const html = await res.text();
      const extracted = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000);
      if (extracted.length > 100) {
        culturaText = extracted;
        console.log('[/api/intro] cultura.html carregado — chars:', extracted.length);
      }
    }
  } catch (fetchErr: any) {
    console.warn('[/api/intro] Fetch cultura.html falhou, usando texto fixo:', fetchErr?.message);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

    const prompt = `
      Você é o "Brisinha", embaixador da cultura Mar Brasil Climatização.
      Baseado no conteúdo abaixo, gere DOIS textos calorosos e inspiradores:

      DIRETRIZES:
      - Foque em Climatização, Escolas Públicas e Qualidade do Ar.
      - Use os termos "Meritocracia Afetiva" e o símbolo do "Hexágono".
      - NÃO mencione oceanos ou praias. O "Mar" no nome é institucional.
      - O tom deve ser vibrante, humano e focado em transformar a educação.

      1. CURTO (Voz alta, ~150 caracteres): Apresentação vibrante focada em climatização e educação.
      2. LONGO (Chat, ~400 caracteres): Resumo envolvente dos valores (Respeito, Disciplina, Técnica, Limpeza, Segurança) e do propósito de cuidar do ar que respiramos.

      Responda APENAS JSON puro: {"short": "...", "long": "..."}

      Conteúdo:
      ${culturaText}
    `.trim();

    console.log('[/api/intro] Chamando Gemini...');
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log('[/api/intro] Resposta Gemini raw:', text.slice(0, 300));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`JSON não encontrado na resposta: ${text.slice(0, 100)}`);

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.short || !parsed.long) throw new Error('Campos short/long ausentes');

    cachedIntro = { short: parsed.short, long: parsed.long };
    console.log('[/api/intro] ✓ Cache salvo');

    return NextResponse.json({
      short: cachedIntro.short,
      long: cachedIntro.long,
      videoUrl: VIDEO_URL,
      culturaUrl: CULTURA_PAGE_URL,
    });
  } catch (geminiErr: any) {
    console.error('[/api/intro] Erro Gemini:', geminiErr?.message || geminiErr);
    return NextResponse.json(FALLBACK_RESPONSE);
  }
}
