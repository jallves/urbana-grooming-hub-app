import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditLogParams {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
}

export const useAuditLog = () => {
  const { toast } = useToast();

  const logAction = async ({ action, entity, entityId, details }: AuditLogParams) => {
    try {
      // Inserir diretamente na tabela de auditoria
      const { error } = await supabase
        .from('admin_activity_log')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action,
          entity,
          entity_id: entityId || null,
          details: details || null,
        });

      if (error) {
        console.error('Erro ao registrar log de auditoria:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      return false;
    }
  };

  const logClientView = (clientId: string) => 
    logAction({ action: 'view', entity: 'client', entityId: clientId });

  const logClientCreate = (clientId: string, clientData: any) => 
    logAction({ 
      action: 'create', 
      entity: 'client', 
      entityId: clientId,
      details: { client: clientData }
    });

  const logClientUpdate = (clientId: string, changes: any) => 
    logAction({ 
      action: 'update', 
      entity: 'client', 
      entityId: clientId,
      details: { changes }
    });

  const logClientDelete = (clientId: string) => 
    logAction({ action: 'delete', entity: 'client', entityId: clientId });

  const logAppointmentCreate = (appointmentId: string, appointmentData: any) => 
    logAction({ 
      action: 'create', 
      entity: 'appointment', 
      entityId: appointmentId,
      details: { appointment: appointmentData }
    });

  const logAppointmentUpdate = (appointmentId: string, changes: any) => 
    logAction({ 
      action: 'update', 
      entity: 'appointment', 
      entityId: appointmentId,
      details: { changes }
    });

  const logAppointmentCancel = (appointmentId: string, reason?: string) => 
    logAction({ 
      action: 'cancel', 
      entity: 'appointment', 
      entityId: appointmentId,
      details: { reason }
    });

  const logFinancialTransaction = (transactionId: string, transactionData: any) => 
    logAction({ 
      action: 'create', 
      entity: 'financial_transaction', 
      entityId: transactionId,
      details: { transaction: transactionData }
    });

  const logSettingsChange = (setting: string, oldValue: any, newValue: any) => 
    logAction({ 
      action: 'update', 
      entity: 'settings',
      details: { setting, oldValue, newValue }
    });

  const logBarberAccess = (barberId: string, accessType: string) => 
    logAction({ 
      action: accessType, 
      entity: 'barber_access', 
      entityId: barberId 
    });

  return {
    logAction,
    logClientView,
    logClientCreate,
    logClientUpdate,
    logClientDelete,
    logAppointmentCreate,
    logAppointmentUpdate,
    logAppointmentCancel,
    logFinancialTransaction,
    logSettingsChange,
    logBarberAccess,
  };
};
