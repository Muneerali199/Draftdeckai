import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Sparkles, 
  Zap, 
  Star, 
  Users, 
  Globe, 
  Code, 
  Palette, 
  Shield,
  Heart,
  Github,
  ExternalLink,
  CheckCircle,
  Target,
  Rocket,
  Award,
  BookOpen,
  Coffee,
  Lightbulb,
  TrendingUp,
  FileText,
  Presentation,
  Mail,
  Download,
  Brain,
  Wand2,
  ArrowRight,
  Workflow
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden section-header py-16 sm:py-24 lg:py-32">
          {/* Animated background elements */}
          <div className="absolute inset-0 mesh-gradient opacity-30"></div>
          <div className="absolute inset-0 mesh-gradient-alt opacity-15"></div>
          
          {/* Animated colorful floating orbs */}
          <div className="floating-orb w-48 h-48 sm:w-72 sm:h-72 sunset-gradient opacity-20 top-10 -left-24 sm:-left-36 animate-float-gentle will-change-transform"></div>
          <div className="floating-orb w-64 h-64 sm:w-96 sm:h-96 ocean-gradient opacity-15 -top-20 -right-32 sm:-right-48 animate-glow-pulse will-change-transform"></div>
          <div className="floating-orb w-40 h-40 sm:w-64 sm:h-64 forest-gradient opacity-25 bottom-10 left-1/4 sm:left-1/3 animate-float-gentle will-change-transform" style={{animationDelay: '2s'}}></div>
          
          <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-border mb-6 sm:mb-8 animate-bounce-in will-change-transform">
                <div className="relative z-10 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500 animate-text-glow" />
                  <span className="text-sm font-medium bolt-gradient-text">About DraftDeckAI</span>
                  <Heart className="h-4 w-4 text-red-500" style={{animation: 'sparkle 2s ease-in-out infinite'}} />
                </div>
              </div>
              
              {/* Main heading */}
              <h1 className="modern-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 sm:mb-8 animate-slide-in-left will-change-transform">
                Transforming Ideas into{" "}
                <span className="bolt-gradient-text relative inline-block">
                  Professional Magic
                  <div className="absolute -top-2 -right-2">
                    <Wand2 className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 animate-bounce" />
                  </div>
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="modern-body text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-slide-in-right delay-200 will-change-opacity">
                DraftDeckAI is a <span className="font-semibold bolt-gradient-text">100% open source</span>, 
                AI-powered document creation platform that revolutionizes how professionals create 
                stunning documents. Built by the community, for the community.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mt-12 animate-scale-in delay-400 will-change-transform">
                <div className="professional-card p-4 rounded-xl text-center">
                  <div className="bolt-gradient-text text-2xl sm:text-3xl font-bold animate-text-glow">50K+</div>
                  <div className="text-sm text-muted-foreground">Documents Created</div>
                </div>
                <div className="professional-card p-4 rounded-xl text-center">
                  <div className="bolt-gradient-text text-2xl sm:text-3xl font-bold animate-text-glow">99%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="professional-card p-4 rounded-xl text-center">
                  <div className="bolt-gradient-text text-2xl sm:text-3xl font-bold animate-text-glow">50+</div>
                  <div className="text-sm text-muted-foreground">Countries</div>
                </div>
                <div className="professional-card p-4 rounded-xl text-center">
                  <div className="bolt-gradient-text text-2xl sm:text-3xl font-bold animate-text-glow">4.9★</div>
                  <div className="text-sm text-muted-foreground">User Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 sm:py-24 relative">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                  Our <span className="bolt-gradient-text">Mission</span>
                </h2>
                <p className="modern-body text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Democratize professional document creation through AI magic, making high-quality 
                  documents accessible to everyone, everywhere.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <Card className="card-coral hover-coral professional-card animate-slide-in-left delay-100 will-change-transform">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl sunset-gradient">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="professional-heading text-xl sm:text-2xl">Vision</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="professional-text text-base sm:text-lg leading-relaxed">
                      To become the world's leading community-driven AI-powered document creation platform, 
                      transforming how professionals, students, and businesses create stunning documents in seconds.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-sky hover-sky professional-card animate-slide-in-right delay-200 will-change-transform">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl ocean-gradient">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="professional-heading text-xl sm:text-2xl">Values</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 professional-text">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Open Source & Community-Driven
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Accessibility & Inclusivity
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Innovation & Excellence
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Privacy & Security
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 sm:py-24 section-header">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                  Core <span className="bolt-gradient-text">Features</span>
                </h2>
                <p className="modern-body text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Powerful AI-driven tools designed to create professional documents with magical precision.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {features.map((feature, index) => (
                  <Card key={feature.title} className={`${feature.cardClass} professional-card animate-bounce-in will-change-transform`} style={{animationDelay: `${(index + 1) * 100}ms`}}>
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-xl ${feature.gradientClass} flex items-center justify-center mb-4`}>
                        {feature.icon}
                      </div>
                      <CardTitle className="professional-heading text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="professional-text text-sm text-center">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16 sm:py-24">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                  Technology <span className="bolt-gradient-text">Stack</span>
                </h2>
                <p className="modern-body text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Built with cutting-edge technologies for optimal performance and developer experience.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="card-mint hover-mint professional-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl forest-gradient">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="professional-heading text-xl">Frontend</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {frontendTechnologies.map((tech) => (
                        <div key={tech.name} className="flex items-center justify-between">
                          <span className="professional-text text-sm">{tech.name}</span>
                          <Badge variant="secondary" className="text-xs">{tech.version}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="card-lavender hover-lavender professional-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl cosmic-gradient">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="professional-heading text-xl">AI & Backend</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {backendTechnologies.map((tech) => (
                        <div key={tech.name} className="flex items-center justify-between">
                          <span className="professional-text text-sm">{tech.name}</span>
                          <Badge variant="secondary" className="text-xs">{tech.version}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="card-coral hover-coral professional-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl sunset-gradient">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="professional-heading text-xl">Infrastructure</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {infrastructureTechnologies.map((tech) => (
                        <div key={tech.name} className="flex items-center justify-between">
                          <span className="professional-text text-sm">{tech.name}</span>
                          <Badge variant="secondary" className="text-xs">{tech.version}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Design Philosophy */}
        <section className="py-16 sm:py-24 section-header">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                  Design <span className="bolt-gradient-text">Philosophy</span>
                </h2>
                <p className="modern-body text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  "Magical Professionalism" - combining cutting-edge visual effects with professional usability.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {designPrinciples.map((principle, index) => (
                  <Card key={principle.title} className={`${principle.cardClass} professional-card`}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl ${principle.gradientClass}`}>
                          {principle.icon}
                        </div>
                        <CardTitle className="professional-heading text-lg">{principle.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="professional-text text-sm">{principle.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security & Quality */}
        <section className="py-16 sm:py-24">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                  Security & <span className="bolt-gradient-text">Quality</span>
                </h2>
                <p className="modern-body text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Enterprise-grade security and quality assurance built into every aspect of DraftDeckAI.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="card-coral hover-coral professional-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl sunset-gradient">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="professional-heading text-xl">Security First</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 professional-text text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        OWASP Security Compliance
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Supabase Authentication & Authorization
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Rate Limiting & DDoS Protection
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Data Encryption & Privacy
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Responsible Vulnerability Disclosure
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="card-sky hover-sky professional-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl ocean-gradient">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="professional-heading text-xl">Quality Assurance</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 professional-text text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Comprehensive Testing (Jest, Cypress)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Continuous Integration/Deployment
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Performance Monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        WCAG 2.1 AA Accessibility
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Code Quality Standards
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="py-16 sm:py-24 section-header">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-border mb-8">
                <div className="relative z-10 flex items-center gap-2">
                  <Github className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium bolt-gradient-text">100% Open Source</span>
                  <Heart className="h-4 w-4 text-red-500" />
                </div>
              </div>
              
              <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                Built by the <span className="bolt-gradient-text">Community</span>
              </h2>
              
              <p className="modern-body text-lg sm:text-xl text-muted-foreground mb-8">
                DraftDeckAI is proudly open source under the MIT License. We believe in the power of 
                community-driven development and welcome contributions from developers, designers, 
                and users worldwide.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-6 mb-12">
                <div className="professional-card p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="professional-heading text-lg mb-2">Community Driven</h3>
                  <p className="professional-text text-sm">Built by developers for developers</p>
                </div>
                <div className="professional-card p-6 text-center">
                  <Code className="h-8 w-8 mx-auto mb-3 text-green-500" />
                  <h3 className="professional-heading text-lg mb-2">MIT Licensed</h3>
                  <p className="professional-text text-sm">Free to use, modify, and distribute</p>
                </div>
                <div className="professional-card p-6 text-center">
                  <Globe className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                  <h3 className="professional-heading text-lg mb-2">Global Impact</h3>
                  <p className="professional-text text-sm">Used in 50+ countries worldwide</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bolt-gradient text-white font-semibold px-6 py-3 rounded-full hover:scale-105 transition-all duration-300">
                  <Link href="https://github.com/Muneerali199/DocMagic/" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    View on GitHub
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gradient-border px-6 py-3 rounded-full hover:scale-105 transition-all duration-300">
                  <Link href="https://github.com/Muneerali199/DocMagic/issues" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Start Contributing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Preview */}
        <section className="py-16 sm:py-24">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                  What's <span className="bolt-gradient-text">Next</span>
                </h2>
                <p className="modern-body text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Exciting features and improvements coming to DraftDeckAI in 2025.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {roadmapItems.map((item, index) => (
                  <Card key={item.title} className={`${item.cardClass} professional-card`}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl ${item.gradientClass}`}>
                          {item.icon}
                        </div>
                        <div>
                          <CardTitle className="professional-heading text-lg">{item.title}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">{item.timeline}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="professional-text text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Community */}
        <section className="py-16 sm:py-24 section-header">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="modern-title text-3xl sm:text-4xl lg:text-5xl mb-6">
                Join Our <span className="bolt-gradient-text">Community</span>
              </h2>
              
              <p className="modern-body text-lg sm:text-xl text-muted-foreground mb-12">
                Connect with fellow developers, designers, and users. Get help, share ideas, 
                and contribute to the future of DraftDeckAI.
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {communityLinks.map((link, index) => (
                  <Button
                    key={link.name}
                    asChild
                    variant="outline"
                    className="professional-card h-auto p-6 flex-col gap-3 hover:scale-105 transition-all duration-300"
                  >
                    <Link href={link.href} className="text-center">
                      <div className={`p-3 rounded-xl ${link.gradientClass} mb-2`}>
                        {link.icon}
                      </div>
                      <div className="professional-heading text-sm">{link.name}</div>
                      <div className="professional-text text-xs">{link.description}</div>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Data arrays
const features = [
  {
    title: "AI Resume Builder",
    description: "Create professional resumes with Gemini AI 2.0 Flash and ATS optimization",
    icon: <FileText className="h-8 w-8 text-white" />,
    cardClass: "card-coral hover-coral",
    gradientClass: "sunset-gradient"
  },
  {
    title: "Presentation Generator",
    description: "Generate complete slide decks with smart layouts and stunning visuals",
    icon: <Presentation className="h-8 w-8 text-white" />,
    cardClass: "card-sky hover-sky",
    gradientClass: "ocean-gradient"
  },
  {
    title: "Letter Composer",
    description: "Draft professional letters for any purpose with perfect tone and formatting",
    icon: <Mail className="h-8 w-8 text-white" />,
    cardClass: "card-mint hover-mint",
    gradientClass: "forest-gradient"
  },
  {
    title: "Multi-Format Export",
    description: "Download as PDF, DOCX, or PPTX with one click for easy sharing",
    icon: <Download className="h-8 w-8 text-white" />,
    cardClass: "card-lavender hover-lavender",
    gradientClass: "cosmic-gradient"
  }
];

const frontendTechnologies = [
  { name: "Next.js", version: "15.4.0" },
  { name: "React", version: "18.3.1" },
  { name: "TypeScript", version: "5.8.3" },
  { name: "Tailwind CSS", version: "3.4.17" },
  { name: "Radix UI", version: "Latest" },
  { name: "Framer Motion", version: "12.23.6" },
  { name: "DraftDeckAI", version: "0.7.0" }
];

// Backend technologies defined below

// Infrastructure technologies defined below

const roadmapItems = [
  {
    title: "AI Templates",
    description: "Smart template suggestions based on content and industry",
    timeline: "Q1 2025",
    icon: <Lightbulb className="h-6 w-6 text-white" />,
    cardClass: "card-coral hover-coral",
    gradientClass: "sunset-gradient"
  },
  {
    title: "Team Collaboration",
    description: "Real-time collaborative editing and commenting features",
    timeline: "Q2 2025",
    icon: <Users className="h-6 w-6 text-white" />,
    cardClass: "card-sky hover-sky",
    gradientClass: "ocean-gradient"
  },
  {
    title: "Mobile App",
    description: "Native iOS and Android apps for document creation on-the-go",
    timeline: "Q3 2025",
    icon: <Rocket className="h-6 w-6 text-white" />,
    cardClass: "card-mint hover-mint",
    gradientClass: "forest-gradient"
  },
  {
    title: "API Platform",
    description: "Public API for developers to integrate DraftDeckAI into their apps",
    timeline: "Q4 2025",
    icon: <Code className="h-6 w-6 text-white" />,
    cardClass: "card-lavender hover-lavender",
    gradientClass: "cosmic-gradient"
  },
  {
    title: "Analytics Dashboard",
    description: "Comprehensive analytics for document performance and usage",
    timeline: "Q1 2026",
    icon: <TrendingUp className="h-6 w-6 text-white" />,
    cardClass: "card-coral hover-coral",
    gradientClass: "sunset-gradient"
  },
  {
    title: "Enterprise Features",
    description: "Advanced security, SSO, and enterprise-grade collaboration tools",
    timeline: "Q2 2026",
    icon: <Award className="h-6 w-6 text-white" />,
    cardClass: "card-sky hover-sky",
    gradientClass: "ocean-gradient"
  }
];

const designPrinciples = [
  {
    title: "Magical Yet Professional",
    description: "Visual effects that inspire without overwhelming, maintaining trust and reliability",
    icon: <Wand2 className="h-6 w-6 text-white" />,
    cardClass: "card-coral hover-coral",
    gradientClass: "sunset-gradient"
  },
  {
    title: "User-Centric Design",
    description: "Every design decision prioritizes user experience and intuitive interactions",
    icon: <Heart className="h-6 w-6 text-white" />,
    cardClass: "card-sky hover-sky",
    gradientClass: "ocean-gradient"
  },
  {
    title: "Accessible First",
    description: "WCAG 2.1 AA compliance built into every component for inclusive design",
    icon: <Users className="h-6 w-6 text-white" />,
    cardClass: "card-mint hover-mint",
    gradientClass: "forest-gradient"
  },
  {
    title: "Mobile-First",
    description: "Responsive design that works beautifully on all devices and screen sizes",
    icon: <Globe className="h-6 w-6 text-white" />,
    cardClass: "card-lavender hover-lavender",
    gradientClass: "cosmic-gradient"
  },
  {
    title: "Performance-Focused",
    description: "Beautiful animations and effects that don't compromise on speed or usability",
    icon: <Zap className="h-6 w-6 text-white" />,
    cardClass: "card-coral hover-coral",
    gradientClass: "sunset-gradient"
  },
  {
    title: "Glass Morphism",
    description: "Modern glass-effect components with subtle transparency and blur effects",
    icon: <Palette className="h-6 w-6 text-white" />,
    cardClass: "card-sky hover-sky",
    gradientClass: "ocean-gradient"
  }
];

const frontendTech = [
  { name: "Next.js", version: "15.4.0" },
  { name: "React", version: "18.3.1" },
  { name: "TypeScript", version: "5.8.3" },
  { name: "Tailwind CSS", version: "3.4.17" },
  { name: "Framer Motion", version: "11.x" },
  { name: "Shadcn/ui", version: "Latest" }
];

const backendTechnologies = [
  { name: "Gemini AI", version: "2.0 Flash" },
  { name: "Supabase", version: "Latest" },
  { name: "Stripe", version: "Latest" },
  { name: "Next.js API", version: "15.x" },
  { name: "PostgreSQL", version: "15+" },
  { name: "Webhooks", version: "REST" }
];

const infrastructureTechnologies = [
  { name: "Netlify", version: "Hosting" },
  { name: "Vercel", version: "Alternative" },
  { name: "GitHub", version: "CI/CD" },
  { name: "Docker", version: "Containers" },
  { name: "Cloudflare", version: "CDN" },
  { name: "Monitoring", version: "24/7" }
];

const communityLinks = [
  {
    name: "GitHub",
    description: "Source code & issues",
    href: "https://github.com/Muneerali199/DocMagic",
    icon: <Github className="h-6 w-6 text-white" />,
    gradientClass: "sunset-gradient"
  },
  {
    name: "Discord",
    description: "Community chat",
    href: "https://discord.gg/3hMNhxGa",
    icon: <Users className="h-6 w-6 text-white" />,
    gradientClass: "ocean-gradient"
  },
  {
    name: "Documentation",
    description: "Guides & tutorials",
    href: "https://github.com/Muneerali199/DocMagic/blob/main/README.md",
    icon: <BookOpen className="h-6 w-6 text-white" />,
    gradientClass: "forest-gradient"
  },
  {
    name: "Support",
    description: "Get help & feedback",
    href: " INFO@DOCMAGIC.COM",
    icon: <Coffee className="h-6 w-6 text-white" />,
    gradientClass: "cosmic-gradient"
  }
];