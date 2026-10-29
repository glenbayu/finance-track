-- Record the function hardening already applied to the connected production database.
-- This migration is intended to keep repository history aligned with Supabase migration history.

-- The auth.users trigger invokes this function internally; client roles should not
-- invoke it as a public RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user_setup() FROM PUBLIC, anon, authenticated, service_role;

-- The RPC validates auth.uid() against p_user_id. Keep authenticated access because
-- the application calls it, but do not expose it to anonymous callers or PUBLIC.
REVOKE EXECUTE ON FUNCTION public.recalculate_monthly_rollovers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_monthly_rollovers(uuid) TO authenticated, service_role;

-- Pin search_path for functions flagged by the Security Advisor.
ALTER FUNCTION public.set_quick_add_templates_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_budgets_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_transactions_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_categories_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.reorder_quick_add_template(uuid, uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user_setup() SET search_path = public, pg_temp;
