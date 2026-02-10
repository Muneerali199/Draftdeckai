'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';

interface PWABannerProps {
  className?: string;
}

export function PWABanner({ className }: PWABannerProps) {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setIsDismissed(true);
        localStorage.setItem('pwa-banner-dismissed', 'true');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border bg-background p-4 shadow-lg',
      'animate-in slide-in-from-bottom-2 duration-300',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="rounded-full bg-primary/10 p-2">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="text-sm font-semibold">Install DraftDeckAI</h4>
            <p className="text-xs text-muted-foreground">
              Add DraftDeckAI to your home screen for quick access and offline use.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={isInstalling}
              className="h-8"
            >
              {isInstalling ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-transparent border-t-current" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span className="ml-1">
                {isInstalling ? 'Installing...' : 'Install'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8"
            >
              Maybe later
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-6 w-6 flex-shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}
