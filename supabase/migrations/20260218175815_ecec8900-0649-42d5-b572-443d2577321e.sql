-- Inserir Renata na tabela staff para que apareça no front-end
INSERT INTO public.staff (name, email, role, is_active, created_at, updated_at)
SELECT name, email, role, is_active, created_at, now()
FROM public.employees
WHERE name ILIKE '%renata%'
  AND email = 'rlcpt28@gmail.com'
ON CONFLICT DO NOTHING;