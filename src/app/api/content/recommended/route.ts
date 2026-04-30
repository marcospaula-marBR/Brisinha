import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const { data: contents, error } = await supabaseServer
      .from('public_content')
      .select('title, embed_url, primary_url, short_summary, tags')
      .eq('published', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const recommended = contents.filter((item: any) => {
      try {
        const tags = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
        return Array.isArray(tags) && tags.includes('onboarding');
      } catch {
        return false;
      }
    }).map((item: any) => ({
      title: item.title,
      embed_url: item.embed_url,
      primary_url: item.primary_url,
      short_summary: item.short_summary,
    }));

    return NextResponse.json(recommended);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
