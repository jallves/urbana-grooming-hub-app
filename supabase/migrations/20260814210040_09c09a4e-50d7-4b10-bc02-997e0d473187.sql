-- 1) STAFF: anon só pode ler colunas públicas
REVOKE SELECT ON public.staff FROM anon;
GRANT SELECT (id, name, role, photo_url, image_url, specialties, experience, is_active, staff_id, created_at, updated_at) ON public.staff TO anon;

-- 2) PAINEL_BARBEIROS: anon só pode ler colunas públicas
REVOKE SELECT ON public.painel_barbeiros FROM anon;
GRANT SELECT (id, nome, foto_url, image_url, specialties, experience, ativo, is_active, role, staff_id, created_at, updated_at) ON public.painel_barbeiros TO anon;

-- 3) EMPLOYEES: remove leitura pública total
DROP POLICY IF EXISTS "Public can read active employees" ON public.employees;
REVOKE ALL ON public.employees FROM anon;

-- password_hash nunca deve ser lido pelo cliente
REVOKE SELECT ON public.employees FROM authenticated;
GRANT SELECT (id, user_id, name, email, phone, role, commission_rate, is_active, photo_url, status, created_at, updated_at) ON public.employees TO authenticated;

-- Leitura restrita: admins veem tudo, funcionário vê a si mesmo
CREATE POLICY "Admins can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (public.is_admin_or_higher(auth.uid()));
