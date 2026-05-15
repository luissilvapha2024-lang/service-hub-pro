import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps {
  phone: string;
  message: string;
  variant?: 'default' | 'outline' | 'ghost' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({
  phone,
  message,
  variant = 'default',
  size = 'default',
  className,
  children,
}: WhatsAppButtonProps) {
  // Validação e sanitização do telefone - apenas números permitidos
  const cleanPhone = phone.replace(/\D/g, '').slice(0, 15); // Max 15 digits
  
  // Valida se o telefone tem comprimento mínimo
  if (cleanPhone.length < 10) {
    console.warn('WhatsAppButton: Telefone inválido fornecido');
  }
  
  // Adiciona código do Brasil se não tiver
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  // Sanitiza e limita o tamanho da mensagem
  const sanitizedMessage = message.slice(0, 4096); // WhatsApp URL limit

  const handleClick = () => {
    if (cleanPhone.length < 10) return;

    // Normaliza Unicode para garantir que emojis sejam transmitidos corretamente (NFC)
    const normalizedMessage = sanitizedMessage.normalize('NFC');
    // encodeURIComponent garante UTF-8, mas alguns clientes WhatsApp interpretam '+' como espaço
    // e quebram emojis. Usamos api.whatsapp.com que preserva corretamente caracteres Unicode.
    const encodedMessage = encodeURIComponent(normalizedMessage);
    const mode = localStorage.getItem('whatsapp_open_mode') || 'auto';

    let url: string;
    if (mode === 'web') {
      url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    } else if (mode === 'desktop') {
      url = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
    } else {
      // api.whatsapp.com lida melhor com emojis do que wa.me em alguns clientes desktop
      url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant === 'success' ? 'default' : variant}
      size={size}
      onClick={handleClick}
      className={cn(
        variant === 'success' && 'bg-[#25D366] hover:bg-[#128C7E] text-white',
        className
      )}
    >
      <MessageCircle className="w-4 h-4" />
      {children}
    </Button>
  );
}

// Função helper para gerar mensagens de status
export function generateStatusMessage(
  clientName: string,
  orderNumber: number,
  deviceModel: string,
  status: string,
  companyName?: string
): string {
  const statusMessages: Record<string, string> = {
    em_analise: `Olá ${clientName}! 👋\n\nSua ordem de serviço *OS-${String(orderNumber).padStart(3, '0')}* do aparelho *${deviceModel}* está *em análise*.\n\nEm breve entraremos em contato com o diagnóstico e orçamento.\n\n${companyName || 'Assistência Técnica'}`,
    
    aguardando_autorizacao: `Olá ${clientName}! 👋\n\nFinalizamos a análise da sua OS *OS-${String(orderNumber).padStart(3, '0')}* (*${deviceModel}*).\n\n⚠️ *Aguardamos sua autorização* para prosseguir com o serviço.\n\nResponda esta mensagem para autorizar ou tirar dúvidas.\n\n${companyName || 'Assistência Técnica'}`,
    
    aguardando_pecas: `Olá ${clientName}! 👋\n\nSua OS *OS-${String(orderNumber).padStart(3, '0')}* (*${deviceModel}*) está *aguardando peças*.\n\n📦 Assim que as peças chegarem, daremos andamento ao serviço.\n\nPrevisão: 3-5 dias úteis.\n\n${companyName || 'Assistência Técnica'}`,
    
    em_andamento: `Olá ${clientName}! 👋\n\nBoas notícias! 🛠️\n\nSua OS *OS-${String(orderNumber).padStart(3, '0')}* (*${deviceModel}*) está *em andamento*.\n\nNossos técnicos já estão trabalhando no seu aparelho.\n\n${companyName || 'Assistência Técnica'}`,
    
    concluido: `Olá ${clientName}! 🎉\n\nÓtima notícia!\n\nSua OS *OS-${String(orderNumber).padStart(3, '0')}* (*${deviceModel}*) foi *concluída com sucesso*! ✅\n\n📱 Seu aparelho está pronto para retirada.\n\nAguardamos sua visita!\n\n${companyName || 'Assistência Técnica'}`,
    
    entregue: `Olá ${clientName}! 👋\n\nAgradecemos a preferência! 🙏\n\nSua OS *OS-${String(orderNumber).padStart(3, '0')}* (*${deviceModel}*) foi *entregue*.\n\nCaso tenha alguma dúvida ou precise de suporte, estamos à disposição!\n\n⭐ Avalie nosso atendimento!\n\n${companyName || 'Assistência Técnica'}`,
    
    pago: `Olá ${clientName}! 👋\n\nPagamento confirmado! ✅\n\nSua OS *OS-${String(orderNumber).padStart(3, '0')}* (*${deviceModel}*) está *paga e finalizada*.\n\nObrigado pela confiança!\n\n${companyName || 'Assistência Técnica'}`,
  };

  return statusMessages[status] || `Olá ${clientName}! Sua OS OS-${String(orderNumber).padStart(3, '0')} está com status: ${status}. ${companyName || 'Assistência Técnica'}`;
}
