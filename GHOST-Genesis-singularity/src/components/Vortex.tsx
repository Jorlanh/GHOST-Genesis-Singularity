import { motion } from "framer-motion";

type VortexState = "idle" | "listening" | "processing";

interface VortexProps {
  state?: VortexState;
  size?: number;
  accentColor?: string;
}

const Vortex = ({ state = "idle", size = 280, accentColor }: VortexProps) => {
  const color = accentColor || "hsl(186 100% 50%)";

  const rings = [
    { radius: 0.95, width: 1.5, speed: 20, reverse: false, dash: "4 6" },
    { radius: 0.82, width: 1, speed: 15, reverse: true, dash: "8 4" },
    { radius: 0.68, width: 2, speed: 25, reverse: false, dash: "2 8" },
    { radius: 0.55, width: 1, speed: 12, reverse: true, dash: "6 3" },
    { radius: 0.42, width: 1.5, speed: 18, reverse: false, dash: "3 5" },
    { radius: 0.30, width: 1, speed: 30, reverse: true, dash: "10 2" },
  ];

  const getAnimationSpeed = (baseSpeed: number) => {
    if (state === "listening") return baseSpeed * 0.3;
    if (state === "processing") return baseSpeed * 0.5;
    return baseSpeed;
  };

  const getGlowIntensity = () => {
    if (state === "listening") return 1;
    if (state === "processing") return 0.7;
    return 0.4;
  };

  const getBreathScale = () => {
    if (state === "listening") return [1, 1.08, 1];
    if (state === "processing") return [0.95, 1.05, 0.97, 1.02, 0.95];
    return [1, 1.03, 1];
  };

  const getBreathDuration = () => {
    if (state === "listening") return 1.5;
    if (state === "processing") return 0.4;
    return 4;
  };

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ scale: getBreathScale() }}
      transition={{
        duration: getBreathDuration(),
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color.replace(")", ` / ${getGlowIntensity() * 0.15})`).replace("hsl(", "hsl(")} 0%, transparent 70%)`,
        }}
      />

      {/* SVG Rings */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {rings.map((ring, i) => {
          const r = (size / 2) * ring.radius;
          const cx = size / 2;
          const cy = size / 2;
          const duration = getAnimationSpeed(ring.speed);

          return (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={ring.width}
              strokeDasharray={ring.dash}
              strokeOpacity={0.3 + (i * 0.1)}
              filter="url(#glow)"
              animate={{
                rotate: ring.reverse ? [360, 0] : [0, 360],
              }}
              transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
      </svg>

      {/* Center void */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.22,
          height: size * 0.22,
          background: `radial-gradient(circle, hsl(0 0% 0%) 60%, ${color.replace(")", " / 0.1)")} 100%)`,
          boxShadow: `0 0 ${state === "listening" ? 40 : 20}px ${color.replace(")", ` / ${getGlowIntensity() * 0.5})`)}, inset 0 0 20px hsl(0 0% 0%)`,
        }}
      />

      {/* Glitch overlay for processing */}
      {state === "processing" && (
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/50"
          animate={{
            opacity: [0, 0.5, 0, 0.8, 0],
            scale: [1, 1.02, 0.98, 1.01, 1],
          }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

export default Vortex;
