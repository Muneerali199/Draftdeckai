'use client';

import React, { Suspense } from 'react';
import { DocumentGeneratorEnhanced } from '@/components/documents/document-generator-enhanced';
import { CreateDocumentGuard } from "@/components/ui/auth-guard";

export default function DocumentsPage() {
  return (
    <CreateDocumentGuard>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
          <DocumentGeneratorEnhanced />
        </div>
      </Suspense>
    </CreateDocumentGuard>
  );
}
