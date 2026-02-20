import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api'; // Conexão centralizada

interface GhostResponse {
  response: string;
  audioUrl?: string;
  user: string;
  status: string;
}

export const useGhostEar = (uid: string) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedFinal = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SILENCE_THRESHOLD = 1400;

  const playAudio = useCallback((relativePath: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Monta URL completa (remove /api/v1/ghost do baseURL do axios)
    const baseUrl = api.defaults.baseURL?.replace('/api/v1/ghost', '') || 'http://localhost:8081';
    const fullUrl = `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;

    const audio = new Audio(fullUrl);
    audioRef.current = audio;

    setIsSpeaking(true);

    audio.onended = () => {
      setIsSpeaking(false);
      audioRef.current = null;
      // Opcional: voltar a escutar após falar
      // startListening();
    };

    audio.onerror = (e) => {
      console.error('Erro ao tocar áudio neural:', e);
      setIsSpeaking(false);
      audioRef.current = null;
    };

    audio.play().catch(err => {
      console.error('Autoplay bloqueado:', err);
      setIsSpeaking(false);
      speak('Desculpe, erro ao reproduzir minha voz.');
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const sendToGhost = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      const res = await api.post<GhostResponse>('/interact', {
        command: text.trim(),
        uid,
      });

      const { response, audioUrl } = res.data;
      console.log('GHOST:', response);

      if (audioUrl && audioUrl.trim()) {
        playAudio(audioUrl);
      } else {
        speak(response);
      }
    } catch (err) {
      console.error('Falha de conexão com o núcleo:', err);
      speak('Sem conexão com o núcleo. Estou em modo de espera.');
    }
  }, [playAudio, speak]);

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

      if (lowerText.includes('ghost')) {
        let cleanCommand = rawText.replace(/ghost/gi, '').trim();
        cleanCommand = cleanCommand.replace(/^[,\s]+|[,\s]+$/g, '').trim();

        if (cleanCommand) {
          console.log(`[WAKE-WORD] Comando enviado: "${cleanCommand}"`);
          sendToGhost(cleanCommand);
        } else {
          speak('Sim, Senhor Walker. Às suas ordens.');
        }

        accumulatedFinal.current = '';
        setTranscript('');
      } else if (rawText.length > 0) {
        console.log(`[STEALTH] Ignorado (sem wake-word): "${rawText}"`);
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
      console.warn('Erro no reconhecimento:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        restart();
      } else if (event.error === 'not-allowed') {
        speak('Permissão de microfone negada. Verifique as configurações.');
        setIsListening(false);
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
      try {
        recognition.start();
      } catch (e) {
        console.warn('Erro ao reiniciar recognition:', e);
      }
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

  return { isListening, transcript, isSpeaking, startListening, stopListening };
};