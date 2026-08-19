'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

interface DocumentUploaderProps {
  label: string;
  description?: string;
  required?: boolean;
  /** Called when a file is selected — receives the File so the parent can batch-upload later */
  onFileSelected?: (file: File, url: string) => void;
  /** Controlled uploaded state — parent sets this when the file is confirmed uploaded */
  uploaded?: boolean;
  uploadedName?: string;
  onClear?: () => void;
}

export function DocumentUploader({
  label,
  description,
  required,
  onFileSelected,
  uploaded,
  uploadedName,
  onClear,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }
    setSelectedFile(file);
    setUploading(true);

    // Upload to storage immediately so we have a URL.
    // The DB row (loan_documents) is created after the application is submitted.
    (async () => {
      try {
        const ext = file.name.split('.').pop();
        const userId = user?.id ?? 'unknown';
        const path = `${userId}/national-id-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('loan-documents')
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('loan-documents')
          .getPublicUrl(path);

        onFileSelected?.(file, urlData.publicUrl);
        toast.success(`${label} uploaded successfully.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        toast.error(msg);
        setSelectedFile(null);
      } finally {
        setUploading(false);
      }
    })();
  }, [label, onFileSelected, user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const isDone = uploaded || (selectedFile && !uploading);

  if (isDone) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{uploadedName ?? selectedFile?.name ?? 'Document uploaded'}</p>
          <p className="text-xs text-muted-foreground">Uploaded successfully</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setSelectedFile(null);
            onClear?.();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
        uploading && 'pointer-events-none opacity-60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading ? (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </>
      ) : (
        <>
          <UploadCloud className="h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</p>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          <p className="mt-2 text-xs text-muted-foreground">Drag & drop or click to browse · Max 10MB</p>
        </>
      )}
    </div>
  );
}
