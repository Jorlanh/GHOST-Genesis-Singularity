import { motion } from "framer-motion";
import Vortex from "@/components/Vortex";
import { useGhostVoice } from "@/hooks/useGhostVoice";

const Dashboard = () => {
  const { vortexState } = useGhostVoice();

  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Vortex state={vortexState} size={300} />
      </motion.div>
    </div>
  );
};

export default Dashboard;
