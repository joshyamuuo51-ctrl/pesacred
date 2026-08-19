/*
# PesaCred — Core Lending Platform Schema

## Overview
Creates the full schema for PesaCred, a modern online lending platform.
Provisions all ten required tables, the enums that drive application and
payment state machines, and Row Level Security policies scoped to owners
or admins.

## Tables
1. profiles — extends auth.users with applicant demographic data.
2. admins — admin-specific metadata + permission flags.
3. loan_products — admin-managed loan offerings.
4. loan_applications — a user's loan request + lifecycle status.
5. loan_documents — uploaded KYC/income documents.
6. payments — processing-fee payments with reference numbers.
7. notifications — in-app + email + SMS placeholder notifications.
8. support_tickets — user support enquiries + staff responses.
9. settings — key/value CMS store.
10. audit_logs — append-only audit trail.

## Security
- RLS on every table.
- Profiles: each user reads/updates own row; admins see all.
- Owner-scoped tables: owner CRUD via auth.uid()=user_id; admins SELECT.
- loan_products + settings: public read; admin-only writes.
- audit_logs: admin SELECT; authenticated insert only (append-only).

## Notes
- profiles.id + user_id columns default to auth.uid() so client inserts
  that omit the owner still satisfy WITH CHECK.
- is_admin() helper checks profiles.role = 'admin' for the current user.
- loan_products.fee_refundable + fee_description support the legally
  required disclosure that paying a fee does not guarantee approval.
- Ordering: profiles table created first (no policies), then is_admin(),
  then profiles policies, then remaining tables.
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE app_role AS ENUM ('user','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE loan_status AS ENUM (
    'application_received','documents_under_review','eligibility_assessment',
    'fee_pending','fee_paid','approved','declined','disbursed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fee_status AS ENUM ('not_required','pending','paid','failed','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('mpesa','airtel','card'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('national_id','payslip','selfie','bank_statement'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('in_app','email','sms'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('open','responded','resolved','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- profiles table (no policies yet — is_admin() must exist first)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  national_id text NOT NULL,
  date_of_birth date NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  avatar_url text,
  county text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- is_admin() helper (profiles now exists)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_admin_read" ON public.admins;
CREATE POLICY "admins_admin_read" ON public.admins
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- loan_products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  interest_rate numeric(5,2) NOT NULL,
  min_amount integer NOT NULL,
  max_amount integer NOT NULL,
  repayment_period_min integer NOT NULL,
  repayment_period_max integer NOT NULL,
  processing_fee_type text NOT NULL DEFAULT 'percentage',
  processing_fee_value numeric(10,2) NOT NULL DEFAULT 0,
  fee_refundable boolean NOT NULL DEFAULT false,
  fee_description text,
  eligibility_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_fee_type CHECK (processing_fee_type IN ('fixed','percentage')),
  CONSTRAINT chk_amounts CHECK (max_amount >= min_amount),
  CONSTRAINT chk_periods CHECK (repayment_period_max >= repayment_period_min)
);
ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON public.loan_products;
CREATE POLICY "products_public_read" ON public.loan_products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_admin_insert" ON public.loan_products;
CREATE POLICY "products_admin_insert" ON public.loan_products
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON public.loan_products;
CREATE POLICY "products_admin_update" ON public.loan_products
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_delete" ON public.loan_products;
CREATE POLICY "products_admin_delete" ON public.loan_products
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- loan_applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.loan_products(id) ON DELETE RESTRICT,
  reference_number text UNIQUE NOT NULL,
  amount integer NOT NULL,
  purpose text NOT NULL,
  employment_status text NOT NULL,
  employer text,
  monthly_income integer NOT NULL,
  mobile_money_number text NOT NULL,
  bank_name text,
  bank_account text,
  county text NOT NULL,
  address text NOT NULL,
  requested_term_months integer NOT NULL,
  interest_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_repayable numeric(12,2) NOT NULL DEFAULT 0,
  processing_fee numeric(12,2) NOT NULL DEFAULT 0,
  fee_status fee_status NOT NULL DEFAULT 'not_required',
  status loan_status NOT NULL DEFAULT 'application_received',
  approved_amount integer,
  disbursed_amount integer,
  internal_notes text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  disbursed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_ref ON public.loan_applications(reference_number);
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_applications" ON public.loan_applications;
CREATE POLICY "select_own_applications" ON public.loan_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_applications" ON public.loan_applications;
CREATE POLICY "insert_own_applications" ON public.loan_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_applications" ON public.loan_applications;
CREATE POLICY "update_own_applications" ON public.loan_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_applications" ON public.loan_applications;
CREATE POLICY "delete_own_applications" ON public.loan_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- loan_documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_application ON public.loan_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.loan_documents(user_id);
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON public.loan_documents;
CREATE POLICY "select_own_documents" ON public.loan_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_documents" ON public.loan_documents;
CREATE POLICY "insert_own_documents" ON public.loan_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON public.loan_documents;
CREATE POLICY "update_own_documents" ON public.loan_documents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_documents" ON public.loan_documents;
CREATE POLICY "delete_own_documents" ON public.loan_documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference_number text UNIQUE NOT NULL,
  provider_reference text,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_application ON public.payments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON public.payments;
CREATE POLICY "select_own_payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_payments" ON public.payments;
CREATE POLICY "insert_own_payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_payments" ON public.payments;
CREATE POLICY "update_own_payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_payments" ON public.payments;
CREATE POLICY "delete_own_payments" ON public.payments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'in_app',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON public.notifications;
CREATE POLICY "insert_own_notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON public.notifications;
CREATE POLICY "delete_own_notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON public.support_tickets;
CREATE POLICY "select_own_tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_tickets" ON public.support_tickets;
CREATE POLICY "insert_own_tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON public.support_tickets;
CREATE POLICY "update_own_tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_tickets" ON public.support_tickets;
CREATE POLICY "delete_own_tickets" ON public.support_tickets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- settings (CMS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_insert" ON public.settings;
CREATE POLICY "settings_admin_insert" ON public.settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "settings_admin_update" ON public.settings;
CREATE POLICY "settings_admin_update" ON public.settings
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "settings_admin_delete" ON public.settings;
CREATE POLICY "settings_admin_delete" ON public.settings
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "audit_authenticated_insert" ON public.audit_logs;
CREATE POLICY "audit_authenticated_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated ON public.loan_products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.loan_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated ON public.loan_applications;
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
