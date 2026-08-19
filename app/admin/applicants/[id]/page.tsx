'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  CreditCard,
  Banknote,
  User,
  Loader2,
  AlertCircle,
  Info,
  Trash2,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAdminApplication, useUpdateApplication, useVerifyDocument, type AdminApplicationDetail } from '@/hooks/use-admin';
import { LoanStatusTracker } from '@/components/loan-status-tracker';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  loanStatusLabel,
  loanStatusColor,
  feeStatusLabel,
  documentTypeLabel,
  initials,
  cn,
} from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

export default function ApplicantDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useAdminApplication(params.id);
  const updateMutation = useUpdateApplication();
  const verifyDocMutation = useVerifyDocument();
  const [notes, setNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [feeAmount, setFeeAmount] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Applicant Review" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data || !data.application) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Applicant Review" />
        <Card className="text-center">
          <CardContent className="py-12">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Application not found.</p>
            <Button asChild className="mt-4">
              <Link href="/admin/applicants">Back to Applicants</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { application, documents = [], payments = [], profile = null } = data as AdminApplicationDetail;
  const product = application.loan_products;

  const handleAction = async (
    status: 'approved' | 'declined' | 'documents_under_review' | 'eligibility_assessment' | 'disbursed',
    extra?: { approved_amount?: number; disbursed_amount?: number }
  ) => {
    await updateMutation.mutateAsync({
      id: application.id,
      status,
      ...extra,
    });
    toast.success(`Application ${loanStatusLabel(status).toLowerCase()}.`);

    const { error: notifError } = await supabase.rpc('send_notification', {
      target_user_id: application.user_id,
      notif_title: `Application ${loanStatusLabel(status)}`,
      notif_message: `Your loan application ${application.reference_number} has been ${loanStatusLabel(status).toLowerCase()}.`,
    });
    if (notifError) console.error('Notification failed:', notifError.message);
  };

  const handleMarkFeePaid = async () => {
    await updateMutation.mutateAsync({ id: application.id, fee_status: 'paid', status: 'documents_under_review' });
    toast.success('Fee marked as paid.');
  };

  const handleSaveNotes = async () => {
    await updateMutation.mutateAsync({ id: application.id, internal_notes: notes || application.internal_notes });
    toast.success('Notes saved.');
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -mb-2">
        <Link href="/admin/applicants"><ArrowLeft className="h-4 w-4" /> Back to Applicants</Link>
      </Button>

      <AdminHeader
        title={`Application ${application.reference_number}`}
        subtitle={product?.name}
        action={
          <Badge className={loanStatusColor(application.status)}>
            {loanStatusLabel(application.status)}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: applicant info */}
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Applicant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {profile ? initials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <InfoRow label="Phone" value={profile?.phone ?? '—'} />
                <InfoRow label="National ID" value={profile?.national_id ?? '—'} />
                <InfoRow label="Date of Birth" value={profile?.date_of_birth ? formatDate(profile.date_of_birth) : '—'} />
                <InfoRow label="County" value={profile?.county ?? '—'} />
                <InfoRow label="Member Since" value={profile?.created_at ? formatDate(profile.created_at) : '—'} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Status Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <LoanStatusTracker status={application.status} />
            </CardContent>
          </Card>
        </div>

        {/* Center: application + documents */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Amount Requested" value={formatCurrency(application.amount)} />
              <InfoRow label="Term" value={`${application.requested_term_months} months`} />
              <InfoRow label="Interest Rate" value={`${product?.interest_rate ?? 0}% p.a.`} />
              <InfoRow label="Interest Amount" value={formatCurrency(application.interest_amount)} />
              <InfoRow label="Total Repayable" value={formatCurrency(application.total_repayable)} />
              <InfoRow label="Processing Fee" value={formatCurrency(application.processing_fee)} />
              <InfoRow label="Fee Status" value={feeStatusLabel(application.fee_status)} />
              <InfoRow label="Purpose" value={application.purpose} />
              <InfoRow label="Employment" value={application.employment_status.replace('_', ' ')} />
              <InfoRow label="Monthly Income" value={formatCurrency(application.monthly_income)} />
              <InfoRow label="Mobile Money" value={application.mobile_money_number} />
              <InfoRow label="County" value={application.county} />
              {application.approved_amount !== null && (
                <InfoRow label="Approved Amount" value={formatCurrency(application.approved_amount)} />
              )}
              {application.disbursed_amount !== null && (
                <InfoRow label="Disbursed Amount" value={formatCurrency(application.disbursed_amount)} />
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-border p-4">
                    {doc.destroyed_at ? (
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Trash2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{documentTypeLabel(doc.document_type)}</p>
                          <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
                        </div>
                        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                          <Trash2 className="h-3 w-3" /> Destroyed
                        </Badge>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{documentTypeLabel(doc.document_type)}</p>
                            <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
                          </div>
                          {doc.verified && <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>}
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                          </Button>
                        </div>
                        {/* Inline preview */}
                        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-muted/30">
                          {doc.mime_type?.startsWith('image/') ? (
                            <img src={doc.file_url} alt={doc.file_name} className="max-h-64 w-full object-contain" />
                          ) : (
                            <object data={doc.file_url} type="application/pdf" className="h-64 w-full">
                              <div className="flex flex-col items-center justify-center gap-2 py-12">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Unable to preview this file</p>
                                <Button asChild variant="outline" size="sm">
                                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">Open in new tab</a>
                                </Button>
                              </div>
                            </object>
                          )}
                        </div>
                        {/* Verify / Reject actions */}
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn('gap-1.5', doc.verified && 'border-emerald-500/40 text-emerald-600')}
                            disabled={verifyDocMutation.isPending}
                            onClick={() => verifyDocMutation.mutate({ docId: doc.id, verified: true })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> {doc.verified ? 'Verified' : 'Verify'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            disabled={verifyDocMutation.isPending || !doc.verified}
                            onClick={() => verifyDocMutation.mutate({ docId: doc.id, verified: false })}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{p.reference_number}</p>
                      <p className="text-xs text-muted-foreground">{p.payment_method.toUpperCase()} · {formatDateTime(p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      <Badge variant="outline" className="capitalize">{p.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No payments recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Internal Notes & Credit Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.internal_notes && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">Existing Notes</p>
                  <p className="mt-1 text-foreground">{application.internal_notes}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Add Notes</Label>
                <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal comments about this applicant..." />
              </div>
              <Button variant="outline" size="sm" onClick={handleSaveNotes} disabled={updateMutation.isPending} className="gap-2">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />}
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card className="border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Processing fee override */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">Processing Fee Override</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Current fee: {formatCurrency(application.processing_fee)} — adjust the amount charged to this applicant.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder={String(application.processing_fee)}
                    className="w-40"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateMutation.isPending || !feeAmount}
                    onClick={async () => {
                      await updateMutation.mutateAsync({
                        id: application.id,
                        processing_fee: Number(feeAmount),
                      });
                      toast.success('Processing fee updated.');
                      setFeeAmount('');
                    }}
                    className="gap-2"
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Update Fee
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {application.fee_status === 'pending' && (
                  <Button onClick={handleMarkFeePaid} disabled={updateMutation.isPending} variant="outline" className="gap-2">
                    <CreditCard className="h-4 w-4" /> Mark Fee Paid
                  </Button>
                )}
                <Button
                  onClick={() => handleAction('documents_under_review')}
                  disabled={updateMutation.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" /> Request More Info
                </Button>

                {/* Approve dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-success text-success-foreground hover:bg-success/90">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Loan Application</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="approvedAmount">Approved Amount (KES)</Label>
                        <Input
                          id="approvedAmount"
                          type="number"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(e.target.value)}
                          placeholder={String(application.amount)}
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to approve the full requested amount.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          handleAction('approved', {
                            approved_amount: approvedAmount ? Number(approvedAmount) : application.amount,
                          });
                        }}
                        className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Confirm Approval
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Decline dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <XCircle className="h-4 w-4" /> Decline
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Decline Loan Application</DialogTitle>
                    </DialogHeader>
                    <p className="py-2 text-sm text-muted-foreground">
                      Are you sure you want to decline this application? This action will notify the applicant.
                    </p>
                    <DialogFooter>
                      <Button onClick={() => handleAction('declined')} variant="destructive" className="gap-2">
                        <XCircle className="h-4 w-4" /> Confirm Decline
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Disburse dialog */}
                {application.status === 'approved' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Banknote className="h-4 w-4" /> Mark Disbursed
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mark Loan as Disbursed</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="disbursedAmount">Disbursed Amount (KES)</Label>
                          <Input
                            id="disbursedAmount"
                            type="number"
                            value={disbursedAmount}
                            onChange={(e) => setDisbursedAmount(e.target.value)}
                            placeholder={String(application.approved_amount ?? application.amount)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            handleAction('disbursed', {
                              disbursed_amount: disbursedAmount ? Number(disbursedAmount) : (application.approved_amount ?? application.amount),
                            });
                          }}
                          className="gap-2"
                        >
                          <Banknote className="h-4 w-4" /> Confirm Disbursement
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
