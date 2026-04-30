'use client';

import React, { useState } from 'react';
import VoiceInput from './VoiceInput';

interface InlineSignupProps {
  visitorId: string;
  onComplete: (userName: string) => void;
  onCancel: () => void;
}

export default function InlineSignup({ visitorId, onComplete, onCancel }: InlineSignupProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    setError('');
    if (step === 1 && name.trim().length < 2) {
      setError('Por favor, informe seu nome.');
      return;
    }
    if (step === 2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    if (step === 3 && phone.replace(/\D/g, '').length < 10) {
      setError('Por favor, informe um telefone com DDD.');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { setError('Você precisa aceitar o consentimento.'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, name, email, phone, consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar.');
      onComplete(name.split(' ')[0]);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
      setIsSubmitting(false);
    }
  };

  const handleVoice = (text: string) => {
    const clean = text.replace(/\.$/, '').trim();
    if (step === 1) setName(clean);
    if (step === 2) setEmail(clean.toLowerCase().replace(/\s/g, ''));
    if (step === 3) setPhone(clean.replace(/\D/g, ''));
  };

  return (
    <div className="inline-signup">
      <div className="inline-signup-header">
        <span className="inline-signup-step">Passo {step} de {step < 4 ? '3' : '3'}</span>
        <button className="inline-signup-cancel" onClick={onCancel} aria-label="Cancelar cadastro">✕</button>
      </div>

      {error && <div className="inline-signup-error">{error}</div>}

      <form onSubmit={handleSubmit} className="inline-signup-form">
        {step === 1 && (
          <div className="inline-signup-field">
            <label>Como posso te chamar?</label>
            <div className="inline-input-group">
              <input id="signup-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" autoFocus />
              <VoiceInput onTranscript={handleVoice} />
            </div>
            <button type="button" className="inline-signup-btn" onClick={handleNext}>Continuar →</button>
          </div>
        )}
        {step === 2 && (
          <div className="inline-signup-field">
            <label>Qual o seu e-mail?</label>
            <div className="inline-input-group">
              <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" autoFocus />
              <VoiceInput onTranscript={handleVoice} />
            </div>
            <div className="inline-btn-row">
              <button type="button" className="inline-signup-btn-secondary" onClick={() => setStep(1)}>← Voltar</button>
              <button type="button" className="inline-signup-btn" onClick={handleNext}>Continuar →</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="inline-signup-field">
            <label>E seu WhatsApp?</label>
            <div className="inline-input-group">
              <input id="signup-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" autoFocus />
              <VoiceInput onTranscript={handleVoice} />
            </div>
            <div className="inline-btn-row">
              <button type="button" className="inline-signup-btn-secondary" onClick={() => setStep(2)}>← Voltar</button>
              <button type="button" className="inline-signup-btn" onClick={handleNext}>Continuar →</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="inline-signup-field">
            <p className="inline-signup-summary">
              <strong>{name}</strong> · {email} · {phone}
            </p>
            <label className="inline-consent">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
              <span>Concordo em receber comunicações e autorizo o tratamento dos meus dados conforme as diretrizes da Mar Brasil.</span>
            </label>
            <div className="inline-btn-row">
              <button type="button" className="inline-signup-btn-secondary" onClick={() => setStep(3)}>← Voltar</button>
              <button type="submit" className="inline-signup-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Cadastrando...' : 'Finalizar ✓'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
