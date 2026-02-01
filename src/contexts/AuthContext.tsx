import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  cnpj: string;
  name: string;
  phone?: string;
  address?: string;
  logo_url?: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  company_id?: string;
  company_cnpj?: string;
  company_name?: string;
  company_phone?: string;
  company_address?: string;
  company_logo_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  companyId: string | null;
  role: 'admin' | 'tecnico' | 'caixa' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, cnpj: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; companyName: string; cnpj: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'tecnico' | 'caixa' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Periodic company access check
  const checkCompanyAccess = async (companyIdToCheck: string): Promise<{ isValid: boolean; reason?: string; expiringInDays?: number }> => {
    const { data, error } = await supabase
      .from('companies')
      .select('is_active, access_expires_at')
      .eq('id', companyIdToCheck)
      .maybeSingle();
    
    if (error || !data) {
      return { isValid: false, reason: 'Erro ao verificar acesso da empresa.' };
    }
    
    if (!data.is_active) {
      return { isValid: false, reason: 'Sua empresa foi desativada. Entre em contato com o suporte.' };
    }
    
    if (data.access_expires_at) {
      const expiresAt = new Date(data.access_expires_at);
      const now = new Date();
      
      if (expiresAt < now) {
        return { isValid: false, reason: 'O acesso da sua empresa expirou. Entre em contato com o suporte.' };
      }
      
      // Check if expiring within 7 days
      const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiration <= 7) {
        return { isValid: true, expiringInDays: daysUntilExpiration };
      }
    }
    
    return { isValid: true };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setCompany(null);
          setCompanyId(null);
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic company access verification (every 2 minutes)
  useEffect(() => {
    if (!companyId || !session) return;

    let expirationWarningShown = false;

    const verifyAccess = async () => {
      const { isValid, reason, expiringInDays } = await checkCompanyAccess(companyId);
      const { toast } = await import('@/hooks/use-toast');
      
      if (!isValid) {
        toast({
          title: 'Acesso Bloqueado',
          description: reason,
          variant: 'destructive',
        });
        
        // Logout the user
        await logout();
        return;
      }

      // Show expiration warning (only once per session)
      if (expiringInDays !== undefined && !expirationWarningShown) {
        expirationWarningShown = true;
        const message = expiringInDays === 1 
          ? 'O acesso da sua empresa expira amanhã!' 
          : expiringInDays === 0 
            ? 'O acesso da sua empresa expira hoje!' 
            : `O acesso da sua empresa expira em ${expiringInDays} dias.`;
        
        toast({
          title: '⚠️ Aviso de Expiração',
          description: `${message} Entre em contato com o suporte para renovar.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    };

    // Check immediately on mount
    verifyAccess();

    // Then check every 2 minutes
    const intervalId = setInterval(verifyAccess, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [companyId, session]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data as Profile);
      setCompanyId(data.company_id);
      
      // Fetch company details if company_id exists
      if (data.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', data.company_id)
          .single();
        
        if (companyData) {
          setCompany(companyData as Company);
        }
      }
    }
  };

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setRole(data.role as 'admin' | 'tecnico' | 'caixa');
    }
  };

  const login = async (email: string, password: string, cnpj: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      // First, verify that the CNPJ exists and check company access status
      //const { data: companyData, error: companyError } = await supabase
      // .from('companies')
      //  .select('id, is_active, access_expires_at')
      //  .eq('cnpj', cleanCnpj)
      //  .maybeSingle();

      const { data: companyData, error: companyError } =
  await supabase.rpc('login_company_by_cnpj', {
    p_cnpj: cleanCnpj,
  });

if (companyError) {
  return { success: false, error: 'Erro ao verificar empresa.' };
}

if (!companyData || companyData.length === 0) {
  return { success: false, error: 'CNPJ não encontrado no sistema.' };
}

const company = companyData[0];

if (!company.is_active) {
  return { success: false, error: 'Sua empresa está desativada.' };
}

if (company.access_expires_at) {
  const expiresAt = new Date(company.access_expires_at);
  if (expiresAt < new Date()) {
    return { success: false, error: 'O acesso da sua empresa expirou.' };
  }
}
      if (companyError) {
        return { success: false, error: 'Erro ao verificar empresa.' };
      }
      
      if (!companyData) {
        return { success: false, error: 'CNPJ não encontrado no sistema.' };
      }

      // Check if company is active
      if (!companyData.is_active) {
        return { success: false, error: 'Sua empresa está desativada. Entre em contato com o suporte.' };
      }

      // Check if company access has expired
      if (companyData.access_expires_at) {
        const expiresAt = new Date(companyData.access_expires_at);
        if (expiresAt < new Date()) {
          return { success: false, error: 'O acesso da sua empresa expirou. Entre em contato com o suporte.' };
        }
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { success: false, error: 'Email ou senha inválidos.' };
        }
        if (error.message === 'Email not confirmed') {
          return { success: false, error: 'Por favor, confirme seu email antes de fazer login.' };
        }
        return { success: false, error: error.message };
      }

      // Verify user belongs to the company
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', data.user.id)
          .single();
        
        if (!profileData?.company_id || profileData.company_id !== companyData.id) {
          // User doesn't belong to this company, logout
          await supabase.auth.signOut();
          return { success: false, error: 'Este usuário não está vinculado a esta empresa.' };
        }
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
    setCompanyId(null);
    setRole(null);
  };

  const register = async (data: { name: string; email: string; password: string; companyName: string; cnpj: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanCnpj = data.cnpj.replace(/\D/g, '');
      
      if (cleanCnpj.length !== 14) {
        return { success: false, error: 'CNPJ inválido. Deve conter 14 dígitos.' };
      }

      // Check if CNPJ already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .maybeSingle();
      
      if (existingCompany) {
        return { success: false, error: 'Este CNPJ já está cadastrado. Entre em contato com o administrador da empresa.' };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            company_name: data.companyName,
            company_cnpj: cleanCnpj,
          },
        },
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este email já está cadastrado.' };
        }
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      company,
      companyId,
      role, 
      isAuthenticated: !!session, 
      isLoading, 
      login, 
      logout, 
      register 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
