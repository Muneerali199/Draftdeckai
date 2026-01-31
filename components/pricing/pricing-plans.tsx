'use client';

import { useState } from 'react';
import { Check, Zap, Users, Crown, Building2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { TIER_LIMITS, ACTION_COSTS } from '@/lib/credits-service';

const features = {
  free: [
    `${TIER_LIMITS.free} credits per month`,
    'Basic templates',
    'PDF export only',
    'Community support',
  ],
  individual: [
    `${TIER_LIMITS.basic} credits per month`,
    'All premium templates',
    'Export to PDF/PPTX/DOCX',
    'Priority support',
    'No watermarks',
    'Credit rollover (up to 20)',
  ],
  pro: [
    `${TIER_LIMITS.pro} credits per month`,
    'Everything in Individual',
    'API access',
    'Advanced analytics',
    'Priority AI processing',
    'Credit rollover (up to 50)',
  ],
  organization: [
    'Unlimited credits',
    'Everything in Pro',
    'Unlimited team members',
    'Team collaboration',
    'Brand customization',
    'Dedicated support',
    'Custom templates',
    'SSO integration',
    'Admin dashboard',
  ],
};

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  plan_type: 'individual' | 'organization';
  billing_period: 'monthly' | 'yearly';
  price: number;
  stripe_price_id: string;
  features: string[];
  popular?: boolean;
}

export default function PricingPlans() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      id: '1',
      name: 'Free',
      description: 'Perfect for trying out DocMagic',
      plan_type: 'individual',
      billing_period: 'monthly',
      price: 0,
      stripe_price_id: '',
      features: features.free,
    },
    {
      id: '2',
      name: 'Basic',
      description: 'For regular document creation',
      plan_type: 'individual',
      billing_period: billingPeriod,
      price: billingPeriod === 'monthly' ? 9.99 : 95.88,
      stripe_price_id: billingPeriod === 'monthly'
        ? (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_INDIVIDUAL_MONTHLY || '')
        : (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_INDIVIDUAL_YEARLY || ''),
      features: features.individual,
    },
    {
      id: '3',
      name: 'Pro',
      description: 'For power users and professionals',
      plan_type: 'individual',
      billing_period: billingPeriod,
      price: billingPeriod === 'monthly' ? 19.99 : 191.88,
      stripe_price_id: billingPeriod === 'monthly'
        ? (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || '')
        : (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY || ''),
      features: features.pro,
      popular: true,
    },
    {
      id: '4',
      name: 'Enterprise',
      description: 'For teams and organizations',
      plan_type: 'organization',
      billing_period: billingPeriod,
      price: billingPeriod === 'monthly' ? 49.99 : 479.88,
      stripe_price_id: billingPeriod === 'monthly'
        ? (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ORGANIZATION_MONTHLY || '')
        : (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ORGANIZATION_YEARLY || ''),
      features: features.organization,
    },
  ];

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.price === 0) {
      router.push('/auth/register');
      return;
    }

    try {
      setLoading(plan.id);

      const supabase = createClient();
      // Use getSession() for rate limit avoidance
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.push('/auth/signin?redirect=/pricing');
        return;
      }

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ← This sends cookies!
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          planType: plan.plan_type,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-4 sm:px-0 leading-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
          Choose the perfect plan for your needs. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-8 sm:mb-12 px-4 sm:px-0">
        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="monthly" className="text-sm sm:text-base py-2.5 sm:py-3">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="text-sm sm:text-base py-2.5 sm:py-3 gap-1 sm:gap-2 flex-wrap">
              Yearly
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">Save 20%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto px-4 sm:px-0">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative hover:shadow-2xl transition-all duration-300 ${plan.popular ? 'border-blue-500 border-2 shadow-xl scale-105 md:scale-100' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="p-5 sm:p-6 lg:p-7">
              <div className="flex items-center gap-2 mb-2">
                {plan.plan_type === 'individual' && <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />}
                {plan.plan_type === 'organization' && <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />}
                <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
              </div>
              <CardDescription className="text-sm sm:text-base">{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm sm:text-base text-muted-foreground">
                    /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>
              {billingPeriod === 'yearly' && plan.price > 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  ${(plan.price / 12).toFixed(2)}/month billed annually
                </p>
              )}
            </CardHeader>

            <CardContent className="p-5 sm:p-6 lg:p-7 pt-0">
              <ul className="space-y-2.5 sm:space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-5 sm:p-6 lg:p-7 pt-0">
              <Button
                className="w-full touch-target"
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? (
                  'Processing...'
                ) : plan.price === 0 ? (
                  'Get Started Free'
                ) : (
                  'Subscribe Now'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Credit Costs Info */}
      <div className="mt-12 max-w-3xl mx-auto px-4 sm:px-0">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="w-5 h-5 text-yellow-500" />
              How Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Each document type uses a different amount of credits. Credits reset monthly on your billing date.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <span className="text-lg">📄</span>
                <div>
                  <p className="text-sm font-medium">Resume</p>
                  <p className="text-xs text-muted-foreground">{ACTION_COSTS.resume} credit</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-sm font-medium">Presentation</p>
                  <p className="text-xs text-muted-foreground">{ACTION_COSTS.presentation} credit/slide</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <span className="text-lg">📐</span>
                <div>
                  <p className="text-sm font-medium">Diagram</p>
                  <p className="text-xs text-muted-foreground">{ACTION_COSTS.diagram} credits</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <span className="text-lg">✉️</span>
                <div>
                  <p className="text-sm font-medium">Letter</p>
                  <p className="text-xs text-muted-foreground">{ACTION_COSTS.letter} credits</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <span className="text-lg">📝</span>
                <div>
                  <p className="text-sm font-medium">Cover Letter</p>
                  <p className="text-xs text-muted-foreground">{ACTION_COSTS.cover_letter} credits</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="text-sm font-medium">ATS Check</p>
                  <p className="text-xs text-muted-foreground">{ACTION_COSTS.ats_check} credits</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Section */}
      <div className="mt-12 sm:mt-16 text-center px-4 sm:px-0">
        <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Secure Payment Methods</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-muted-foreground">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-lg hover:border-blue-500 transition-colors">
            <span className="text-xl sm:text-2xl">💳</span>
            <span className="text-xs sm:text-sm font-medium">All Major Cards</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <span className="text-2xl">🍎</span>
            <span className="text-sm font-medium">Apple Pay</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <span className="text-2xl">🔵</span>
            <span className="text-sm font-medium">Google Pay</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <span className="text-2xl">⚡</span>
            <span className="text-sm font-medium">Link</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <span className="text-2xl">🔒</span>
            <span className="text-sm font-medium">PCI Secure</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Powered by Stripe • Digital wallets (Apple Pay, Google Pay) available in production
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <span className="text-2xl">💳</span>
            <span className="text-sm font-medium">All Major Cards</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <span className="text-2xl">�</span>
            <span className="text-sm font-medium">PCI Compliant</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
            <span className="text-2xl">⚡</span>
            <span className="text-sm font-medium">Instant Activation</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Powered by Stripe • Visa, Mastercard, Amex, Discover, and more accepted worldwide
        </p>
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid gap-6">
          <div>
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-muted-foreground">
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover),
              plus digital wallets including Apple Pay, Google Pay, and Link for one-click checkout.
              All payments are securely processed through Stripe and are PCI compliant.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-muted-foreground">
              Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated amount. When downgrading, the change takes effect at the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
            <p className="text-muted-foreground">
              We offer a 30-day money-back guarantee. If you're not satisfied with DocMagic, contact us within 30 days for a full refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
