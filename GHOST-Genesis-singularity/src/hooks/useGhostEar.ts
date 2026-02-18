import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export const useGhostEar = (uid: string) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedFinal = useRef<string>('');

  const SILENCE_THRESHOLD = 1400; // Ajuste aqui: 1200 = rápido / 1800 = paciente

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendToGhost = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      const res = await axios.post('http://localhost:8081/api/v1/ghost/interact', {
        command: text.trim(),
        uid,
      });
      const responseText = res.data.response ?? 'Entendi, Senhor.';
      console.log('GHOST respondeu:', responseText);
      speak(responseText);
    } catch (err) {
      console.error('Erro na interação com o core:', err);
      speak('Desculpe, tive um problema ao processar. Tente novamente.');
    }
  }, [uid, speak]);

  const startSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(() => {
      const textToSend = accumulatedFinal.current.trim();
      if (textToSend) {
        sendToGhost(textToSend);
        accumulatedFinal.current = '';
        setTranscript('');
      }
    }, SILENCE_THRESHOLD);
  }, [sendToGhost]);

  const startListening = useCallback(() => {
    if (isListening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Web Speech API não suportada.');
      speak('Microfone não disponível neste ambiente.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      if (final) {
        accumulatedFinal.current += final + ' ';
      }

      setTranscript(accumulatedFinal.current.trim() + (interim ? ' ' + interim : ''));

      startSilenceTimer(); // Reinicia timer a cada atividade
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Erro no reconhecimento de voz:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Erros leves → reinicia silenciosamente
        restart();
      } else if (event.error === 'not-allowed') {
        speak('Permissão de microfone negada. Verifique as configurações.');
        setIsListening(false);
      } else {
        console.warn('Erro não tratado:', event.error);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        // Proteção contra onend prematuro
        restartTimeoutRef.current = setTimeout(restart, 500);
      }
    };

    const restart = () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      recognition.start();
      recognitionRef.current = recognition;
    };

    restart();
    setIsListening(true);
  }, [isListening, speak, startSilenceTimer]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript('');
    accumulatedFinal.current = '';
  }, []);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return { isListening, transcript, startListening, stopListening };
};