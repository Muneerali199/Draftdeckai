"use client";
import { SiteHeader } from "@/components/site-header";
import { DiagramGenerator } from "@/components/diagram/diagram-generator";
import { CreateDocumentGuard } from "@/components/ui/auth-guard";
import { Sparkles, Workflow, Zap, Star, Wand2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DiagramGeneratorSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function DiagramPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000);

      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background elements matching landing page */}
      <div className="absolute inset-0 mesh-gradient opacity-20"></div>
      <div className="floating-orb w-32 h-32 sm:w-48 sm:h-48 bolt-gradient opacity-15 top-20 -left-24"></div>
      <div className="floating-orb w-24 h-24 sm:w-36 sm:h-36 bolt-gradient opacity-20 bottom-20 -right-18"></div>
      <div className="floating-orb w-40 h-40 sm:w-56 sm:h-56 bolt-gradient opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3ccircle cx='30' cy='30' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
        }}
      />

      <SiteHeader />
      <main className="flex-1 relative z-10 flex items-center justify-center">
        <div className="container py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div onClick={handleClick} className="inline-flex items-center cursor-pointer gap-2 px-4 py-2 rounded-full glass-effect mb-4 sm:mb-6 shimmer">
              <Workflow className="h-4 w-4 text-yellow-500" />
              <span className={`text-sm font-medium ${copied ? "text-green-600" : ""}`}>{copied ? "Link Copied ✓" : "Diagram Studio"}</span>
              <Share2 className="h-4 w-4 text-blue-500" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight ">
              Create Visual{" "}
              <span className="bolt-gradient-text relative inline-block">
                Diagrams & Flowcharts
                <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2">
                  <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-500 animate-bounce" />
                </div>
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl leading-7 sm:leading-8 text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-0">
              Design{" "}
              <span className="font-semibold text-yellow-600">
                flowcharts
              </span>
              ,{" "}
              <span className="font-semibold text-blue-600">
                system architectures
              </span>
              , and{" "}
              <span className="font-semibold text-purple-600">
                process diagrams
              </span>{" "}
              with{" "}
              <span className="font-semibold bolt-gradient-text">
                Mermaid syntax and live preview
              </span>
            </p>

            {/* Stats bar */}
            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4 sm:gap-6">
              <div className="glass-effect px-4 py-2 rounded-full hover:scale-105 transition-transform duration-300">
                <span className="bolt-gradient-text font-bold text-sm">
                  Live
                </span>
                <span className="text-muted-foreground text-xs ml-1">
                  Preview
                </span>
              </div>
              <div className="glass-effect px-4 py-2 rounded-full hover:scale-105 transition-transform duration-300">
                <span className="bolt-gradient-text font-bold text-sm">
                  Export
                </span>
                <span className="text-muted-foreground text-xs ml-1">
                  SVG/PNG
                </span>
              </div>
              <div className="glass-effect px-4 py-2 rounded-full hover:scale-105 transition-transform duration-300">
                <span className="bolt-gradient-text font-bold text-sm">
                  Mermaid
                </span>
                <span className="text-muted-foreground text-xs ml-1">
                  Syntax
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Generator Container */}
          <div className="glass-effect p-6 sm:p-8 rounded-2xl border border-yellow-400/20 relative overflow-hidden">
            {/* Background shimmer effect */}
            <div className="absolute inset-0 shimmer opacity-20"></div>

            {/* Decorative elements */}
            <div className="absolute top-4 right-4">
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            </div>
            <div className="absolute bottom-4 left-4">
              <Star
                className="h-4 w-4 text-blue-500 animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>

            <div className="relative z-10">
              <CreateDocumentGuard>
                {isLoading ? (
                  <DiagramGeneratorSkeleton />
                ) : (
                  <DiagramGenerator />
                )}
              </CreateDocumentGuard>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center mt-12 sm:mt-16">
            <div className="glass-effect p-6 sm:p-8 rounded-2xl max-w-2xl mx-auto hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-30"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <span className="font-semibold bolt-gradient-text text-lg">
                    Ready to visualize your ideas?
                  </span>
                  <Star className="h-5 w-5 text-blue-500 animate-pulse" />
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Create professional diagrams that communicate complex concepts clearly
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="glass-effect px-4 py-2 rounded-full text-xs hover:scale-105 transition-transform duration-300">
                    <Workflow className="inline h-3 w-3 text-yellow-500 mr-1" />
                    <span className="bolt-gradient-text font-semibold">
                      Professional Templates
                    </span>
                  </div>
                  <div className="glass-effect px-4 py-2 rounded-full text-xs hover:scale-105 transition-transform duration-300">
                    <Zap className="inline h-3 w-3 text-blue-500 mr-1" />
                    <span className="bolt-gradient-text font-semibold">
                      Instant Export
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}