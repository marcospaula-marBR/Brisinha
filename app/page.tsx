'use client';

import React, { useState, useEffect } from 'react';
import Chat from '@/components/Chat';
import InstallPrompt from '@/components/InstallPrompt';

export default function Home() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Gera ou recupera visitor_id
        let id: string | null = null;
        try {
          id = localStorage.getItem('brisinha_visitor_id');
        } catch (e) { console.warn('LocalStorage blocked'); }

        let isNewVisitor = false;
        if (!id) {
          id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
          
          try {
            localStorage.setItem('brisinha_visitor_id', id);
          } catch (e) { console.warn('LocalStorage set blocked'); }
          
          isNewVisitor = true;
          setIsFirstVisit(true); 
        }
        setVisitorId(id);

        // Registra service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
            .catch((e) => console.warn('[SW]', e));
        }

        // Detecta perfil com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        try {
          const res = await fetch('/api/first-seen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitor_id: id }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            setHasProfile(!!data.has_profile);
            setUserName(data.user_name || null);
            setIsFirstVisit(!!data.is_first_time || isNewVisitor);
          }
        } catch (fetchErr: any) {
          console.warn('[first-seen] fetch failed or timeout', fetchErr?.name);
        }
      } catch (err) {
        console.error('[init fatal]', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Carregando o universo do Brisinha...</p>
      </div>
    );
  }

  if (!visitorId) {
    return (
      <div className="error-screen">
        <p>Não foi possível inicializar o acesso.</p>
      </div>
    );
  }

  return (
    <main className="main-content">
      <InstallPrompt />
      <Chat
        visitorId={visitorId}
        hasProfile={hasProfile}
        userName={userName}
        isFirstVisit={isFirstVisit}
      />
    </main>
  );
}
