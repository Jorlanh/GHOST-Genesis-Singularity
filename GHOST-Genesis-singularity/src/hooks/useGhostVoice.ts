import { useState, useEffect, useRef, useCallback } from "react";

type VortexState = "idle" | "listening" | "processing";

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

function speak(text: string, onStart?: () => void, onEnd?: () => void) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  utter.rate = 1;
  utter.pitch = 1;
  if (onStart) utter.onstart = onStart;
  if (onEnd) utter.onend = onEnd;
  speechSynthesis.speak(utter);
}

export function useGhostVoice(): GhostVoiceResult {
  const [vortexState, setVortexState] = useState<VortexState>("listening");
  const [currentNickname, setCurrentNickname] = useState("Senhor Walker");
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [isSupported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);

  const processCommand = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();

    // Check if any wake word is present
    const hasWakeWord = WAKE_WORDS.some(w => lower.includes(w));

    // Check special phrases that don't need wake words
    const isWakeUp = lower.includes("acorda") && lower.includes("papai");
    const isNickChange = lower.includes("me chame de");

    if (!hasWakeWord && !isWakeUp && !isNickChange) return;

    setVortexState("processing");

    let response = "";

    if (isWakeUp) {
      response = `${getGreeting()}, para o senhor eu sempre estou acordado, ${currentNickname}.`;
    } else if (lower.includes("acordado") || lower.includes("está aí") || lower.includes("tá aí")) {
      response = `Para o senhor, sempre, ${currentNickname}!`;
    } else if (isNickChange) {
      const match = transcript.match(/me chame de\s+(.+)/i);
      if (match) {
        const newName = match[1].trim().replace(/[.!?]+$/, "");
        setCurrentNickname(newName);
        response = `Entendido. A partir de agora o chamarei de ${newName}.`;
      }
    } else {
      // Generic acknowledged command
      response = `Comando recebido, ${currentNickname}.`;
    }

    if (response) {
      setLastSpokenText(response);
      speak(
        response,
        undefined,
        () => setVortexState("listening")
      );
    } else {
      setTimeout(() => setVortexState("listening"), 1000);
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
      // Restart on error
      recognitionRef.current = null;
      restartTimeoutRef.current = setTimeout(startListening, 1000);
    };

    recognition.onend = () => {
      // Auto-restart (infinite loop)
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
