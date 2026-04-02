import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, any> = {};

  // 1. Remove duplicate barber_commission for Nuno (venda 303d7a7d)
  // Keep the first one (85bb3cf2), delete the second (5323b11d)
  {
    const { error } = await supabase
      .from("barber_commissions")
      .delete()
      .eq("id", "5323b11d-c1e9-451f-9d48-d6eb2973df58");
    results["delete_dup_commission"] = error ? error.message : "OK";
  }

  // 2. Remove duplicate contas_pagar for Nuno
  // Keep f7ccc7f9, delete 5f7125f2
  {
    const { error } = await supabase
      .from("contas_pagar")
      .delete()
      .eq("id", "5f7125f2-1846-4d04-8b57-4e2a4633606f");
    results["delete_dup_conta_pagar"] = error ? error.message : "OK";
  }

  // 3. Fix totem session statuses (check_in → completed for concluded appointments)
  const sessionsToFix = [
    // Nuno - fb8867c7
    { appointment_id: "fb8867c7-4ab9-4168-a6fe-087c13848255" },
    // Pedro Henrique - d4ad652f
    { appointment_id: "d4ad652f-8bec-4bf9-9084-3e6887b9bfdb" },
    // Danilo - b44be544
    { appointment_id: "b44be544-a73d-45f5-b9fd-abf9183dc604" },
  ];

  for (const s of sessionsToFix) {
    const { error } = await supabase
      .from("appointment_totem_sessions")
      .update({ status: "completed" })
      .eq("appointment_id", s.appointment_id)
      .eq("status", "check_in");
    results[`fix_session_${s.appointment_id.substring(0, 8)}`] = error
      ? error.message
      : "OK";
  }

  // 4. Normalize vendas status PAGA → pago
  {
    const { data: pagaVendas, error: fetchErr } = await supabase
      .from("vendas")
      .select("id")
      .eq("status", "PAGA");

    if (fetchErr) {
      results["normalize_status_fetch"] = fetchErr.message;
    } else if (pagaVendas && pagaVendas.length > 0) {
      const ids = pagaVendas.map((v: any) => v.id);
      const { error } = await supabase
        .from("vendas")
        .update({ status: "pago" })
        .in("id", ids);
      results["normalize_status"] = error
        ? error.message
        : `OK - ${ids.length} vendas updated`;
    } else {
      results["normalize_status"] = "No vendas with PAGA status";
    }
  }

  // 5. Handle orphaned pending vendas
  const pendingVendas = [
    { id: "07dcdf50-1ad2-4673-9149-f33a31ad00fa", reason: "Guilherme Barroso - checkout admin duplicado" },
    { id: "b550b284-7644-4301-a1b2-973c642b46ba", reason: "Fernando M S Araujo - venda órfã" },
    { id: "8f239810-442a-4ec9-820e-4dfa91901683", reason: "João Alves - venda órfã Mar/22" },
    { id: "99517915-9778-4afc-81ad-9b7ace3e262c", reason: "João Alves - venda órfã Mar/21" },
  ];

  for (const v of pendingVendas) {
    const { error } = await supabase
      .from("vendas")
      .update({ status: "cancelado" })
      .eq("id", v.id)
      .eq("status", "pendente");
    results[`cancel_${v.id.substring(0, 8)}`] = error
      ? error.message
      : `OK - ${v.reason}`;
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
