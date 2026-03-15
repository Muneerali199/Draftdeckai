"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MobileSlideViewer } from "@/components/presentation/mobile-slide-viewer";
import { DiagramPreview } from "@/components/diagram/diagram-preview";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  Brain, 
  Palette,
  Play,
  ChevronRight,
  Presentation,
  Wand2,
  Image as ImageIcon,
  BarChart3,
  Download,
  Globe,
  CheckCircle2,
  Crown,
  Star,
  Zap
} from "lucide-react";

type GenerationStep = 'input' | 'outline' | 'theme' | 'preview';

export function MobilePresentationGenerator() {
  const [prompt, setPrompt] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [pageCount, setPageCount] = useState(8);
  const [currentStep, setCurrentStep] = useState<GenerationStep>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern-business");
  const [slideOutlines, setSlideOutlines] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [showSlideViewer, setShowSlideViewer] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const normalizeGeneratedSlides = (rawSlides: any[]) => {
    return (rawSlides || []).map((slide: any) => ({
      ...slide,
      imageUrl: slide.imageUrl || slide.image || null,
      chartData: slide.chartData || slide.charts || null,
      content: slide.content || slide.body_text || slide.bodyText || '',
      bullets: slide.bullets || slide.bullet_points || slide.bulletPoints || [],
    }));
  };

  const normalizeVisualType = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const visualType = value.trim().toLowerCase();
    if (['svg', 'svg_code', 'svgcode'].includes(visualType)) return 'svg_code';
    if (['mermaid', 'diagram'].includes(visualType)) return 'mermaid';
    if (['html', 'html_tailwind', 'tailwind', 'mockup'].includes(visualType)) return 'html_tailwind';
    if (['chart', 'chart_data', 'data'].includes(visualType)) return 'chart_data';
    return visualType;
  };

  const sanitizeMarkup = (markup: string): string => {
    return markup
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son[a-z]+=(["']).*?\1/gi, '')
      .replace(/javascript:/gi, '');
  };

  const renderMobileCodeVisual = (slide: any) => {
    const visualType = normalizeVisualType(slide.visual_type || slide.visualType);
    const visualContent = slide.visual_content ?? slide.visualContent;
    if (!visualType) return null;

    if (visualType === 'mermaid' && typeof visualContent === 'string') {
      return (
        <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-white p-2">
          <DiagramPreview code={visualContent} />
        </div>
      );
    }

    if (visualType === 'svg_code' && typeof visualContent === 'string') {
      const svg = sanitizeMarkup(visualContent);
      return (
        <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-white p-3">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      );
    }

    if (visualType === 'html_tailwind' && typeof visualContent === 'string') {
      const html = sanitizeMarkup(visualContent);
      return (
        <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-white p-3 text-slate-900">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      );
    }

    if (visualType === 'chart_data') {
      const chartData = slide.chartData || slide.charts || visualContent;
      if (!chartData?.data || !Array.isArray(chartData.data)) return null;
      return (
        <div className="w-full p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-md">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">
            📊 {chartData.title || 'Data Visualization'}
          </h4>
          <div className="space-y-1.5">
            {chartData.data.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: chartData.colors?.[idx] || '#3B82F6' }}
                />
                <span className="flex-1 text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const hasCodeVisual = (slide: any) => {
    const visualType = normalizeVisualType(slide.visual_type || slide.visualType);
    return ['svg_code', 'mermaid', 'html_tailwind', 'chart_data'].includes(visualType);
  };

  const MAX_FREE_PAGES = 8;

  const templates = [
    {
      id: "modern-business",
      name: "Modern Business",
      description: "Clean corporate design with blue gradients",
      preview: "bg-gradient-to-br from-blue-50 to-indigo-100",
      accentColor: "from-blue-600 to-indigo-700",
      isPremium: false,
      features: ["Professional Charts", "Corporate Colors", "Clean Typography"]
    },
    {
      id: "creative-gradient",
      name: "Creative Gradient",
      description: "Vibrant gradients with modern layouts",
      preview: "bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50",
      accentColor: "from-purple-600 via-pink-600 to-orange-600",
      isPremium: false,
      features: ["Gradient Backgrounds", "Creative Layouts", "Bold Typography"]
    },
    {
      id: "minimalist-pro",
      name: "Minimalist Pro",
      description: "Ultra-clean design with perfect spacing",
      preview: "bg-gradient-to-br from-gray-50 to-slate-100",
      accentColor: "from-gray-700 to-slate-800",
      isPremium: false,
      features: ["Minimal Design", "Perfect Spacing", "Subtle Shadows"]
    },
    {
      id: "tech-modern",
      name: "Tech Modern",
      description: "Futuristic design with neon accents",
      preview: "bg-gradient-to-br from-cyan-50 to-blue-100",
      accentColor: "from-cyan-500 to-blue-600",
      isPremium: true,
      features: ["Neon Accents", "Dark Theme", "Tech Graphics"]
    },
    {
      id: "elegant-dark",
      name: "Elegant Dark",
      description: "Sophisticated dark theme with gold accents",
      preview: "bg-gradient-to-br from-gray-800 to-gray-900",
      accentColor: "from-yellow-400 to-amber-500",
      isPremium: true,
      features: ["Dark Luxury", "Gold Accents", "Premium Feel"]
    },
    {
      id: "startup-pitch",
      name: "Startup Pitch",
      description: "Dynamic design perfect for pitch decks",
      preview: "bg-gradient-to-br from-green-50 to-emerald-100",
      accentColor: "from-green-600 to-emerald-700",
      isPremium: true,
      features: ["Pitch Optimized", "Growth Charts", "Investor Ready"]
    }
  ];

  const fetchUrlContent = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "Please enter a URL",
        description: "Enter a valid website URL to extract content from",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingUrl(true);
    try {
      const response = await fetch('/api/fetch-url-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch URL content');
      }

      const data = await response.json();
      const contentSummary = `Create a presentation based on this content from ${data.title}:\n\n${data.content}`;
      setPrompt(contentSummary);
      setInputMode('text');

      toast({
        title: "✅ Content Extracted!",
        description: `Extracted ${data.wordCount} words from "${data.title}"`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to fetch URL",
        description: error.message || "Could not extract content from the URL",
        variant: "destructive",
      });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const generateSlideOutlines = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a topic",
        description: "Describe what your presentation should be about",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create presentations.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/generate/presentation-outline', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt, pageCount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error codes
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to create presentations.",
            variant: "destructive",
          });
          return;
        }
        
        if (response.status === 402) {
          toast({
            title: "Not Enough Credits",
            description: errorData.message || "You need more credits to generate this presentation.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate outlines');
      }

      const data = await response.json();
      setSlideOutlines(data.outlines);
      // Don't set slides yet - wait for full generation after template selection
      setCurrentStep('outline');

      toast({
        title: "✅ Structure Created!",
        description: `Generated ${data.outlines.length} slide outlines`,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate slide outlines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFullPresentation = async () => {
    setIsGenerating(true);
    setCurrentStep('preview');
    
    try {
      toast({
        title: "🎨 Generating Presentation...",
        description: "Creating slides with unique images and charts",
      });

      const response = await fetch('/api/generate/presentation-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          outlines: slideOutlines, 
          template: selectedTemplate,
          prompt,
          generationMode: 'code-driven'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate presentation');
      }

      const data = await response.json();
      setSlides(normalizeGeneratedSlides(data.slides));

      toast({
        title: "🎉 Presentation Ready!",
        description: `${data.slides.length} slides generated with code visuals!`,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
      setCurrentStep('theme');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToInput = () => {
    setCurrentStep('input');
    setSlideOutlines([]);
    setSlides([]);
  };

  // Step 1: Input
  if (currentStep === 'input') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background matching your theme */}
        <div className="absolute inset-0 mesh-gradient opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6 pt-6 p-4 pb-24">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-yellow-400/30 shimmer">
              <Brain className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">AI Presentation Studio</span>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold">
              Create Your
              <span className="block bolt-gradient-text">
                Perfect Presentation
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Describe your topic or paste a URL and let AI create a professional presentation
            </p>
          </div>

          {/* Input Mode Toggle */}
          <div className="flex gap-2 p-1 glass-effect rounded-lg border border-yellow-400/20">
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bolt-gradient text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Wand2 className="h-4 w-4 inline mr-2" />
              Text Input
            </button>
            <button
              onClick={() => setInputMode('url')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                inputMode === 'url'
                  ? 'bolt-gradient text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ArrowRight className="h-4 w-4 inline mr-2" />
              From URL
            </button>
          </div>

          {/* Input Card */}
          <Card className="p-6 shadow-xl border-2 border-yellow-400/20 glass-effect">
            <div className="space-y-5">
              {inputMode === 'text' ? (
                /* Text Input Mode */
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-yellow-500" />
                    What's your presentation about?
                  </Label>
                  <Textarea
                    placeholder="E.g., Create a presentation about sustainable energy solutions for businesses, including solar power, wind energy, and cost savings..."
                    className="min-h-[140px] text-sm resize-none glass-effect border-yellow-400/30 focus:border-yellow-400/60"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              ) : (
                /* URL Input Mode */
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-500" />
                    Enter Website URL
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    className="glass-effect border-yellow-400/30 focus:border-yellow-400/60"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={isFetchingUrl}
                  />
                  <Button
                    onClick={fetchUrlContent}
                    disabled={isFetchingUrl || !websiteUrl.trim()}
                    variant="outline"
                    className="w-full glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                  >
                    {isFetchingUrl ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting Content...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Extract Content from URL
                      </>
                    )}
                  </Button>
                  {prompt && (
                    <div className="p-3 glass-effect rounded-lg border border-green-200">
                      <p className="text-xs text-green-700 font-medium mb-1">✅ Content Extracted</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{prompt.substring(0, 150)}...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Slide Count */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Presentation className="h-4 w-4 text-blue-500" />
                  Number of Slides
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="3"
                    max={MAX_FREE_PAGES}
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.min(parseInt(e.target.value) || 3, MAX_FREE_PAGES))}
                    className="w-20 text-center border-gray-200"
                    disabled={isGenerating}
                  />
                  <span className="text-xs text-gray-500">Max {MAX_FREE_PAGES} slides</span>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <ImageIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-blue-900">AI Images</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <BarChart3 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-purple-900">Smart Charts</span>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateSlideOutlines}
                disabled={isGenerating || isFetchingUrl || !prompt.trim()}
                className="w-full h-12 bolt-gradient hover:scale-105 transition-all duration-300 bolt-glow text-white font-semibold rounded-xl shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2 relative z-10">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Creating Structure...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      <span>Generate AI Structure</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </div>
                {!isGenerating && (
                  <div className="absolute inset-0 shimmer opacity-30"></div>
                )}
              </Button>
            </div>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 glass-effect border border-yellow-400/20 hover:scale-105 transition-transform">
              <div className="text-center space-y-1">
                <div className="text-2xl">⚡</div>
                <div className="text-xs font-semibold">Fast Generation</div>
                <div className="text-[10px] text-muted-foreground">In Seconds</div>
              </div>
            </Card>
            <Card className="p-4 glass-effect border border-yellow-400/20 hover:scale-105 transition-transform">
              <div className="text-center space-y-1">
                <div className="text-2xl">🎨</div>
                <div className="text-xs font-semibold">Beautiful Design</div>
                <div className="text-[10px] text-muted-foreground">Pro Quality</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Outline Preview
  if (currentStep === 'outline') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background matching theme */}
        <div className="absolute inset-0 mesh-gradient opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-white to-blue-50/50"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6 pt-6 p-4 pb-24">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-yellow-400/30 shimmer">
              <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              <span className="text-sm font-medium">Structure Ready</span>
            </div>
            <h2 className="text-2xl font-bold">
              Your Presentation
              <span className="block bolt-gradient-text">
                Structure is Ready!
              </span>
            </h2>
            <p className="text-muted-foreground text-sm">
              {slideOutlines?.length || 0} slides planned • Choose your style next
            </p>
          </div>

          {/* Outlines List */}
          <div className="space-y-3">
            {slideOutlines && slideOutlines.length > 0 && slideOutlines.map((outline, index) => (
              <Card key={index} className="p-4 shadow-xl border-2 border-yellow-400/20 glass-effect hover:scale-[1.02] transition-transform">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bolt-gradient flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1.5 line-clamp-2">
                      {outline.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {outline.content}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {outline.imageUrl && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full glass-effect border border-blue-200">
                          <ImageIcon className="h-3 w-3 text-blue-600" />
                          <span className="text-[10px] font-medium text-blue-900">Image</span>
                        </div>
                      )}
                      {outline.chartData && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full glass-effect border border-purple-200">
                          <BarChart3 className="h-3 w-3 text-purple-600" />
                          <span className="text-[10px] font-medium text-purple-900">Chart</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-yellow-400/20 shadow-lg">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                onClick={resetToInput}
                variant="outline"
                className="flex-1 h-12 glass-effect border-2 border-yellow-400/30 hover:border-yellow-400/60 font-semibold"
              >
                ← Back
              </Button>
              <Button
                onClick={() => setCurrentStep('theme')}
                className="flex-1 h-12 bolt-gradient hover:scale-105 transition-all duration-300 text-white font-semibold shadow-lg bolt-glow"
              >
                Choose Style
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Theme Selection
  if (currentStep === 'theme') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background matching theme */}
        <div className="absolute inset-0 mesh-gradient opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 pt-6 p-4 pb-32">
          {/* Header */}
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-effect border border-yellow-400/30 shimmer">
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-xs sm:text-sm font-medium">Professional Templates</span>
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold px-2">
              Choose Your
              <span className="block bolt-gradient-text">
                Professional Style
              </span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm px-4 sm:px-6">
              Select a professional template with optimized layouts and color schemes
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`cursor-pointer group relative transition-all duration-300 ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-yellow-400 ring-offset-2 rounded-lg scale-[1.02]' 
                    : ''
                }`}
              >
                {selectedTemplate === template.id && (
                  <div className="absolute -top-1.5 -right-1.5 z-10 bg-yellow-400 rounded-full p-1 shadow-lg">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                )}

                {template.isPremium && (
                  <div className="absolute -top-1.5 -left-1.5 z-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-1 shadow-lg">
                    <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                )}
                
                <Card className="overflow-hidden h-full border-2 border-yellow-400/20 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  {/* Template Preview */}
                  <div className={`h-32 sm:h-40 relative overflow-hidden transition-all ${template.preview}`}>
                    {/* Mock slide layout */}
                    <div className="absolute inset-0 p-2 sm:p-3 flex flex-col">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                        <div className={`h-4 w-16 sm:h-6 sm:w-24 rounded-lg bg-gradient-to-r opacity-90 ${template.accentColor}`} />
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      </div>
                      
                      {/* Content area */}
                      <div className="flex-1 grid grid-cols-2 gap-1.5 sm:gap-2">
                        {/* Left side - text content */}
                        <div className="space-y-1 sm:space-y-1.5">
                          <div className="h-1.5 sm:h-2 w-full bg-white/60 rounded-full" />
                          <div className="h-1.5 sm:h-2 w-4/5 bg-white/40 rounded-full" />
                          <div className="h-1.5 sm:h-2 w-3/5 bg-white/40 rounded-full" />
                          
                          {/* Bullet points */}
                          <div className="space-y-0.5 sm:space-y-1 mt-1 sm:mt-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center gap-1 sm:gap-1.5">
                                <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-r ${template.accentColor}`} />
                                <div className="h-1 sm:h-1.5 w-8 sm:w-12 bg-white/50 rounded-full" />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Right side - chart/visual */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 flex items-center justify-center">
                          <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 rounded flex items-end justify-center gap-0.5 p-1 sm:p-1.5">
                            {[60, 80, 45, 90, 70].map((height, i) => (
                              <div
                                key={i}
                                className={`w-1 sm:w-1.5 rounded-t bg-gradient-to-t ${template.accentColor}`}
                                style={{ height: `${height}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer indicators */}
                      <div className="flex justify-center gap-0.5 sm:gap-1 mt-1.5 sm:mt-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-background">
                    <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                      <h3 className={`font-bold text-sm sm:text-base leading-tight ${selectedTemplate === template.id ? "bolt-gradient-text" : ""}`}>
                        {template.name}
                      </h3>
                      {template.isPremium && (
                        <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-[10px] sm:text-xs font-medium flex-shrink-0">
                          <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden xs:inline">Pro</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mb-2">
                      {template.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature, index) => (
                        <span
                          key={index}
                          className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground whitespace-nowrap"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Template Features */}
          <div className="glass-effect p-3 sm:p-4 rounded-xl border border-yellow-400/20">
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3 bolt-gradient-text text-center">All Templates Include:</h3>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 glass-effect rounded-lg">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                <span className="truncate">AI Content</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 glass-effect rounded-lg">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">Charts</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 glass-effect rounded-lg">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                <span className="truncate">Pro Images</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 glass-effect rounded-lg">
                <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span className="truncate">Branding</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/80 backdrop-blur-lg border-t border-yellow-400/20 shadow-lg">
            <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
              <Button
                onClick={() => setCurrentStep('outline')}
                variant="outline"
                className="flex-1 h-11 sm:h-12 glass-effect border-2 border-yellow-400/30 hover:border-yellow-400/60 font-semibold text-sm sm:text-base"
              >
                ← Back
              </Button>
              <Button
                onClick={generateFullPresentation}
                disabled={isGenerating}
                className="flex-1 h-11 sm:h-12 bolt-gradient hover:scale-105 transition-all duration-300 text-white font-semibold shadow-lg bolt-glow text-sm sm:text-base disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden xs:inline">Generate </span>Slides
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Preview
  return (
    <>
      {showSlideViewer && slides.length > 0 && (
        <MobileSlideViewer 
          slides={slides} 
          onClose={() => setShowSlideViewer(false)} 
        />
      )}
      
      <div className="min-h-screen relative overflow-hidden">
        {/* Background matching theme */}
        <div className="absolute inset-0 mesh-gradient opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-green-50/50"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6 pt-6 p-4 pb-24">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border-2 border-yellow-400/40 shimmer bg-white/50 dark:bg-gray-800/50">
              <Sparkles className="h-4 w-4 text-yellow-500 dark:text-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{isGenerating ? "Generating..." : "Ready to Present"}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isGenerating ? (
                <>
                  Creating Your
                  <span className="block bolt-gradient-text">
                    Presentation ✨
                  </span>
                </>
              ) : (
                <>
                  Your Presentation
                  <span className="block bolt-gradient-text">
                    is Ready! 🎉
                  </span>
                </>
              )}
            </h2>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300 px-4">
              {isGenerating 
                ? "AI is generating unique images and charts for each slide..." 
                : `${slides?.length || 0} professional slides created`
              }
            </p>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-yellow-500 dark:text-yellow-400 animate-spin" />
                <Sparkles className="h-8 w-8 text-blue-500 dark:text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-3 px-4">
                <p className="font-bold text-xl text-gray-900 dark:text-white">Generating Your Presentation</p>
                <div className="space-y-2 text-base">
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg glass-effect border border-yellow-400/30">
                    <span className="text-2xl">✨</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Creating slide content with AI</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg glass-effect border border-yellow-400/30">
                    <span className="text-2xl">🖼️</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Finding unique images for each slide</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg glass-effect border border-yellow-400/30">
                    <span className="text-2xl">📊</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Generating data visualizations</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg glass-effect border border-yellow-400/30">
                    <span className="text-2xl">🎨</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Applying {selectedTemplate} theme</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slides Preview */}
          {!isGenerating && (
            <div className="space-y-4">
            {slides && slides.length > 0 && slides.map((slide, index) => (
              <Card key={index} className="p-0 shadow-2xl border-2 border-yellow-400/30 bg-white dark:bg-gray-900 hover:scale-[1.02] transition-all duration-300 overflow-hidden group relative">
                {/* Slide Number Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="w-10 h-10 rounded-full bolt-gradient flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white/80 dark:ring-gray-800/80">
                    {index + 1}
                  </div>
                </div>

                {/* Code Visual Section */}
                {hasCodeVisual(slide) && renderMobileCodeVisual(slide)}

                {/* Image Section (legacy fallback) */}
                {!hasCodeVisual(slide) && slide.imageUrl && (
                  <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    
                    {/* Title Overlay on Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pl-16">
                      <h3 className="font-bold text-xl text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                        {slide.title}
                      </h3>
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="p-5 space-y-3 bg-white dark:bg-gray-900">
                  {/* Title if no image */}
                  {!hasCodeVisual(slide) && !slide.imageUrl && (
                    <h3 className="font-bold text-xl leading-tight text-gray-900 dark:text-white pl-12">
                      {slide.title}
                    </h3>
                  )}
                  
                  {/* Content */}
                  <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                    {slide.content}
                  </p>
                  
                  {/* Bullets */}
                  {slide.bullets && slide.bullets.length > 0 && (
                    <ul className="space-y-2 mt-4">
                      {slide.bullets.slice(0, 3).map((bullet: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bolt-gradient flex items-center justify-center mt-0.5 shadow-md">
                            <span className="text-white text-xs font-bold">{i + 1}</span>
                          </div>
                          <span className="flex-1 leading-relaxed text-gray-800 dark:text-gray-200 font-medium">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Chart Indicator */}
                  {slide.chartData && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 mt-3">
                      <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">Includes Data Visualization</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
            </div>
          )}

          {/* Actions */}
          {!isGenerating && slides && slides.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-white/80 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/80 backdrop-blur-lg border-t-2 border-yellow-400/30 shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-3">
                {/* Primary Action */}
                <Button
                  onClick={() => setShowSlideViewer(true)}
                  className="w-full h-14 bolt-gradient hover:scale-105 transition-all duration-300 text-white font-bold text-lg shadow-xl bolt-glow relative overflow-hidden group"
                >
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <Play className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span>Start Presentation</span>
                  </div>
                  <div className="absolute inset-0 shimmer opacity-30"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 bg-white dark:bg-gray-800 border-2 border-yellow-400/40 hover:border-yellow-400/80 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-semibold text-sm text-gray-900 dark:text-white transition-all duration-300 group"
                  >
                    <Download className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Download
                  </Button>
                  <Button
                    onClick={resetToInput}
                    variant="outline"
                    className="h-11 bg-white dark:bg-gray-800 border-2 border-yellow-400/40 hover:border-yellow-400/80 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-semibold text-sm text-gray-900 dark:text-white transition-all duration-300 group"
                  >
                    <Sparkles className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Create New
                  </Button>
                </div>

                {/* Slide Count Badge */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border-2 border-yellow-400/40 shadow-lg">
                    <Presentation className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {slides.length} Professional Slides Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
