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

// Nova função para deletar barbeiro (exclui da tabela barbers e staff)
export async function deleteBarber(barberId: string): Promise<void> {
  // Primeiro, buscamos o registro para pegar staff_id
  const { data, error } = await supabase
    .from("barbers")
    .select("id,staff_id")
    .eq("id", barberId)
    .single();

  if (error) throw error;
  const staffId = data.staff_id;

  // Remove da tabela barbers
  const { error: deleteBarberError } = await supabase
    .from("barbers")
    .delete()
    .eq("id", barberId);

  if (deleteBarberError) throw deleteBarberError;

  // Opcional: remove do staff, se desejar excluir completamente o profissional
  // Descomente esta linha se deseja remover do staff
  // await supabase.from("staff").delete().eq("id", staffId);
}
