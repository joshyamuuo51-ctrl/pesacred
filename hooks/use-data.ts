'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { generateReferenceNumber } from '@/lib/utils';
import { calculateLoan, isFeeRequired } from '@/services/loan-calc';
import type {
  LoanApplication,
  LoanProduct,
  Notification,
  SupportTicket,
  Payment,
  LoanDocument,
  ApplicationWithProduct,
  PaymentWithApplication,
} from '@/types/database';

export const queryKeys = {
  products: ['loan-products'] as const,
  myApplications: ['my-applications'] as const,
  myPayments: ['my-payments'] as const,
  myNotifications: ['my-notifications'] as const,
  myTickets: ['my-tickets'] as const,
  myDocuments: (appId: string) => ['my-documents', appId] as const,
  application: (id: string) => ['application', id] as const,
};

type ApplicationWithFullProduct = LoanApplication & { loan_products: LoanProduct | null };

export function useLoanProducts() {
  return useQuery<LoanProduct[]>({
    queryKey: queryKeys.products,
    queryFn: async (): Promise<LoanProduct[]> => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return data as LoanProduct[];
    },
  });
}

export function useMyApplications() {
  const { user } = useAuth();
  return useQuery<ApplicationWithProduct[]>({
    queryKey: queryKeys.myApplications,
    enabled: !!user,
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

export function useApplication(id: string | undefined) {
  return useQuery<ApplicationWithFullProduct | null>({
    queryKey: queryKeys.application(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<ApplicationWithFullProduct | null> => {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*, loan_products(*)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as ApplicationWithFullProduct | null;
    },
  });
}

export function useApplicationDocuments(applicationId: string | undefined) {
  return useQuery<LoanDocument[]>({
    queryKey: queryKeys.myDocuments(applicationId ?? ''),
    enabled: !!applicationId,
    queryFn: async (): Promise<LoanDocument[]> => {
      const { data, error } = await supabase
        .from('loan_documents')
        .select('*')
        .eq('application_id', applicationId!)
        .order('created_at');
      if (error) throw error;
      return data as LoanDocument[];
    },
  });
}

export function useMyPayments() {
  const { user } = useAuth();
  return useQuery<PaymentWithApplication[]>({
    queryKey: queryKeys.myPayments,
    enabled: !!user,
    queryFn: async (): Promise<PaymentWithApplication[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, loan_applications(id, reference_number, amount)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PaymentWithApplication[];
    },
  });
}

export function useMyNotifications() {
  const { user } = useAuth();
  return useQuery<Notification[]>({
    queryKey: queryKeys.myNotifications,
    enabled: !!user,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
  });
}

/** Subscribe to realtime notification inserts so they appear instantly without a refresh. */
export function useNotificationsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as Notification;
        qc.setQueryData<Notification[]>(queryKeys.myNotifications, (old: Notification[] | undefined) => {
          if (!old) return [newNotif];
          if (old.some((n) => n.id === newNotif.id)) return old;
          return [newNotif, ...old];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload) => {
        const updated = payload.new as Notification;
        qc.setQueryData<Notification[]>(queryKeys.myNotifications, (old: Notification[] | undefined) => {
          if (!old) return old;
          return old.map((n) => (n.id === updated.id ? updated : n));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useMyTickets() {
  const { user } = useAuth();
  return useQuery<SupportTicket[]>({
    queryKey: queryKeys.myTickets,
    enabled: !!user,
    queryFn: async (): Promise<SupportTicket[]> => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}

interface CreateApplicationInput {
  product: LoanProduct;
  amount: number;
  purpose: string;
  employmentStatus: string;
  employer?: string;
  monthlyIncome: number;
  mobileMoneyNumber: string;
  bankName?: string;
  bankAccount?: string;
  county: string;
  address: string;
  requestedTermMonths: number;
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateApplicationInput): Promise<LoanApplication> => {
      const calc = calculateLoan(input.product, input.amount, input.requestedTermMonths);
      const feeRequired = isFeeRequired(input.product);

      const payload = {
        product_id: input.product.id,
        reference_number: generateReferenceNumber(),
        amount: input.amount,
        purpose: input.purpose,
        employment_status: input.employmentStatus,
        employer: input.employer || null,
        monthly_income: input.monthlyIncome,
        mobile_money_number: input.mobileMoneyNumber,
        bank_name: input.bankName || null,
        bank_account: input.bankAccount || null,
        county: input.county,
        address: input.address,
        requested_term_months: input.requestedTermMonths,
        interest_amount: calc.interestAmount,
        total_repayable: calc.totalRepayable,
        processing_fee: calc.processingFee,
        fee_status: feeRequired ? 'pending' : 'not_required',
        status: feeRequired ? 'fee_pending' : 'application_received',
      };

      const { data, error } = await supabase
        .from('loan_applications')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      const { error: notifError } = await supabase.from('notifications').insert({
        title: 'Application Submitted',
        message: `Your loan application ${(data as LoanApplication).reference_number} has been received and is under review.`,
      });
      if (notifError) console.error('Notification insert failed:', notifError.message);

      return data as LoanApplication;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myApplications });
    },
  });
}

export function useCancelApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loan_applications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myApplications });
      qc.invalidateQueries({ queryKey: queryKeys.myPayments });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myNotifications });
    },
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subject: string; message: string }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myTickets });
    },
  });
}

export function useUploadDocument(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      documentType: LoanDocument['document_type'];
    }): Promise<LoanDocument> => {
      const ext = input.file.name.split('.').pop();
      const fileName = `${applicationId}/${input.documentType}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(fileName, input.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('loan-documents')
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from('loan_documents')
        .insert({
          application_id: applicationId,
          document_type: input.documentType,
          file_url: urlData.publicUrl,
          file_name: input.file.name,
          file_size: input.file.size,
          mime_type: input.file.type,
        })
        .select()
        .single();
      if (error) throw error;
      return data as LoanDocument;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myDocuments(applicationId) });
    },
  });
}
