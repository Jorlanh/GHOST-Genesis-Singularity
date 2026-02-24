import { motion } from "framer-motion";
import Vortex from "@/components/Vortex";
import TerminalContainer from "@/components/TerminalContainer";
import { useGhostVoice } from "@/hooks/useGhostVoice";

const Dashboard = () => {
  // 1. Extraímos os novos controles de gravação
  const { vortexState, startRecording, stopRecording } = useGhostVoice();

  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-black overflow-hidden">
      {/* Background Grid sutil para profundidade */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Núcleo Central: Vortex com Sensores Táteis */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10"
      >
        {/* 2. Conectamos os sensores no Vortex */}
        <Vortex 
          state={vortexState} 
          size={320} 
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerLeave={stopRecording}
        />
      </motion.div>
      
      {/* Interface de Telemetria: Terminal fixado no canto inferior direito */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute bottom-10 right-10 z-20"
      >
        <TerminalContainer />
      </motion.div>

      {/* Indicador de Latência/Estado Lateral */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-30 h-1/2 justify-center border-l border-primary/20 pl-4 pointer-events-none">
        <div className="space-y-1">
          <p className="text-[10px] text-primary tracking-tighter">SIGNAL_STRENGTH</p>
          <div className="w-24 h-1 bg-primary/20 overflow-hidden">
             <motion.div 
              className="h-full bg-primary" 
              animate={{ x: ["-100%", "0%"] }} 
              transition={{ repeat: Infinity, duration: 2 }} 
             />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-primary tracking-tighter">NEURAL_LOAD</p>
          <p className="text-sm font-mono text-primary font-bold">
            {vortexState === 'processing' ? '88.4%' : '12.1%'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;