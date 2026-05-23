
-- 1) Sincronizar taxa_comissao = commission_rate para todos os barbeiros existentes
UPDATE painel_barbeiros
SET taxa_comissao = commission_rate,
    updated_at = now()
WHERE taxa_comissao IS DISTINCT FROM commission_rate;

-- 2) Atualizar trigger function para também sincronizar taxa_comissao
CREATE OR REPLACE FUNCTION public.sync_staff_to_painel_barbeiros()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_staff_id uuid;
BEGIN
  IF NEW.role = 'barber' THEN
    v_staff_id := COALESCE(NEW.staff_id, NEW.id);

    IF EXISTS (
      SELECT 1 FROM painel_barbeiros 
      WHERE staff_id = v_staff_id OR email = NEW.email
    ) THEN
      UPDATE painel_barbeiros SET
        nome = NEW.name,
        email = NEW.email,
        telefone = NEW.phone,
        image_url = NEW.image_url,
        foto_url = NEW.image_url,
        specialties = NEW.specialties,
        experience = NEW.experience,
        commission_rate = NEW.commission_rate,
        taxa_comissao = NEW.commission_rate,
        is_active = NEW.is_active,
        ativo = NEW.is_active,
        role = NEW.role,
        staff_id = v_staff_id,
        updated_at = now()
      WHERE staff_id = v_staff_id OR email = NEW.email;
    ELSE
      INSERT INTO painel_barbeiros (
        nome, email, telefone, image_url, foto_url,
        specialties, experience, commission_rate, taxa_comissao,
        is_active, ativo, role, staff_id
      ) VALUES (
        NEW.name, NEW.email, NEW.phone, NEW.image_url, NEW.image_url,
        NEW.specialties, NEW.experience, NEW.commission_rate, NEW.commission_rate,
        NEW.is_active, NEW.is_active, NEW.role, v_staff_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Recalcular barber_commissions pendentes onde a taxa cadastrada difere
--    (apenas serviços/extras - produtos/gorjetas/créditos não são afetados)
WITH wrong AS (
  SELECT bc.id,
         pb.commission_rate AS correct_rate,
         ROUND(bc.valor * (pb.commission_rate / bc.commission_rate), 2) AS new_valor
  FROM barber_commissions bc
  JOIN painel_barbeiros pb ON pb.id = bc.barber_id
  WHERE bc.status IN ('pending','pendente')
    AND bc.commission_rate IS NOT NULL
    AND bc.commission_rate > 0
    AND bc.commission_rate <> pb.commission_rate
    AND bc.tipo IN ('servico','servico_extra')
)
UPDATE barber_commissions bc
SET valor = w.new_valor,
    amount = w.new_valor,
    commission_rate = w.correct_rate
FROM wrong w
WHERE bc.id = w.id;

-- 4) Atualizar contas_pagar correspondentes baseado nos novos totais por venda+barbeiro
WITH totals AS (
  SELECT bc.venda_id, bc.barber_name, pb.commission_rate AS correct_rate,
         SUM(bc.valor) AS new_total
  FROM barber_commissions bc
  JOIN painel_barbeiros pb ON pb.id = bc.barber_id
  WHERE bc.status IN ('pending','pendente')
    AND bc.tipo IN ('servico','servico_extra')
    AND bc.venda_id IS NOT NULL
  GROUP BY bc.venda_id, bc.barber_name, pb.commission_rate
),
cp_totals AS (
  SELECT cp.venda_id, cp.fornecedor, SUM(cp.valor) AS old_total
  FROM contas_pagar cp
  WHERE cp.categoria ILIKE '%comiss%'
    AND cp.categoria NOT ILIKE '%gorjeta%'
    AND cp.status IN ('pendente','pending')
    AND cp.venda_id IS NOT NULL
  GROUP BY cp.venda_id, cp.fornecedor
)
UPDATE contas_pagar cp
SET valor = ROUND(cp.valor * (t.new_total / NULLIF(ct.old_total,0)), 2),
    descricao = regexp_replace(coalesce(cp.descricao,''), '\d+%', t.correct_rate::int || '%'),
    updated_at = now()
FROM totals t
JOIN cp_totals ct ON ct.venda_id = t.venda_id AND ct.fornecedor = t.barber_name
WHERE cp.venda_id = t.venda_id
  AND cp.fornecedor = t.barber_name
  AND cp.categoria ILIKE '%comiss%'
  AND cp.categoria NOT ILIKE '%gorjeta%'
  AND cp.status IN ('pendente','pending')
  AND ct.old_total <> t.new_total
  AND ct.old_total > 0;

-- 5) Atualizar financial_records pendentes correspondentes
UPDATE financial_records fr
SET amount = bc.valor,
    net_amount = bc.valor,
    description = regexp_replace(coalesce(fr.description,''), '\d+%', bc.commission_rate::int || '%'),
    updated_at = now()
FROM barber_commissions bc
WHERE fr.status = 'pending'
  AND fr.transaction_type = 'commission'
  AND fr.reference_id = bc.venda_id
  AND fr.barber_id = bc.barber_id
  AND bc.tipo IN ('servico','servico_extra')
  AND fr.amount <> bc.valor;
