-- Identify trusted internal callers using the verified JWT role claim
-- (reliable inside SECURITY DEFINER functions, and impossible to forge)
-- plus the real session user for scheduled/cron maintenance jobs.
CREATE OR REPLACE FUNCTION private.is_service_request()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT coalesce(auth.role() = 'service_role', false)
      OR session_user IN ('postgres', 'supabase_admin');
$$;

REVOKE ALL ON FUNCTION private.is_service_request() FROM PUBLIC, anon, authenticated;