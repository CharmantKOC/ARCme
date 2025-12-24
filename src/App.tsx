import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Documentation from "./pages/Documentation";
import AjouterDocument from "./pages/AjouterDocument";
import NouvelleSession from "./pages/NouvelleSession";
import Consultation from "./pages/Consultation";
import Alumni from "./pages/Alumni";
import Visualisation from "./pages/Visualisation";
import Profil from "./pages/Profil";
import Messagerie from "./pages/Messagerie";
import Conversations from "./pages/Conversations";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Protected routes */}
            <Route path="/documentation" element={
              <ProtectedRoute><Documentation /></ProtectedRoute>
            } />
            <Route path="/ajouter-document" element={
              <ProtectedRoute><AjouterDocument /></ProtectedRoute>
            } />
            <Route path="/nouvelle-session" element={
              <ProtectedRoute><NouvelleSession /></ProtectedRoute>
            } />
            <Route path="/consultation" element={
              <ProtectedRoute><Consultation /></ProtectedRoute>
            } />
            <Route path="/alumni" element={
              <ProtectedRoute><Alumni /></ProtectedRoute>
            } />
            <Route path="/visualisation" element={
              <ProtectedRoute><Visualisation /></ProtectedRoute>
            } />
            <Route path="/profil" element={
              <ProtectedRoute><Profil /></ProtectedRoute>
            } />
            <Route path="/conversations" element={
              <ProtectedRoute><Conversations /></ProtectedRoute>
            } />
            <Route path="/messagerie/:alumniId" element={
              <ProtectedRoute><Messagerie /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);


export default App;
