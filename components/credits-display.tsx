'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Coins,
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Crown,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { TIER_NAMES, type Tier } from '@/lib/credits-service';
import Link from 'next/link';

interface CreditsInfo {
  tier: Tier;
  tierName: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  resetDate: string;
}

interface ReferralInfo {
  referralCode: string | null;
  referralLink: string | null;
  referralCount: number;
  totalCreditsEarned: number;
  creditsPerReferral: number;
}

export function CreditsDisplay() {
  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Load credits and referral info in parallel
      const [creditsRes, referralRes] = await Promise.all([
        fetch('/api/credits', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/referral', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
      ]);

      if (creditsRes.ok) {
        const data = await creditsRes.json();
        setCreditsInfo(data);
      }

      if (referralRes.ok) {
        const data = await referralRes.json();
        setReferralInfo(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const shareLink = async () => {
    if (!referralInfo?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join DraftDeckAI',
          text: 'Create professional documents with AI! Use my referral link:',
          url: referralInfo.referralLink,
        });
      } catch (error) {
        copyToClipboard(referralInfo.referralLink);
      }
    } else {
      copyToClipboard(referralInfo.referralLink);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted animate-pulse">
        <Coins className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!creditsInfo) {
    return null;
  }

  const tierColors: Record<Tier, string> = {
    free: 'text-gray-500',
    basic: 'text-blue-500',
    pro: 'text-purple-500',
    enterprise: 'text-yellow-500',
  };

  const progressPercentage = Math.min(
    (creditsInfo.creditsRemaining / creditsInfo.creditsTotal) * 100,
    100
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-muted/80 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <Coins className={`h-4 w-4 ${tierColors[creditsInfo.tier]} group-hover:animate-pulse`} />
            <span className="text-sm font-medium">
              {creditsInfo.creditsRemaining}
            </span>
            <span className="text-xs text-muted-foreground">credits</span>
          </div>
          {creditsInfo.tier !== 'free' && (
            <Badge variant="secondary" className={`text-xs ${tierColors[creditsInfo.tier]}`}>
              <Crown className="w-3 h-3 mr-1" />
              {creditsInfo.tierName}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Your Credits
          </DialogTitle>
          <DialogDescription>
            Manage your credits and earn more through referrals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Credits Overview */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className={`h-5 w-5 ${tierColors[creditsInfo.tier]}`} />
                <span className="font-medium">{creditsInfo.tierName} Plan</span>
              </div>
              <Badge variant="outline" className={tierColors[creditsInfo.tier]}>
                {creditsInfo.creditsRemaining} / {creditsInfo.creditsTotal}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              Credits reset on {new Date(creditsInfo.resetDate).toLocaleDateString()}
            </p>
          </div>

          {/* Referral Section */}
          {referralInfo && referralInfo.referralLink && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gift className="h-4 w-4 text-green-500" />
                Earn More Credits
              </div>
              
              <div className="bg-green-500/10 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Share your referral link and earn <span className="font-semibold text-green-600">{referralInfo.creditsPerReferral} credits</span> for each friend who signs up!
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-center">
                  <div className="flex-1 bg-background/50 rounded-lg py-2">
                    <p className="text-lg font-bold">{referralInfo.referralCount}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                  <div className="flex-1 bg-background/50 rounded-lg py-2">
                    <p className="text-lg font-bold">{referralInfo.totalCreditsEarned}</p>
                    <p className="text-xs text-muted-foreground">Earned</p>
                  </div>
                </div>

                {/* Referral Code */}
                <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2">
                  <code className="flex-1 text-sm font-mono text-center tracking-wider">
                    {referralInfo.referralCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => copyToClipboard(referralInfo.referralCode!)}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Share Button */}
                <Button
                  onClick={shareLink}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  size="sm"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Referral Link
                </Button>
              </div>
            </div>
          )}

          {/* Upgrade CTA for free users */}
          {creditsInfo.tier === 'free' && (
            <Link href="/pricing" onClick={() => setIsDialogOpen(false)}>
              <Button variant="outline" className="w-full group">
                <Zap className="mr-2 h-4 w-4 text-yellow-500 group-hover:animate-pulse" />
                Upgrade for More Credits
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}

          {/* View Full Profile Link */}
          <Link href="/profile" onClick={() => setIsDialogOpen(false)}>
            <Button variant="ghost" className="w-full text-muted-foreground">
              View Full Profile
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
