import { supabase } from '@/integrations/supabase/client';

export type LogAction = 
  | 'view' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'cancel' 
  | 'complete' 
  | 'absent'
  | 'grant'
  | 'revoke';

export type EntityType = 
  | 'client' 
  | 'appointment' 
  | 'barber' 
  | 'service' 
  | 'staff' 
  | 'product' 
  | 'financial' 
  | 'financial_transaction' 
  | 'settings'
  | 'barber_access'
  | 'user'
  | 'session';

interface LogActivityParams {
  action: LogAction;
  entityType?: EntityType;
  entityId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
}

/**
 * Registrar atividade de administração no log de segurança
 */
export const logAdminActivity = async ({
  action,
  entityType,
  entityId,
  oldData,
  newData
}: LogActivityParams): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('log_admin_activity', {
      p_action: action,
      p_entity_type: entityType || null,
      p_entity_id: entityId || null,
      p_old_data: oldData || null,
      p_new_data: newData || null
    });

    if (error) {
      console.error('Erro ao registrar log de atividade:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao registrar log de atividade:', error);
    return null;
  }
};

/**
 * Hook para usar o logger de atividade
 */
export const useActivityLogger = () => {
  const logActivity = async (params: LogActivityParams) => {
    return await logAdminActivity(params);
  };

  const logView = async (entityType: EntityType, entityId?: string, data?: Record<string, any>) => {
    return await logActivity({ action: 'view', entityType, entityId, newData: data });
  };

  const logCreate = async (entityType: EntityType, entityId?: string, newData?: Record<string, any>) => {
    return await logActivity({ action: 'create', entityType, entityId, newData });
  };

  const logUpdate = async (entityType: EntityType, entityId?: string, oldData?: Record<string, any>, newData?: Record<string, any>) => {
    return await logActivity({ action: 'update', entityType, entityId, oldData, newData });
  };

  const logDelete = async (entityType: EntityType, entityId?: string, oldData?: Record<string, any>) => {
    return await logActivity({ action: 'delete', entityType, entityId, oldData });
  };

  const logLogin = async (userId?: string, email?: string) => {
    return await logActivity({ 
      action: 'login', 
      entityType: 'session',
      entityId: userId,
      newData: { email, timestamp: new Date().toISOString() }
    });
  };

  const logLogout = async (userId?: string, email?: string) => {
    return await logActivity({ 
      action: 'logout', 
      entityType: 'session',
      entityId: userId,
      oldData: { email, timestamp: new Date().toISOString() }
    });
  };

  const logAppointmentAction = async (action: 'cancel' | 'complete' | 'absent', appointmentId: string, details?: Record<string, any>) => {
    return await logActivity({ 
      action, 
      entityType: 'appointment', 
      entityId: appointmentId,
      newData: details
    });
  };

  return {
    logActivity,
    logView,
    logCreate,
    logUpdate,
    logDelete,
    logLogin,
    logLogout,
    logAppointmentAction
  };
};