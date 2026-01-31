'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Zap, Crown, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TIER_NAMES, TIER_LIMITS, ACTION_COSTS, TIER_FEATURES } from '@/lib/credits-service';

interface CreditsInfo {
  tier: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  resetDate: string | null;
  features: string[];
  actionCosts: typeof ACTION_COSTS;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditsInfo?: CreditsInfo | null;
}

const TIER_PRICING = {
  free: { price: 0, period: '' },
  basic: { price: 9.99, period: '/month' },
  pro: { price: 19.99, period: '/month' },
  enterprise: { price: 49.99, period: '/month' }
};

const TIER_ICONS = {
  free: Zap,
  basic: Sparkles,
  pro: Crown,
  enterprise: Crown
};

export function UpgradeModal({ open, onOpenChange, creditsInfo }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (tier: string) => {
    if (tier === 'free') return;

    setLoading(true);
    setSelectedTier(tier);

    try {
      // Redirect to pricing page with selected tier
      router.push(`/pricing?tier=${tier}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error initiating upgrade:', error);
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  const currentTier = creditsInfo?.tier || 'free';
  const creditsRemaining = creditsInfo?.creditsRemaining ?? TIER_LIMITS.free;
  const creditsTotal = creditsInfo?.creditsTotal ?? TIER_LIMITS.free;
  const usagePercentage = creditsTotal > 0 ? ((creditsTotal - creditsRemaining) / creditsTotal) * 100 : 0;

  const tiers = ['free', 'basic', 'pro', 'enterprise'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-background via-background to-muted/20 border-muted/30">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Get more credits and unlock powerful features
          </DialogDescription>
        </DialogHeader>

        {/* Current Usage */}
        <div className="bg-muted/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Credits</span>
            <Badge variant={creditsRemaining < 3 ? 'destructive' : 'secondary'}>
              {TIER_NAMES[currentTier as keyof typeof TIER_NAMES] || 'Free'} Plan
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={usagePercentage} className="flex-1 h-2" />
            <span className="text-sm font-semibold min-w-[80px] text-right">
              {creditsRemaining} / {creditsTotal}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Credits reset monthly • Presentations charged per slide
          </p>
        </div>

        {/* Credit Costs Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Credit Costs:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <span>📄 Resume: {ACTION_COSTS.resume} credit</span>
            <span>📊 Presentation: {ACTION_COSTS.presentation}/slide</span>
            <span>📐 Diagram: {ACTION_COSTS.diagram} credit</span>
            <span>✉️ Letter: {ACTION_COSTS.letter} credit</span>
            <span>📝 Cover Letter: {ACTION_COSTS.cover_letter} credit</span>
            <span>🎯 ATS Check: {ACTION_COSTS.ats_check} credit</span>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((tier) => {
            const TierIcon = TIER_ICONS[tier as keyof typeof TIER_ICONS];
            const pricing = TIER_PRICING[tier as keyof typeof TIER_PRICING];
            const features = TIER_FEATURES[tier as keyof typeof TIER_FEATURES] || [];
            const credits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
            const isCurrentTier = currentTier === tier;
            const isDowngrade = tiers.indexOf(tier) < tiers.indexOf(currentTier);

            return (
              <div
                key={tier}
                className={`relative rounded-xl border p-4 transition-all ${tier === 'pro'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : isCurrentTier
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-muted/50 hover:border-muted'
                  }`}
              >
                {tier === 'pro' && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-xs">
                    Popular
                  </Badge>
                )}
                {isCurrentTier && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-xs">
                    Current
                  </Badge>
                )}

                <div className="text-center mb-3">
                  <TierIcon className={`w-8 h-8 mx-auto mb-2 ${tier === 'pro' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  <h3 className="font-bold capitalize">{tier}</h3>
                  <div className="text-2xl font-bold">
                    ${pricing.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {pricing.period}
                    </span>
                  </div>
                </div>

                <div className="text-center mb-3">
                  <Badge variant="outline" className="text-xs">
                    {credits === Infinity ? 'Unlimited' : `${credits} credits/mo`}
                  </Badge>
                </div>

                <ul className="space-y-1 mb-4 text-xs">
                  {features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="sm"
                  className="w-full"
                  variant={tier === 'pro' ? 'default' : isCurrentTier ? 'outline' : 'secondary'}
                  disabled={isCurrentTier || isDowngrade || loading}
                  onClick={() => handleUpgrade(tier)}
                >
                  {loading && selectedTier === tier ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentTier ? (
                    'Current Plan'
                  ) : isDowngrade ? (
                    'Downgrade N/A'
                  ) : tier === 'free' ? (
                    'Free'
                  ) : (
                    'Upgrade'
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          All plans include secure document storage and export to PDF/DOCX
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Hook to fetch and manage credits with debouncing to prevent rate limiting
export function useCredits() {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const fetchingRef = useRef<boolean>(false);

  const fetchCredits = async (force: boolean = false) => {
    // Debounce: prevent fetching within 5 seconds of last fetch unless forced
    const now = Date.now();
    if (!force && (now - lastFetchRef.current < 5000 || fetchingRef.current)) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);

      // Get the user's session token from Supabase (uses local cache)
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setCredits(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/credits', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      lastFetchRef.current = Date.now();

      if (response.status === 401) {
        setCredits(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCredits(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchCredits(true); // Force fetch on mount
  }, []);

  return { credits, loading, error, refetch: () => fetchCredits(true) };
}
