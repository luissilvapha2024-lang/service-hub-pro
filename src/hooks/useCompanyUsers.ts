import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CompanyUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'tecnico' | 'caixa';
  created_at: string;
}

export function useCompanyUsers() {
  const { companyId, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      // Get profiles for this company
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, name, email, created_at')
        .eq('company_id', companyId);

      if (profilesError) throw profilesError;

      // Get roles for these users
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: CompanyUser[] = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          role: (userRole?.role || 'tecnico') as 'admin' | 'tecnico' | 'caixa',
          created_at: profile.created_at,
        };
      }) || [];

      return usersWithRoles;
    },
    enabled: !!companyId,
  });

  const createUser = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role: string }) => {
      const response = await supabase.functions.invoke('create-user', {
        body: data,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', companyId] });
      toast({
        title: 'Usuário criado',
        description: 'O novo usuário foi cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', companyId] });
      toast({
        title: 'Função atualizada',
        description: 'A função do usuário foi alterada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar função',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser,
    updateUserRole,
  };
}
