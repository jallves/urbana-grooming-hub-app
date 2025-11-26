import { supabase } from '@/integrations/supabase/client';

export interface SessionData {
  userId?: string;
  userType: 'admin' | 'barber' | 'client' | 'painel_cliente' | 'totem';
  userEmail?: string;
  userName?: string;
  expiresInHours?: number;
}

export interface ActiveSession {
  id: string;
  user_id: string | null;
  user_type: string;
  user_email: string | null;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  login_at: string;
  last_activity_at: string;
  expires_at: string;
}

class SessionManager {
  private sessionToken: string | null = null;

  // Gerar token único para a sessão
  private generateSessionToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obter informações do dispositivo
  private getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Criar nova sessão
  async createSession(data: SessionData): Promise<string | null> {
    try {
      const token = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));

      const { data: sessionId, error } = await supabase.rpc('create_user_session', {
        p_user_id: data.userId || null,
        p_user_type: data.userType,
        p_user_email: data.userEmail || null,
        p_user_name: data.userName || null,
        p_session_token: token,
        p_user_agent: navigator.userAgent,
        p_device_info: this.getDeviceInfo(),
        p_expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('Erro ao criar sessão:', error);
        return null;
      }

      this.sessionToken = token;
      localStorage.setItem(`session_token_${data.userType}`, token);
      
      // Iniciar atualização periódica de atividade
      this.startActivityUpdater();

      return token;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      return null;
    }
  }

  // Atualizar atividade da sessão
  async updateActivity(token?: string): Promise<boolean> {
    try {
      const sessionToken = token || this.sessionToken;
      if (!sessionToken) return false;

      const { data, error } = await supabase.rpc('update_session_activity', {
        p_session_token: sessionToken,
      });

      if (error) {
        console.error('Erro ao atualizar atividade:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      return false;
    }
  }

  // Invalidar sessão (logout)
  async invalidateSession(userType: string, token?: string): Promise<boolean> {
    try {
      const sessionToken = token || this.sessionToken || localStorage.getItem(`session_token_${userType}`);
      if (!sessionToken) return false;

      const { data, error } = await supabase.rpc('invalidate_session', {
        p_session_token: sessionToken,
      });

      if (error) {
        console.error('Erro ao invalidar sessão:', error);
        return false;
      }

      this.sessionToken = null;
      localStorage.removeItem(`session_token_${userType}`);
      this.stopActivityUpdater();

      return data || false;
    } catch (error) {
      console.error('Erro ao invalidar sessão:', error);
      return false;
    }
  }

  // Validar sessão existente
  async validateSession(userType: string, token?: string): Promise<any> {
    try {
      const sessionToken = token || localStorage.getItem(`session_token_${userType}`);
      if (!sessionToken) return { valid: false };

      const { data, error } = await supabase.rpc('validate_session', {
        p_session_token: sessionToken,
      });

      if (error) {
        console.error('Erro ao validar sessão:', error);
        return { valid: false };
      }

      const result = data as any;
      if (result && result.valid) {
        this.sessionToken = sessionToken;
        this.startActivityUpdater();
      }

      return result || { valid: false };
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return { valid: false };
    }
  }

  // Obter todas as sessões ativas (apenas admins)
  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_sessions');

      if (error) {
        console.error('Erro ao obter sessões ativas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao obter sessões ativas:', error);
      return [];
    }
  }

  // Forçar logout de uma sessão (apenas admins)
  async forceLogoutSession(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('force_logout_session', {
        p_session_id: sessionId,
      });

      if (error) {
        console.error('Erro ao forçar logout:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro ao forçar logout:', error);
      return false;
    }
  }

  // Atualizar atividade periodicamente
  private activityInterval: NodeJS.Timeout | null = null;

  private startActivityUpdater() {
    if (this.activityInterval) return;

    // Atualizar atividade a cada 5 minutos
    this.activityInterval = setInterval(() => {
      this.updateActivity();
    }, 5 * 60 * 1000);
  }

  private stopActivityUpdater() {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
  }
}

// Singleton
export const sessionManager = new SessionManager();
