'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ResumeEditorContent from './resume-editor-content';

export default function ResumeEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResumeEditorContent />
    </Suspense>
  );
}
