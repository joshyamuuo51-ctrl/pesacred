import { z } from 'zod';

export const registerSchema = z
  .object({
    full_name: z.string().min(3, 'Full name must be at least 3 characters'),
    national_id: z
      .string()
      .min(6, 'National ID must be at least 6 characters')
      .max(20, 'National ID is too long')
      .regex(/^[A-Za-z0-9]+$/, 'National ID can only contain letters and numbers'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(/^[0-9+\-\s]+$/, 'Enter a valid phone number'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const loanApplicationSchema = z.object({
  product_id: z.string().min(1, 'Please select a loan product'),
  amount: z.coerce.number().min(500, 'Minimum loan amount is KES 500').max(1000000, 'Amount too high'),
  purpose: z.string().min(1, 'Please select a loan purpose'),
  employment_status: z.string().min(1, 'Please select your employment status'),
  employer: z.string().optional(),
  monthly_income: z.coerce.number().min(0, 'Monthly income must be a positive number'),
  mobile_money_number: z
    .string()
    .min(10, 'Enter a valid mobile money number')
    .regex(/^[0-9+\-\s]+$/, 'Enter a valid phone number'),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  county: z.string().min(1, 'Please select your county'),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  requested_term_months: z.coerce.number().min(1, 'Select a loan term'),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().min(3, 'Full name must be at least 3 characters'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  county: z.string().optional(),
  address: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const loanProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  interest_rate: z.coerce.number().min(0).max(100, 'Rate must be between 0 and 100'),
  min_amount: z.coerce.number().min(0),
  max_amount: z.coerce.number().min(0),
  repayment_period_min: z.coerce.number().min(1),
  repayment_period_max: z.coerce.number().min(1),
  processing_fee_type: z.enum(['fixed', 'percentage']),
  processing_fee_value: z.coerce.number().min(0),
  fee_refundable: z.boolean(),
  fee_description: z.string().optional(),
  icon: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LoanProductInput = z.infer<typeof loanProductSchema>;
