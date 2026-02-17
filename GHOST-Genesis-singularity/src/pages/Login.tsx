import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const bootLines = [
  "[GHOST] Kernel v4.7.1 loaded...",
  "[GHOST] Initializing neural interface...",
  "[SYS] Scanning biometric signature... OK",
  "[NET] Establishing encrypted channel... DONE",
  "[AI] Loading cognitive modules...",
  "[SEC] Firewall protocols active",
  "[GHOST] All systems nominal",
  "[GHOST] Welcome, Operator.",
];

const Login = () => {
  const [booting, setBooting] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);
  const navigate = useNavigate();

  const startBoot = useCallback(() => {
    setBooting(true);
    setLines([]);
  }, []);

  useEffect(() => {
    if (!booting) return;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < bootLines.length) {
        const line = bootLines[idx];
        setLines((prev) => [...prev, line]);
        idx++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootComplete(true), 600);
        setTimeout(() => navigate("/dashboard"), 1800);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [booting, navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Scanlines */}
      <div className="absolute inset-0 ghost-scanline pointer-events-none" />

      <AnimatePresence mode="wait">
        {!booting ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-10"
          >
            {/* Logo */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h1 className="font-display text-6xl md:text-8xl font-bold tracking-[0.3em] text-primary ghost-text-glow">
                GHOST
              </h1>
              <p className="text-muted-foreground text-xs tracking-[0.5em] mt-2 font-body uppercase">
                Tactical Interface System
              </p>
            </motion.div>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-48 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />

            {/* Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={startBoot}
              className="px-8 py-3 rounded-sm border border-primary/40 bg-primary/5 text-primary font-display text-lg tracking-widest uppercase hover:bg-primary/10 hover:border-primary/60 transition-all duration-300 ghost-glow"
            >
              Initialize System
            </motion.button>

            <p className="text-muted-foreground/50 text-[10px] tracking-widest font-body">
              v4.7.1 // SINGULARITY EDITION
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-xl px-6"
          >
            <div className="ghost-glass p-6 font-mono text-xs space-y-1">
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${
                    line.includes("OK") || line.includes("DONE") || line.includes("active") || line.includes("nominal")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {line}
                </motion.div>
              ))}

              {!bootComplete && booting && (
                <span className="inline-block w-2 h-4 bg-primary animate-terminal-cursor" />
              )}

              {bootComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-primary font-display text-sm tracking-widest ghost-text-glow"
                >
                  {">> SYSTEM ONLINE"}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
