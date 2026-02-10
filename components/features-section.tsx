import { CheckCircle, FileText, PresentationIcon as LayoutPresentationIcon, BookOpen, Users, PenTool, Download, Sparkles, Zap, Star, Wand2, Workflow, Brain, Palette, Shield } from "lucide-react";

export function FeaturesSection() {
  return (
    <div className="py-12 sm:py-20 md:py-28 lg:py-36 relative overflow-hidden section-header" id="how-it-works">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 mesh-gradient opacity-25"></div>
      <div className="floating-orb w-64 h-64 sm:w-96 sm:h-96 sunset-gradient opacity-15 top-20 -right-32"></div>
      <div className="floating-orb w-48 h-48 sm:w-72 sm:h-72 ocean-gradient opacity-20 bottom-20 -left-24"></div>
      <div className="floating-orb w-56 h-56 sm:w-80 sm:h-80 forest-gradient opacity-15 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center mb-10 sm:mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-full glass-effect mb-6 sm:mb-8 border border-blue-200/30">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span className="text-sm sm:text-base font-semibold bolt-gradient-text">Powered by Advanced AI</span>
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 animate-pulse" />
          </div>

          <h2 className="modern-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6 sm:mb-8 leading-tight px-4">
            <span className="block mb-2">How DraftDeckAI</span>
            <span className="bolt-gradient-text">Works Its Magic</span>
          </h2>

          <p className="modern-body text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Experience the future of document creation. Our AI understands context, follows best practices, and delivers professional results that exceed expectations.
          </p>
        </div>

        {/* Enhanced features grid with better organization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12">
          {features.map((feature, index) => {
            const themes = [
              { cardClass: 'card-coral hover-coral', gradientClass: 'sunset-gradient', glowClass: 'sunset-glow', borderClass: 'border-amber-200/30' },
              { cardClass: 'card-sky hover-sky', gradientClass: 'ocean-gradient', glowClass: 'ocean-glow', borderClass: 'border-blue-200/30' },
              { cardClass: 'card-mint hover-mint', gradientClass: 'forest-gradient', glowClass: 'bolt-glow', borderClass: 'border-emerald-200/30' },
              { cardClass: 'card-lavender hover-lavender', gradientClass: 'cosmic-gradient', glowClass: 'sunset-glow', borderClass: 'border-purple-200/30' },
              { cardClass: 'card-coral hover-coral', gradientClass: 'bolt-gradient', glowClass: 'ocean-glow', borderClass: 'border-indigo-200/30' },
              { cardClass: 'card-sky hover-sky', gradientClass: 'sunset-gradient', glowClass: 'bolt-glow', borderClass: 'border-pink-200/30' }
            ];
            const theme = themes[index % themes.length];
            const animationDelay = `delay-${(index + 1) * 100}`;

            return (
              <div key={feature.name} className={`group relative animate-slide-in-left ${animationDelay} will-change-transform`}>
                {/* Enhanced background glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradientClass.includes('sunset') ? 'from-amber-400/10 to-orange-400/10' : theme.gradientClass.includes('ocean') ? 'from-blue-400/10 to-cyan-400/10' : theme.gradientClass.includes('forest') ? 'from-emerald-400/10 to-teal-400/10' : 'from-purple-400/10 to-pink-400/10'} rounded-2xl sm:rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300`}></div>

                <div className={`relative professional-card mobile-card p-5 sm:p-6 md:p-7 lg:p-8 rounded-2xl sm:rounded-3xl hover:scale-[1.02] sm:hover:scale-105 transition-all duration-500 ${theme.cardClass} hover:${theme.glowClass} border ${theme.borderClass}`}>
                  {/* Enhanced icon container */}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 mb-5 sm:mb-6 ${theme.gradientClass} rounded-xl sm:rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 relative touch-target`}>
                    {feature.icon}
                    <div className={`absolute inset-0 ${theme.gradientClass} rounded-2xl opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300`}></div>
                  </div>

                  {/* Enhanced content */}
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 group-hover:bolt-gradient-text transition-all duration-300">
                    {feature.name}
                  </h3>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 sm:mb-6 group-hover:text-foreground/80 transition-colors">
                    {feature.description}
                  </p>

                  {/* Enhanced feature badge */}
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full glass-effect border border-current/20 touch-target">
                    <Star className="h-4 w-4 text-yellow-500 animate-pulse" />
                    <span className="text-sm font-medium bolt-gradient-text">
                      {feature.badge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced bottom section */}
        <div className="text-center mt-12 sm:mt-16 md:mt-20">
          <div className="inline-flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3 sm:py-4 rounded-full glass-effect border border-green-200/30 hover:scale-105 transition-transform duration-300 touch-target">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <span className="text-sm sm:text-base font-semibold text-green-700">Enterprise-grade security</span>
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    name: 'AI-Powered Generation',
    description:
      'Describe what you need in plain language, and our advanced AI will generate a complete, professional document with intelligent formatting and contextual content that matches your requirements perfectly.',
    icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />,
    badge: 'Instant Results'
  },
  {
    name: 'Professional Templates',
    description:
      'Choose from our curated collection of professionally designed templates for resumes, presentations, CVs, and letters. Each template follows industry best practices and modern design standards.',
    icon: <LayoutPresentationIcon className="h-6 w-6 sm:h-7 sm:w-7" />,
    badge: 'Industry Standard'
  },
  {
    name: 'Smart Content Engine',
    description:
      'Our AI understands context, industry requirements, and target audiences to generate compelling content that resonates with your specific goals and professional needs.',
    icon: <Brain className="h-6 w-6 sm:h-7 sm:w-7" />,
    badge: 'Context Aware'
  },
  {
    name: 'Intuitive Editor',
    description:
      'Fine-tune your documents with our powerful yet simple editor. Real-time preview, instant formatting, and intelligent suggestions make editing effortless and efficient.',
    icon: <PenTool className="h-6 w-6 sm:h-7 sm:w-7" />,
    badge: 'Real-time Preview'
  },
  {
    name: 'Team Collaboration',
    description:
      'Share documents with teammates for feedback and collaborative editing. Built-in commenting, version control, and real-time collaboration features streamline teamwork.',
    icon: <Users className="h-6 w-6 sm:h-7 sm:w-7" />,
    badge: 'Team Ready'
  },
  {
    name: 'Multi-Format Export',
    description:
      'Export your documents in multiple professional formats including PDF, PPTX, DOCX, and more. Perfect formatting preserved across all platforms and devices.',
    icon: <Download className="h-6 w-6 sm:h-7 sm:w-7" />,
    badge: 'Universal Compatibility'
  }
];