import { motion } from "framer-motion";
import { Calendar, Home, Music, ExternalLink } from "lucide-react";

const integrations = [
  {
    title: "Google Calendar",
    description: "Sync agenda and events",
    icon: Calendar,
    status: "Disconnected",
  },
  {
    title: "Smart Home",
    description: "Home Assistant integration",
    icon: Home,
    status: "Disconnected",
  },
  {
    title: "Spotify",
    description: "Music control & playback",
    icon: Music,
    status: "Disconnected",
  },
];

const SettingsPage = () => {
  return (
    <div className="h-full flex flex-col ghost-scanline">
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border/20">
        <div className="w-2 h-2 rounded-full bg-primary animate-flicker" />
        <span className="font-display text-sm tracking-widest text-primary/80">
          SYSTEM CONFIG
        </span>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <h2 className="font-display text-lg tracking-widest text-primary/80 mb-1">
            INTEGRATIONS
          </h2>
          <p className="text-[10px] text-muted-foreground tracking-wider">
            Connect external services
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {integrations.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="ghost-glass p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <item.icon size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
                <ExternalLink size={12} className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              </div>

              <div>
                <h3 className="font-display text-sm tracking-wider text-primary/80">
                  {item.title}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
                <span className="text-[9px] text-muted-foreground/60 tracking-wider uppercase">
                  {item.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
