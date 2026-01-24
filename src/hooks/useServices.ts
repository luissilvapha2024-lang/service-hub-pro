import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Service = Tables<'services'>;
export type ServiceInsert = TablesInsert<'services'>;
export type ServiceUpdate = TablesUpdate<'services'>;

export function useServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createService = useMutation({
    mutationFn: async (service: Omit<ServiceInsert, 'user_id'>) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('services')
        .insert({ ...service, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Serviço cadastrado',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cadastrar serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...updates }: ServiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Serviço atualizado',
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Serviço removido',
        description: 'O serviço foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    services,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
  };
}
