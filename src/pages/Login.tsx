import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Email ou senha inválidos.',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-sidebar-foreground">TechFix</h1>
          </div>
          <p className="text-xl text-sidebar-foreground/80 max-w-md">
            Sistema completo para gestão de assistência técnica de celulares
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-sidebar-foreground/70">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Controle de Ordens de Serviço</span>
            </div>
            <div className="flex items-center gap-3 text-sidebar-foreground/70">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>PDV Integrado</span>
            </div>
            <div className="flex items-center gap-3 text-sidebar-foreground/70">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Gestão Financeira Completa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold">TechFix</h1>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="mt-2 text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm text-muted-foreground">Lembrar de mim</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </a>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-primary font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
