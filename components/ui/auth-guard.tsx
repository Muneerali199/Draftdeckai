"use client";

import { useAuthGuard, getActivityDescription } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles, ArrowRight, Star, Zap } from "lucide-react";
import Link from "next/link";

interface AuthGuardProps {
  activity: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDefaultFallback?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export function AuthGuard({
  activity,
  children,
  fallback,
  showDefaultFallback = true,
  title,
  description,
  className,
}: AuthGuardProps) {
  const { isAuthenticated, loading, requireAuth } = useAuthGuard();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-8 bg-muted rounded w-1/4"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <div className={className}>{children}</div>;
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (!showDefaultFallback) {
    return null;
  }

  const activityDescription = getActivityDescription(activity);
  const defaultTitle = title || `Sign in to ${activityDescription}`;
  const defaultDescription = description || `You need to be signed in to ${activityDescription}. Join thousands of professionals using DraftDeckAI.`;

  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">{defaultTitle}</CardTitle>
          <CardDescription className="text-base">
            {defaultDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => requireAuth(activity)}
              className="bolt-gradient text-white font-semibold hover:scale-105 transition-transform"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Sign In to Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/register">
                <Star className="h-4 w-4 mr-2" />
                Create Account
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-6">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" />
              <span>10K+ users</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>AI-powered</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized auth guards for common use cases
export function CreateDocumentGuard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AuthGuard
      activity="create_document"
      title="Sign in to create documents"
      description="Start creating professional documents with AI assistance. Join thousands of professionals using DraftDeckAI."
      className={className}
    >
      {children}
    </AuthGuard>
  );
}

export function SaveDocumentGuard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AuthGuard
      activity="save_document"
      title="Sign in to save your work"
      description="Save your documents to access them later from any device. Never lose your progress again."
      className={className}
    >
      {children}
    </AuthGuard>
  );
}

export function EditTemplateGuard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AuthGuard
      activity="edit_template"
      title="Sign in to customize templates"
      description="Edit and customize templates to match your personal style and requirements."
      className={className}
    >
      {children}
    </AuthGuard>
  );
}

// Inline auth prompt for smaller UI elements
export function InlineAuthPrompt({
  activity,
  className,
}: {
  activity: string;
  className?: string;
}) {
  const { requireAuth } = useAuthGuard();
  const activityDescription = getActivityDescription(activity);

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Lock className="h-4 w-4" />
      <span>
        <button
          onClick={() => requireAuth(activity)}
          className="text-blue-600 hover:text-blue-700 underline font-medium"
        >
          Sign in
        </button>
        {" "}to {activityDescription}
      </span>
    </div>
  );
}
