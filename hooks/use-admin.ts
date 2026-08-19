'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  LoanApplication,
  LoanProduct,
  LoanDocument,
  Payment,
  Profile,
  AuditLog,
  ApplicationWithProduct,
} from '@/types/database';

export const adminKeys = {
  stats: ['admin-stats'] as const,
  applications: ['admin-applications'] as const,
  application: (id: string) => ['admin-application', id] as const,
  products: ['admin-products'] as const,
  payments: ['admin-payments'] as const,
  audit: ['admin-audit'] as const,
  settings: ['admin-settings'] as const,
  users: ['admin-users'] as const,
};

export interface AdminStats {
  totalUsers: number;
  totalApplications: number;
  pendingReviews: number;
  approvedLoans: number;
  declinedLoans: number;
  paymentsReceived: number;
  totalDisbursed: number;
  recentApplications: ApplicationWithProduct[];
}

export interface AdminApplicationDetail {
  application: LoanApplication & { loan_products: LoanProduct | null };
  documents: LoanDocument[];
  payments: Payment[];
  profile: Profile | null;
}

export interface LoanProductInsert {
  id?: string;
  name: string;
  description?: string | null;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  repayment_period_min: number;
  repayment_period_max: number;
  processing_fee_type?: 'fixed' | 'percentage';
  processing_fee_value?: number;
  fee_refundable?: boolean;
  fee_description?: string | null;
  eligibility_rules?: Record<string, unknown>;
  is_active?: boolean;
  icon?: string | null;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export type AuditLogWithProfile = AuditLog & { profiles: { full_name: string; email: string } | null };

export type AdminUser = Profile;

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: adminKeys.users,
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: adminKeys.stats,
    queryFn: async (): Promise<AdminStats> => {
      const [profiles, applications, payments] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('loan_applications').select('*'),
        supabase.from('payments').select('*'),
      ]);

      const allApps = (applications.data ?? []) as LoanApplication[];
      const allPayments = (payments.data ?? []) as Payment[];

      const pending = allApps.filter((a) =>
        ['application_received', 'documents_under_review', 'eligibility_assessment', 'fee_pending', 'fee_paid'].includes(a.status)
      ).length;
      const approved = allApps.filter((a) => a.status === 'approved').length;
      const declined = allApps.filter((a) => a.status === 'declined').length;
      const disbursed = allApps.filter((a) => a.status === 'disbursed');
      const paymentsReceived = allPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

      const { data: recentData } = await supabase
        .from('loan_applications')
        .select('*, loan_products(id, name, interest_rate, processing_fee_type, processing_fee_value)')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        totalUsers: profiles.count ?? 0,
        totalApplications: allApps.length,
        pendingReviews: pending,
        approvedLoans: approved,
        declinedLoans: declined,
        paymentsReceived,
        totalDisbursed: disbursed.reduce((s, a) => s + (a.disbursed_amount ?? a.amount), 0),
        recentApplications: (recentData ?? []) as ApplicationWithProduct[],
      };
    },
  });
}

export function useAdminApplications() {
  return useQuery<ApplicationWithProduct[]>({
    queryKey: adminKeys.applications,
    queryFn: async (): Promise<ApplicationWithProduct[]> => {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*, loan_products(id, name, interest_rate, processing_fee_type, processing_fee_value)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ApplicationWithProduct[];
    },
  });
}

export function useAdminApplication(id: string | undefined) {
  return useQuery<AdminApplicationDetail | null>({
    queryKey: adminKeys.application(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<AdminApplicationDetail | null> => {
      const { data: app } = await supabase
        .from('loan_applications')
        .select('*, loan_products(*)')
        .eq('id', id!)
        .maybeSingle();
      if (!app) return null;
      const { data: docs } = await supabase
        .from('loan_documents')
        .select('*')
        .eq('application_id', id!);
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('application_id', id!);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', app.user_id)
        .maybeSingle();
      return {
        application: app as LoanApplication & { loan_products: LoanProduct | null },
        documents: (docs ?? []) as LoanDocument[],
        payments: (payments ?? []) as Payment[],
        profile: profile as Profile | null,
      };
    },
  });
}

interface UpdateApplicationInput {
  id: string;
  status?: LoanApplication['status'];
  approved_amount?: number | null;
  disbursed_amount?: number | null;
  internal_notes?: string | null;
  fee_status?: LoanApplication['fee_status'];
  processing_fee?: number;
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateApplicationInput) => {
      const updates: Record<string, unknown> = {};
      if (input.status) {
        updates.status = input.status;
        if (input.status === 'approved') updates.approved_at = new Date().toISOString();
        if (input.status === 'declined') updates.reviewed_at = new Date().toISOString();
        if (input.status === 'disbursed') {
          updates.disbursed_at = new Date().toISOString();
          updates.disbursed_amount = input.disbursed_amount;
        }
      }
      if (input.approved_amount !== undefined) updates.approved_amount = input.approved_amount;
      if (input.internal_notes !== undefined) updates.internal_notes = input.internal_notes;
      if (input.fee_status) updates.fee_status = input.fee_status;
      if (input.processing_fee !== undefined) updates.processing_fee = input.processing_fee;

      const { data, error } = await supabase
        .from('loan_applications')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: input.status ? `status_${input.status}` : 'application_update',
        entity_type: 'loan_application',
        entity_id: input.id,
        metadata: { updates },
      });

      const finalStatuses: string[] = ['approved', 'declined', 'disbursed'];
      if (input.status && finalStatuses.includes(input.status)) {
        await supabase.rpc('delete_application_documents', { app_id: input.id });
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: adminKeys.applications });
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      if (variables.id) {
        qc.invalidateQueries({ queryKey: adminKeys.application(variables.id) });
      }
    },
  });
}

export function useVerifyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docId, verified }: { docId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('loan_documents')
        .update({ verified })
        .eq('id', docId);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: verified ? 'document_verified' : 'document_rejected',
        entity_type: 'loan_document',
        entity_id: docId,
        metadata: { verified },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-application'] });
    },
  });
}

export function useAdminProducts() {
  return useQuery<LoanProduct[]>({
    queryKey: adminKeys.products,
    queryFn: async (): Promise<LoanProduct[]> => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoanProduct[];
    },
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoanProductInsert): Promise<LoanProduct> => {
      if (input.id) {
        const { id, ...rest } = input;
        const { data, error } = await supabase
          .from('loan_products')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as LoanProduct;
      }
      const { data, error } = await supabase
        .from('loan_products')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as LoanProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.products });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loan_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.products });
    },
  });
}

export function useAdminAuditLogs() {
  return useQuery<AuditLogWithProfile[]>({
    queryKey: adminKeys.audit,
    queryFn: async (): Promise<AuditLogWithProfile[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AuditLogWithProfile[];
    },
  });
}

export function useAdminSettings() {
  return useQuery<AdminSetting[]>({
    queryKey: adminKeys.settings,
    queryFn: async (): Promise<AdminSetting[]> => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      return data as AdminSetting[];
    },
  });
}

export function useSaveSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; value: Record<string, unknown> }) => {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', input.key)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('settings')
          .update({ value: input.value })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('settings')
        .insert({ key: input.key, value: input.value })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
    },
  });
}
