'use client';

import React, { useState } from 'react';
import VoiceInput from './VoiceInput';

interface OnboardingProps {
  visitorId: string;
  onComplete: (userId: string) => void;
}

export default function Onboarding({ visitorId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => {
    setError('');
    if (step === 1 && (!name || name.trim().length < 2)) {
      setError('Por favor, informe seu nome.');
      return;
    }
    if (step === 2 && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    if (step === 3 && (!phone || phone.replace(/\D/g, '').length < 10)) {
      setError('Por favor, informe um telefone válido (com DDD).');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consent) {
      setError('Você precisa aceitar os termos de consentimento.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: visitorId,
          name,
          email,
          phone,
          consent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro.');
      }

      onComplete(data.user_id);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
      setIsSubmitting(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    const cleanText = text.replace(/\.$/, '').trim();
    if (step === 1) setName(cleanText);
    if (step === 2) setEmail(cleanText.toLowerCase().replace(/\s/g, ''));
    if (step === 3) setPhone(cleanText.replace(/\D/g, ''));
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="avatar-wrapper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BrisinhAI.jpeg" alt="Brisinha Avatar" className="brisinha-avatar-small" />
        </div>
        
        <h2>Olá! Sou o Brisinha.</h2>
        <p className="subtitle">Para começarmos, preciso de algumas informações rápidas.</p>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="onboarding-form">
          {step === 1 && (
            <div className="form-step">
              <label htmlFor="name">Como posso te chamar?</label>
              <div className="input-with-voice">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  autoFocus
                />
                <VoiceInput onTranscript={handleVoiceTranscript} />
              </div>
              <button type="button" onClick={nextStep} className="primary-btn">
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <label htmlFor="email">Qual o seu e-mail?</label>
              <div className="input-with-voice">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  autoFocus
                />
                <VoiceInput onTranscript={handleVoiceTranscript} />
              </div>
              <div className="button-group">
                <button type="button" onClick={prevStep} className="secondary-btn">
                  Voltar
                </button>
                <button type="button" onClick={nextStep} className="primary-btn">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <label htmlFor="phone">E seu telefone para contato?</label>
              <div className="input-with-voice">
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  autoFocus
                />
                <VoiceInput onTranscript={handleVoiceTranscript} />
              </div>
              <div className="button-group">
                <button type="button" onClick={prevStep} className="secondary-btn">
                  Voltar
                </button>
                <button type="button" onClick={nextStep} className="primary-btn">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-step">
              <h3>Confirme seus dados</h3>
              <div className="summary-box">
                <p><strong>Nome:</strong> {name}</p>
                <p><strong>E-mail:</strong> {email}</p>
                <p><strong>Telefone:</strong> {phone}</p>
              </div>

              <div className="consent-checkbox">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <label htmlFor="consent">
                  Eu concordo em receber comunicações e autorizo o tratamento dos meus dados conforme as diretrizes da Mar Brasil.
                </label>
              </div>

              <div className="button-group">
                <button type="button" onClick={prevStep} className="secondary-btn" disabled={isSubmitting}>
                  Voltar
                </button>
                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Cadastrando...' : 'Finalizar e Acessar'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
