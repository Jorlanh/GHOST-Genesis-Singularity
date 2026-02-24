import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

type VortexState = "idle" | "listening" | "processing";

const WAKE_WORDS = ["ghost", "chrono", "turing", "gör"];

interface GhostVoiceResult {
  vortexState: VortexState;
  currentNickname: string;
  lastSpokenText: string;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  processTextCommand: (transcript: string) => Promise<void>; // Mantido para entradas de texto
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * PROTOCOLO DE VOZ: Garante que o GHOST interrompa falas anteriores.
 */
function speak(text: string, onStart?: () => void, onEnd?: () => void) {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  utter.rate = 1.1;
  utter.pitch = 1;
  
  if (onStart) utter.onstart = onStart;
  if (onEnd) utter.onend = onEnd;
  
  window.speechSynthesis.speak(utter);
}

export function useGhostVoice(): GhostVoiceResult {
  const [vortexState, setVortexState] = useState<VortexState>("idle");
  const [currentNickname] = useState("Senhor Walker");
  const [lastSpokenText, setLastSpokenText] = useState("");
  
  // Alterado para verificar suporte de Hardware real em vez de API web
  const [isSupported] = useState(() => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // MARCAPASSO DE ÁUDIO: Mantém o barramento ativo
  const keepAudioAlive = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      gain.gain.value = 0.0001; 
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) {
      console.warn("GHOST >> Falha no marcapasso de áudio");
    }
  }, []);

  // =========================================================================
  // PROTOCOLO ORIGINAL MANTIDO (Para Terminal de Texto / Fallbacks)
  // =========================================================================
  const processTextCommand = useCallback(async (transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    const hasWakeWord = WAKE_WORDS.some(w => lower.includes(w));
    const isWakeUp = lower.includes("acorda") && lower.includes("papai");

    if (!hasWakeWord && !isWakeUp) return;

    setVortexState("processing");
    keepAudioAlive();
    const electron = (window as any).electronAPI;

    if (lower.includes("modo pânico") || lower.includes("limpar rastro")) {
      if (electron) electron.sendOSCommand('PANIC_MODE');
      const resp = "Protocolo Pânico ativado. Navegadores encerrados e trilhas removidas.";
      setLastSpokenText(resp);
      speak(resp, undefined, () => setVortexState("idle"));
      return;
    }

    if (lower.includes("mostrar terminal") || lower.includes("exibir interface") || lower.includes("apareça")) {
      if (electron) electron.showWindow();
      const resp = "Protocolo visual restaurado.";
      setLastSpokenText(resp);
      speak(resp, undefined, () => setVortexState("idle"));
      return;
    }

    if (lower.includes("esconder terminal") || lower.includes("ocultar interface") || lower.includes("desapareça")) {
      const resp = "Entrando em modo stealth.";
      setLastSpokenText(resp);
      speak(resp, undefined, () => {
        if (electron) electron.hideWindow();
        setVortexState("idle");
      });
      return;
    }

    if (isWakeUp) {
      const response = `${getGreeting()}, para o senhor eu sempre estou acordado, ${currentNickname}.`;
      setLastSpokenText(response);
      speak(response, undefined, () => setVortexState("idle"));
      return;
    }

    try {
      const cleanCommand = lower.replace(new RegExp(WAKE_WORDS.join('|'), 'g'), '').trim();
      const response = await api.post('/interact', {
        command: cleanCommand,
        uid: import.meta.env.VITE_OPERATOR_UID || "Walker", 
        clientSource: electron ? "ELECTRON" : "WEB",
        context: "stealth_mode"
      });

      const data = response.data; 
      if (data.osCommand && electron) electron.sendOSCommand(data.osCommand);

      const textToSpeak = data.response || data.reply;
      if (textToSpeak) {
        setLastSpokenText(textToSpeak);
        speak(textToSpeak, undefined, () => setVortexState("idle"));
      } else {
        setVortexState("idle");
      }
    } catch (error: any) {
      const fallbackMessage = error.response?.data?.message || "Conexão com a Singularidade interrompida.";
      setLastSpokenText(fallbackMessage);
      speak(fallbackMessage, undefined, () => setVortexState("idle"));
    }
  }, [currentNickname, keepAudioAlive]);

  // =========================================================================
  // NOVO PROTOCOLO DE ÁUDIO NATIVO (ELECTRON BYPASS)
  // =========================================================================
  const processAudioBlob = useCallback(async (audioBlob: Blob) => {
    setVortexState("processing");
    const electron = (window as any).electronAPI;

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "command.webm");
      formData.append("uid", import.meta.env.VITE_OPERATOR_UID || "Walker");
      formData.append("clientSource", electron ? "ELECTRON" : "WEB");

      const response = await api.post('/interact/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;

      // Executa os comandos OS retornados pelo Backend, mantendo a arquitetura intacta
      if (data.osCommand && electron) {
        electron.sendOSCommand(data.osCommand);
      }

      const textToSpeak = data.response || data.reply;
      if (textToSpeak) {
        setLastSpokenText(textToSpeak);
        speak(textToSpeak, undefined, () => setVortexState("idle"));
      } else {
        setVortexState("idle");
      }
    } catch (error: any) {
      const fallbackMessage = error.response?.data?.message || "Senhor, falha ao transmitir pacote de áudio.";
      setLastSpokenText(fallbackMessage);
      speak(fallbackMessage, undefined, () => setVortexState("idle"));
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setVortexState("listening");
      
    } catch (err) {
      console.error("GHOST >> Microfone bloqueado.", err);
      setVortexState("idle");
    }
  }, [isSupported, processAudioBlob]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // CICLO DE VIDA E CLEANUP DE PROTOCOLO IPC
  useEffect(() => {
    const pulse = setInterval(keepAudioAlive, 25000);
    const electron = (window as any).electronAPI;
    let removeListener: (() => void) | undefined;

    if (electron && electron.onCommandResult) {
      removeListener = electron.onCommandResult((data: any) => {
        console.log("GHOST >> Auditoria de Comando:", data);
      });
    }

    return () => {
      clearInterval(pulse);
      if (removeListener) removeListener();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [keepAudioAlive]);

  return { vortexState, currentNickname, lastSpokenText, isSupported, startRecording, stopRecording, processTextCommand };
}