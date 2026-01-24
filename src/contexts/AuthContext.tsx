import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  company_name?: string;
  company_cnpj?: string;
  company_phone?: string;
  company_address?: string;
  company_logo_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: 'admin' | 'tecnico' | 'caixa' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; companyName: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<'admin' | 'tecnico' | 'caixa' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data as Profile);
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
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
    setRole(null);
  };

  const register = async (data: { name: string; email: string; password: string; companyName: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            company_name: data.companyName,
          },
        },
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este email já está cadastrado.' };
        }
        return { success: false, error: error.message };
      }
      
      // Update profile with company name after signup
      if (authData.user) {
        await supabase
          .from('profiles')
          .update({ company_name: data.companyName })
          .eq('user_id', authData.user.id);
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
