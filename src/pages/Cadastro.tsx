import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function Cadastro() {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    cnpj: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated, isLoading } = useAuth();
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
    
    // Sanitização dos inputs
    const sanitizedData = {
      name: formData.name.trim().slice(0, 100),
      companyName: formData.companyName.trim().slice(0, 150),
      email: formData.email.trim().toLowerCase().slice(0, 255),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      cnpj: formData.cnpj,
    };
    
    if (!sanitizedData.name || !sanitizedData.email || !sanitizedData.password || !sanitizedData.cnpj || !sanitizedData.companyName) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe um email válido.',
        variant: 'destructive',
      });
      return;
    }

    const cleanCnpj = sanitizedData.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      toast({
        title: 'Erro',
        description: 'CNPJ inválido. Deve conter 14 dígitos.',
        variant: 'destructive',
      });
      return;
    }
    
    if (sanitizedData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    
    if (sanitizedData.password !== sanitizedData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    const result = await register({
      name: sanitizedData.name,
      email: sanitizedData.email,
      password: sanitizedData.password,
      companyName: sanitizedData.companyName,
      cnpj: sanitizedData.cnpj,
    });
    
    if (result.success) {
      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar o cadastro.',
      });
      navigate('/login');
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Não foi possível criar a conta.',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'cnpj') {
      setFormData(prev => ({ ...prev, [field]: formatCNPJ(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
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
            Comece a gerenciar sua assistência técnica de forma profissional
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-sidebar-foreground/70">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Cadastro rápido e simples</span>
            </div>
            <div className="flex items-center gap-3 text-sidebar-foreground/70">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Dados isolados por CNPJ</span>
            </div>
            <div className="flex items-center gap-3 text-sidebar-foreground/70">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Suporte completo incluído</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold">TechFix</h1>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Cadastrar empresa</h2>
            <p className="mt-2 text-muted-foreground">
              Preencha os dados para começar a usar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ da Empresa *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  className="pl-10"
                  maxLength={18}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">O CNPJ será usado para identificar sua empresa no sistema</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="TechFix Assistência"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="pl-10"
                  maxLength={150}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Seu nome *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="pl-10"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="pl-10"
                  maxLength={255}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Criando conta...' : 'Cadastrar empresa'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
