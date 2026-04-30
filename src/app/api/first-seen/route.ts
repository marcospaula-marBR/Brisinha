import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { visitor_id } = body;

    if (!visitor_id || typeof visitor_id !== 'string') {
      return NextResponse.json({ error: 'visitor_id inválido' }, { status: 400 });
    }

    const { data: visitor, error: visitorError } = await supabaseServer
      .from('visitors')
      .select('visitor_id')
      .eq('visitor_id', visitor_id)
      .single();

    let is_first_time = false;

    if (visitorError && visitorError.code === 'PGRST116') {
      is_first_time = true;

      await supabaseServer.from('visitors').insert({
        visitor_id,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      });

      await supabaseServer.from('events').insert({
        visitor_id,
        event_name: 'first_seen',
        event_payload: {},
      });
    } else if (visitor) {
      await supabaseServer
        .from('visitors')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('visitor_id', visitor_id);
    } else {
      return NextResponse.json({ error: 'Erro ao buscar visitante' }, { status: 500 });
    }

    const { data: user } = await supabaseServer
      .from('public_users')
      .select('id, name')
      .eq('visitor_id', visitor_id)
      .single();

    const has_profile = !!user;
    const user_name = user?.name ? (user.name as string).split(' ')[0] : null;

    return NextResponse.json({
      is_first_time,
      has_profile,
      user_name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
