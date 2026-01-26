import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AccessDenied() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleGoBack = () => {
    // Redirect based on role
    if (role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/ordens');
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso Não Autorizado</h1>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar esta página. 
            Entre em contato com o administrador do sistema caso precise de acesso.
          </p>
        </div>
        <Button onClick={handleGoBack} variant="default">
          Voltar para página inicial
        </Button>
      </div>
    </div>
  );
}
