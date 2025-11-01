-- First, remove duplicate whatsapp numbers keeping only the most recent record
-- Step 1: Create a temporary table with IDs to keep (most recent by created_at)
WITH duplicates AS (
  SELECT 
    whatsapp,
    MAX(created_at) as max_date
  FROM painel_clientes
  WHERE whatsapp IS NOT NULL
  GROUP BY whatsapp
  HAVING COUNT(*) > 1
),
to_keep AS (
  SELECT DISTINCT ON (pc.whatsapp) pc.id
  FROM painel_clientes pc
  INNER JOIN duplicates d ON pc.whatsapp = d.whatsapp AND pc.created_at = d.max_date
),
to_delete AS (
  SELECT pc.id
  FROM painel_clientes pc
  WHERE pc.whatsapp IN (SELECT whatsapp FROM duplicates)
    AND pc.id NOT IN (SELECT id FROM to_keep)
)
-- Delete the older duplicate records
DELETE FROM painel_clientes
WHERE id IN (SELECT id FROM to_delete);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE public.painel_clientes 
ADD CONSTRAINT painel_clientes_whatsapp_unique UNIQUE (whatsapp);

-- Step 3: Do the same for clients table (check for duplicates first)
WITH duplicates_clients AS (
  SELECT 
    phone,
    MAX(created_at) as max_date
  FROM clients
  WHERE phone IS NOT NULL
  GROUP BY phone
  HAVING COUNT(*) > 1
),
to_keep_clients AS (
  SELECT DISTINCT ON (c.phone) c.id
  FROM clients c
  INNER JOIN duplicates_clients d ON c.phone = d.phone AND c.created_at = d.max_date
),
to_delete_clients AS (
  SELECT c.id
  FROM clients c
  WHERE c.phone IN (SELECT phone FROM duplicates_clients)
    AND c.id NOT IN (SELECT id FROM to_keep_clients)
)
DELETE FROM clients
WHERE id IN (SELECT id FROM to_delete_clients);

-- Step 4: Add unique constraint to clients table
ALTER TABLE public.clients 
ADD CONSTRAINT clients_phone_unique UNIQUE (phone);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_painel_clientes_whatsapp ON public.painel_clientes(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);