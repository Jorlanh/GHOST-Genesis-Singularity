import { motion, AnimatePresence } from "framer-motion";
import Vortex from "@/components/Vortex";
import { useGhostVoice } from "@/hooks/useGhostVoice";

const VoiceMode = () => {
  const { vortexState, lastSpokenText, currentNickname } = useGhostVoice();

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decorativo - Grade Cibernética */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* Indicador de Operador */}
      <div className="absolute top-10 left-10 font-mono text-[10px] text-primary/40 tracking-[0.2em]">
        SYSTEM OPERATOR: <span className="text-primary/80">{currentNickname.toUpperCase()}</span>
      </div>

      {/* Vortex Central */}
      <div className="relative">
        <Vortex state={vortexState} size={400} />
        {vortexState === "listening" && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -inset-4 border border-primary/10 rounded-full animate-pulse"
           />
        )}
      </div>

      {/* Feedback de Comando */}
      <div className="mt-12 text-center max-w-2xl px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={vortexState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <p className="font-display text-[10px] tracking-[0.5em] text-primary ghost-text-glow uppercase">
              {vortexState === "listening" ? "Listening Active" : "Executing Logic"}
            </p>
            
            {lastSpokenText && (
              <p className="font-mono text-sm text-primary/60 italic leading-relaxed">
                "{lastSpokenText}"
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de Status Inferior */}
      <div className="absolute bottom-10 flex gap-8 font-mono text-[9px] text-primary/20 tracking-widest uppercase">
        <span>Kernel: Linked</span>
        <span>Gateway: Port 8080</span>
        <span>Security: God Mode</span>
      </div>
    </div>
  );
};

export default VoiceMode;