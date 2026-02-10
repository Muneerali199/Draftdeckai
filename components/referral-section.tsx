'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Gift,
  Copy,
  Check,
  Users,
  Sparkles,
  Share2,
  ExternalLink,
} from 'lucide-react';

interface ReferralInfo {
  referralCode: string | null;
  referralLink: string | null;
  referralCount: number;
  totalCreditsEarned: number;
  creditsPerReferral: number;
}

export function ReferralSection() {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/referral', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReferralInfo(data);
      }
    } catch (error) {
      console.error('Error loading referral info:', error);
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
          text: 'Create professional documents with AI! Use my referral link to sign up:',
          url: referralInfo.referralLink,
        });
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        copyToClipboard(referralInfo.referralLink);
      }
    } else {
      copyToClipboard(referralInfo.referralLink);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referralInfo) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-blue-500/10 border-b">
        <CardTitle className="flex items-center">
          <Gift className="mr-2 h-5 w-5 text-yellow-500" />
          Referral Program
          <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-600">
            <Sparkles className="w-3 h-3 mr-1" />
            Earn Credits
          </Badge>
        </CardTitle>
        <CardDescription>
          Share DraftDeckAI with friends and earn {referralInfo.creditsPerReferral} bonus credits for each signup!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{referralInfo.referralCount}</p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Sparkles className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{referralInfo.totalCreditsEarned}</p>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
          </div>
        </div>

        {/* Referral Code */}
        {referralInfo.referralCode && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Your Referral Code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-lg tracking-wider text-center border border-dashed border-yellow-500/30">
                {referralInfo.referralCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralInfo.referralCode!)}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Referral Link */}
        {referralInfo.referralLink && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Your Referral Link
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={referralInfo.referralLink}
                readOnly
                className="flex-1 text-sm bg-muted/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralInfo.referralLink!)}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Share Button */}
        <Button
          onClick={shareLink}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share & Earn {referralInfo.creditsPerReferral} Credits
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>

        {/* How it works */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-1">
          <p className="font-medium text-foreground">How it works:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Share your unique referral link with friends</li>
            <li>When they sign up using your link, you get {referralInfo.creditsPerReferral} credits</li>
            <li>No limit on referrals - keep sharing, keep earning!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
