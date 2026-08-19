/*
# Add Support Role to Enum

## Overview
Adds a new `support` value to the `app_role` enum. This value must be
committed in its own migration before it can be referenced in functions
or policies (PostgreSQL requires this).

## Changes
1. Add `support` to the `app_role` enum.

## Security
- No security changes in this migration. Subsequent migration will create
  the is_staff() helper and update chat policies.
*/

DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'support';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;