import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VoiceMode from "./pages/VoiceMode";
import SettingsPage from "./pages/Settings";
import AgendaPage from "./pages/Agenda";
import IoTPage from "./pages/IoT";
import DevicesPage from "./pages/Devices";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/voice-mode" element={<VoiceMode />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/agenda"
            element={
              <Layout>
                <AgendaPage />
              </Layout>
            }
          />
          <Route
            path="/iot"
            element={
              <Layout>
                <IoTPage />
              </Layout>
            }
          />
          <Route
            path="/devices"
            element={
              <Layout>
                <DevicesPage />
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <SettingsPage />
              </Layout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
