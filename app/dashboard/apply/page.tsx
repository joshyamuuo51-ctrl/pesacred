'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wallet,
  Briefcase,
  Zap,
  Banknote,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DocumentUploader } from '@/components/document-uploader';
import { useLoanProducts, useCreateApplication } from '@/hooks/use-data';
import { supabase } from '@/lib/supabase';
import { loanApplicationSchema, type LoanApplicationInput } from '@/lib/validations';
import { KENYA_COUNTIES, EMPLOYMENT_STATUSES, LOAN_PURPOSES } from '@/lib/constants';
import { calculateLoan } from '@/services/loan-calc';
import { formatCurrency, cn } from '@/lib/utils';
import type { LoanProduct } from '@/types/database';

const productIcons: Record<string, React.ElementType> = {
  Wallet,
  Briefcase,
  Zap,
  Banknote,
};

const steps = ['Product', 'Details', 'Documents'];

export default function ApplyLoanPage() {
  const router = useRouter();
  const { data: productsData, isLoading, error, refetch } = useLoanProducts();
  const products: LoanProduct[] = productsData ?? [];
  const createApplication = useCreateApplication();
  const [step, setStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [idUploaded, setIdUploaded] = useState(false);
  const [idFileName, setIdFileName] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idDocUrl, setIdDocUrl] = useState<string>('');

  const form = useForm<LoanApplicationInput>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      product_id: '',
      amount: 0,
      purpose: '',
      employment_status: '',
      employer: '',
      monthly_income: 0,
      mobile_money_number: '',
      bank_name: '',
      bank_account: '',
      county: '',
      address: '',
      requested_term_months: 0,
    },
  });

  const watchedAmount = form.watch('amount');
  const watchedTerm = form.watch('requested_term_months');
  const watchedProductId = form.watch('product_id');

  const calc = selectedProduct && watchedAmount > 0 && watchedTerm > 0
    ? calculateLoan(selectedProduct, watchedAmount, watchedTerm)
    : null;

  const handleProductSelect = (product: LoanProduct) => {
    setSelectedProduct(product);
    form.setValue('product_id', product.id);
    form.setValue('amount', product.min_amount);
    form.setValue('requested_term_months', product.repayment_period_min);
    setStep(1);
  };

  const onDetailsSubmit = (values: LoanApplicationInput) => {
    if (!selectedProduct) return;
    if (values.amount < selectedProduct.min_amount || values.amount > selectedProduct.max_amount) {
      toast.error(`Amount must be between ${formatCurrency(selectedProduct.min_amount)} and ${formatCurrency(selectedProduct.max_amount)}`);
      return;
    }
    setStep(2);
    void values;
  };

  const handleIdUploaded = async (file: File, url: string) => {
    setIdFile(file);
    setIdFileName(file.name);
    setIdDocUrl(url);

    // Submit the application immediately after the ID upload completes.
    const values = form.getValues();
    if (!selectedProduct) return;

    if (values.amount < selectedProduct.min_amount || values.amount > selectedProduct.max_amount) {
      toast.error(`Amount must be between ${formatCurrency(selectedProduct.min_amount)} and ${formatCurrency(selectedProduct.max_amount)}`);
      return;
    }

    setIdUploaded(true);

    createApplication.mutate(
      {
        product: selectedProduct,
        amount: values.amount,
        purpose: values.purpose,
        employmentStatus: values.employment_status,
        employer: values.employer,
        monthlyIncome: values.monthly_income,
        mobileMoneyNumber: values.mobile_money_number,
        bankName: values.bank_name,
        bankAccount: values.bank_account,
        county: values.county,
        address: values.address,
        requestedTermMonths: values.requested_term_months,
      },
      {
        onSuccess: async (app) => {
          // Save the document record
          if (url && file) {
            const { error: docError } = await supabase.from('loan_documents').insert({
              application_id: app.id,
              document_type: 'national_id',
              file_url: url,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            });
            if (docError) {
              console.error('Document save failed:', docError.message);
            }
          }

          // Insert the admin greeting message via the SECURITY DEFINER function
          const { error: greetingError } = await supabase.rpc('send_greeting');
          if (greetingError) {
            console.error('Greeting failed:', greetingError.message);
          }

          toast.success('Application submitted! Our team will be in touch shortly.');
          router.push('/dashboard/support?chat=open');
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to submit application.');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Apply for a Loan"
        subtitle="Complete the steps below to submit your loan application."
      />

      {/* Stepper */}
      <div className="flex items-center justify-center">
        <div className="flex w-full max-w-2xl items-center">
          {steps.map((label, i) => (
            <div key={label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  i < step ? 'border-primary bg-primary text-primary-foreground' :
                  i === step ? 'border-primary text-primary' :
                  'border-border text-muted-foreground'
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('mt-1.5 text-xs', i === step ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('mx-2 mb-5 h-0.5 flex-1', i < step ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {step === 0 && (
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-center text-sm text-muted-foreground">Select a loan product to get started</p>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="mt-3 text-sm font-medium">Could not load loan products</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                There was a problem connecting to the server. Please check your connection and try again.
              </p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => refetch()}>
                <Loader2 className="h-4 w-4" /> Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-border p-8 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No loan products available</p>
              <p className="mt-1 text-xs text-muted-foreground">Please check back later for available loan options.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => {
                const Icon = productIcons[product.icon ?? ''] ?? Wallet;
                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card"
                    onClick={() => handleProductSelect(product)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
                          <Icon className="h-5 w-5" />
                        </span>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {product.interest_rate}% p.a.
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                        <span className="text-muted-foreground">
                          {formatCurrency(product.min_amount)} – {formatCurrency(product.max_amount)}
                        </span>
                        <span className="text-muted-foreground">{product.repayment_period_min}–{product.repayment_period_max} months</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 1 && selectedProduct && (
        <div className="mx-auto max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-5">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">Loan Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount (KES)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} placeholder={`${selectedProduct.min_amount}`} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Min: {formatCurrency(selectedProduct.min_amount)} · Max: {formatCurrency(selectedProduct.max_amount)}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requested_term_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repayment Period (months)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} placeholder={`${selectedProduct.repayment_period_min}`} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Min: {selectedProduct.repayment_period_min} · Max: {selectedProduct.repayment_period_max} months
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Purpose</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LOAN_PURPOSES.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">Employment & Income</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="employment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your employment status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EMPLOYMENT_STATUSES.map((e) => (
                              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthly_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income (KES)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} placeholder="50000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">Payment & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mobile_money_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Money Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+254 700 000 000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="KCB, Equity, etc." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Account number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your county" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {KENYA_COUNTIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street, building, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Live calculation */}
              {calc && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-foreground">Loan Summary</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Principal</p>
                        <p className="font-semibold">{formatCurrency(calc.principal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Interest ({calc.interestRate}% p.a.)</p>
                        <p className="font-semibold">{formatCurrency(calc.interestAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Repayable</p>
                        <p className="font-semibold text-primary">{formatCurrency(calc.totalRepayable)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Payment</p>
                        <p className="font-semibold">{formatCurrency(calc.monthlyPayment)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="submit" className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {step === 2 && (
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Upload Your National ID</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload a clear copy of your National ID to submit your application. Accepted formats: JPG, PNG, PDF.
              </p>
            </CardHeader>
            <CardContent>
              <DocumentUploader
                label="National ID"
                description="Front and back of your ID card"
                required
                uploaded={idUploaded}
                uploadedName={idFileName}
                onFileSelected={handleIdUploaded}
                onClear={() => { setIdUploaded(false); setIdFileName(''); setIdFile(null); }}
              />
              {createApplication.isPending && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting your application...
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)} disabled={createApplication.isPending}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
