import { supabase } from '@/integrations/supabase/client';

export interface StaffLoginResult {
  userId: string;
  userType: 'admin' | 'barber';
  name?: string | null;
}

/**
 * Autentica um colaborador (admin, gerente ou barbeiro) pela MATRÍCULA.
 * O e-mail nunca trafega para o cliente: a edge function resolve a matrícula
 * internamente e devolve apenas a sessão.
 */
export const signInWithMatricula = async (
  matricula: string,
  password: string
): Promise<StaffLoginResult> => {
  const { data, error } = await supabase.functions.invoke('staff-login', {
    body: { matricula: matricula.trim(), password },
  });

  let payload: any = data;

  if (error) {
    // Erros HTTP (401/403) trazem o corpo dentro de error.context
    try {
      const ctx: any = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        payload = await ctx.json();
      }
    } catch {
      // ignora
    }
    if (!payload?.error) {
      throw new Error('Não foi possível autenticar. Tente novamente.');
    }
  }

  if (!payload?.success) {
    throw new Error(payload?.error || 'Matrícula ou senha incorretos');
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: payload.session.access_token,
    refresh_token: payload.session.refresh_token,
  });

  if (sessionError) throw sessionError;

  return {
    userId: payload.user_id,
    userType: payload.user_type,
    name: payload.name,
  };
};

export const signInMasterWithEmail = async (
  email: string,
  password: string
): Promise<StaffLoginResult> => {
  const { data, error } = await supabase.functions.invoke('staff-login', {
    body: { email: email.trim().toLowerCase(), password },
  });

  let payload: any = data;
  if (error) {
    try {
      const context: any = (error as any).context;
      if (context && typeof context.json === 'function') payload = await context.json();
    } catch {
      // A mensagem genérica abaixo evita expor detalhes internos.
    }
  }

  if (!payload?.success) {
    throw new Error(payload?.error || 'E-mail ou senha incorretos');
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: payload.session.access_token,
    refresh_token: payload.session.refresh_token,
  });
  if (sessionError) throw sessionError;

  return {
    userId: payload.user_id,
    userType: payload.user_type,
    name: payload.name,
  };
};

export const isEmailInput = (value: string) => value.includes('@');
