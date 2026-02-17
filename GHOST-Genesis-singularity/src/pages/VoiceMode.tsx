import { motion } from "framer-motion";
import Vortex from "@/components/Vortex";
import { useGhostVoice } from "@/hooks/useGhostVoice";

const VoiceMode = () => {
  const { vortexState } = useGhostVoice();

  return (
    <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
      <Vortex state={vortexState} size={300} />

      <motion.p
        key={vortexState}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="mt-8 font-display text-xs tracking-[0.5em] text-primary/30 uppercase"
      >
        {vortexState === "listening" ? "AWAITING COMMAND" : "PROCESSING"}
      </motion.p>
    </div>
  );
};

export default VoiceMode;
