'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Save,
  Wallet,
  Briefcase,
  Zap,
  Banknote,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useAdminProducts, useSaveProduct, useDeleteProduct } from '@/hooks/use-admin';
import type { LoanProduct } from '@/types/database';
import { loanProductSchema, type LoanProductInput } from '@/lib/validations';
import { formatCurrency, cn } from '@/lib/utils';

const productIcons: Record<string, React.ElementType> = { Wallet, Briefcase, Zap, Banknote };
const iconOptions = ['Wallet', 'Briefcase', 'Zap', 'Banknote'];

export default function AdminProductsPage() {
  const { data, isLoading } = useAdminProducts();
  const products: LoanProduct[] = data ?? [];
  const saveProduct = useSaveProduct();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState<LoanProduct | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<LoanProductInput>({
    resolver: zodResolver(loanProductSchema),
    defaultValues: {
      name: '',
      description: '',
      interest_rate: 0,
      min_amount: 0,
      max_amount: 0,
      repayment_period_min: 1,
      repayment_period_max: 12,
      processing_fee_type: 'percentage',
      processing_fee_value: 0,
      fee_refundable: false,
      fee_description: '',
      icon: 'Wallet',
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: '', description: '', interest_rate: 0, min_amount: 0, max_amount: 0,
      repayment_period_min: 1, repayment_period_max: 12, processing_fee_type: 'percentage',
      processing_fee_value: 0, fee_refundable: false, fee_description: '', icon: 'Wallet',
    });
    setOpen(true);
  };

  const openEdit = (product: LoanProduct) => {
    setEditing(product);
    form.reset({
      name: product.name,
      description: product.description ?? '',
      interest_rate: product.interest_rate,
      min_amount: product.min_amount,
      max_amount: product.max_amount,
      repayment_period_min: product.repayment_period_min,
      repayment_period_max: product.repayment_period_max,
      processing_fee_type: product.processing_fee_type,
      processing_fee_value: product.processing_fee_value,
      fee_refundable: product.fee_refundable,
      fee_description: product.fee_description ?? '',
      icon: product.icon ?? 'Wallet',
    });
    setOpen(true);
  };

  const onSubmit = (values: LoanProductInput) => {
    saveProduct.mutate(
      { ...values, id: editing?.id },
      {
        onSuccess: () => {
          toast.success(editing ? 'Product updated.' : 'Product created.');
          setOpen(false);
        },
        onError: (err) => toast.error(err.message || 'Failed to save product.'),
      }
    );
  };

  const handleDelete = (product: LoanProduct) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    deleteProduct.mutate(product.id, {
      onSuccess: () => toast.success('Product deleted.'),
      onError: (err) => toast.error(err.message || 'Failed to delete.'),
    });
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Loan Products"
        subtitle="Create and manage loan products available to applicants."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Product
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = productIcons[product.icon ?? ''] ?? Package;
            return (
              <Card key={product.id} className="shadow-soft">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Interest</span><span className="font-medium text-primary">{product.interest_rate}% p.a.</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatCurrency(product.min_amount)} – {formatCurrency(product.max_amount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span className="font-medium">{product.repayment_period_min}–{product.repayment_period_max} months</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-medium">{product.processing_fee_type === 'fixed' ? formatCurrency(product.processing_fee_value) : `${product.processing_fee_value}%`}</span></div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className={product.fee_refundable ? 'text-emerald-600' : 'text-orange-600'}>
                      {product.fee_refundable ? 'Refundable' : 'Non-Refundable'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Package className="h-7 w-7 text-primary" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">No loan products yet</p>
            <Button onClick={openCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create First Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Create Loan Product'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="icon" render={({ field }) => (
                  <FormItem><FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{iconOptions.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="interest_rate" render={({ field }) => (
                  <FormItem><FormLabel>Interest Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="min_amount" render={({ field }) => (
                  <FormItem><FormLabel>Min Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="max_amount" render={({ field }) => (
                  <FormItem><FormLabel>Max Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="repayment_period_min" render={({ field }) => (
                  <FormItem><FormLabel>Min Term (months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="repayment_period_max" render={({ field }) => (
                  <FormItem><FormLabel>Max Term (months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="processing_fee_type" render={({ field }) => (
                  <FormItem><FormLabel>Fee Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="processing_fee_value" render={({ field }) => (
                  <FormItem><FormLabel>Fee Value</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fee_refundable" render={({ field }) => (
                  <FormItem><FormLabel>Refundable?</FormLabel>
                    <div className="flex h-10 items-center gap-2">
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <span className="text-sm text-muted-foreground">{field.value ? 'Yes' : 'No'}</span>
                    </div>
                  <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="fee_description" render={({ field }) => (
                <FormItem><FormLabel>Fee Description</FormLabel><FormControl><Textarea rows={3} {...field} placeholder="Explain why the fee is charged, including the non-guarantee disclaimer..." /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saveProduct.isPending} className="gap-2">
                  {saveProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editing ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
