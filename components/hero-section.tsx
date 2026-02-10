'use client';
import { Button } from "@/components/ui/button";
import { StatCounter } from "./ui/stat-counter";
import { TooltipWithShortcut } from "@/components/ui/tooltip";
import Link from "next/link";
import { Sparkles, ArrowRight, Zap, Star, Wand2, Clock, Users, Trophy } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-background py-16 sm:py-24 md:py-32 lg:py-40">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20"></div>
      <div className="absolute inset-0 mesh-gradient-alt opacity-20"></div>

      {/* Enhanced floating orbs with better positioning and animations */}
      <div className="floating-orb w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bolt-gradient opacity-20 top-1/4 -left-20 sm:-left-32 animate-float" />
      <div className="floating-orb w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 sunset-gradient opacity-15 top-3/4 -right-20 sm:-right-28 animate-float-delayed" />
      <div className="floating-orb w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 ocean-gradient opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />

      {/* Enhanced grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3ccircle cx='30' cy='30' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          {/* Enhanced Trust Badge */}
          <div className="mb-6 sm:mb-8 animate-fade-in-down will-change-transform">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-effect border-2 border-amber-200/40 dark:border-amber-500/30 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/30 dark:to-yellow-900/30 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100">
                #1 AI Document Creator
              </span>
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 fill-current animate-pulse" />
            </div>
          </div>

          {/* Enhanced Animated Badge */}
          <div
            className="inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-full glass-effect mb-8 sm:mb-10 shimmer relative animate-fade-in-down will-change-transform border-2 border-blue-200/40 dark:border-blue-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            aria-label="AI-Powered Document Magic"
          >
            <div className="relative z-10 flex items-center gap-2 sm:gap-3">
              <Sparkles
                className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-base sm:text-lg font-bold bolt-gradient-text">
                AI-Powered Document Magic
              </span>
              <Wand2
                className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-bounce"
                aria-hidden="true"
              />
            </div>
          </div>
          {/* Enhanced Hero Heading - Landing Page Specific */}
          <h1 className="modern-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6 sm:mb-8 animate-slide-in-left will-change-transform leading-[1.15] px-4 sm:px-0">
            <span className="block mb-2 sm:mb-3 font-extrabold text-gray-900 dark:text-white">
              Create Stunning Documents
            </span>
            <span className="block">
              <span className="font-extrabold text-gray-900 dark:text-white">with </span>
              <span className="bolt-gradient-text relative inline-block font-extrabold">
                AI-Powered Magic
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                  <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-500 animate-bounce" aria-hidden="true" />
                </div>
              </span>
            </span>
          </h1>

          {/* Enhanced Subtitle with Better Readability */}
          <p className="modern-body text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl sm:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-0 mb-8 sm:mb-10 animate-slide-in-right delay-200 will-change-opacity leading-relaxed">
            Generate <span className="font-bold bolt-gradient-text">professional resumes</span>, 
            <span className="font-bold text-purple-600 dark:text-purple-400"> stunning presentations</span>, 
            <span className="font-bold text-emerald-600 dark:text-emerald-400"> academic CVs</span>, and 
            <span className="font-bold text-blue-600 dark:text-blue-400"> business letters</span> in seconds with our 
            <span className="font-bold bolt-gradient-text"> advanced AI technology</span>.
          </p>

          {/* Enhanced Key Benefits Pills */}
          <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-5 px-4 sm:px-0 animate-scale-in delay-250">
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass-effect border-2 border-green-200/40 dark:border-green-500/30 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm sm:text-base font-bold text-green-700 dark:text-green-300">Save Hours</span>
            </div>
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass-effect border-2 border-blue-200/40 dark:border-blue-500/30 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-300">10K+ Users</span>
            </div>
            <div className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass-effect border-2 border-purple-200/40 dark:border-purple-500/30 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm sm:text-base font-bold text-purple-700 dark:text-purple-300">AI-Powered</span>
            </div>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4 sm:px-0 animate-fade-in-up delay-300 will-change-transform w-full max-w-2xl mx-auto">
            <Button
              asChild
              size="lg"
              className="bolt-gradient text-white font-bold px-10 sm:px-12 py-5 sm:py-6 rounded-full hover:scale-110 focus:ring-4 focus:ring-blue-400 focus:outline-none transition-all duration-300 bolt-glow w-full sm:w-auto relative overflow-hidden shadow-2xl text-base sm:text-xl group"
              style={{ animation: "gradient-shift 4s ease infinite" }}
              aria-label="Start Creating Documents"
            >
              <Link
                href="#document-types"
                className="flex items-center justify-center gap-3 sm:gap-4"
                tabIndex={0}
              >
                <Sparkles
                  className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-spin transition-transform"
                  aria-hidden="true"
                />
                <span className="font-extrabold">
                  Start Creating Now
                </span>
                <ArrowRight
                  className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-2 transition-transform duration-300"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            {/*Enhanced watch demo button*/}
              <Button
             asChild
             variant="outline"
             size="lg"
            className="px-10 sm:px-12 py-5 sm:py-6 rounded-full w-full sm:w-auto relative z-10 focus:ring-4 focus:ring-red-400 focus:outline-none shadow-xl text-base sm:text-xl font-bold transition-all duration-500 ease-in-out group
             bg-gradient-to-r from-red-600 to-black text-white border-2 border-red-500/50
             hover:from-red-700 hover:to-neutral-900
             hover:scale-110 hover:shadow-[0_15px_35px_rgba(220,38,38,0.4)] hover:z-20"
            aria-label="Watch Demo"
>
            <Link
            href="#how-it-works"
            className="flex items-center justify-center gap-3 sm:gap-4"
            tabIndex={0}
          >
    <Star
  
  className="text-yellow-400 h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-700 ease-in-out group-hover:fill-yellow-400 group-hover:rotate-[360deg]"
  aria-hidden="true"
/>
      <span className="text-white font-extrabold">Watch Demo</span>
       </Link>
      </Button>
       </div>
          {/* Social Proof Banner */}
          <div className="mt-8 sm:mt-10 animate-fade-in-up delay-350">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by professionals worldwide
            </p>
            <div className="flex items-center justify-center gap-6 opacity-60">
              <div className="text-xs font-medium">Fortune 500</div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="text-xs font-medium">Startups</div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="text-xs font-medium">Freelancers</div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="text-xs font-medium">Students</div>
            </div>
          </div>

          {/* Enhanced Professional Stats with Better Visual Hierarchy */}
          <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 px-4 sm:px-0">
            <TooltipWithShortcut content="Over 10,000 professional documents successfully created by our users worldwide">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/30 to-orange-400/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative card-coral hover-glow-coral p-8 sm:p-10 rounded-3xl hover:scale-110 transition-all duration-500 sunset-glow animate-fade-in-up delay-400 will-change-transform cursor-pointer border-2 border-amber-200/40 dark:border-amber-500/30 shadow-xl hover:shadow-2xl">
                  <div className="text-center">
                    <div className="bolt-gradient-text text-4xl sm:text-5xl lg:text-6xl font-extrabold animate-text-glow text-shadow-professional mb-3">
                      <StatCounter target={10000} suffix="+" />
                    </div>
                    <div className="text-muted-foreground text-base sm:text-lg font-bold">
                      Documents Created
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground/70 mt-2 font-medium">
                      And counting...
                    </div>
                  </div>
                </div>
              </div>
            </TooltipWithShortcut>

            <TooltipWithShortcut content="98% of our users successfully achieve their goals with DraftDeckAI-generated documents">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative card-sky hover-glow-sky p-8 sm:p-10 rounded-3xl hover:scale-110 transition-all duration-500 bolt-glow animate-fade-in-up delay-500 will-change-transform cursor-pointer border-2 border-blue-200/40 dark:border-blue-500/30 shadow-xl hover:shadow-2xl">
                  <div className="text-center">
                    <div className="bolt-gradient-text text-4xl sm:text-5xl lg:text-6xl font-extrabold animate-text-glow text-shadow-professional mb-3">
                      <StatCounter target={98} suffix="%" />
                    </div>
                    <div className="text-muted-foreground text-base sm:text-lg font-bold">
                      Success Rate
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground/70 mt-2 font-medium">
                      Proven results
                    </div>
                  </div>
                </div>
              </div>
            </TooltipWithShortcut>

            <TooltipWithShortcut content="Average 5-star rating from thousands of satisfied users across all platforms">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative card-mint hover-glow-mint p-8 sm:p-10 rounded-3xl hover:scale-110 transition-all duration-500 ocean-glow animate-fade-in-up delay-600 will-change-transform cursor-pointer border-2 border-emerald-200/40 dark:border-emerald-500/30 shadow-xl hover:shadow-2xl">
                  <div className="text-center">
                    <div className="bolt-gradient-text text-4xl sm:text-5xl lg:text-6xl font-extrabold animate-text-glow text-shadow-professional mb-3">
                      <StatCounter target={5} suffix="★" />
                    </div>
                    <div className="text-muted-foreground text-base sm:text-lg font-bold">
                      User Rating
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground/70 mt-2 font-medium">
                      Loved by users
                    </div>
                  </div>
                </div>
              </div>
            </TooltipWithShortcut>
          </div>
        </div>
      </div>
    </div>
  );
}
