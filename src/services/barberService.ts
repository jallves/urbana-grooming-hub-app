
import { supabase } from "@/integrations/supabase/client";

export async function deleteBarber(barberId: string): Promise<void> {
  // Deleta do staff
  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", barberId);
  if (error) throw error;
}
