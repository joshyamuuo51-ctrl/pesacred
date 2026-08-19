'use client';

import Link from 'next/link';
import { FolderOpen, FileText, Download, ArrowRight, Upload } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyApplications, useApplicationDocuments } from '@/hooks/use-data';
import type { ApplicationWithProduct, LoanDocument } from '@/types/database';
import { documentTypeLabel, formatDate, formatRelativeTime } from '@/lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DocumentUploader } from '@/components/document-uploader';
import type { DocumentType } from '@/types/database';

export default function DocumentsPage() {
  const { data, isLoading } = useMyApplications();
  const applications: ApplicationWithProduct[] = data ?? [];
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Documents"
        subtitle="Manage your uploaded documents across all applications."
        action={
          <Button asChild className="gap-2">
            <Link href="/dashboard/apply">
              <Upload className="h-4 w-4" /> Upload Documents
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationDocuments
              key={app.id}
              applicationId={app.id}
              reference={app.reference_number}
              productName={app.loan_products?.name ?? 'Loan'}
              appliedAt={app.applied_at}
            />
          ))}
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FolderOpen className="h-7 w-7 text-primary" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">No documents yet</p>
            <Button asChild className="mt-4 gap-2">
              <Link href="/dashboard/apply">
                Apply for a Loan <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ApplicationDocuments({
  applicationId,
  reference,
  productName,
  appliedAt,
}: {
  applicationId: string;
  reference: string;
  productName: string;
  appliedAt: string;
}) {
  const { data: docData, isLoading } = useApplicationDocuments(applicationId);
  const documents: LoanDocument[] = docData ?? [];
  const [open, setOpen] = useState(false);

  return (
    <Card className="shadow-soft">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{productName}</p>
            <p className="text-xs text-muted-foreground">{reference} · {formatDate(appliedAt)}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" /> Add Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {(['national_id'] as DocumentType[]).map((type) => (
                  <DocumentUploader
                    key={type}
                    label={documentTypeLabel(type)}
                    onFileSelected={() => setOpen(false)}
                  />
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : documents && documents.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{documentTypeLabel(doc.document_type)}</p>
                  <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
                </div>
                {doc.verified && <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>}
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No documents uploaded for this application</p>
        )}
      </CardContent>
    </Card>
  );
}
