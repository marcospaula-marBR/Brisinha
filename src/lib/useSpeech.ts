'use client';

import { useCallback, useRef } from 'react';

export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancela qualquer fala em andamento
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 1.05;
    utter.pitch = 1.1;
    utter.volume = 1;

    // Tenta usar voz pt-BR se disponível
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(
      (v) => v.lang === 'pt-BR' || v.lang.startsWith('pt')
    );
    if (ptVoice) utter.voice = ptVoice;

    if (onEnd) utter.onend = onEnd;

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
