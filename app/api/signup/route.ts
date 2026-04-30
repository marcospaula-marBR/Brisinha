import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { validateSignupPayload, normalizeEmail, normalizePhone } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    try {
      validateSignupPayload(body);
    } catch (valError: any) {
      return NextResponse.json({ error: valError.message }, { status: 400 });
    }

    const { visitor_id, name, email, phone, consent } = body;

    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(phone);

    const { data: user, error: userError } = await supabaseServer
      .from('public_users')
      .upsert(
        {
          visitor_id,
          name,
          email: cleanEmail,
          phone: cleanPhone,
          consent_at: new Date().toISOString(),
        },
        { onConflict: 'visitor_id' }
      )
      .select('id')
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: userError?.message || 'Erro ao salvar usuário' },
        { status: 500 }
      );
    }

    await supabaseServer.from('events').insert([
      {
        visitor_id,
        user_id: user.id,
        event_name: 'consent_granted',
        event_payload: { consent },
      },
      {
        visitor_id,
        user_id: user.id,
        event_name: 'signup_completed',
        event_payload: { email: cleanEmail },
      },
    ]);

    return NextResponse.json({
      user_id: user.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
