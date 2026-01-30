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
 * Session Manager - Gerencia sessões usando a tabela active_sessions no Supabase
 */
class SessionManager {
  private currentSessionId: string | null = null;
  private activityInterval: NodeJS.Timeout | null = null;

  private getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: navigator.userAgent,
    };
  }

  // Criar nova sessão no banco
  async createSession(data: SessionData): Promise<string | null> {
    try {
      const deviceInfo = this.getDeviceInfo();

      const { data: result, error } = await supabase.rpc('create_user_session', {
        p_user_id: data.userId || null,
        p_user_type: data.userType,
        p_user_email: data.userEmail || null,
        p_user_name: data.userName || null,
        p_ip_address: null, // IP será detectado pelo servidor
        p_user_agent: deviceInfo.userAgent,
        p_device_info: deviceInfo,
        p_expires_in_hours: data.expiresInHours || 24
      });

      if (error) {
        console.error('Erro ao criar sessão:', error);
        // Fallback para localStorage se RPC falhar
        return this.createLocalSession(data);
      }

      this.currentSessionId = result;
      localStorage.setItem(`session_id_${data.userType}`, result);
      this.startActivityUpdater();

      return result;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      return this.createLocalSession(data);
    }
  }

  // Fallback: criar sessão local
  private createLocalSession(data: SessionData): string {
    const sessionId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sessionData = {
      id: sessionId,
      userId: data.userId,
      userType: data.userType,
      userEmail: data.userEmail,
      userName: data.userName,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (data.expiresInHours || 24) * 60 * 60 * 1000).toISOString()
    };
    
    this.currentSessionId = sessionId;
    localStorage.setItem(`session_id_${data.userType}`, sessionId);
    localStorage.setItem(`session_data_${data.userType}`, JSON.stringify(sessionData));
    this.startActivityUpdater();
    
    return sessionId;
  }

  // Atualizar atividade da sessão
  async updateActivity(sessionId?: string): Promise<boolean> {
    try {
      const id = sessionId || this.currentSessionId;
      if (!id) return false;

      // Se for sessão local, atualizar localmente
      if (id.startsWith('local-')) {
        const userTypes = ['admin', 'barber', 'client', 'painel_cliente', 'totem'];
        for (const userType of userTypes) {
          const storedId = localStorage.getItem(`session_id_${userType}`);
          if (storedId === id) {
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
      }

      // Atualizar no banco
      const { data, error } = await supabase.rpc('update_session_activity', {
        p_session_id: id
      });

      if (error) {
        console.error('Erro ao atualizar atividade:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      return false;
    }
  }

  // Invalidar sessão (logout)
  async invalidateSession(userType: string, sessionId?: string): Promise<boolean> {
    try {
      const id = sessionId || localStorage.getItem(`session_id_${userType}`);
      
      // Limpar dados locais
      localStorage.removeItem(`session_id_${userType}`);
      localStorage.removeItem(`session_data_${userType}`);
      this.currentSessionId = null;
      this.stopActivityUpdater();

      // Se for sessão local, já está limpa
      if (!id || id.startsWith('local-')) {
        return true;
      }

      // Invalidar no banco
      const { data, error } = await supabase.rpc('invalidate_session', {
        p_session_id: id
      });

      if (error) {
        console.error('Erro ao invalidar sessão:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erro ao invalidar sessão:', error);
      return false;
    }
  }

  // Validar sessão existente
  async validateSession(userType: string, sessionId?: string): Promise<{ valid: boolean; userId?: string; userEmail?: string; userName?: string; reason?: string }> {
    try {
      const id = sessionId || localStorage.getItem(`session_id_${userType}`);
      if (!id) return { valid: false };

      // Se for sessão local, validar localmente
      if (id.startsWith('local-')) {
        const sessionDataStr = localStorage.getItem(`session_data_${userType}`);
        if (!sessionDataStr) return { valid: false };

        const sessionData = JSON.parse(sessionDataStr);
        const expiresAt = new Date(sessionData.expiresAt);
        
        if (expiresAt < new Date()) {
          await this.invalidateSession(userType);
          return { valid: false, reason: 'expired' };
        }

        this.currentSessionId = id;
        this.startActivityUpdater();

        return { 
          valid: true,
          userId: sessionData.userId,
          userEmail: sessionData.userEmail,
          userName: sessionData.userName
        };
      }

      // Verificar no banco
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        await this.invalidateSession(userType);
        return { valid: false, reason: 'not_found' };
      }

      if (new Date(data.expires_at) < new Date()) {
        await this.invalidateSession(userType);
        return { valid: false, reason: 'expired' };
      }

      this.currentSessionId = id;
      this.startActivityUpdater();

      return { 
        valid: true,
        userId: data.user_id || undefined,
        userEmail: data.user_email || undefined,
        userName: data.user_name || undefined
      };
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return { valid: false };
    }
  }

  // Obter todas as sessões ativas do banco
  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_sessions');

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        return [];
      }

      return (data || []).map((session: any) => ({
        id: session.id,
        user_id: session.user_id,
        user_type: session.user_type,
        user_email: session.user_email,
        user_name: session.user_name,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        login_at: session.login_at,
        last_activity_at: session.last_activity_at,
        expires_at: session.expires_at
      }));
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      return [];
    }
  }

  // Forçar logout de um usuário específico
  async forceLogoutUser(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('force_logout_user', {
        p_user_id: userId
      });

      if (error) {
        console.error('Erro ao forçar logout:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao forçar logout:', error);
      return false;
    }
  }

  // Forçar logout de uma sessão específica
  async forceLogoutSession(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('invalidate_session', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Erro ao forçar logout da sessão:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erro ao forçar logout da sessão:', error);
      return false;
    }
  }

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