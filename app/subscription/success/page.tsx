'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Give Stripe webhook time to process
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-center text-muted-foreground">
              Processing your subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to DraftDeckAI!</CardTitle>
          <CardDescription>
            Your subscription has been successfully activated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 You now have unlimited access to all premium features!
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">What's next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✨ Create unlimited presentations, resumes, and CVs</li>
              <li>🎨 Access premium templates</li>
              <li>📤 Export to PDF, PPTX, and DOCX</li>
              <li>💬 Get priority support</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push('/presentation')} className="w-full">
              Create Your First Presentation
            </Button>
            <Button onClick={() => router.push('/subscription')} variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
