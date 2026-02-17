import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Calendar, Cpu, Settings, Menu, X, Mic, Bluetooth } from "lucide-react";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda Sync", path: "/agenda", icon: Calendar },
  { title: "IoT Control", path: "/iot", icon: Cpu },
  { title: "Devices", path: "/devices", icon: Bluetooth },
  { title: "System Config", path: "/settings", icon: Settings },
  { title: "Voice Mode", path: "/voice-mode", icon: Mic },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
  const showSidebar = isDesktop ? hovered : sidebarOpen;

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex relative">
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-sm border border-border/30 bg-muted/60 backdrop-blur-sm text-primary"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop hover trigger */}
      <div
        className="hidden md:block fixed left-0 top-0 w-3 h-full z-40"
        onMouseEnter={() => setHovered(true)}
      />

      {/* Sidebar overlay (mobile) */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed left-0 top-0 h-full w-60 z-40 flex flex-col border-r border-border/20 bg-background/95 backdrop-blur-xl"
            onMouseLeave={() => isDesktop && setHovered(false)}
          >
            {/* Logo */}
            <div className="p-6 border-b border-border/20">
              <h2 className="font-display text-xl tracking-[0.2em] text-primary ghost-text-glow">
                GHOST
              </h2>
              <p className="text-[9px] text-primary/50 tracking-widest mt-1">
                SINGULARITY v4.7
              </p>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-body transition-all duration-200 ${
                      isActive
                        ? "border-l-2 border-primary text-primary ghost-text-glow bg-primary/5"
                        : "text-primary/60 hover:text-primary hover:bg-muted/30 border-l-2 border-transparent"
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border/20 text-[9px] text-primary/40 tracking-wider">
              OPERATOR: AUTHORIZED
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 h-full overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
