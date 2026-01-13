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

/**
 * Session Manager simplificado - gerencia sessões localmente
 * As RPCs de sessão não existem no banco, então usamos localStorage
 */
class SessionManager {
  private sessionToken: string | null = null;

  private generateSessionToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Criar nova sessão (local)
  async createSession(data: SessionData): Promise<string | null> {
    try {
      const token = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));

      // Armazenar sessão localmente
      const sessionData = {
        token,
        userId: data.userId,
        userType: data.userType,
        userEmail: data.userEmail,
        userName: data.userName,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo()
      };

      this.sessionToken = token;
      localStorage.setItem(`session_token_${data.userType}`, token);
      localStorage.setItem(`session_data_${data.userType}`, JSON.stringify(sessionData));
      
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

      // Atualizar last activity no localStorage
      const userTypes = ['admin', 'barber', 'client', 'painel_cliente', 'totem'];
      for (const userType of userTypes) {
        const storedToken = localStorage.getItem(`session_token_${userType}`);
        if (storedToken === sessionToken) {
          const sessionDataStr = localStorage.getItem(`session_data_${userType}`);
          if (sessionDataStr) {
            const sessionData = JSON.parse(sessionDataStr);
            sessionData.lastActivity = new Date().toISOString();
            localStorage.setItem(`session_data_${userType}`, JSON.stringify(sessionData));
          }
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      return false;
    }
  }

  // Invalidar sessão (logout)
  async invalidateSession(userType: string, token?: string): Promise<boolean> {
    try {
      this.sessionToken = null;
      localStorage.removeItem(`session_token_${userType}`);
      localStorage.removeItem(`session_data_${userType}`);
      this.stopActivityUpdater();

      return true;
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

      const sessionDataStr = localStorage.getItem(`session_data_${userType}`);
      if (!sessionDataStr) return { valid: false };

      const sessionData = JSON.parse(sessionDataStr);
      const expiresAt = new Date(sessionData.expiresAt);
      
      if (expiresAt < new Date()) {
        await this.invalidateSession(userType);
        return { valid: false, reason: 'expired' };
      }

      this.sessionToken = sessionToken;
      this.startActivityUpdater();

      return { 
        valid: true,
        userId: sessionData.userId,
        userEmail: sessionData.userEmail,
        userName: sessionData.userName
      };
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return { valid: false };
    }
  }

  // Obter todas as sessões ativas (simplificado)
  async getActiveSessions(): Promise<ActiveSession[]> {
    // Retornar array vazio - não temos tabela de sessões
    return [];
  }

  // Forçar logout de uma sessão
  async forceLogoutSession(sessionId: string): Promise<boolean> {
    // Simplificado - não temos controle centralizado de sessões
    return true;
  }

  private activityInterval: NodeJS.Timeout | null = null;

  private startActivityUpdater() {
    if (this.activityInterval) return;

    this.activityInterval = setInterval(() => {
      this.updateActivity();
    }, 15 * 60 * 1000);
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
