import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export const useGhostEar = (uid: string) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedFinal = useRef<string>('');

  const SILENCE_THRESHOLD = 1400; // Ajuste: 1200 = agressivo / 1800 = paciente

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
      const rawText = accumulatedFinal.current.trim();
      if (!rawText) {
        accumulatedFinal.current = '';
        setTranscript('');
        return;
      }

      const lowerText = rawText.toLowerCase();

      // LÓGICA DE WAKE-WORD: só processa se contiver "ghost" (case-insensitive)
      if (lowerText.includes('ghost')) {
        // Remove todas as ocorrências de "ghost" (ou "Ghost", "GHOST", etc.)
        let cleanCommand = rawText.replace(/ghost/gi, '').trim();

        // Limpa vírgulas/espaços extras no início e fim
        cleanCommand = cleanCommand.replace(/^[,\s]+|[,\s]+$/g, '').trim();

        if (cleanCommand) {
          console.log(`[WAKE-WORD] Ativado. Enviando comando: "${cleanCommand}"`);
          sendToGhost(cleanCommand);
        } else {
          // Apenas "ghost" foi dito → confirma presença
          speak('Sim, Senhor Walker. Estou às ordens.');
          console.log('[WAKE-WORD] Apenas invocação detectada.');
        }

        // Limpa buffer após processar
        accumulatedFinal.current = '';
        setTranscript('');
      } else if (rawText.length > 0) {
        // Ignora completamente (não envia nem acumula)
        console.log(`[STEALTH] Ignorando fala sem wake-word: "${rawText}"`);
        accumulatedFinal.current = '';
        setTranscript('');
      }
    }, SILENCE_THRESHOLD);
  }, [sendToGhost]);

  const startListening = useCallback(() => {
    if (isListening) return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.error('Web Speech API não suportada.');
      speak('Microfone não disponível neste ambiente.');
      return;
    }

    const recognition = new SpeechRecognitionClass() as SpeechRecognition;
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

      startSilenceTimer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Erro no reconhecimento de voz:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
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
        restartTimeoutRef.current = setTimeout(restart, 500);
      }
    };

    const restart = () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
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