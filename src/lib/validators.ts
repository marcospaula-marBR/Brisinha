export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function validateSignupPayload(payload: {
  visitor_id: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}) {
  if (!payload.visitor_id || typeof payload.visitor_id !== 'string') {
    throw new Error('visitor_id inválido ou ausente');
  }
  if (!payload.name || typeof payload.name !== 'string' || payload.name.trim().length < 2) {
    throw new Error('Nome inválido (mínimo 2 caracteres)');
  }
  if (!payload.email || !validateEmail(payload.email)) {
    throw new Error('E-mail inválido');
  }
  if (!payload.phone || !validatePhone(payload.phone)) {
    throw new Error('Telefone inválido (deve conter DDD + número)');
  }
  if (payload.consent !== true) {
    throw new Error('O consentimento é obrigatório');
  }
}
