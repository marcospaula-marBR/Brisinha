import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Cache em memória — evita chamar Gemini a cada primeiro acesso
let cachedIntro: { short: string; long: string } | null = null;

const VIDEO_URL = 'https://youtu.be/KcCJkbBKNdM';
const CULTURA_PAGE_URL = 'https://marbr.com.br/cultura.html';

// Contexto fixo usado quando o fetch da página falhar
const CULTURA_FALLBACK_TEXT = `
Mar Brasil é uma empresa que une paixão pelo oceano, surf, esportes aquáticos e sustentabilidade.
Nossa cultura valoriza autenticidade, liberdade, inovação e profundo respeito ao mar e ao meio ambiente.
Acreditamos em pessoas apaixonadas, times unidos e um propósito maior: conectar as pessoas ao mar de forma responsável.
Nossos valores: Transparência, Coragem, Colaboração, Sustentabilidade e Alegria.
`;

const FALLBACK_RESPONSE = {
  short: 'A Mar Brasil vive o mar! Venha conhecer nossa cultura de paixão, propósito e conexão com o oceano.',
  long: 'A Mar Brasil é uma empresa apaixonada pelo oceano e pela cultura do mar. Nossos valores de autenticidade, coragem e sustentabilidade nos guiam a cada dia. Aqui você vai descobrir nossa essência, nossa missão e o que nos une como time. Que tal começar pelo nosso vídeo de cultura?',
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
Com base no conteúdo abaixo sobre a cultura da empresa Mar Brasil, gere DOIS textos em português brasileiro informal e caloroso:

1. CURTO (para leitura em voz alta, máximo 2 frases, ~150 caracteres): Uma frase de apresentação vibrante do Manual de Cultura Mar Brasil.
2. LONGO (para exibição em balão de chat, máximo 4 frases, ~400 caracteres): Um resumo envolvente dos valores e essência da cultura Mar Brasil, convidando o usuário a explorar mais.

Responda APENAS no formato JSON puro, sem markdown, sem explicação:
{"short": "...", "long": "..."}

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
