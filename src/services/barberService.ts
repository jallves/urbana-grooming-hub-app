
import { supabase } from "@/integrations/supabase/client";

export async function createBarber(staffId: string, userId?: string) {
  // Cria registro na tabela barbers (apenas se ainda não existir)
  const { data, error } = await supabase
    .from("barbers")
    .insert([{ staff_id: staffId, user_id: userId ?? null }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function logBarberAction(barberId: string, action: string, performedBy: string, description?: string) {
  // Cria entrada no log de auditoria do barbeiro
  const { error } = await supabase
    .from("barber_audit_log")
    .insert([
      {
        barber_id: barberId,
        action,
        performed_by: performedBy,
        description: description ?? null,
      },
    ]);
  if (error) throw error;
}

// Pode criar funções de busca/edição caso necessário...
