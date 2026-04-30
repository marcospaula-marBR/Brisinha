'use client';

import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    setIsAndroid(/Android/.test(ua));
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Captura o evento de instalação nativa (Chrome/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Não exibe se já instalado, se dispensado, ou se não for mobile
  if (isStandalone || dismissed) return null;
  if (!isIOS && !isAndroid && !deferredPrompt) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDismissed(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="install-banner" role="banner" aria-label="Instalar Brisinha">
      <div className="install-banner-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="Brisinha" className="install-icon" />
        <div className="install-text">
          <strong>Adicione o Brisinha à tela inicial!</strong>
          {isIOS ? (
            <span>Toque em <b>Compartilhar</b> ⎋ e depois <b>&ldquo;Adicionar à Tela de Início&rdquo;</b> ➕</span>
          ) : (
            <span>Tenha acesso rápido com um toque, como um app nativo.</span>
          )}
        </div>
      </div>
      <div className="install-actions">
        {deferredPrompt && (
          <button id="install-btn" className="install-btn-primary" onClick={handleInstall}>
            Instalar
          </button>
        )}
        <button
          id="install-dismiss-btn"
          className="install-btn-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
