import { motion, AnimatePresence } from "framer-motion";

// Estados do núcleo neural GHOST
type VortexState = "idle" | "listening" | "processing" | "panic" | "error";

interface VortexProps {
  state?: VortexState;
  size?: number;
  accentColor?: string;
}

// Protocolo de cores: Mapeamento de espectro por estado de sistema
const STATE_COLORS: Record<VortexState, string> = {
  idle: "hsl(186 100% 50%)",       // Ciano (Standby)
  listening: "hsl(142 70% 50%)",   // Verde (Captação de áudio)
  processing: "hsl(280 100% 60%)", // Roxo (Cálculo sináptico)
  panic: "hsl(0 100% 50%)",        // Vermelho (Purgação/Pânico)
  error: "hsl(35 100% 50%)",       // Âmbar (Falha de sistema)
};

const Vortex = ({ state = "idle", size = 280, accentColor }: VortexProps) => {
  const color = accentColor || STATE_COLORS[state];

  const rings = [
    { radius: 0.95, width: 1.5, speed: 20, reverse: false, dash: "4 6" },
    { radius: 0.82, width: 1, speed: 15, reverse: true, dash: "8 4" },
    { radius: 0.68, width: 2, speed: 25, reverse: false, dash: "2 8" },
    { radius: 0.55, width: 1, speed: 12, reverse: true, dash: "6 3" },
    { radius: 0.42, width: 1.5, speed: 18, reverse: false, dash: "3 5" },
    { radius: 0.30, width: 1, speed: 30, reverse: true, dash: "10 2" },
  ];

  // Modulação de torque: Aceleração centrífuga em estados críticos
  const getAnimationSpeed = (baseSpeed: number) => {
    if (state === "panic") return baseSpeed * 0.1; 
    if (state === "listening") return baseSpeed * 0.3;
    if (state === "processing") return baseSpeed * 0.5;
    return baseSpeed;
  };

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ 
        scale: state === "panic" ? [1, 1.15, 0.95, 1.1, 1] : [1, 1.03, 1],
        filter: state === "panic" ? "contrast(1.5) brightness(1.2)" : "contrast(1) brightness(1)"
      }}
      transition={{
        duration: state === "panic" ? 0.15 : 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Halo de Brilho Atmosférico */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          background: `radial-gradient(circle, ${color.replace(")", " / 0.2)")} 0%, transparent 75%)`,
        }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation={state === "panic" ? "6" : "3"} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {rings.map((ring, i) => {
          const r = (size / 2) * ring.radius;
          const cx = size / 2;
          const cy = size / 2;
          return (
            <motion.circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={color}
              strokeWidth={ring.width}
              strokeDasharray={ring.dash}
              strokeOpacity={state === "panic" ? 0.8 : 0.3 + (i * 0.1)}
              filter="url(#glow)"
              animate={{
                rotate: ring.reverse ? [360, 0] : [0, 360],
                strokeDashoffset: [0, 50]
              }}
              transition={{
                rotate: { duration: getAnimationSpeed(ring.speed), repeat: Infinity, ease: "linear" },
                strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" }
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
      </svg>

      {/* Núcleo Central (Singularidade) */}
      <motion.div
        className="absolute rounded-full z-10"
        style={{
          width: size * 0.25,
          height: size * 0.25,
          background: `radial-gradient(circle, #000 40%, ${color.replace(")", " / 0.4)")} 100%)`,
          boxShadow: `0 0 ${state === "listening" ? 50 : 25}px ${color.replace(")", " / 0.6)")}, inset 0 0 15px #000`,
        }}
        animate={state === "processing" ? { scale: [1, 0.8, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      />

      {/* Interface de Glitch Unificada (Solução Erro 17001) */}
      <AnimatePresence>
        {(state === "processing" || state === "panic") && (
          <motion.div
            key="vortex-glitch"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: [0, 0.7, 0],
              scale: [1, 1.05, 1],
              borderWidth: ["1px", "4px", "1px"]
            }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: color }}
            transition={{ 
              duration: state === "panic" ? 0.1 : 0.4, 
              repeat: Infinity,
              ease: "linear" 
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Vortex;