import { useState } from "react";
import { motion } from "framer-motion";
import { Bluetooth, Headphones, Watch, Speaker, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface BluetoothDevice {
  name: string;
  type: string;
  icon: typeof Headphones;
  connected: boolean;
  battery: number;
  volume: number;
}

const initialDevices: BluetoothDevice[] = [
  { name: "Headset X10 Pro", type: "Audio", icon: Headphones, connected: true, battery: 85, volume: 70 },
  { name: "Smartwatch X10", type: "Wearable", icon: Watch, connected: true, battery: 62, volume: 50 },
  { name: "JBL Flip 6", type: "Speaker", icon: Speaker, connected: false, battery: 0, volume: 0 },
];

const DevicesPage = () => {
  const [devices, setDevices] = useState(initialDevices);

  const updateVolume = (index: number, value: number[]) => {
    setDevices(prev => prev.map((d, i) => i === index ? { ...d, volume: value[0] } : d));
  };

  return (
    <div className="h-full flex flex-col ghost-scanline">
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border/20">
        <div className="w-2 h-2 rounded-full bg-primary animate-flicker" />
        <span className="font-display text-sm tracking-widest text-primary">
          DEVICES
        </span>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bluetooth size={16} className="text-primary" />
          <h2 className="font-display text-sm tracking-widest text-primary">
            BLUETOOTH CONNECTIONS
          </h2>
        </div>

        <div className="space-y-4">
          {devices.map((device, i) => (
            <motion.div
              key={device.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="ghost-glass p-5"
            >
              <div className="flex items-center gap-4">
                <device.icon size={20} className={device.connected ? "text-primary" : "text-muted-foreground/30"} />
                <div className="flex-1">
                  <h3 className="font-display text-sm tracking-wider text-primary">
                    {device.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${device.connected ? "bg-primary" : "bg-destructive/60"}`} />
                      <span className="text-[9px] text-primary/60 uppercase tracking-wider">
                        {device.connected ? "CONNECTED" : "OFFLINE"}
                      </span>
                    </div>
                    {device.connected && (
                      <span className="text-[9px] text-primary/40 font-mono">
                        BAT: {device.battery}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {device.connected && (
                <div className="mt-4 flex items-center gap-3">
                  <Volume2 size={14} className="text-primary/60" />
                  <Slider
                    value={[device.volume]}
                    max={100}
                    step={1}
                    onValueChange={(v) => updateVolume(i, v)}
                    className="flex-1"
                  />
                  <span className="text-[10px] text-primary/60 font-mono w-8 text-right">
                    {device.volume}%
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DevicesPage;
