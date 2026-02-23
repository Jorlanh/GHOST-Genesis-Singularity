import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

type VortexState = "idle" | "listening" | "processing";

const WAKE_WORDS = ["ghost", "chrono", "turing", "gör"];

interface GhostVoiceResult {
  vortexState: VortexState;
  currentNickname: string;
  lastSpokenText: string;
  isSupported: boolean;
  startListening: () => void;
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
  const [isSupported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
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

  const processCommand = useCallback(async (transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    const hasWakeWord = WAKE_WORDS.some(w => lower.includes(w));
    const isWakeUp = lower.includes("acorda") && lower.includes("papai");

    if (!hasWakeWord && !isWakeUp) return;

    setVortexState("processing");
    keepAudioAlive();
    const electron = (window as any).electronAPI;

    // PROTOCOLO MODO PÂNICO
    if (lower.includes("modo pânico") || lower.includes("limpar rastro")) {
      if (electron) electron.sendOSCommand('PANIC_MODE');
      const resp = "Protocolo Pânico ativado. Navegadores encerrados e trilhas removidas.";
      setLastSpokenText(resp);
      speak(resp, undefined, () => setVortexState("listening"));
      return;
    }

    // PROTOCOLO DE INTERFACE
    if (lower.includes("mostrar terminal") || lower.includes("exibir interface") || lower.includes("apareça")) {
      if (electron) electron.showWindow();
      const resp = "Protocolo visual restaurado.";
      setLastSpokenText(resp);
      speak(resp, undefined, () => setVortexState("listening"));
      return;
    }

    if (lower.includes("esconder terminal") || lower.includes("ocultar interface") || lower.includes("desapareça")) {
      const resp = "Entrando em modo stealth.";
      setLastSpokenText(resp);
      speak(resp, undefined, () => {
        if (electron) electron.hideWindow();
        setVortexState("listening");
      });
      return;
    }

    if (isWakeUp) {
      const response = `${getGreeting()}, para o senhor eu sempre estou acordado, ${currentNickname}.`;
      setLastSpokenText(response);
      speak(response, undefined, () => setVortexState("listening"));
      return;
    }

    // INTERAÇÃO COM GATEWAY (SINGULARIDADE)
    try {
      const cleanCommand = lower.replace(new RegExp(WAKE_WORDS.join('|'), 'g'), '').trim();
      const response = await api.post('/interact', {
        command: cleanCommand,
        uid: import.meta.env.VITE_OPERATOR_UID || "GHOST_UNAUTHORIZED", 
        clientSource: electron ? "ELECTRON" : "WEB",
        context: "stealth_mode"
      });

      const data = response.data; 

      if (data.osCommand && electron) {
        electron.sendOSCommand(data.osCommand);
      }

      const textToSpeak = data.response || data.reply;
      if (textToSpeak) {
        setLastSpokenText(textToSpeak);
        speak(textToSpeak, undefined, () => setVortexState("listening"));
      } else {
        setVortexState("listening");
      }
    } catch (error) {
      const errorMsg = "Conexão com a Singularidade interrompida.";
      setLastSpokenText(errorMsg);
      speak(errorMsg, undefined, () => setVortexState("idle"));
    }
  }, [currentNickname, keepAudioAlive]);

  const startListening = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "pt-BR";

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        processCommand(last[0].transcript);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      restartTimeoutRef.current = setTimeout(startListening, 100);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setVortexState("listening");
    } catch (err) {
      restartTimeoutRef.current = setTimeout(startListening, 1000);
    }
  }, [isSupported, processCommand]);

  // CICLO DE VIDA E CLEANUP DE PROTOCOLO IPC
  useEffect(() => {
    startListening();
    const pulse = setInterval(keepAudioAlive, 25000);

    // Incremento de Auditoria: Escuta os resultados vindos do Main Process
    const electron = (window as any).electronAPI;
    let removeListener: (() => void) | undefined;

    if (electron && electron.onCommandResult) {
      removeListener = electron.onCommandResult((data: any) => {
        console.log("GHOST >> Auditoria de Comando:", data);
        // Aqui você pode disparar sons ou feedbacks visuais de sucesso/erro
      });
    }

    return () => {
      clearInterval(pulse);
      if (removeListener) removeListener(); // <--- CLEANUP ESSENCIAL
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, [startListening, keepAudioAlive]);

  return { vortexState, currentNickname, lastSpokenText, isSupported, startListening };
}