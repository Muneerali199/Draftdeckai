"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles,
  Zap,
  Star,
  Mail,
  ArrowRight,
  Wand2,
  KeyRound,
  Check,
  Loader2,
  ArrowLeft,
  Send,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      setCountdown(60); // 60 second cooldown before allowing resend
      
      toast({
        title: "Reset Email Sent! ✨",
        description: "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setEmailSent(false);
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-8">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 mesh-gradient opacity-20 animate-pulse-glow"></div>

      {/* Animated floating orbs */}
      <div className="floating-orb w-32 h-32 sm:w-48 sm:h-48 bolt-gradient opacity-15 top-20 -left-24 animate-float delay-100"></div>
      <div className="floating-orb w-24 h-24 sm:w-36 sm:h-36 bolt-gradient opacity-20 bottom-20 -right-18 animate-float delay-300"></div>
      <div className="floating-orb w-40 h-40 sm:w-56 sm:h-56 bolt-gradient opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-float delay-500"></div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] animate-subtle-shimmer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3ccircle cx='30' cy='30' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
        }}
      />

      <div
        className={`w-full max-w-md mx-4 relative z-10 transition-all duration-1000 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Card */}
        <div className="glass-effect p-6 sm:p-8 rounded-2xl shadow-2xl border border-yellow-400/20 relative overflow-hidden group hover:border-yellow-400/40 transition-all duration-500 hover:shadow-3xl backdrop-blur-xl">
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 group-hover:scale-125 transition-transform duration-300">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse group-hover:animate-bounce" />
          </div>
          <div className="absolute bottom-4 left-4 group-hover:scale-125 transition-transform duration-300">
            <Star
              className="h-4 w-4 text-blue-500 animate-spin group-hover:animate-pulse"
              style={{ animationDuration: "3s" }}
            />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div
              className={`text-center mb-6 sm:mb-8 transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4 group hover:scale-105 transition-all duration-300">
                <KeyRound className="h-4 w-4 text-yellow-500 group-hover:animate-pulse" />
                <span className="text-sm font-medium bolt-gradient-text">
                  Password Recovery
                </span>
                <Wand2 className="h-4 w-4 text-blue-500 group-hover:animate-spin" />
              </div>

              <h1 className="modern-display text-2xl sm:text-3xl font-bold mb-2">
                {emailSent ? (
                  <>
                    Check Your{" "}
                    <span className="bolt-gradient-text">Email</span>
                  </>
                ) : (
                  <>
                    Forgot Your{" "}
                    <span className="bolt-gradient-text">Password?</span>
                  </>
                )}
              </h1>
              <p className="modern-body text-muted-foreground text-sm sm:text-base">
                {emailSent
                  ? "We've sent you a password reset link"
                  : "Enter your email and we'll send you a reset link"}
              </p>
            </div>

            {emailSent ? (
              // Success state
              <div
                className={`transition-all duration-500 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {/* Success animation */}
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-6 animate-bounce shadow-xl">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>

                  <div className="glass-effect p-4 rounded-xl border border-green-400/30 mb-6 max-w-sm">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Email sent to:
                        </p>
                        <p className="text-sm text-muted-foreground break-all">
                          {email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Click the link in the email to reset your password.
                      <br />
                      Check your spam folder if you don't see it.
                    </p>
                  </div>

                  {/* Resend button */}
                  <Button
                    onClick={handleResend}
                    variant="outline"
                    disabled={countdown > 0 || isLoading}
                    className="w-full glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend in {countdown}s
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Resend Email
                      </>
                    )}
                  </Button>
                </div>

                {/* Back to sign in */}
                <div className="text-center mt-4">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-2 text-sm font-medium bolt-gradient-text hover:scale-105 transition-all duration-200 group"
                  >
                    <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              // Form state
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div
                  className={`space-y-2 transition-all duration-500 delay-300 ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <Label
                    htmlFor="email"
                    className={`text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                      focusedField === "email" ? "text-yellow-600 scale-105" : ""
                    }`}
                  >
                    <Mail
                      className={`h-4 w-4 text-muted-foreground transition-all duration-300 ${
                        focusedField === "email" ? "text-yellow-500 animate-pulse" : ""
                      }`}
                    />
                    Email Address
                    {email && isValidEmail(email) && (
                      <Check className="h-3 w-3 text-green-500 animate-scale-in" />
                    )}
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your email address"
                      required
                      className={`glass-effect focus:ring-yellow-400/20 pl-4 pr-4 py-3 text-sm sm:text-base transition-all duration-300 group-hover:shadow-lg ${
                        email && !isValidEmail(email) && email.length > 0
                          ? "border-red-400/60 focus:border-red-400/80"
                          : "border-yellow-400/30 focus:border-yellow-400/60 hover:border-yellow-400/50"
                      }`}
                      disabled={isLoading}
                    />
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${
                        email && isValidEmail(email)
                          ? "w-full bg-gradient-to-r from-green-400 to-blue-500"
                          : email && !isValidEmail(email) && email.length > 0
                          ? "w-full bg-gradient-to-r from-red-400 to-orange-500"
                          : email
                          ? "w-1/2 bg-gradient-to-r from-yellow-400 to-blue-500"
                          : "w-0"
                      }`}
                    ></div>
                  </div>
                  {email && email.length > 0 && !isValidEmail(email) && (
                    <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in-up">
                      <Mail className="h-3 w-3" />
                      Please enter a valid email address
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <div
                  className={`transition-all duration-500 delay-400 ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <Button
                    type="submit"
                    disabled={isLoading || !isValidEmail(email)}
                    className="w-full bolt-gradient text-white font-semibold py-4 sm:py-5 rounded-xl relative text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-3 relative z-20">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="font-bold">Sending Reset Link...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span className="font-bold">Send Reset Link</span>
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </form>
            )}

            {/* Footer - Back to sign in */}
            {!emailSent && (
              <div
                className={`mt-6 text-center transition-all duration-500 delay-500 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <div className="glass-effect p-4 rounded-xl border border-yellow-400/10 hover:border-yellow-400/20 transition-all duration-300">
                  <p className="text-sm text-muted-foreground mb-3">
                    Remember your password?
                  </p>
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-2 text-sm font-medium bolt-gradient-text hover:scale-105 transition-all duration-200 group"
                  >
                    <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span>Back to Sign In</span>
                    <Zap className="h-3 w-3 group-hover:animate-pulse" />
                  </Link>
                </div>
              </div>
            )}

            {/* Home link */}
            <div
              className={`mt-4 text-center transition-all duration-500 delay-600 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:bolt-gradient-text transition-all duration-200 group"
              >
                <ArrowRight className="h-3 w-3 rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
