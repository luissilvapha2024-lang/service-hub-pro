import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientUpdate = TablesUpdate<'clients'>;

// Type for the secure view (CPF, email, address may be null for non-admins)
export type ClientSafe = Omit<Client, 'cpf' | 'email' | 'address'> & {
  cpf: string | null;
  email: string | null;
  address: string | null;
};

export function useClients() {
  const { user, companyId, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use secure view for reading - non-admins see masked data
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients', companyId, role],
    queryFn: async () => {
      if (!user || !companyId) return [];
      
      // Admins use the base table for full access, others use the secure view
      if (role === 'admin') {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as ClientSafe[];
      } else {
        const { data, error } = await supabase
          .from('clients_safe' as 'clients')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as unknown as ClientSafe[];
      }
    },
    enabled: !!user && !!companyId,
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<ClientInsert, 'user_id' | 'company_id'>) => {
      if (!user || !companyId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user.id, company_id: companyId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente cadastrado',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cadastrar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: ClientUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente atualizado',
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente removido',
        description: 'O cliente foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
}
