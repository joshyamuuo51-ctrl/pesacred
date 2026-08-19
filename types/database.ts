export type AppRole = 'user' | 'admin' | 'support';

export type LoanStatus =
  | 'application_received'
  | 'documents_under_review'
  | 'eligibility_assessment'
  | 'fee_pending'
  | 'fee_paid'
  | 'approved'
  | 'declined'
  | 'disbursed';

export type FeeStatus = 'not_required' | 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'mpesa' | 'airtel' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DocumentType = 'national_id' | 'payslip' | 'selfie' | 'bank_statement';
export type NotificationType = 'in_app' | 'email' | 'sms';
export type TicketStatus = 'open' | 'responded' | 'resolved' | 'closed';
export type ChatSender = 'client' | 'admin';

export type ProcessingFeeType = 'fixed' | 'percentage';
export type EmploymentStatus = 'employed' | 'self_employed' | 'business' | 'unemployed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          national_id: string;
          date_of_birth: string;
          phone: string;
          email: string;
          role: AppRole;
          avatar_url: string | null;
          county: string | null;
          address: string | null;
          last_login_at: string | null;
          login_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          national_id: string;
          date_of_birth: string;
          phone: string;
          email: string;
          role?: AppRole;
          avatar_url?: string | null;
          county?: string | null;
          address?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      admins: {
        Row: {
          id: string;
          permissions: Record<string, boolean>;
          created_at: string;
        };
        Insert: { id: string; permissions?: Record<string, boolean> };
        Update: { permissions?: Record<string, boolean> };
      };
      loan_products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          interest_rate: number;
          min_amount: number;
          max_amount: number;
          repayment_period_min: number;
          repayment_period_max: number;
          processing_fee_type: ProcessingFeeType;
          processing_fee_value: number;
          fee_refundable: boolean;
          fee_description: string | null;
          eligibility_rules: Record<string, unknown>;
          is_active: boolean;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          interest_rate: number;
          min_amount: number;
          max_amount: number;
          repayment_period_min: number;
          repayment_period_max: number;
          processing_fee_type?: ProcessingFeeType;
          processing_fee_value?: number;
          fee_refundable?: boolean;
          fee_description?: string | null;
          eligibility_rules?: Record<string, unknown>;
          is_active?: boolean;
          icon?: string | null;
        };
        Update: Partial<Database['public']['Tables']['loan_products']['Insert']>;
      };
      loan_applications: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          reference_number: string;
          amount: number;
          purpose: string;
          employment_status: string;
          employer: string | null;
          monthly_income: number;
          mobile_money_number: string;
          bank_name: string | null;
          bank_account: string | null;
          county: string;
          address: string;
          requested_term_months: number;
          interest_amount: number;
          total_repayable: number;
          processing_fee: number;
          fee_status: FeeStatus;
          status: LoanStatus;
          approved_amount: number | null;
          disbursed_amount: number | null;
          internal_notes: string | null;
          applied_at: string;
          reviewed_at: string | null;
          approved_at: string | null;
          disbursed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          product_id: string;
          reference_number: string;
          amount: number;
          purpose: string;
          employment_status: string;
          employer?: string | null;
          monthly_income: number;
          mobile_money_number: string;
          bank_name?: string | null;
          bank_account?: string | null;
          county: string;
          address: string;
          requested_term_months: number;
          interest_amount?: number;
          total_repayable?: number;
          processing_fee?: number;
          fee_status?: FeeStatus;
          status?: LoanStatus;
          approved_amount?: number | null;
          disbursed_amount?: number | null;
          internal_notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['loan_applications']['Insert']>;
      };
      loan_documents: {
        Row: {
          id: string;
          application_id: string;
          user_id: string;
          document_type: DocumentType;
          file_url: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          verified: boolean;
          destroyed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          user_id?: string;
          document_type: DocumentType;
          file_url: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          verified?: boolean;
        };
        Update: Partial<Database['public']['Tables']['loan_documents']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          application_id: string;
          user_id: string;
          amount: number;
          payment_method: PaymentMethod;
          reference_number: string;
          provider_reference: string | null;
          status: PaymentStatus;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          user_id?: string;
          amount: number;
          payment_method: PaymentMethod;
          reference_number: string;
          provider_reference?: string | null;
          status?: PaymentStatus;
          paid_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title: string;
          message: string;
          read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          message: string;
          status: TicketStatus;
          response: string | null;
          created_at: string;
          responded_at: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          subject: string;
          message: string;
          status?: TicketStatus;
          response?: string | null;
        };
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>;
      };
      settings: {
        Row: { id: string; key: string; value: Record<string, unknown>; updated_at: string };
        Insert: { id?: string; key: string; value: Record<string, unknown> };
        Update: { value?: Record<string, unknown> };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Record<string, never>;
      };
    };
  };
}

export interface ChatMessage {
  id: string;
  user_id: string;
  sender: ChatSender;
  admin_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type LoanProduct = Database['public']['Tables']['loan_products']['Row'];
export type LoanApplication = Database['public']['Tables']['loan_applications']['Row'];
export type LoanDocument = Database['public']['Tables']['loan_documents']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export type ApplicationWithProduct = LoanApplication & {
  loan_products: Pick<
    LoanProduct,
    'id' | 'name' | 'interest_rate' | 'processing_fee_type' | 'processing_fee_value'
  > | null;
};

export type PaymentWithApplication = Payment & {
  loan_applications: Pick<LoanApplication, 'id' | 'reference_number' | 'amount'> | null;
};
