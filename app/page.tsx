import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { DocumentCard } from "@/components/document-card";
import { TooltipWithShortcut } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  File as FileIcon,
  FileText,
  Presentation as LayoutPresentation,
  Mail,
  Github,
  Twitter,
  Linkedin,
  HelpCircle,
  BookOpen,
  Users,
  Sparkles,
  Heart,
  Zap,
  Star,
  ArrowDown,
  Wand2,
  Shield,
  Globe,
  Coffee,
  ArrowRight,
  Trophy,
} from "lucide-react";
import ScrollToTop from "@/components/scroll-to-top";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ResumeGenerator } from "@/components/resume/resume-generator";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          // No-op in this read-only context
        },
        remove(name: string, options?: any) {
          // No-op in this read-only context
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div id="top" className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        {/* Enhanced AI-Powered Features Showcase */}
        <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
          {/* Enhanced Background Elements - Matching other sections */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="mesh-gradient opacity-40"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-r from-amber-400/8 to-orange-400/8 rounded-full blur-2xl animate-pulse delay-500"></div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Enhanced Header */}
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-blue-200/30 mb-6 hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
                <span className="text-sm font-semibold bolt-gradient-text">AI-Powered Document Creation</span>
                <Wand2 className="h-5 w-5 text-purple-500 animate-bounce" />
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                <span className="block mb-2">Create Professional Documents</span>
                <span className="bolt-gradient-text">In Seconds, Not Hours</span>
              </h2>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                Transform your ideas into stunning documents with our advanced AI. From resumes to presentations,
                experience the magic of instant professional creation.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mb-8">
                <div className="text-center min-w-[90px] sm:min-w-[100px]">
                  <div className="text-2xl sm:text-3xl font-bold bolt-gradient-text">50K+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Documents Created</div>
                </div>
                <div className="text-center min-w-[90px] sm:min-w-[100px]">
                  <div className="text-2xl sm:text-3xl font-bold sunset-gradient-text">30s</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Average Creation Time</div>
                </div>
                <div className="text-center min-w-[90px] sm:min-w-[100px]">
                  <div className="text-2xl sm:text-3xl font-bold forest-gradient-text">99%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">ATS Compatibility</div>
                </div>
              </div>
            </div>

            {/* Enhanced Core Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12">
              {/* AI Resume Builder */}
              <TooltipWithShortcut content="Create ATS-optimized resumes with AI guidance and real-time optimization">
                <Link
                  href="/resume"
                  className="group relative flex flex-col p-4 sm:p-6 rounded-2xl card-coral hover-coral border-2 border-amber-200/50 hover:border-amber-300/70 hover:scale-105 hover:shadow-2xl transition-all duration-500 backdrop-blur-xl shadow-lg hover:shadow-amber-200/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/8 to-orange-500/8 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 sunset-gradient rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ring-2 ring-white/20">
                      <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:bolt-gradient-text transition-all duration-300 text-gray-800 dark:text-white">
                      AI Resume Builder
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Generate professional, ATS-optimized resumes with intelligent formatting and industry-specific content
                    </p>
                    <div className="flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-50/80 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                      <Zap className="h-3 w-3" />
                      <span>30-second creation</span>
                    </div>
                  </div>
                </Link>
              </TooltipWithShortcut>

              {/* Presentation Generator */}
              <TooltipWithShortcut content="Create stunning presentations with AI-generated content, charts, and shareable links">
                <Link
                  href="/presentation"
                  className="group relative flex flex-col p-4 sm:p-6 rounded-2xl card-lavender hover-lavender border-2 border-purple-200/50 hover:border-purple-300/70 hover:scale-105 hover:shadow-2xl transition-all duration-500 backdrop-blur-xl shadow-lg hover:shadow-purple-200/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/8 to-pink-500/8 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 cosmic-gradient rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ring-2 ring-white/20">
                      <LayoutPresentation className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:bolt-gradient-text transition-all duration-300 text-gray-800 dark:text-white">
                      Smart Presentations
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Generate complete slide decks with outlines, themes, and shareable public URLs automatically
                    </p>
                    <div className="flex items-center gap-2 text-xs text-purple-600 font-medium bg-purple-50/80 dark:bg-purple-900/30 px-3 py-1.5 rounded-full">
                      <Globe className="h-3 w-3" />
                      <span>Shareable links</span>
                    </div>
                  </div>
                </Link>
              </TooltipWithShortcut>

              {/* Letter Composer */}
              <TooltipWithShortcut content="Draft professional letters and cover letters with perfect tone and formatting">
                <Link
                  href="/letter"
                  className="group relative flex flex-col p-4 sm:p-6 rounded-2xl card-sky hover-sky border-2 border-blue-200/50 hover:border-blue-300/70 hover:scale-105 hover:shadow-2xl transition-all duration-500 backdrop-blur-xl shadow-lg hover:shadow-blue-200/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 to-cyan-500/8 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bolt-gradient rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ring-2 ring-white/20">
                      <Mail className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:bolt-gradient-text transition-all duration-300 text-gray-800 dark:text-white">
                      Letter Composer
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Create compelling cover letters and business correspondence with AI-powered tone optimization
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50/80 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                      <Trophy className="h-3 w-3" />
                      <span>Perfect tone</span>
                    </div>
                  </div>
                </Link>
              </TooltipWithShortcut>

              {/* CV Generator */}
              <TooltipWithShortcut content="Build comprehensive academic CVs with research focus and detailed formatting">
                <Link
                  href="/cv"
                  className="group relative flex flex-col p-4 sm:p-6 rounded-2xl card-mint hover-mint border-2 border-emerald-200/50 hover:border-emerald-300/70 hover:scale-105 hover:shadow-2xl transition-all duration-500 backdrop-blur-xl shadow-lg hover:shadow-emerald-200/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/8 to-teal-500/8 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 forest-gradient rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ring-2 ring-white/20">
                      <FileIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:bolt-gradient-text transition-all duration-300 text-gray-800 dark:text-white">
                      CV Builder
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Generate comprehensive academic and research CVs with detailed sections and professional formatting
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50/80 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
                      <Shield className="h-3 w-3" />
                      <span>Academic standard</span>
                    </div>
                  </div>
                </Link>
              </TooltipWithShortcut>
            </div>

            {/* Secondary Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              <TooltipWithShortcut content="Access premium templates and manage your document library">
                <Link
                  href="/templates"
                  className="group flex flex-col items-center p-3 sm:p-4 rounded-xl card-lavender hover-lavender border-2 border-purple-200/50 hover:border-purple-300/70 hover:scale-105 transition-all duration-300 backdrop-blur-lg shadow-md hover:shadow-lg min-h-[100px] justify-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 cosmic-gradient rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md ring-2 ring-white/20">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center text-gray-800 dark:text-white">Templates</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">50+ Designs</span>
                </Link>
              </TooltipWithShortcut>

              <TooltipWithShortcut content="Manage your profile and track document creation analytics">
                <Link
                  href="/profile"
                  className="group flex flex-col items-center p-3 sm:p-4 rounded-xl card-sky hover-sky border-2 border-blue-200/50 hover:border-blue-300/70 hover:scale-105 transition-all duration-300 backdrop-blur-lg shadow-md hover:shadow-lg min-h-[100px] justify-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bolt-gradient rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md ring-2 ring-white/20">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center text-gray-800 dark:text-white">Profile</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">Analytics</span>
                </Link>
              </TooltipWithShortcut>

              <TooltipWithShortcut content="Explore flexible pricing plans for individuals and teams">
                <Link
                  href="/pricing"
                  className="group flex flex-col items-center p-3 sm:p-4 rounded-xl card-mint hover-mint border-2 border-emerald-200/50 hover:border-emerald-300/70 hover:scale-105 transition-all duration-300 backdrop-blur-lg shadow-md hover:shadow-lg min-h-[100px] justify-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 forest-gradient rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md ring-2 ring-white/20">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center text-gray-800 dark:text-white">Pricing</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">Free Start</span>
                </Link>
              </TooltipWithShortcut>

              <TooltipWithShortcut content="Learn about our mission to democratize document creation">
                <Link
                  href="/about"
                  className="group flex flex-col items-center p-3 sm:p-4 rounded-xl card-coral hover-coral border-2 border-amber-200/50 hover:border-amber-300/70 hover:scale-105 transition-all duration-300 backdrop-blur-lg shadow-md hover:shadow-lg min-h-[100px] justify-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 sunset-gradient rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md ring-2 ring-white/20">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center text-gray-800 dark:text-white">About</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">Our Story</span>
                </Link>
              </TooltipWithShortcut>

              <TooltipWithShortcut content="Get support and connect with our community">
                <Link
                  href="/contact"
                  className="group flex flex-col items-center p-3 sm:p-4 rounded-xl card-sky hover-sky border-2 border-blue-200/50 hover:border-blue-300/70 hover:scale-105 transition-all duration-300 backdrop-blur-lg shadow-md hover:shadow-lg min-h-[100px] justify-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 ocean-gradient rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md ring-2 ring-white/20">
                    <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center text-gray-800 dark:text-white">Support</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">24/7 Help</span>
                </Link>
              </TooltipWithShortcut>

              <TooltipWithShortcut content="Access comprehensive guides and API documentation">
                <Link
                  href="/documentation"
                  className="group flex flex-col items-center p-3 sm:p-4 rounded-xl card-lavender hover-lavender border-2 border-purple-200/50 hover:border-purple-300/70 hover:scale-105 transition-all duration-300 backdrop-blur-lg shadow-md hover:shadow-lg min-h-[100px] justify-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bolt-gradient rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md ring-2 ring-white/20">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center text-gray-800 dark:text-white">Docs</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">Get Started</span>
                </Link>
              </TooltipWithShortcut>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass-effect border-2 border-blue-200/50 hover:border-blue-300/70 hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-lg shadow-lg hover:shadow-blue-200/20">
                <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
                <span className="text-lg font-semibold bolt-gradient-text">Ready to create your first document?</span>
                <ArrowRight className="h-5 w-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>
        <FeaturesSection />
        <TestimonialsSection />
        <ScrollToTop />
      </main>
    </div>
  );
}