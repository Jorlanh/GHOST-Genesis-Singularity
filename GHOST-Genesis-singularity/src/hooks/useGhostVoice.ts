import { useState, useEffect, useRef, useCallback } from "react";

type VortexState = "idle" | "listening" | "processing";

// Wake Words oficiais do protocolo
const WAKE_WORDS = ["ghost", "chrono", "turing", "gör"];

interface GhostVoiceResult {
  vortexState: VortexState;
  currentNickname: string;
  lastSpokenText: string;
  isSupported: boolean;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// Síntese de voz com foco em PT-BR para suportar as gírias
function speak(text: string, onStart?: () => void, onEnd?: () => void) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  utter.rate = 1.1; // Levemente mais rápido para parecer natural
  utter.pitch = 1;
  if (onStart) utter.onstart = onStart;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}

export function useGhostVoice(): GhostVoiceResult {
  const [vortexState, setVortexState] = useState<VortexState>("listening");
  const [currentNickname, setCurrentNickname] = useState("Senhor Walker");
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [isSupported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);

  const processCommand = useCallback(async (transcript: string) => {
    const lower = transcript.toLowerCase().trim();

    // 1. Verificação de Gatilhos
    const hasWakeWord = WAKE_WORDS.some(w => lower.includes(w));
    const isWakeUp = lower.includes("acorda") && lower.includes("papai");

    if (!hasWakeWord && !isWakeUp) return;

    setVortexState("processing");

    // 2. Lógica "God Mode" (Instantânea/Local)
    if (isWakeUp) {
      const response = `${getGreeting()}, para o senhor eu sempre estou acordado, ${currentNickname}.`;
      setLastSpokenText(response);
      speak(response, undefined, () => setVortexState("listening"));
      return;
    }

    // 3. Processamento via Ghost Core Híbrido
    try {
      const cleanCommand = lower.replace(new RegExp(WAKE_WORDS.join('|'), 'g'), '').trim();

      // Ajustado para porta 8081 (conforme seu YML) e payload de Elite
      const result = await fetch("http://localhost:8081/api/v1/ghost/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          command: cleanCommand,
          uid: "ID_DO_WALKER", // Importante para ativar o God Mode no Java
          clientSource: "ELECTRON", // Matriz de decisão Híbrida
          context: "stealth_mode"
        })
      });

      const data = await result.json();
      
      // 4. A MÁGICA FÍSICA ACONTECE AQUI (Delegação do Electron)
      if (data.osCommand && window.electronAPI) {
        console.log("GHOST >> Executando ação física no SO:", data.osCommand);
        window.electronAPI.sendOSCommand(data.osCommand);
      }

      // 5. O GHOST fala a resposta (Prioriza o neural, faz fallback pro texto)
      const textToSpeak = data.response || data.reply;
      if (textToSpeak) {
        setLastSpokenText(textToSpeak);
        speak(textToSpeak, undefined, () => setVortexState("listening"));
      }
    } catch (error) {
      const errorMsg = "Tô fora de área, chefe. O servidor deu linha.";
      setLastSpokenText(errorMsg);
      speak(errorMsg, undefined, () => setVortexState("listening"));
    }
  }, [currentNickname]);

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

    recognition.onerror = () => {
      recognitionRef.current = null;
      restartTimeoutRef.current = setTimeout(startListening, 1000);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      restartTimeoutRef.current = setTimeout(startListening, 300);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setVortexState("listening");
    } catch {
      restartTimeoutRef.current = setTimeout(startListening, 1000);
    }
  }, [isSupported, processCommand]);

  useEffect(() => {
    startListening();
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, [startListening]);

  return { vortexState, currentNickname, lastSpokenText, isSupported };
}