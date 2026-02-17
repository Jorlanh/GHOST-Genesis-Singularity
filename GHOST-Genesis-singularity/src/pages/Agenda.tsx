import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";

const AgendaPage = () => {
  const events = [
    { time: "09:00", title: "Neural Calibration", type: "system" },
    { time: "11:30", title: "Ops Briefing", type: "meeting" },
    { time: "14:00", title: "IoT Diagnostics", type: "system" },
    { time: "17:00", title: "Security Audit", type: "critical" },
  ];

  return (
    <div className="h-full flex flex-col ghost-scanline">
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border/20">
        <div className="w-2 h-2 rounded-full bg-primary animate-flicker" />
        <span className="font-display text-sm tracking-widest text-primary/80">
          AGENDA SYNC
        </span>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={14} />
          <span className="text-[10px] tracking-widest uppercase">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>

        <div className="space-y-2">
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="ghost-glass p-4 flex items-center gap-4"
            >
              <div className="flex items-center gap-2 text-primary/50">
                <Clock size={12} />
                <span className="font-mono text-xs">{event.time}</span>
              </div>
              <div className="flex-1">
                <p className="font-display text-sm tracking-wider text-primary/80">
                  {event.title}
                </p>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${
                event.type === "critical" ? "bg-destructive" : "bg-primary/40"
              }`} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;
