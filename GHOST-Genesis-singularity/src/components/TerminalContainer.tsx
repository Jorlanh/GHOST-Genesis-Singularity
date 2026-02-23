import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
  id: string;
  msg: string;
  type: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  timestamp: string;
}

const TerminalContainer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const electron = (window as any).electronAPI;

    // BLINDAGEM DE INFRAESTRUTURA: Verificação estrita para evitar crashes fora do Electron
    if (electron && typeof electron.onLogUpdate === 'function') {
      return electron.onLogUpdate((newLog: any) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const entry: LogEntry = { id, ...newLog };
        
        setLogs(prev => [...prev.slice(-4), entry]); // Máximo 5 mensagens simultâneas

        // Protocolo de Autodestruição: Remove o log após 5 segundos
        setTimeout(() => {
          setLogs(prev => prev.filter(log => log.id !== id));
        }, 5000);
      });
    }
  }, []);

  const getColor = (type: string) => {
    const colors = {
      ERROR: "text-red-500/80",
      WARN: "text-amber-500/80",
      SUCCESS: "text-emerald-400/80",
      INFO: "text-cyan-400/40"
    };
    return colors[type as keyof typeof colors] || colors.INFO;
  };

  return (
    // Removido background e bordas. Apenas um container invisível.
    <div className="flex flex-col w-[400px] font-mono text-[10px] pointer-events-none overflow-hidden h-fit">
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -10, filter: "blur(5px)", transition: { duration: 0.8 } }}
              className="flex gap-3 items-center"
            >
              <span className="text-primary/20 text-[8px] italic">{log.timestamp}</span>
              <div className={`h-[1px] w-4 ${log.type === 'ERROR' ? 'bg-red-500' : 'bg-cyan-500/30'}`} />
              <span className={`${getColor(log.type)} tracking-tight leading-none`}>
                {log.msg.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TerminalContainer;