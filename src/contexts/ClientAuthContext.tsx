import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Client } from '@/types/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput, validatePasswordStrength } from '@/lib/security';
import { checkRateLimit, resetRateLimit, formatLockoutTime } from '@/lib/rateLimiting';
import { validateClientRegistration, validateClientLogin } from '@/lib/inputValidation';

interface ClientAuthContextType {
  client: Client | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: ClientSignUpData) => Promise<{ error: string | null }>;
  signIn: (data: ClientLoginData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateClient: (data: Partial<Client>) => Promise<{ error: string | null }>;
}

interface ClientSignUpData {
  name: string;
  email: string;
  phone: string;
  birth_date?: string;
  password: string;
  confirmPassword: string;
}

interface ClientLoginData {
  email: string;
  password: string;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}

interface ClientAuthProviderProps {
  children: ReactNode;
}

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Test database connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
        if (error) {
          console.error('Database connection test failed:', error);
          toast({
            title: "Erro de Conexão",
            description: "Não foi possível conectar ao banco de dados. Verifique sua conexão.",
            variant: "destructive",
          });
        } else {
          console.log('Database connection successful');
        }
      } catch (error) {
        console.error('Connection test error:', error);
      }
    };

    testConnection();
  }, [toast]);

  // Set up auth state listener and check for existing session
  useEffect(() => {
    let isMounted = true;
    console.log('Setting up auth state listener...');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'Session exists:', !!session);
        
        if (!isMounted) return;
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('User authenticated, fetching profile...');
            await fetchOrCreateClientProfile(session.user);
          } else {
            console.log('No user session, clearing client data');
            setClient(null);
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }
        
        if (!isMounted) return;
        
        if (initialSession?.user) {
          console.log('Initial session found for user:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchOrCreateClientProfile(initialSession.user);
        } else {
          console.log('No initial session found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('Cleaning up auth listener');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrCreateClientProfile = async (authUser: User) => {
    try {
      console.log('Fetching client profile for user:', authUser.id);
      
      // Try to fetch existing client profile
      const { data: existingClient, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching client profile:', fetchError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o perfil do cliente.",
          variant: "destructive",
        });
        return;
      }

      if (existingClient) {
        console.log('Existing client found:', existingClient);
        setClient(existingClient);
      } else {
        // Create client profile from auth user metadata
        console.log('Creating new client profile from auth user');
        const clientData = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Cliente',
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || '',
          birth_date: authUser.user_metadata?.birth_date || null,
        };

        console.log('Inserting client data:', clientData);
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single();

        if (createError) {
          console.error('Error creating client profile:', createError);
          // If it's a duplicate key error, try to fetch the existing profile
          if (createError.code === '23505') {
            const { data: retryClient } = await supabase
              .from('clients')
              .select('*')
              .eq('id', authUser.id)
              .maybeSingle();
            
            if (retryClient) {
              setClient(retryClient);
            }
          } else {
            toast({
              title: "Erro",
              description: "Não foi possível criar o perfil do cliente.",
              variant: "destructive",
            });
          }
          return;
        }

        console.log('New client profile created:', newClient);
        setClient(newClient);
      }
    } catch (error) {
      console.error('Error in fetchOrCreateClientProfile:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao carregar perfil.",
        variant: "destructive",
      });
    }
  };

  const signUp = async (data: ClientSignUpData): Promise<{ error: string | null }> => {
    try {
      // Rate limiting check
      const rateCheck = checkRateLimit(data.email, 'registration');
      if (!rateCheck.allowed) {
        const lockoutTime = rateCheck.lockoutUntil ? formatLockoutTime(rateCheck.lockoutUntil) : '';
        return { 
          error: `Muitas tentativas de registro. Tente novamente em ${lockoutTime}.` 
        };
      }

      // Enhanced input validation
      const validation = validateClientRegistration(data);
      if (!validation.isValid) {
        return { error: validation.errors[0] };
      }

      // Sanitize input data
      const sanitizedData = {
        name: sanitizeInput(data.name),
        email: sanitizeInput(data.email),
        phone: sanitizeInput(data.phone),
        birth_date: data.birth_date ? sanitizeInput(data.birth_date) : undefined,
      };

      // Enhanced password validation
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        return { error: passwordValidation.errors[0] };
      }

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: data.password,
        options: {
          data: {
            full_name: sanitizedData.name,
            phone: sanitizedData.phone,
            birth_date: sanitizedData.birth_date,
          },
          emailRedirectTo: `${window.location.origin}/cliente/dashboard`
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { error: 'Erro ao criar conta: ' + authError.message };
      }

      if (!authData.user) {
        return { error: 'Falha ao criar usuário' };
      }

      // Reset rate limit on success
      resetRateLimit(data.email, 'registration');

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signIn = async (data: ClientLoginData): Promise<{ error: string | null }> => {
    try {
      // Rate limiting check
      const rateCheck = checkRateLimit(data.email, 'login');
      if (!rateCheck.allowed) {
        const lockoutTime = rateCheck.lockoutUntil ? formatLockoutTime(rateCheck.lockoutUntil) : '';
        return { 
          error: `Muitas tentativas de login. Tente novamente em ${lockoutTime}.` 
        };
      }

      // Enhanced input validation
      const validation = validateClientLogin(data);
      if (!validation.isValid) {
        return { error: validation.errors[0] };
      }

      const sanitizedEmail = sanitizeInput(data.email);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: data.password,
      });

      if (authError) {
        console.error('Login error:', authError);
        return { error: 'Email ou senha incorretos' };
      }

      if (!authData.user) {
        return { error: 'Falha na autenticação' };
      }

      // Reset rate limit on successful login
      resetRateLimit(data.email, 'login');

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setClient(null);
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const updateClient = async (data: Partial<Client>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      // Sanitize input data
      const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = sanitizeInput(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(sanitizedData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update client error:', error);
        return { error: error.message };
      }

      setClient(updatedClient);
      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const value = {
    client,
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateClient
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}
