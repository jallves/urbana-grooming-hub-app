
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Client } from '@/types/client';

interface ClientAuthContextType {
  user: User | null;
  client: Client | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: {
    name: string;
    phone: string;
    birth_date: string;
  }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateClient: (data: Partial<Client>) => Promise<{ error: any }>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};

export const ClientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClient(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchClient(session.user.email!);
        } else {
          setClient(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchClient = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching client:', error);
      } else {
        setClient(data);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    phone: string;
    birth_date: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/client-dashboard`,
      },
    });

    if (!error && data.user) {
      // Create client record
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          name: userData.name,
          email: email,
          phone: userData.phone,
          birth_date: userData.birth_date,
        });

      if (clientError) {
        console.error('Error creating client record:', clientError);
        return { error: clientError };
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateClient = async (data: Partial<Client>) => {
    if (!client) return { error: 'No client found' };

    const { error } = await supabase
      .from('clients')
      .update(data)
      .eq('id', client.id);

    if (!error) {
      setClient({ ...client, ...data });
    }

    return { error };
  };

  const value = {
    user,
    client,
    loading,
    signIn,
    signUp,
    signOut,
    updateClient,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};
