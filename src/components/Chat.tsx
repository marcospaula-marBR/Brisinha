'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoiceInput from './VoiceInput';
import CultureBubble from './CultureBubble';
import InlineSignup from './InlineSignup';
import { useSpeech } from '@/lib/useSpeech';

interface Message {
  id: string;
  sender: 'user' | 'brisinha';
  text: string;
  type?: 'text' | 'culture' | 'invite' | 'signup' | 'welcome_back';
  cultureData?: { long: string; videoUrl: string; culturaUrl: string };
  recommendedContent?: any[];
  createdAt: Date;
}

interface ChatProps {
  visitorId: string;
  hasProfile: boolean;
  userName: string | null;
  isFirstVisit: boolean;
}

type SignupPhase = 'none' | 'invited' | 'form' | 'done';

export default function Chat({ visitorId, hasProfile: initialHasProfile, userName: initialUserName, isFirstVisit }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIntroLoading, setIsIntroLoading] = useState(isFirstVisit);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [signupPhase, setSignupPhase] = useState<SignupPhase>('none');
  const [hasProfile, setHasProfile] = useState(initialHasProfile);
  const [userName, setUserName] = useState<string | null>(initialUserName);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak } = useSpeech();
  const greeted = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCulture = useCallback(async () => {
    setIsIntroLoading(true);
    const introController = new AbortController();
    const introTimeout = setTimeout(() => introController.abort(), 8000);

    try {
      const res = await fetch('/api/intro', { signal: introController.signal });
      const data = await res.json();
      clearTimeout(introTimeout);

      const introMsg: Message = {
        id: 'culture-intro-' + Date.now(),
        sender: 'brisinha',
        text: data.long || '',
        type: 'culture',
        cultureData: {
          long: data.long,
          videoUrl: data.videoUrl,
          culturaUrl: data.culturaUrl,
        },
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, introMsg]);
      setTimeout(() => speak(data.short || data.long), 1500);
    } catch (e) {
      console.error('Falha ao carregar cultura', e);
    } finally {
      setIsIntroLoading(false);
    }
  }, [speak]);

  // Saudação por voz + carregamento do intro
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;

    const greeting = hasProfile && userName
      ? `Olá, ${userName}! Que bom te ver de novo!`
      : 'Olá! Eu sou o Brisinha, o assistente da Mar Brasil. Que bom que você está aqui!';

    const timer = setTimeout(() => speak(greeting), 800);

    if (isFirstVisit) {
      fetchCulture();
    } else {
      setMessages([{
        id: 'welcome',
        sender: 'brisinha',
        text: hasProfile && userName
          ? `Que saudade, ${userName}! Como posso te ajudar a transformar a educação hoje?`
          : 'Olá! Sou o Brisinha. Quer que eu te conte um pouco mais sobre nossa cultura de climatização nas escolas?',
        type: 'text',
        createdAt: new Date(),
      }]);
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gatilho de convite para cadastro após 3 mensagens
  useEffect(() => {
    if (hasProfile || signupPhase !== 'none' || userMsgCount < 3) return;

    setSignupPhase('invited');
    const inviteMsg: Message = {
      id: 'signup-invite',
      sender: 'brisinha',
      text: 'Ei, adorei conversar com você! Que tal se cadastrar para não perder nenhuma novidade da Mar Brasil? É rapidinho 😊',
      type: 'invite',
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, inviteMsg]);
    speak('Ei, que tal se cadastrar? É rapidinho!');
  }, [userMsgCount, hasProfile, signupPhase, speak]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setUserMsgCount((n) => n + 1);

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem.');

      const reply: Message = {
        id: Math.random().toString(),
        sender: 'brisinha',
        text: data.answer,
        type: 'text',
        recommendedContent: data.recommended_content,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'brisinha',
          text: err.message || 'Desculpe, ocorreu um erro. Tente novamente.',
          type: 'text',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, visitorId]);

  const handleSignupAccept = useCallback(() => {
    setSignupPhase('form');
    setMessages((prev) => [
      ...prev,
      {
        id: 'signup-form',
        sender: 'brisinha',
        text: '',
        type: 'signup',
        createdAt: new Date(),
      },
    ]);
  }, []);

  const handleSignupDecline = useCallback(() => {
    setSignupPhase('done');
    setMessages((prev) => [
      ...prev,
      {
        id: 'signup-declined',
        sender: 'brisinha',
        text: 'Tudo bem! Estarei aqui sempre que precisar 😊',
        type: 'text',
        createdAt: new Date(),
      },
    ]);
  }, []);

  const handleSignupComplete = useCallback((firstName: string) => {
    setHasProfile(true);
    setUserName(firstName);
    setSignupPhase('done');
    setMessages((prev) => [
      ...prev.filter((m) => m.type !== 'signup'),
      {
        id: 'signup-done',
        sender: 'brisinha',
        text: `Bem-vindo(a) oficialmente, ${firstName}! 🎉 Agora você faz parte da família Mar Brasil. Como posso te ajudar?`,
        type: 'text',
        createdAt: new Date(),
      },
    ]);
    speak(`Bem-vindo, ${firstName}! Seja muito bem-vindo à família Mar Brasil!`);
  }, [speak]);

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-info">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BrisinhAI.jpeg" alt="Brisinha" className="brisinha-avatar-header" />
          <div>
            <h1>Brisinha</h1>
            <span className="status-indicator">
              {isIntroLoading ? 'Pensando...' : 'Online'}
            </span>
          </div>
        {userName && <span className="chat-user-tag">Olá, {userName}!</span>}
        <button className="culture-retry-btn" onClick={fetchCulture} title="Ver Manual de Cultura">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
          </svg>
          <span>Manual</span>
        </button>
      </header>

      <div className="chat-messages">
        {isIntroLoading && (
          <div className="message-row brisinha">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BrisinhAI.jpeg" alt="Brisinha" className="brisinha-avatar-msg" />
            <div className="message-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            {msg.sender === 'brisinha' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/BrisinhAI.jpeg" alt="Brisinha" className="brisinha-avatar-msg" />
            )}

            <div className={`message-bubble ${msg.type === 'culture' ? 'culture' : ''} ${msg.type === 'invite' ? 'invite' : ''}`}>
              {/* Balão de Cultura */}
              {msg.type === 'culture' && msg.cultureData ? (
                <CultureBubble
                  long={msg.cultureData.long}
                  videoUrl={msg.cultureData.videoUrl}
                  culturaUrl={msg.cultureData.culturaUrl}
                />
              ) : msg.type === 'signup' ? (
                /* Mini-form inline */
                <InlineSignup
                  visitorId={visitorId}
                  onComplete={handleSignupComplete}
                  onCancel={handleSignupDecline}
                />
              ) : msg.type === 'invite' ? (
                /* Convite de cadastro */
                <>
                  <div className="message-text">{msg.text}</div>
                  <div className="invite-actions">
                    <button id="signup-yes-btn" className="invite-btn-yes" onClick={handleSignupAccept}>
                      Quero me cadastrar 🙋
                    </button>
                    <button id="signup-no-btn" className="invite-btn-no" onClick={handleSignupDecline}>
                      Agora não
                    </button>
                  </div>
                </>
              ) : (
                /* Mensagem de texto normal */
                <>
                  {msg.text && <div className="message-text">{msg.text}</div>}
                  {msg.recommendedContent && msg.recommendedContent.length > 0 && (
                    <div className="recommendations-container">
                      {msg.recommendedContent.map((c, i) => (
                        <div key={i} className="content-card">
                          <h4>{c.title}</h4>
                          {c.short_summary && <p>{c.short_summary}</p>}
                          {c.embed_url && (
                            <div className="video-wrapper">
                              <iframe src={c.embed_url} title={c.title} frameBorder="0" allowFullScreen />
                            </div>
                          )}
                          {c.primary_url && (
                            <a href={c.primary_url} target="_blank" rel="noopener noreferrer" className="fallback-link">
                              Ver no site
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {msg.type !== 'signup' && msg.type !== 'culture' && (
                <span className="message-time">
                  {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        ))}

        { (isLoading || isIntroLoading) && (
          <div className="message-row brisinha">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BrisinhAI.jpeg" alt="Brisinha" className="brisinha-avatar-msg" />
            <div className="message-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading || isIntroLoading}
            id="chat-input"
          />
          <VoiceInput onTranscript={(t) => setInputText(t)} />
        </div>
        <button
          type="submit"
          id="chat-send-btn"
          className="send-btn"
          disabled={isLoading || isIntroLoading || !inputText.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="send-icon">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
