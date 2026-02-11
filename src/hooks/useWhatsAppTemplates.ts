import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { statusConfig, type OrderStatus } from '@/hooks/useServiceOrders';

export interface WhatsAppTemplate {
  id: string;
  company_id: string;
  status_key: string;
  template_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Default templates with placeholder variables
export const DEFAULT_TEMPLATES: Record<string, string> = {
  em_analise: `Olá {{cliente}}! 👋\n\nSua ordem de serviço *{{os}}* do aparelho *{{aparelho}}* está *em análise*.\n\nEm breve entraremos em contato com o diagnóstico e orçamento.\n\n{{empresa}}`,
  aguardando_autorizacao: `Olá {{cliente}}! 👋\n\nFinalizamos a análise da sua OS *{{os}}* (*{{aparelho}}*).\n\n⚠️ *Aguardamos sua autorização* para prosseguir com o serviço.\n\nResponda esta mensagem para autorizar ou tirar dúvidas.\n\n{{empresa}}`,
  aguardando_pecas: `Olá {{cliente}}! 👋\n\nSua OS *{{os}}* (*{{aparelho}}*) está *aguardando peças*.\n\n📦 Assim que as peças chegarem, daremos andamento ao serviço.\n\nPrevisão: 3-5 dias úteis.\n\n{{empresa}}`,
  em_andamento: `Olá {{cliente}}! 👋\n\nBoas notícias! 🛠️\n\nSua OS *{{os}}* (*{{aparelho}}*) está *em andamento*.\n\nNossos técnicos já estão trabalhando no seu aparelho.\n\n{{empresa}}`,
  concluido: `Olá {{cliente}}! 🎉\n\nÓtima notícia!\n\nSua OS *{{os}}* (*{{aparelho}}*) foi *concluída com sucesso*! ✅\n\n📱 Seu aparelho está pronto para retirada.\n\nAguardamos sua visita!\n\n{{empresa}}`,
  entregue: `Olá {{cliente}}! 👋\n\nAgradecemos a preferência! 🙏\n\nSua OS *{{os}}* (*{{aparelho}}*) foi *entregue*.\n\nCaso tenha alguma dúvida ou precise de suporte, estamos à disposição!\n\n⭐ Avalie nosso atendimento!\n\n{{empresa}}`,
  pago: `Olá {{cliente}}! 👋\n\nPagamento confirmado! ✅\n\nSua OS *{{os}}* (*{{aparelho}}*) está *paga e finalizada*.\n\nObrigado pela confiança!\n\n{{empresa}}`,
};

export const TEMPLATE_VARIABLES = [
  { key: '{{cliente}}', label: 'Nome do Cliente' },
  { key: '{{os}}', label: 'Número da OS' },
  { key: '{{aparelho}}', label: 'Modelo do Aparelho' },
  { key: '{{empresa}}', label: 'Nome da Empresa' },
];

export function useWhatsAppTemplates() {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['whatsapp_templates', companyId],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data as WhatsAppTemplate[];
    },
    enabled: !!user && !!companyId,
  });

  const upsertTemplate = useMutation({
    mutationFn: async ({ status_key, template_text }: { status_key: string; template_text: string }) => {
      if (!user || !companyId) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('whatsapp_templates')
        .upsert(
          { company_id: companyId, status_key, template_text, is_active: true },
          { onConflict: 'company_id,status_key' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Template salvo', description: 'A mensagem foi atualizada com sucesso.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar template', description: error.message, variant: 'destructive' });
    },
  });

  const resetTemplate = useMutation({
    mutationFn: async ({ status_key }: { status_key: string }) => {
      if (!user || !companyId) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('company_id', companyId)
        .eq('status_key', status_key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Template restaurado', description: 'A mensagem padrão foi restaurada.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao restaurar', description: error.message, variant: 'destructive' });
    },
  });

  // Get the effective template for a status (custom or default)
  const getTemplate = (statusKey: string): string => {
    const custom = templates.find((t) => t.status_key === statusKey && t.is_active);
    return custom?.template_text || DEFAULT_TEMPLATES[statusKey] || '';
  };

  // Build final message replacing variables
  const buildMessage = (
    statusKey: string,
    clientName: string,
    orderNumber: number,
    deviceModel: string,
    companyName?: string
  ): string => {
    const template = getTemplate(statusKey);
    return template
      .replace(/\{\{cliente\}\}/g, clientName)
      .replace(/\{\{os\}\}/g, `OS-${String(orderNumber).padStart(3, '0')}`)
      .replace(/\{\{aparelho\}\}/g, deviceModel)
      .replace(/\{\{empresa\}\}/g, companyName || 'Assistência Técnica');
  };

  return {
    templates,
    isLoading,
    upsertTemplate,
    resetTemplate,
    getTemplate,
    buildMessage,
  };
}
