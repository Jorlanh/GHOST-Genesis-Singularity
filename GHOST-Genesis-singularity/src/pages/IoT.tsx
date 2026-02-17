import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Thermometer, Zap, Wifi, Palette } from "lucide-react";

const devices = [
  { name: "Living Room Hub", status: "online", icon: Wifi, temp: "23°C" },
  { name: "Security Camera #1", status: "online", icon: Cpu, temp: "41°C" },
  { name: "Smart Lock", status: "offline", icon: Zap, temp: "--" },
  { name: "Climate Control", status: "online", icon: Thermometer, temp: "22°C" },
];

const presetColors = [
  { name: "Cyan", value: "#00F3FF" },
  { name: "Red", value: "#FF0040" },
  { name: "Green", value: "#00FF88" },
  { name: "Purple", value: "#A020F0" },
  { name: "Orange", value: "#FF6600" },
  { name: "White", value: "#FFFFFF" },
];

const IoTPage = () => {
  const [selectedColor, setSelectedColor] = useState("#00F3FF");

  return (
    <div className="h-full flex flex-col ghost-scanline">
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border/20">
        <div className="w-2 h-2 rounded-full bg-primary animate-flicker" />
        <span className="font-display text-sm tracking-widest text-primary">
          IoT CONTROL
        </span>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* LED Color Control */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-primary" />
            <h2 className="font-display text-sm tracking-widest text-primary">
              LED COLOR
            </h2>
          </div>

          <div className="ghost-glass p-5">
            <div className="flex items-center gap-4 flex-wrap">
              {presetColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 transition-all duration-200"
                    style={{
                      backgroundColor: color.value,
                      borderColor: selectedColor === color.value ? color.value : "transparent",
                      boxShadow: selectedColor === color.value
                        ? `0 0 20px ${color.value}80, 0 0 40px ${color.value}40`
                        : "none",
                    }}
                  />
                  <span className="text-[8px] text-muted-foreground tracking-wider uppercase group-hover:text-primary transition-colors">
                    {color.name}
                  </span>
                </button>
              ))}

              {/* Custom color picker */}
              <div className="flex flex-col items-center gap-1.5">
                <label className="relative w-10 h-10 rounded-full border-2 border-border/30 cursor-pointer overflow-hidden hover:border-primary/50 transition-colors">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full"
                    style={{
                      background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                    }}
                  />
                </label>
                <span className="text-[8px] text-muted-foreground tracking-wider uppercase">
                  CUSTOM
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedColor, boxShadow: `0 0 10px ${selectedColor}` }}
              />
              <span className="text-[10px] text-primary font-mono tracking-wider">
                ACTIVE: {selectedColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Devices */}
        <div>
          <h2 className="font-display text-sm tracking-widest text-primary mb-4">
            DEVICES
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {devices.map((device, i) => (
              <motion.div
                key={device.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="ghost-glass p-5 flex items-start gap-4"
              >
                <device.icon size={20} className={`mt-0.5 ${
                  device.status === "online" ? "text-primary" : "text-muted-foreground/30"
                }`} />
                <div className="flex-1">
                  <h3 className="font-display text-sm tracking-wider text-primary">
                    {device.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        device.status === "online" ? "bg-primary" : "bg-destructive/60"
                      }`} />
                      <span className="text-[9px] text-primary/60 uppercase tracking-wider">
                        {device.status}
                      </span>
                    </div>
                    <span className="text-[9px] text-primary/40 font-mono">
                      {device.temp}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IoTPage;
