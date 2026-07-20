import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { SpeedInsights } from "@vercel/speed-insights/react";

const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Servicos = lazy(() => import("./pages/Servicos"));
const Produtos = lazy(() => import("./pages/Produtos"));
const OrdensServico = lazy(() => import("./pages/OrdensServico"));
const EditarOS = lazy(() => import("./pages/EditarOS"));
const PDV = lazy(() => import("./pages/PDV"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SpeedInsights />
          <BrowserRouter>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/servicos" element={<Servicos />} />
                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/ordens" element={<OrdensServico />} />
                    <Route path="/ordens/:id" element={<EditarOS />} />
                    <Route path="/pdv" element={<PDV />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                  </Route>
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
