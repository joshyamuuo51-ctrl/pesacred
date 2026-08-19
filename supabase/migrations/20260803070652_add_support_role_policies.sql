/*
# Add Support Staff Access — Functions and Policies

## Overview
Creates the `is_staff()` helper and updates chat_messages + admins RLS
policies so support-role users can access Live Chat in the admin portal.

## Changes
1. Create `is_staff()` — returns true for `admin` OR `support` role.
   Used to gate chat access (read all messages, send as admin sender).
2. `is_admin()` unchanged — still `role = 'admin'` only. Full admin areas
   (applications, products, payments, CMS, audit) remain admin-only.
3. Update chat_messages SELECT/INSERT/UPDATE policies to use `is_staff()`
   instead of `is_admin()`.
4. Update admins table SELECT policy to allow any staff to read admin records.
5. Add admins INSERT policy for staff to insert their own record.

## Security
- Support staff CAN: read all chat messages, send messages as admin, mark
  messages as read, view the admin sidebar.
- Support staff CANNOT: access loan_applications, payments, loan_products,
  settings, audit_logs — those policies still use `is_admin()`.
*/

-- 1. is_staff() — true for admin OR support
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
$$;

-- 2. Update chat_messages policies to use is_staff()
DROP POLICY IF EXISTS "select_own_chat" ON public.chat_messages;
CREATE POLICY "select_own_chat" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff());

DROP POLICY IF EXISTS "insert_chat" ON public.chat_messages;
CREATE POLICY "insert_chat" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND sender = 'client')
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "update_chat" ON public.chat_messages;
CREATE POLICY "update_chat" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff())
  WITH CHECK (auth.uid() = user_id OR public.is_staff());

-- 3. Update admins table policies
DROP POLICY IF EXISTS "admins_admin_read" ON public.admins;
DROP POLICY IF EXISTS "admins_staff_read" ON public.admins;
CREATE POLICY "admins_staff_read" ON public.admins
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "admins_staff_insert" ON public.admins;
CREATE POLICY "admins_staff_insert" ON public.admins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id AND public.is_staff());