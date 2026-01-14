'use client';

import { useState, useEffect, useRef } from 'react';
import { useStreamingPresentation } from '@/hooks/useStreamingPresentation';
import { exportPremiumPresentation } from '@/lib/premium-presentation-export';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, 
  Sparkles, 
  Zap, 
  ChevronDown, 
  FileText, 
  Upload, 
  Layout, 
  ArrowLeft,
  Check,
  Palette,
  Image as ImageIcon,
  Type,
  MoreHorizontal,
  Plus,
  Trash2,
  Settings2,
  AlignLeft,
  Grid,
  Globe,
  Smile,
  Users,
  Download,
  X,
  Search,
  Presentation,
  Minus,
  Wand2,
  PenTool
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PRESENTATION_THEMES, getThemeById, PresentationTheme } from '@/lib/presentation-themes';
import { ThemePreview } from './theme-preview';
import { OutlineEditor } from './outline-editor';
import { getProIcon, ProFeatureCard, ProStatCard, ProLogo, ProIconGrid } from './pro-icons';
import { AIImageGeneratorModal } from './ai-image-generator';

// Circuit Pattern Component (inline for now)
export const CircuitPattern = ({ color = '#3B82F6' }: { color?: string }) => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs>
      <pattern id="circuit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill={color} opacity="0.3" />
        <path d="M0 10h8M12 10h8M10 0v8M10 12v8" stroke={color} strokeWidth="0.5" opacity="0.2" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#circuit)" />
  </svg>
);

export interface Slide {
  slideNumber: number;
  type: string;
  layout?: string;
  title: string;
  subtitle?: string;
  content: string;
  bullets?: string[];
  cta?: string;
  design?: {
    background: string;
    layout: string;
  };
  imageUrl?: string;
  chartData?: {
    type: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'funnel';
    data: { name: string; value: number; category?: string }[];
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
  };
  // Enhanced slide types
  stats?: { value: string; label: string; context?: string }[];
  comparison?: {
    leftTitle?: string;
    rightTitle?: string;
    left: string[];
    right: string[];
  };
  timeline?: { date: string; title: string; description?: string }[];
  mockup?: {
    type: 'phone' | 'laptop' | 'tablet' | 'browser' | 'dashboard';
    title?: string;
    elements: { type: string; content: string }[];
  };
  icons?: { icon: string; label: string }[];
  logos?: string[];
  testimonial?: {
    quote: string;
    author: string;
    role?: string;
  };
}

interface OutlineItem {
  title: string;
  type: string;
  description: string;
  content?: string;
  bullets?: string[];
}

type ViewState = 'dashboard' | 'input' | 'paste-text' | 'import-file' | 'webpage' | 'outline-review' | 'presentation';
type OutlineMode = 'card-by-card' | 'freeform';

export default function RealTimeGenerator() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [generationMode, setGenerationMode] = useState('presentation');
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const supabase = createClient();
  
  // Settings
  const [slideCount, setSlideCount] = useState(8);
  const [language, setLanguage] = useState('English');
  const [topic, setTopic] = useState('');
  
  // Outline Review State
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [outlineMode, setOutlineMode] = useState<OutlineMode>('card-by-card');
  const [rawOutlineText, setRawOutlineText] = useState('');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [pastedText, setPastedText] = useState('');
  
  // Advanced Settings
  const [textDensity, setTextDensity] = useState('concise');
  const [audience, setAudience] = useState('Business');
  const [tone, setTone] = useState('Professional');
  const [theme, setTheme] = useState('Peach');
  const [imageSource, setImageSource] = useState('ai');
  const [imageModel, setImageModel] = useState('flux-fast');
  const [artStyle, setArtStyle] = useState('photorealistic');
  const [extraKeywords, setExtraKeywords] = useState('');

  // Loading Animation State
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Analyzing your topic...",
    "Brainstorming key ideas...", 
    "Structuring the narrative...",
    "Designing slide layouts...",
    "Polishing the outline..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingOutline) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGeneratingOutline]);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // AI Image Generator Modal State
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imageGeneratorSlideIndex, setImageGeneratorSlideIndex] = useState<number | null>(null);
  
  // Theme Gallery State
  const [showThemeGallery, setShowThemeGallery] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState('peach');

  // Load presentation from history
  useEffect(() => {
    async function loadPresentation() {
      if (!editId) return;
      
      try {
        // Try documents table first (new standard for unified history)
        let { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', editId)
          .single();

        // Fallback to older presentations table for legacy items
        if (error || !data) {
          const { data: legacyData, error: legacyError } = await supabase
            .from('presentations')
            .select('*')
            .eq('id', editId)
            .single();
          
          if (legacyData) {
            data = legacyData;
          } else {
             if (error || legacyError) console.error('Load error:', error || legacyError);
          }
        }

        if (data) {
          // Structure can vary between tables
          const content = data.content || {};
          const storedSlides = data.slides || {};
          
          // Handle both 'documents' (data.content.slides) and 'presentations' (data.slides.slides or data.slides)
          const loadedSlides = Array.isArray(content.slides) 
            ? content.slides 
            : Array.isArray(storedSlides) 
              ? storedSlides 
              : (storedSlides.slides || []);
          
          const loadedThemeId = content.themeId || storedSlides.themeId || 'peach';
          
          setSlides(loadedSlides);
          setTopic(data.title);
          setSelectedThemeId(loadedThemeId);
          setPresentationId(data.id);
          // Switch to presentation view
          setView('presentation');
          
          console.log('✅ Loaded presentation:', data.title);
        }
      } catch (error) {
        console.error('Error loading presentation:', error);
      }
    }
    
    loadPresentation();
  }, [editId, supabase]);

  const [searchTheme, setSearchTheme] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'dark' | 'light' | 'colorful' | 'professional'>('all');

  const currentTheme = getThemeById(selectedThemeId);

  // Filter themes
  const filteredThemes = PRESENTATION_THEMES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTheme.toLowerCase());
    const matchesTab = activeTab === 'all' || t.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideText, setCurrentSlideText] = useState('');
  const slideContainerRef = useRef<HTMLDivElement>(null);

  const handleSlideUpdate = (index: number, updatedSlide: Slide) => {
    setSlides(prev => {
      const newSlides = [...prev];
      newSlides[index] = updatedSlide;
      return newSlides;
    });
  };

  // Handler to open AI Image Generator for a specific slide
  const handleOpenImageGenerator = (slideIndex: number) => {
    setImageGeneratorSlideIndex(slideIndex);
    setShowImageGenerator(true);
  };

  // Handler to add AI-generated image to slide
  const handleAddImageToSlide = (imageUrl: string, imageType: string) => {
    if (imageGeneratorSlideIndex !== null) {
      setSlides(prev => {
        const newSlides = [...prev];
        newSlides[imageGeneratorSlideIndex] = {
          ...newSlides[imageGeneratorSlideIndex],
          imageUrl
        };
        return newSlides;
      });
      console.log(`✅ Added ${imageType} image to slide ${imageGeneratorSlideIndex + 1}`);
    }
    setShowImageGenerator(false);
    setImageGeneratorSlideIndex(null);
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      slideNumber: slides.length + 1,
      type: 'content',
      title: 'New Slide',
      content: 'Click to edit content...',
      design: { background: 'gradient-blue-purple' }
    };
    setSlides(prev => [...prev, newSlide]);
  };

  // Save & Share state
  const [isSaving, setIsSaving] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSavePresentation = async (isAutoSave = false) => {
    if (!isAutoSave) setIsSaving(true);
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (!isAutoSave) alert('Please sign in to save and share presentations');
        setIsSaving(false);
        return;
      }

      // Save to 'documents' table for unified history
      const savePayload = {
        user_id: user.id,
        title: topic || 'Untitled Presentation',
        type: 'presentation',
        content: {
          slides: slides,
          themeId: selectedThemeId,
          version: 2,
          isPublic: true
        }
      };

      let result;
      
      if (presentationId) {
        // Update existing
        const { data, error } = await supabase
          .from('documents')
          .update(savePayload)
          .eq('id', presentationId)
          .select()
          .single();
        
        if (error) {
          // Try updating legacy presentations table if it was a legacy item
          await supabase.from('presentations').update({
            title: savePayload.title,
            slides: savePayload.content
          }).eq('id', presentationId);
        }
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('documents')
          .insert(savePayload)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        setPresentationId(data.id);
      }

      if (result && !isAutoSave) {
        const link = `${window.location.protocol}//${window.location.host}/presentation/view/${result.id}`;
        setShareUrl(link);
        setShowShareModal(true);
      }
      
      console.log(isAutoSave ? '🤖 Presentation auto-saved' : '✅ Presentation saved:', result?.id);
    } catch (error) {
      console.error('❌ Error saving presentation:', error);
      if (!isAutoSave) alert('Failed to save presentation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const { isStreaming, content, error, progress, generatePresentation } =
    useStreamingPresentation();

  // Auto-save when generation completes
  useEffect(() => {
    if (!isStreaming && slides.length > 3 && !presentationId && view === 'presentation') {
      const timer = setTimeout(() => {
        handleSavePresentation(true);
      }, 2000); // Small delay to ensure state is settled
      return () => clearTimeout(timer);
    }
  }, [isStreaming, slides.length, presentationId, view]);

  const examplePrompts = [
    "The future of AI in healthcare",
    "Q3 Marketing Strategy Review",
    "Introduction to React Native",
    "Sustainable Energy Solutions"
  ];

  const themes = [
    { name: 'Peach', color: 'bg-orange-100', border: 'border-orange-200' },
    { name: 'Serene', color: 'bg-emerald-100', border: 'border-emerald-200' },
    { name: 'Malibu', color: 'bg-blue-100', border: 'border-blue-200' },
    { name: 'Chimney', color: 'bg-stone-100', border: 'border-stone-200' },
    { name: 'Bee Happy', color: 'bg-yellow-100', border: 'border-yellow-200' },
    { name: 'Spectrum', color: 'bg-purple-100', border: 'border-purple-200' },
  ];

  // Convert structured outline to raw text for editor
  useEffect(() => {
    if (outline.length > 0 && !rawOutlineText) {
      const text = outline.map(item => {
        let cardText = `${item.title}\n${item.description || item.content || ''}`;
        if (item.bullets) {
          cardText += '\n' + item.bullets.map(b => `* ${b}`).join('\n');
        }
        return cardText;
      }).join('\n\n---\n\n');
      setRawOutlineText(text);
    }
  }, [outline, rawOutlineText]);

  // Debug view changes
  useEffect(() => {
    console.log('🎬 VIEW CHANGED TO:', view);
  }, [view]);

  // Update structured outline when raw text changes (debounced or on blur ideally, but simple here)
  const handleRawTextChange = (text: string) => {
    setRawOutlineText(text);
    // Simple parsing for card count update
    const cards = text.split('---').filter(c => c.trim().length > 0);
    setSlideCount(cards.length);
  };

  // Parse streamed content into slides
  useEffect(() => {
    if (!content) return;

    const parseSlides = (text: string) => {
      // Attempt to parse as JSON first (in case AI ignores TOON format)
      try {
        // Find potential JSON array in the text
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const jsonSlides = JSON.parse(jsonMatch[0]);
          if (Array.isArray(jsonSlides)) {
            return jsonSlides.map((s: any, i: number) => ({
              slideNumber: i + 1,
              type: s.type || 'content',
              title: s.title || `Slide ${i + 1}`,
              subtitle: s.subtitle,
              content: s.content || s.description || '',
              bullets: s.bullets || [],
              cta: s.cta,
              design: { background: s.background || 'gradient-blue-purple', layout: 'default' },
              chartData: s.chartData,
              imageUrl: s.imageUrl
            }));
          }
        }
      } catch (e) {
        // Not valid JSON, continue to TOON parsing
      }

      // TOON Parsing
      // Split by separator, handle potential variations (case insensitive, spaces)
      const slideBlocks = text.split(/---SLIDE---|--- SLIDE ---|---slide---/i).filter(block => block.trim());
      
      if (slideBlocks.length === 0) {
        // Fallback: If no separators found but text exists, treat as single slide or try to split by "Slide X"
        if (text.length > 50) {
           const implicitSlides = text.split(/Slide \d+:/i).filter(b => b.trim());
           if (implicitSlides.length > 1) {
             return implicitSlides.map((block, i) => ({
               slideNumber: i + 1,
               title: `Slide ${i + 1}`,
               content: block.trim(),
               type: 'content',
               design: { background: 'gradient-blue-purple', layout: 'default' }
             }));
           }
        }
      }

      return slideBlocks.map((block, index) => {
        const lines = block.trim().split('\n');
        const slide: any = { 
          slideNumber: index + 1,
          design: { background: 'gradient-blue-purple', layout: 'default' }
        };
        
        let currentKey = '';
        let currentList: string[] = [];
        let chartDataLines: string[] = [];
        let inChartData = false;
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;
          
          const lowerLine = trimmedLine.toLowerCase();

          if (lowerLine.startsWith('type:')) {
            slide.type = trimmedLine.substring(5).trim();
          } else if (lowerLine.startsWith('title:')) {
            slide.title = trimmedLine.substring(6).trim();
          } else if (lowerLine.startsWith('subtitle:')) {
            slide.subtitle = trimmedLine.substring(9).trim();
          } else if (lowerLine.startsWith('cta:')) {
            slide.cta = trimmedLine.substring(4).trim();
          } else if (lowerLine.startsWith('background:')) {
            slide.design.background = trimmedLine.substring(11).trim();
          } else if (lowerLine.startsWith('charttype:')) {
            const chartType = trimmedLine.substring(10).trim().toLowerCase();
            slide.chartData = { type: chartType, data: [] };
            inChartData = false;
          } else if (lowerLine.startsWith('chartdata:')) {
            inChartData = true;
            chartDataLines = [];
          } else if (inChartData && trimmedLine.includes(':')) {
            // Parse chart data line: "Q1 2024: 125"
            const [name, valueStr] = trimmedLine.split(':').map(s => s.trim());
            const value = parseFloat(valueStr);
            if (!isNaN(value) && name) {
              chartDataLines.push({ name, value });
            }
          } else if (lowerLine.startsWith('bullets:')) {
            currentKey = 'bullets';
            currentList = [];
            inChartData = false;
          } else if (trimmedLine.startsWith('* ') && currentKey === 'bullets') {
            currentList.push(trimmedLine.substring(2).trim());
            slide.bullets = currentList;
          } else if (lowerLine.startsWith('content:')) {
            slide.content = trimmedLine.substring(8).trim();
            currentKey = 'content';
            inChartData = false;
          } else if (currentKey === 'content' && !trimmedLine.includes(':') && !inChartData) {
            slide.content += ' ' + trimmedLine;
          }
        });
        
        // Add parsed chart data
        if (chartDataLines.length > 0 && slide.chartData) {
          slide.chartData.data = chartDataLines;
          slide.chartData.colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        }

        // Fallback if title is missing
        if (!slide.title) {
          const titleMatch = block.match(/Title:\s*(.*)/i);
          if (titleMatch) slide.title = titleMatch[1];
          else slide.title = `Slide ${index + 1}`;
        }
        
        return slide as Slide;
      });
    };

    try {
      const parsedSlides = parseSlides(content);
      if (parsedSlides.length > 0) {
        // Merge with existing slides to preserve images
        setSlides(prevSlides => {
          return parsedSlides.map((newSlide, index) => {
            const existingSlide = prevSlides[index];
            if (existingSlide && existingSlide.imageUrl) {
              return { ...newSlide, imageUrl: existingSlide.imageUrl };
            }
            return newSlide;
          });
        });
        
        // Update current slide text for the loading indicator
        const lastSlide = parsedSlides[parsedSlides.length - 1];
        if (lastSlide) {
          setCurrentSlideText(lastSlide.title || 'Generating...');
        }
      }
    } catch (e) {
      console.error('Error parsing slides:', e);
    }
  }, [content]);  const handleGenerateOutline = async () => {
    if (!topic.trim()) return;
    
    console.log('🎯 handleGenerateOutline called with topic:', topic);
    console.log('🎯 Requesting', slideCount, 'cards');
    
    setIsGeneratingOutline(true);
    
    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please sign in to create presentations.');
        setIsGeneratingOutline(false);
        return;
      }

      console.log('📡 Calling /api/generate/presentation-outline...');
      const response = await fetch('/api/generate/presentation-outline', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          prompt: topic, 
          pageCount: slideCount,
          outlineOnly: true 
        })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          alert('Authentication required. Please sign in to create presentations.');
          return;
        }
        
        if (response.status === 402) {
          alert(errorData.message || 'Not enough credits. Please upgrade your plan.');
          return;
        }
        
        throw new Error(errorData.error || `API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Received data:', data);
      
      if (data.outlines && Array.isArray(data.outlines)) {
        console.log('✅ Setting', data.outlines.length, 'outlines');
        setOutline(data.outlines);
        console.log('✅ Switching to outline-review view');
        setView('outline-review');
      } else {
        console.error('❌ Invalid outline format:', data);
        throw new Error('Invalid outline format received');
      }
    } catch (err) {
      console.error("❌ Failed to generate outline:", err);
      alert(`Failed to generate outline: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleFinalGenerate = async () => {
    console.log('🚀 handleFinalGenerate called');
    console.log('🚀 Topic:', topic);
    console.log('🚀 Outline length:', outline.length);
    console.log('🚀 Settings:', { textDensity, audience, tone, theme, imageSource });
    
    setSlides([]);
    setCurrentSlideText('');
    setView('presentation');
    console.log('🎬 View set to: presentation');
    
    // If in card-by-card mode, parse the raw text back into structured outline
    // If in freeform mode, parse the raw text back into structured outline
    let finalOutline = outline;
    if (outlineMode === 'freeform') {
      const cards = rawOutlineText.split('---').filter(c => c.trim().length > 0);
      if (cards.length > 0) {
        finalOutline = cards.map((cardText, index) => {
          const lines = cardText.trim().split('\n');
          const title = lines[0] || `Slide ${index + 1}`;
          const content = lines.slice(1).join('\n').trim();
          return {
            title,
            type: 'content',
            description: content,
            content: content
          };
        });
      }
    }

    const settings = {
      textDensity,
      audience,
      tone,
      language,
      theme,
      imageSource,
      imageModel,
      artStyle,
      extraKeywords
    };

    console.log('📡 Calling generatePresentation with:', {
      topic,
      audience,
      outlineLength: finalOutline.length,
      settings
    });
    
    // Start text generation stream
    generatePresentation(topic, audience, finalOutline, settings); 
    
    // Start parallel image generation if enabled
    if (imageSource === 'ai') {
      console.log('🎨 Starting AI image generation for ALL slides...');
      try {
        // Import dynamically to avoid SSR issues
        const { generateSlideImage } = await import('@/lib/flux-image-generator');
        
        // Generate images for EVERY slide in the outline
        const imagePromises = finalOutline.map(async (slide, index) => {
          try {
            console.log(`🖼️ Generating image for slide ${index + 1}: "${slide.title}"`);
            
            const imageUrl = await generateSlideImage(
              slide.type || 'content',
              slide.title,
              slide.description || slide.content || '',
              "1024x576"
            );
            
            // Update the specific slide with the new image
            setSlides(prevSlides => {
              const newSlides = [...prevSlides];
              // Find slide by index since streaming might not have created all slides yet
              // We'll store it in a temporary map if slide doesn't exist
              if (newSlides[index]) {
                newSlides[index] = { ...newSlides[index], imageUrl };
              }
              return newSlides;
            });
            
            return { index, imageUrl };
          } catch (err) {
            console.error(`Failed to generate image for slide ${index + 1}`, err);
            return { index, imageUrl: null };
          }
        });
        
        // Wait for all images (optional, or let them load progressively)
        const results = await Promise.all(imagePromises);
        
        // Final pass to ensure all images are attached to slides
        setSlides(prevSlides => {
          return prevSlides.map((slide, index) => {
            const imgResult = results.find(r => r.index === index);
            if (imgResult && imgResult.imageUrl) {
              return { ...slide, imageUrl: imgResult.imageUrl };
            }
            return slide;
          });
        });
        
      } catch (err) {
        console.error("❌ Image generation failed:", err);
      }
    }
  };

  const handleExport = async (format: 'png' | 'pdf' | 'pptx') => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const slideElements = Array.from(
        document.querySelectorAll('[data-slide-card]')
      ) as HTMLElement[];
      
      if (slideElements.length === 0) {
        alert('No slides to export');
        return;
      }

      await exportPremiumPresentation(
        slideElements,
        slides,
        topic || 'presentation',
        currentTheme,
        {
          format,
          quality: 'high',
          preserveGradients: true
        }
      );
      
      console.log(`✅ Premium exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateFromText = async () => {
    if (!pastedText.trim()) return;
    
    setIsGeneratingOutline(true);
    
    try {
      // Check if text contains --- separators for manual slide breaks
      if (pastedText.includes('---')) {
        // Manual mode: split by --- and create slides
        const sections = pastedText.split('---').filter(s => s.trim());
        const manualOutline = sections.map((section, index) => {
          const lines = section.trim().split('\n').filter(l => l.trim());
          const title = lines[0] || `Slide ${index + 1}`;
          const content = lines.slice(1).join('\n');
          
          return {
            title,
            type: 'content',
            description: content,
            content: content,
            bullets: lines.slice(1).filter(l => l.trim())
          };
        });
        
        setOutline(manualOutline);
        setSlideCount(manualOutline.length);
        setRawOutlineText(pastedText);
        setOutlineMode('freeform');
        setView('outline-review');
      } else {
        // AI mode: use pasted text as prompt to generate outline
        setTopic(pastedText.substring(0, 200)); // Set truncated version as topic
        
        // Get authentication token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          alert('Please sign in to create presentations.');
          setIsGeneratingOutline(false);
          return;
        }

        const response = await fetch('/api/generate/presentation-outline', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: pastedText,
            pageCount: Math.min(12, Math.max(1, Math.ceil(pastedText.length / 200))),
            outlineOnly: true
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 401) {
            alert('Authentication required. Please sign in to create presentations.');
            return;
          }
          
          if (response.status === 402) {
            alert(errorData.message || 'Not enough credits. Please upgrade your plan.');
            return;
          }
          
          throw new Error(errorData.error || 'Failed to generate outline');
        }
        
        const data = await response.json();
        setOutline(data.outlines || []);
        setSlideCount(data.outlines?.length || 8);
        setView('outline-review');
      }
    } catch (error) {
      console.error('Error generating from text:', error);
      alert('Failed to generate presentation. Please try again.');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const getGradientClass = (background?: string) => {
    // ALWAYS use the selected theme's gradient
    // This prevents AI from overriding with blue/purple gradients
    const themeConfig = getThemeById(selectedThemeId);
    return themeConfig.colors.gradient;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans text-foreground selection:bg-blue-500/30">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="mesh-gradient opacity-40 absolute inset-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-border z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => !isStreaming && setView('dashboard')}>
              <div className="w-10 h-10 bolt-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold professional-heading tracking-tight">DocMagic AI</h1>
              </div>
            </div>

            {isStreaming && (
              <div className="flex items-center gap-4 bg-card/80 px-4 py-2 rounded-full border border-border backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-semibold">Generating...</span>
                </div>
                <div className="w-32 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bolt-gradient h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-32 relative z-10">
        
        {/* VIEW 1: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 pt-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-blue-200/30 mb-6 hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                <span className="text-sm font-semibold bolt-gradient-text">AI-Powered Creation</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold professional-heading mb-6 tracking-tight">
                Create with <span className="bolt-gradient-text">Intelligence</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                Transform your ideas into professional presentations in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button 
                onClick={() => setView('input')}
                className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10 transition-all">
                    <div className="w-12 h-12 bolt-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Generate</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Create from a one-line prompt.</p>
                </div>
              </button>
              <button 
                onClick={() => setView('paste-text')}
                className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all">
                    <div className="w-12 h-12 cosmic-gradient rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Paste Text</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Transform notes into slides.</p>
                </div>
              </button>

              <button 
                onClick={() => setView('import-file')}
                className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-orange-500/50 shadow-lg hover:shadow-orange-500/10 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Import File</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Convert PDF or Doc to slides.</p>
                </div>
              </button>

              <button 
                onClick={() => setView('webpage')}
                className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <Layout className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Webpage</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Turn any URL into a deck.</p>
                </div>
              </button>
            </div>
          </div>
        )}



        {/* VIEW 1.6: IMPORT FILE */}
        {view === 'import-file' && (
          <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-3xl w-full animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold professional-heading mb-4 tracking-tight">
                  Import a <span className="bolt-gradient-text">File</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  Upload a PDF, Word document, or text file to generate slides.
                </p>
              </div>

              <div className="bg-card rounded-3xl shadow-2xl shadow-orange-500/5 border border-border p-12 mb-8 border-dashed border-2 flex flex-col items-center justify-center hover:border-orange-500/50 transition-colors cursor-pointer group">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Click to upload or drag and drop</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Supported formats: PDF, DOCX, TXT, MD (Max 10MB)
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setView('dashboard')}
                  className="px-6 py-3 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  disabled
                  className="px-8 py-3 rounded-xl font-bold bg-muted text-muted-foreground cursor-not-allowed"
                >
                  Generate Presentation (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1.7: WEBPAGE */}
        {view === 'webpage' && (
          <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-3xl w-full animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold professional-heading mb-4 tracking-tight">
                  Transform a <span className="bolt-gradient-text">Webpage</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  Paste a URL to turn any article or blog post into a presentation.
                </p>
              </div>

              <div className="bg-card rounded-3xl shadow-2xl shadow-indigo-500/5 border border-border p-8 mb-8">
                <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border">
                  <div className="p-3 bg-background rounded-lg shadow-sm">
                    <Globe className="w-6 h-6 text-indigo-500" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="https://example.com/article"
                    className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setView('dashboard')}
                  className="px-6 py-3 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  disabled
                  className="px-8 py-3 rounded-xl font-bold bg-muted text-muted-foreground cursor-not-allowed"
                >
                  Generate Presentation (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        )}


        {/* VIEW 2: INPUT FORM */}
        {view === 'input' && (
          <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6">
            <div className="max-w-4xl w-full animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold professional-heading mb-4 tracking-tight">
                  What would you like to <span className="bolt-gradient-text">create?</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
                  <span className="text-sm font-medium text-muted-foreground">Number of cards:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSlideCount(Math.max(1, slideCount - 1))}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={slideCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setSlideCount(Math.min(20, Math.max(1, val)));
                      }}
                      className="w-16 text-center bg-transparent font-bold text-lg text-foreground outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={() => setSlideCount(Math.min(20, slideCount + 1))}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">(1-20)</span>
                </div>
              </div>

              <div className="bg-card rounded-3xl shadow-2xl shadow-blue-500/5 border border-border p-2">
                <div className="relative">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Describe your presentation topic..."
                    className="w-full px-6 py-6 bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[120px]"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerateOutline()}
                    autoFocus
                  />
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={handleGenerateOutline}
                      disabled={!topic.trim() || isGeneratingOutline}
                      className="bolt-gradient text-white p-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                    >
                      {isGeneratingOutline ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-5 h-5 rotate-180" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {examplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(prompt)}
                    className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-muted-foreground hover:border-blue-300 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Enhanced Loading Overlay */}
              {isGeneratingOutline && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                  <div className="bg-card/90 border border-border/50 rounded-3xl p-10 shadow-2xl max-w-md w-full mx-6 backdrop-blur-xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

                    <div className="flex flex-col items-center gap-8 relative z-10">
                      <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
                        </div>
                      </div>

                      <div className="text-center space-y-3">
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 min-h-[2rem] transition-all duration-300">
                          {loadingSteps[loadingStep]}
                        </h3>
                        <p className="text-muted-foreground">
                          Creating {slideCount} expert-crafted cards for <span className="font-semibold text-foreground">"{topic.length > 30 ? topic.substring(0, 30) + '...' : topic}"</span>
                        </p>
                      </div>

                      {/* Progress Indicators */}
                      <div className="w-full space-y-2">
                        <div className="flex justify-between px-1">
                          {loadingSteps.map((_, idx) => (
                            <div 
                              key={idx}
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                idx <= loadingStep ? 'w-full bg-blue-500' : 'w-2 bg-muted'
                              } ${idx === loadingStep ? 'ring-2 ring-blue-500/30' : ''}`}
                              style={{ width: `${100 / loadingSteps.length}%`, margin: '0 2px' }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1 uppercase tracking-wider font-semibold">
                          <span>Start</span>
                          <span>Finish</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: OUTLINE REVIEW (Gamma Style) */}
        {view === 'outline-review' && (
          <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: Outline Editor */}
            <OutlineEditor 
              outline={outline}
              setOutline={setOutline}
              slideCount={slideCount}
              setSlideCount={setSlideCount}
              rawOutlineText={rawOutlineText}
              setRawOutlineText={setRawOutlineText}
              outlineMode={outlineMode}
              setOutlineMode={setOutlineMode}
            />

            {/* Right Column: Settings Panel */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6 h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
              <h3 className="text-lg font-bold professional-heading mb-4">Settings</h3>
              
              {/* Text Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Type className="w-3 h-3" />
                  Text Content
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount of text</label>
                    <select 
                      value={textDensity}
                      onChange={(e) => setTextDensity(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="minimal">Brief</option>
                      <option value="concise">Concise</option>
                      <option value="detailed">Detailed</option>
                      <option value="extensive">Extensive</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Write for...</label>
                    <select 
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="Business">Business</option>
                      <option value="High schoolers">High schoolers</option>
                      <option value="College students">College students</option>
                      <option value="Creatives">Creatives</option>
                      <option value="Tech enthusiasts">Tech enthusiasts</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tone</label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Technical">Technical</option>
                      <option value="Academic">Academic</option>
                      <option value="Inspirational">Inspirational</option>
                      <option value="Humorous">Humorous</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Output language</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-border w-full" />

                
              {/* Visual Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Palette className="w-3 h-3" />
                  Visuals
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground block">Theme</label>
                    <button 
                      onClick={() => setShowThemeGallery(true)}
                      className="text-xs text-blue-500 hover:text-blue-600 font-medium hover:underline"
                    >
                      View more
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {PRESENTATION_THEMES.slice(0, 6).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedThemeId(t.id);
                          setTheme(t.name);
                        }}
                        className={`
                          relative group overflow-hidden rounded-xl border-2 transition-all duration-200 aspect-[4/3]
                          ${selectedThemeId === t.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-border'}
                        `}
                      >
                        <div 
                          className={`absolute inset-0 w-full h-full ${t.colors.gradient} p-3 flex flex-col`} 
                          style={{ backgroundColor: t.colors.background }}
                        >
                          <div className="flex-1" style={{ fontFamily: t.font, color: t.colors.foreground }}>
                            <div className="h-1.5 w-1/3 rounded-full mb-2 opacity-20" style={{ backgroundColor: t.colors.foreground }} />
                            <div className="text-[10px] font-bold leading-tight mb-1">Title</div>
                            <div className="text-[7px] opacity-80 leading-relaxed mb-1.5 line-clamp-2">
                              Body text preview for {t.name} theme style.
                            </div>
                            <div className="text-[7px] font-medium" style={{ color: t.colors.accent }}>Link text &rarr;</div>
                          </div>
                        </div>

                        {selectedThemeId === t.id && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Image Source</label>
                    <select 
                      value={imageSource}
                      onChange={(e) => setImageSource(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="ai">AI Images</option>
                      <option value="stock">Stock Photos</option>
                      <option value="web">Web Images</option>
                    </select>
                  </div>

                  {imageSource === 'ai' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">AI Model</label>
                        <select 
                          value={imageModel}
                          onChange={(e) => setImageModel(e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                        >
                          <option value="flux-fast">Flux Fast</option>
                          <option value="flux-pro">Flux Pro</option>
                          <option value="dalle">DALL-E 3</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Art Style</label>
                        <select 
                          value={artStyle}
                          onChange={(e) => setArtStyle(e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                        >
                          <option value="photorealistic">Photorealistic</option>
                          <option value="illustration">Illustration</option>
                          <option value="abstract">Abstract</option>
                          <option value="3d">3D Render</option>
                          <option value="line-art">Line Art</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Extra Keywords</label>
                        <input 
                          value={extraKeywords}
                          onChange={(e) => setExtraKeywords(e.target.value)}
                          placeholder="e.g. playful, sunlit"
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theme Gallery Modal */}
        {showThemeGallery && (
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
            <div className="bg-card w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl border border-border flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Left Sidebar - Filters & List */}
              <div className="w-1/3 border-r border-border flex flex-col bg-muted/30">
                <div className="p-6 border-b border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Select a Theme</h2>
                    <button onClick={() => setShowThemeGallery(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search themes..." 
                      value={searchTheme}
                      onChange={(e) => setSearchTheme(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {['all', 'dark', 'light', 'colorful', 'professional'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors
                          ${activeTab === tab ? 'bg-foreground text-background' : 'bg-background border border-border hover:bg-muted'}
                        `}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    {filteredThemes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedThemeId(t.id);
                          setTheme(t.name);
                        }}
                        className={`
                          relative group overflow-hidden rounded-xl border-2 transition-all duration-200 aspect-[4/3] text-left
                          ${selectedThemeId === t.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg scale-[1.02]' : 'border-transparent hover:border-border'}
                        `}
                      >
                        <div 
                          className={`absolute inset-0 w-full h-full ${t.colors.gradient} p-4 flex flex-col`} 
                          style={{ backgroundColor: t.colors.background }}
                        >
                          <div className="flex-1" style={{ fontFamily: t.font, color: t.colors.foreground }}>
                            <div className="h-2 w-1/3 rounded-full mb-3 opacity-20" style={{ backgroundColor: t.colors.foreground }} />
                            <div className="text-xs font-bold leading-tight mb-1.5">Title</div>
                            <div className="text-[9px] opacity-80 leading-relaxed mb-2 line-clamp-2">
                              Body text preview for {t.name} theme style.
                            </div>
                            <div className="text-[9px] font-medium" style={{ color: t.colors.accent }}>Link text &rarr;</div>
                          </div>
                        </div>

                        {selectedThemeId === t.id && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Live Preview */}
              <div className="flex-1 bg-muted/10 p-8 flex flex-col">
                <div className="flex-1 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full max-w-2xl aspect-[16/9] shadow-2xl rounded-xl overflow-hidden transform transition-all duration-500">
                      <ThemePreview theme={currentTheme} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-4">
                  <button 
                    onClick={() => setShowThemeGallery(false)}
                    className="px-6 py-2.5 font-medium hover:bg-muted rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowThemeGallery(false)}
                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    Apply Theme
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* AI Image Generator Modal */}
        <AIImageGeneratorModal
          isOpen={showImageGenerator}
          onClose={() => {
            setShowImageGenerator(false);
            setImageGeneratorSlideIndex(null);
          }}
          onImageSelect={handleAddImageToSlide}
          slideTitle={imageGeneratorSlideIndex !== null && slides[imageGeneratorSlideIndex] ? slides[imageGeneratorSlideIndex].title : ''}
          slideContent={imageGeneratorSlideIndex !== null && slides[imageGeneratorSlideIndex] ? slides[imageGeneratorSlideIndex].content : ''}
          slideType={imageGeneratorSlideIndex !== null && slides[imageGeneratorSlideIndex] ? slides[imageGeneratorSlideIndex].type : 'content'}
          presentationTopic={topic}
          theme={currentTheme}
        />

        {/* Presentation Full Screen Overlay */}
        {isPresenting && (
          <div className="fixed inset-0 z-[200] bg-black text-white">
            <div className="snap-y snap-mandatory h-[100dvh] w-full overflow-y-scroll scroll-smooth">
              {slides.map((slide, idx) => (
                 <div key={idx} className="h-[100dvh] w-full snap-start snap-always flex items-center justify-center p-4">
                   <div 
                     className="aspect-video w-full max-h-[90vh] shadow-2xl mx-auto"
                     style={{ maxWidth: 'calc(90vh * 16 / 9)' }}
                   >
                     <SlideCard 
                       slide={slide} 
                       theme={currentTheme} 
                       getGradientClass={getGradientClass}
                     />
                   </div>
                 </div>
              ))}
            </div>
            
            <button 
              onClick={() => setIsPresenting(false)}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-2xl z-[9999] flex items-center gap-3 transition-transform hover:scale-105 border-2 border-white/20"
            >
              <X className="w-6 h-6" />
              <span className="text-lg">Exit Presentation</span>
            </button>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none animate-pulse">
              Scroll to navigate slides ↓
            </div>
          </div>
        )}

        {/* VIEW 4: PRESENTATION */}
        {view === 'presentation' && (
          <div className="max-w-6xl mx-auto px-6 py-8">
            {!isStreaming && (
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <button 
                  onClick={() => setView('dashboard')}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium group"
                >
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:border-foreground/20 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Create New
                </button>

                {/* Action Buttons Container */}
                {slides.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Theme Selector Button */}
                    <button
                      onClick={() => setShowThemeGallery(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-muted border border-border rounded-xl font-medium transition-all"
                    >
                      <Palette className="w-4 h-4" />
                      <span className="hidden sm:inline">Theme</span>
                    </button>

                    {/* Present Button */}
                    <button
                      onClick={() => setIsPresenting(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-muted border border-border rounded-xl font-medium transition-all"
                    >
                      <Presentation className="w-4 h-4" />
                      <span className="hidden sm:inline">Present</span>
                    </button>

                    {/* Save & Share Button */}
                    <button
                      onClick={handleSavePresentation}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          <span className="hidden sm:inline">Share</span>
                        </>
                      )}
                    </button>

                    {/* Export Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Exporting...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>

                      {/* Export Dropdown Menu */}
                      {showExportMenu && !isExporting && (
                        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                          <button
                            onClick={() => handleExport('png')}
                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <div>
                              <div className="font-semibold text-sm">PNG Images</div>
                              <div className="text-xs text-muted-foreground">High quality</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleExport('pdf')}
                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-t border-border"
                          >
                            <FileText className="w-4 h-4" />
                            <div>
                              <div className="font-semibold text-sm">PDF Document</div>
                              <div className="text-xs text-muted-foreground">Portable format</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleExport('pptx')}
                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-t border-border"
                          >
                            <Layout className="w-4 h-4" />
                            <div>
                              <div className="font-semibold text-sm">PowerPoint</div>
                              <div className="text-xs text-muted-foreground">Editable slides</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={slideContainerRef} className="space-y-6 sm:space-y-8 md:space-y-12">
              {slides.length === 0 && isStreaming && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-50 duration-500">
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-muted/50 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold professional-heading mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Generating Your Presentation
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-md text-center leading-relaxed">
                    DocMagic is crafting your slides, designing layouts, and writing professional content...
                  </p>
                </div>
              )}
              
              {slides.map((slide, index) => (
                <div key={index} className="animate-fadeIn" data-slide-card>
                  <SlideCard 
                    slide={slide} 
                    getGradientClass={getGradientClass} 
                    theme={currentTheme}
                    onUpdate={(updatedSlide) => handleSlideUpdate(index, updatedSlide)}
                    onAddImage={() => handleOpenImageGenerator(index)}
                  />
                </div>
              ))}
              
              {/* Add Slide Button */}
              {!isStreaming && slides.length > 0 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleAddSlide}
                    className="group flex items-center gap-3 px-8 py-4 bg-card hover:bg-muted border-2 border-dashed border-border hover:border-blue-500 rounded-2xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                      <Plus className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-foreground">Add New Slide</div>
                      <div className="text-sm text-muted-foreground">Click to insert a blank slide</div>
                    </div>
                  </button>
                </div>
              )}
              
              {isStreaming && currentSlideText && slides.length > 0 && (
                <div className="animate-pulse">
                  <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 aspect-video flex flex-col items-center justify-center border border-border shadow-xl">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2">Creating Slide {slides.length + 1}</h3>
                    <p className="text-muted-foreground max-w-md text-center">Analyzing content and designing layout...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="fixed bottom-8 right-8 max-w-md animate-slideIn z-50">
            <div className="bg-card border border-red-200 dark:border-red-900 rounded-2xl p-6 shadow-2xl shadow-red-500/10 flex items-start gap-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-foreground font-bold mb-1">Generation Error</h4>
                <p className="text-muted-foreground text-sm mb-3">{error}</p>
                <button onClick={() => window.location.reload()} className="text-red-600 hover:text-red-700 font-bold text-sm">Try again</button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Presentation Saved!</h2>
                      <p className="text-sm text-muted-foreground">Share with anyone via link</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowShareModal(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Share Link */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Share Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm font-mono"
                      />
                      <button
                        onClick={() => handleCopyLink(shareUrl)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                          copySuccess 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {copySuccess ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Permission Options */}
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Anyone with the link</div>
                          <div className="text-xs text-muted-foreground">Can view this presentation</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Active
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button
                      onClick={() => window.open(shareUrl, '_blank')}
                      className="px-4 py-3 bg-card hover:bg-muted border border-border rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Open Link
                    </button>
                    <button
                      onClick={() => handleCopyLink(`Check out my presentation: ${shareUrl}`)}
                      className="px-4 py-3 bg-card hover:bg-muted border border-border rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Copy Share Text
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Footer (Only in Outline Review) */}
        {view === 'outline-review' && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border p-4 z-50 animate-slideUp">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-muted-foreground">
                  <span className="text-foreground font-bold">{slideCount}</span> cards total
                </div>
                <div className="h-4 w-[1px] bg-border" />
                <div className="text-sm text-muted-foreground">
                  Est. time: <span className="text-foreground font-bold">~1min</span>
                </div>
              </div>
              
              <button 
                onClick={handleFinalGenerate}
                className="bolt-gradient text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Presentation
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-fade-in-up { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      </div>
    </div>
  );
}

// Enhanced Slide Card Component with Icons, Diagrams, Images, and Charts
export function SlideCard({ slide, getGradientClass, theme, onUpdate, onAddImage }: { 
  slide: Slide; 
  getGradientClass: (bg?: string) => string; 
  theme: PresentationTheme;
  onUpdate?: (updatedSlide: Slide) => void;
  onAddImage?: () => void;
}) {
  const isHero = slide.type === 'hero' || slide.type === 'cover' || slide.type === 'title';
  const isFlowchart = slide.type === 'process' || slide.type === 'flowchart';
  const isStats = slide.type === 'stats' || slide.type === 'big-number';
  const isComparison = slide.type === 'comparison' || slide.type === 'before-after';
  const isTimeline = slide.type === 'timeline' || slide.type === 'roadmap';
  const isMockup = slide.type === 'mockup';
  const isFeatureGrid = slide.type === 'feature-grid' || slide.type === 'icon-grid';
  const isTestimonial = slide.type === 'testimonial' || slide.type === 'quote';
  const isLogoCloud = slide.type === 'logo-cloud';
  const hasChart = slide.chartData && slide.chartData.data && slide.chartData.data.length > 0;
  const hasImage = slide.imageUrl && slide.imageUrl.length > 0;
  const hasStats = slide.stats && slide.stats.length > 0;
  const hasComparison = slide.comparison && (slide.comparison.left?.length > 0 || slide.comparison.right?.length > 0);
  const hasTimeline = slide.timeline && slide.timeline.length > 0;
  const hasMockup = slide.mockup && slide.mockup.elements?.length > 0;
  const hasIcons = slide.icons && slide.icons.length > 0;
  const hasLogos = slide.logos && slide.logos.length > 0;
  const hasTestimonial = slide.testimonial && slide.testimonial.quote;
  const isEditable = !!onUpdate;

  // Dynamic import for Recharts
  const { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } = 
    require('recharts');

  // Enhanced icon mapping for different slide types
  const getSlideIcon = (type: string) => {
    switch(type) {
      case 'hero': return '🚀';
      case 'stats': return '📊';
      case 'comparison': return '⚖️';
      case 'before-after': return '🔄';
      case 'timeline': return '📅';
      case 'roadmap': return '🗺️';
      case 'mockup': return '📱';
      case 'feature-grid': return '✨';
      case 'icon-grid': return '🎯';
      case 'testimonial': return '💬';
      case 'quote': return '💭';
      case 'logo-cloud': return '🏢';
      case 'process': return '⚡';
      case 'flowchart': return '📈';
      case 'data-viz': return '📉';
      case 'chart': return '📊';
      case 'bullets': return '✓';
      default: return '✨';
    }
  };

  // Parse icon from bullet text like "<Icon:Zap> Fast Performance"
  // Returns { IconComponent: React.FC | null, text: string, iconName: string }
  const parseIconBullet = (text: string): { IconComponent: React.FC<{className?: string; color?: string}> | null; text: string; iconName: string } => {
    const iconMatch = text.match(/<Icon:(\w+)>/);
    if (iconMatch) {
      const iconName = iconMatch[1];
      const cleanText = text.replace(/<Icon:\w+>\s*/, '');
      const IconComponent = getProIcon(iconName);
      return { IconComponent, text: cleanText, iconName };
    }
    // Check for emoji at start - convert to icon if possible
    const emojiMatch = text.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|✓|•|⚡|🛡️|👥|🌍|🎯|🚀|❤️|⭐|📈|⏰|🔒|🏆|💡|📊|💰|📱|☁️|💻|🎨)\s*/u);
    if (emojiMatch) {
      const emoji = emojiMatch[1];
      const cleanText = text.substring(emojiMatch[0].length);
      // Map common emojis to icon names
      const emojiToIcon: Record<string, string> = {
        '⚡': 'Zap', '🛡️': 'Shield', '👥': 'Users', '🌍': 'Globe', '🎯': 'Target',
        '🚀': 'Rocket', '❤️': 'Heart', '⭐': 'Star', '✓': 'Check', '📈': 'TrendUp',
        '⏰': 'Clock', '🔒': 'Lock', '🏆': 'Award', '💡': 'Lightbulb', '📊': 'BarChart',
        '💰': 'DollarSign', '📱': 'Smartphone', '☁️': 'Cloud', '💻': 'Code', '🎨': 'Palette'
      };
      const iconName = emojiToIcon[emoji] || 'Check';
      const IconComponent = getProIcon(iconName);
      return { IconComponent, text: cleanText, iconName };
    }
    return { IconComponent: null, text, iconName: '' };
  };

  // Import color contrast utility
  const { getOptimalTextColor } = require('@/lib/color-contrast');

  // Smart text color based on background using WCAG 2.0 luminance calculation
  const slideBackground = slide.design?.background || '';
  const gradientClass = getGradientClass(slideBackground);
  
  // ALWAYS use the theme's background hex color for contrast calculation
  // This ensures accurate text color on light backgrounds like Peach (#FFF5F0)
  const textColor = getOptimalTextColor(theme.colors.background) || theme.colors.foreground;

  const chartColors = slide.chartData?.colors || [theme.colors.accent, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Heuristic for font size scaling based on content density
  const getTotalContentLength = () => {
    let len = (slide.title?.length || 0) + (slide.subtitle?.length || 0) + (slide.content?.length || 0);
    if (slide.bullets) len += slide.bullets.reduce((acc, b) => acc + b.length, 0);
    return len;
  };
  
  const contentLen = getTotalContentLength();
  
  const titleSize = isHero 
    ? (contentLen > 300 ? 'text-4xl md:text-5xl' : 'text-5xl md:text-7xl')
    : (contentLen > 600 ? 'text-2xl md:text-3xl' : contentLen > 400 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl');
    
  const subtitleSize = contentLen > 600 ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl';
  
  const bodySize = contentLen > 800 ? 'text-sm' : contentLen > 500 ? 'text-base' : 'text-xl md:text-2xl';
  const bulletSize = contentLen > 800 ? 'text-sm' : contentLen > 500 ? 'text-base' : 'text-xl md:text-2xl';

  return (
    <div 
      className="group relative rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border"
      style={{ 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border
      }}
    >
      {/* Edit indicator */}
      {isEditable && (
        <div 
          data-export-hide="true"
          className="absolute top-4 left-4 z-30 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Type className="w-3 h-3" />
          Click to edit
        </div>
      )}

      {/* AI Image Generator Button */}
      {onAddImage && (
        <button
          data-export-hide="true"
          onClick={(e) => {
            e.stopPropagation();
            onAddImage();
          }}
          className="absolute top-4 left-32 z-30 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-lg"
        >
          <Wand2 className="w-3 h-3" />
          Add AI Image
        </button>
      )}
      
      <div 
        className={`${getGradientClass(slide.design?.background)} aspect-video relative overflow-hidden`}
        style={{ 
          color: textColor,
          backgroundColor: theme.colors.background
        }}
      >
        {/* Premium Decorative Background Elements with Animations */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 float-animation" 
          style={{ backgroundColor: `${theme.colors.accent}20` }}
        />
        <div 
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 float-animation" 
          style={{ backgroundColor: `${textColor}15`, animationDelay: '2s' }}
        />
        {/* Morphing accent shape */}
        <div 
          className="absolute top-1/4 left-1/4 w-32 h-32 morph-shape opacity-10"
          style={{ backgroundColor: theme.colors.accent }}
        />
        {/* Circuit pattern for tech slides */}
        {(slide.type === 'data-viz' || slide.type === 'stats' || slide.type === 'mockup') && (
          <div className="absolute inset-0 opacity-5">
            <CircuitPattern color={theme.colors.accent} />
          </div>
        )}
        
        {/* Slide Number Badge */}
        <div 
          data-export-hide="true"
          className="absolute top-8 right-8 backdrop-blur-md border px-4 py-2 rounded-full text-sm font-bold tracking-wide shadow-lg z-20"
          style={{ 
            borderColor: `${textColor}30`,
            backgroundColor: `${theme.colors.background}40`,
            color: textColor
          }}
        >
          SLIDE {slide.slideNumber}
        </div>

        <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="min-h-full w-full p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center relative z-10">
            <div className={`max-w-5xl ${isHero ? 'text-center' : 'text-left'} w-full relative z-10`}>
          {/* Icon for slide type */}
          {!isHero && (
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl backdrop-blur-md mb-6 text-4xl"
              style={{ backgroundColor: `${theme.colors.background}30` }}
            >
              {getSlideIcon(slide.type)}
            </div>
          )}

          {/* Title */}
          <h2 
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ ...slide, title: e.currentTarget.textContent || slide.title })}
            className={`font-bold mb-8 leading-tight tracking-tight drop-shadow-md ${titleSize} ${isEditable ? 'cursor-text hover:outline hover:outline-2 hover:outline-blue-500/50 rounded-lg px-2 -mx-2' : ''}`}
            style={{ color: textColor }}
          >
            {slide.title}
          </h2>

          {/* Subtitle */}
          {slide.subtitle && (
            <p 
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ ...slide, subtitle: e.currentTarget.textContent || slide.subtitle })}
              className={`${subtitleSize} mb-10 font-light leading-relaxed drop-shadow-sm opacity-90 ${isEditable ? 'cursor-text hover:outline hover:outline-2 hover:outline-blue-500/50 rounded-lg px-2 -mx-2' : ''}`}
              style={{ color: textColor }}
            >
              {slide.subtitle}
            </p>
          )}

          {/* Chart Visualization */}
          {hasChart && (
            <div className="my-10 backdrop-blur-md rounded-2xl p-6 border" style={{ borderColor: `${textColor}20`, backgroundColor: `${theme.colors.background}20` }}>
              <ResponsiveContainer width="100%" height={350}>
                {slide.chartData!.type === 'bar' && (
                  <BarChart data={slide.chartData!.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${textColor}30`} />
                    <XAxis dataKey="name" stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip 
                      contentStyle={{ 
                        background: theme.colors.card, 
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.foreground
                      }} 
                    />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Bar dataKey="value" fill={chartColors[0]} radius={[8, 8, 0, 0]} />
                  </BarChart>
                )}

                {slide.chartData!.type === 'line' && (
                  <LineChart data={slide.chartData!.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${textColor}30`} />
                    <XAxis dataKey="name" stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip 
                      contentStyle={{ 
                        background: theme.colors.card, 
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.foreground
                      }} 
                    />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Line type="monotone" dataKey="value" stroke={chartColors[0]} strokeWidth={3} />
                  </LineChart>
                )}

                {slide.chartData!.type === 'pie' && (
                  <PieChart>
                    <Pie
                      data={slide.chartData!.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {slide.chartData!.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: theme.colors.card, 
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.foreground
                      }} 
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats Grid - Premium Glassmorphism KPI Cards with Animations */}
          {slide.stats && slide.stats.length > 0 && (
            <div className={`grid gap-6 mt-10 ${slide.stats.length === 2 ? 'grid-cols-2' : slide.stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              {slide.stats.map((stat, idx) => {
                // Assign different icons based on index or stat type
                const statIcons = ['TrendUp', 'Users', 'DollarSign', 'Award', 'Target', 'Clock', 'Star', 'Rocket'];
                const iconName = statIcons[idx % statIcons.length];
                const IconComp = getProIcon(iconName);
                // Parse percentage value for animated bar
                const numericValue = parseInt(stat.value.replace(/[^0-9]/g, '')) || 0;
                const isPercentage = stat.value.includes('%');
                
                return (
                  <div 
                    key={idx}
                    className="relative glass-card rounded-2xl p-8 text-center transition-all hover:scale-105 hover:shadow-2xl group overflow-hidden hover-lift scale-bounce"
                    style={{ 
                      animationDelay: `${idx * 0.1}s`,
                      borderColor: `${theme.colors.accent}30`,
                      backgroundColor: `${theme.colors.background}30`
                    }}
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 shine-effect opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
                    <div className="relative z-10">
                      {/* Icon with pulse glow */}
                      {IconComp && (
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:pulse-glow transition-all"
                          style={{ 
                            backgroundColor: `${theme.colors.accent}25`,
                            border: `2px solid ${theme.colors.accent}40`,
                            color: theme.colors.accent
                          }}
                        >
                          <IconComp className="w-8 h-8" color={theme.colors.accent} />
                        </div>
                      )}
                      <div 
                        className="text-5xl md:text-6xl font-black mb-3 tracking-tight gradient-text-animated"
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.foreground})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-lg font-semibold opacity-90" style={{ color: textColor }}>{stat.label}</div>
                      {/* Animated progress bar for percentages */}
                      {isPercentage && numericValue <= 100 && (
                        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${textColor}20` }}>
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${numericValue}%`,
                              backgroundColor: theme.colors.accent,
                              boxShadow: `0 0 10px ${theme.colors.accent}`
                            }}
                          />
                        </div>
                      )}
                      {stat.context && (
                        <div className="text-sm mt-3 opacity-60" style={{ color: textColor }}>{stat.context}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comparison View - Side by Side */}
          {slide.comparison && (
            <div className="grid grid-cols-2 gap-8 mt-10">
              <div 
                className="backdrop-blur-md rounded-2xl p-8 border"
                style={{ 
                  borderColor: `${textColor}20`,
                  backgroundColor: `${theme.colors.background}30`
                }}
              >
                <h4 
                  className="text-2xl font-bold mb-6 pb-4 border-b"
                  style={{ color: textColor, borderColor: `${textColor}20` }}
                >
                  {slide.comparison.leftTitle || 'Before'}
                </h4>
                <ul className="space-y-4">
                  {slide.comparison.left.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-lg" style={{ color: textColor }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div 
                className="backdrop-blur-md rounded-2xl p-8 border"
                style={{ 
                  borderColor: `${theme.colors.accent}40`,
                  backgroundColor: `${theme.colors.accent}10`
                }}
              >
                <h4 
                  className="text-2xl font-bold mb-6 pb-4 border-b"
                  style={{ color: textColor, borderColor: `${textColor}20` }}
                >
                  {slide.comparison.rightTitle || 'After'}
                </h4>
                <ul className="space-y-4">
                  {slide.comparison.right.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-lg" style={{ color: textColor }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Timeline View - Premium Animated Version */}
          {slide.timeline && slide.timeline.length > 0 && (
            <div className="mt-10 relative">
              {/* Animated flowing line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 rounded-full overflow-hidden" style={{ backgroundColor: `${theme.colors.accent}20` }}>
                <div 
                  className="w-full h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(180deg, ${theme.colors.accent}, transparent, ${theme.colors.accent})`,
                    backgroundSize: '100% 200%',
                    animation: 'gradient-shift 3s ease infinite'
                  }}
                />
              </div>
              <div className="space-y-8">
                {slide.timeline.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-6 items-start relative scale-bounce"
                    style={{ animationDelay: `${idx * 0.15}s` }}
                  >
                    {/* Pulsing node */}
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg shrink-0 relative"
                      style={{ backgroundColor: theme.colors.accent, color: '#fff' }}
                    >
                      <div 
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                      <span className="relative z-10">{item.date}</span>
                    </div>
                    <div 
                      className="flex-1 glass-card rounded-2xl p-6 hover-lift shimmer-border"
                      style={{ 
                        borderColor: `${theme.colors.accent}30`,
                        backgroundColor: `${theme.colors.background}30`
                      }}
                    >
                      <h5 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: textColor }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                        {item.title}
                      </h5>
                      {item.description && (
                        <p className="text-base opacity-80" style={{ color: textColor }}>{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Device Mockup - Phone/Laptop/Browser */}
          {slide.mockup && (
            <div className="mt-10 flex justify-center">
              {slide.mockup.type === 'phone' && (
                <div className="relative w-72 h-[580px] rounded-[3rem] border-8 border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-800 rounded-full" />
                  <div 
                    className="absolute top-12 left-2 right-2 bottom-2 rounded-[2rem] overflow-hidden"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <div className="p-4 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                        <span className="font-bold text-sm" style={{ color: textColor }}>{slide.mockup.title || 'App'}</span>
                      </div>
                      <div className="space-y-3 flex-1">
                        {slide.mockup.elements.map((el, idx) => (
                          <div key={idx}>
                            {el.type === 'header' && (
                              <div className="text-lg font-bold" style={{ color: textColor }}>{el.content}</div>
                            )}
                            {el.type === 'card' && (
                              <div className="p-3 rounded-xl border" style={{ borderColor: `${textColor}20`, backgroundColor: `${textColor}05` }}>
                                <span className="text-sm" style={{ color: textColor }}>{el.content}</span>
                              </div>
                            )}
                            {el.type === 'button' && (
                              <div className="px-4 py-2 rounded-lg text-center text-sm font-semibold text-white" style={{ backgroundColor: theme.colors.accent }}>
                                {el.content}
                              </div>
                            )}
                            {el.type === 'input' && (
                              <div className="px-3 py-2 rounded-lg border text-sm opacity-60" style={{ borderColor: `${textColor}30`, color: textColor }}>
                                {el.content}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {slide.mockup.type === 'laptop' && (
                <div className="relative">
                  <div className="w-[600px] h-[380px] rounded-t-xl border-8 border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
                    <div 
                      className="h-full"
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      <div className="h-8 border-b flex items-center gap-2 px-4" style={{ borderColor: `${textColor}20` }}>
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1 mx-4 h-5 rounded-full" style={{ backgroundColor: `${textColor}10` }} />
                      </div>
                      <div className="p-6">
                        <div className="text-xl font-bold mb-4" style={{ color: textColor }}>{slide.mockup.title}</div>
                        <div className="grid grid-cols-3 gap-4">
                          {slide.mockup.elements.map((el, idx) => (
                            <div key={idx} className="p-4 rounded-xl border" style={{ borderColor: `${textColor}20` }}>
                              <span className="text-sm" style={{ color: textColor }}>{el.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-[700px] h-4 bg-gray-800 rounded-b-lg mx-auto" />
                  <div className="w-[200px] h-2 bg-gray-700 rounded-b-lg mx-auto" />
                </div>
              )}
              {slide.mockup.type === 'browser' && (
                <div className="w-full max-w-4xl rounded-xl border-2 overflow-hidden shadow-2xl" style={{ borderColor: `${textColor}30` }}>
                  <div className="h-10 border-b flex items-center gap-2 px-4" style={{ borderColor: `${textColor}20`, backgroundColor: `${textColor}05` }}>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 mx-4 h-6 rounded-full px-3 flex items-center text-sm" style={{ backgroundColor: `${textColor}10`, color: `${textColor}60` }}>
                      {slide.mockup.title || 'https://example.com'}
                    </div>
                  </div>
                  <div className="p-8" style={{ backgroundColor: theme.colors.background }}>
                    <div className="space-y-4">
                      {slide.mockup.elements.map((el, idx) => (
                        <div key={idx}>
                          {el.type === 'hero' && (
                            <div className="text-center py-8">
                              <h3 className="text-3xl font-bold mb-4" style={{ color: textColor }}>{el.content}</h3>
                            </div>
                          )}
                          {el.type === 'nav' && (
                            <div className="flex gap-6 justify-center text-sm" style={{ color: `${textColor}80` }}>
                              {el.content.split(',').map((item, i) => (
                                <span key={i} className="hover:opacity-100">{item.trim()}</span>
                              ))}
                            </div>
                          )}
                          {el.type === 'feature' && (
                            <div className="grid grid-cols-3 gap-4 py-4">
                              {el.content.split(',').map((feature, i) => (
                                <div key={i} className="p-4 rounded-xl text-center border" style={{ borderColor: `${textColor}20` }}>
                                  <span className="text-sm" style={{ color: textColor }}>{feature.trim()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {slide.mockup.type === 'dashboard' && (
                <div className="w-full max-w-4xl rounded-xl border-2 overflow-hidden shadow-2xl" style={{ borderColor: `${textColor}30` }}>
                  <div className="flex">
                    <div className="w-48 border-r p-4 space-y-3" style={{ borderColor: `${textColor}20`, backgroundColor: `${textColor}05` }}>
                      <div className="font-bold text-lg mb-4" style={{ color: textColor }}>Dashboard</div>
                      {['Overview', 'Analytics', 'Reports', 'Settings'].map((item, idx) => (
                        <div 
                          key={idx}
                          className={`px-3 py-2 rounded-lg text-sm ${idx === 0 ? 'font-medium' : 'opacity-60'}`}
                          style={{ 
                            backgroundColor: idx === 0 ? `${theme.colors.accent}20` : 'transparent',
                            color: textColor
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 p-6" style={{ backgroundColor: theme.colors.background }}>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {slide.mockup.elements.slice(0, 3).map((el, idx) => (
                          <div key={idx} className="p-4 rounded-xl border" style={{ borderColor: `${textColor}20` }}>
                            <div className="text-2xl font-bold" style={{ color: theme.colors.accent }}>{el.content}</div>
                            <div className="text-sm opacity-60" style={{ color: textColor }}>{el.type}</div>
                          </div>
                        ))}
                      </div>
                      <div className="h-40 rounded-xl border flex items-center justify-center" style={{ borderColor: `${textColor}20` }}>
                        <span className="text-sm opacity-40" style={{ color: textColor }}>📊 Chart Area</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Icons Grid with Professional SVG Icons */}
          {slide.icons && slide.icons.length > 0 && (
            <div className={`grid gap-6 mt-10 ${slide.icons.length <= 3 ? 'grid-cols-3' : slide.icons.length === 4 ? 'grid-cols-4' : 'grid-cols-3 md:grid-cols-6'}`}>
              {slide.icons.map((item, idx) => {
                // Try to get SVG icon from the icon name or emoji
                const iconName = typeof item.icon === 'string' ? item.icon.replace(/[^\w]/g, '') : '';
                const IconComp = getProIcon(iconName) || getProIcon('Star');
                
                return (
                  <div 
                    key={idx}
                    className="flex flex-col items-center gap-4 p-6 rounded-2xl border backdrop-blur-md transition-all hover:scale-105 group"
                    style={{ 
                      borderColor: `${textColor}20`,
                      backgroundColor: `${theme.colors.background}30`
                    }}
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: `${theme.colors.accent}20`,
                        border: `2px solid ${theme.colors.accent}40`
                      }}
                    >
                      {IconComp ? (
                        <IconComp className="w-8 h-8" color={theme.colors.accent} />
                      ) : (
                        <span className="text-4xl">{item.icon}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-center" style={{ color: textColor }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Testimonial */}
          {slide.testimonial && (
            <div className="mt-10 max-w-3xl mx-auto">
              <div 
                className="relative backdrop-blur-md rounded-3xl p-10 border"
                style={{ 
                  borderColor: `${textColor}20`,
                  backgroundColor: `${theme.colors.background}30`
                }}
              >
                <span className="absolute -top-6 -left-2 text-8xl opacity-20" style={{ color: theme.colors.accent }}>"</span>
                <p className="text-2xl md:text-3xl font-medium italic leading-relaxed mb-8 relative z-10" style={{ color: textColor }}>
                  {slide.testimonial.quote}
                </p>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: theme.colors.accent, color: '#fff' }}
                  >
                    {slide.testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: textColor }}>{slide.testimonial.author}</div>
                    {slide.testimonial.role && (
                      <div className="text-sm opacity-70" style={{ color: textColor }}>{slide.testimonial.role}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart AI Image Layout - Positions image based on slide type and content */}
          {hasImage && (
            (() => {
              // Determine the best layout based on slide type and content
              const hasBullets = slide.bullets && slide.bullets.length > 0;
              const hasContent = slide.content && slide.content.length > 50;
              const isImageFocused = slide.type === 'image' || slide.type === 'visual' || slide.type === 'photo';
              const isContentHeavy = hasBullets || hasStats || hasComparison || hasTimeline || hasMockup || hasChart;
              
              // Layout types: 'full', 'split-left', 'split-right', 'top', 'bottom', 'background-accent'
              let layout = 'full';
              if (isHero) layout = 'background-accent';
              else if (isImageFocused) layout = 'full';
              else if (isContentHeavy) layout = 'split-right';
              else if (hasContent && !hasBullets) layout = 'split-left';
              else layout = 'top';

              // Full width prominent image
              if (layout === 'full') {
                return (
                  <div className="mt-8 mb-8 flex justify-center w-full">
                    <div 
                      className="relative rounded-3xl overflow-hidden shadow-2xl border-2 group/image transition-all hover:scale-[1.01] w-full max-w-4xl"
                      style={{ borderColor: `${theme.colors.accent}30` }}
                    >
                      <div 
                        className="absolute -inset-2 rounded-3xl blur-2xl opacity-20 group-hover/image:opacity-40 transition-opacity"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                      <img 
                        src={slide.imageUrl} 
                        alt={slide.title}
                        className="relative z-10 w-full h-auto object-cover rounded-3xl"
                        style={{ maxHeight: '450px', minHeight: '250px' }}
                      />
                      <div 
                        className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1.5"
                        style={{ 
                          backgroundColor: `${theme.colors.background}90`,
                          color: textColor,
                          border: `1px solid ${theme.colors.accent}40`
                        }}
                      >
                        <Wand2 className="w-3 h-3" style={{ color: theme.colors.accent }} />
                        AI Generated
                      </div>
                    </div>
                  </div>
                );
              }

              // Hero/Cover - Accent background with image overlay
              if (layout === 'background-accent') {
                return (
                  <div className="absolute inset-0 z-0">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${slide.imageUrl})`,
                        opacity: 0.15
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.colors.background}ee 0%, ${theme.colors.background}aa 50%, ${theme.colors.accent}30 100%)`
                      }}
                    />
                  </div>
                );
              }

              // Split layout - Image on right, content on left
              if (layout === 'split-right') {
                return null; // Will be rendered in the split layout section below
              }

              // Split layout - Image on left
              if (layout === 'split-left') {
                return null; // Will be rendered in the split layout section below
              }

              // Top position (default)
              return (
                <div className="mt-6 mb-8 flex justify-center">
                  <div 
                    className="relative rounded-2xl overflow-hidden shadow-xl border group/image transition-all hover:scale-[1.02] max-w-2xl"
                    style={{ borderColor: `${theme.colors.accent}25` }}
                  >
                    <div 
                      className="absolute -inset-1 rounded-2xl blur-xl opacity-20 group-hover/image:opacity-35 transition-opacity"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title}
                      className="relative z-10 w-full h-auto object-cover rounded-2xl"
                      style={{ maxHeight: '350px', minHeight: '180px' }}
                    />
                    <div 
                      className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-1"
                      style={{ 
                        backgroundColor: `${theme.colors.background}85`,
                        color: textColor,
                        border: `1px solid ${theme.colors.accent}30`
                      }}
                    >
                      <Wand2 className="w-2.5 h-2.5" style={{ color: theme.colors.accent }} />
                      AI
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* Content */}
          {slide.content && !slide.bullets && !isFlowchart && !hasChart && !slide.stats && !slide.comparison && !slide.timeline && !slide.mockup && !slide.icons && !slide.testimonial && (
            <p 
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ ...slide, content: e.currentTarget.textContent || slide.content })}
              className={`${bodySize} leading-relaxed font-medium max-w-3xl mx-auto drop-shadow-sm opacity-90 ${isEditable ? 'cursor-text hover:outline hover:outline-2 hover:outline-blue-500/50 rounded-lg px-2 -mx-2' : ''}`}
              style={{ color: textColor }}
            >
              {slide.content}
            </p>
          )}

          {/* Bullets with Image - Smart Split Layout */}
          {slide.bullets && slide.bullets.length > 0 && !isFlowchart && hasImage && !isHero && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
              {/* Bullets Column */}
              <div className="space-y-4 order-2 lg:order-1">
                {slide.bullets.map((bullet, idx) => {
                  const parsed = parseIconBullet(bullet);
                  const IconComp = parsed.IconComponent;
                  
                  return (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 glass-card rounded-xl p-4 transition-all group/item hover:scale-[1.02] hover-lift"
                      style={{ 
                        animationDelay: `${idx * 0.1}s`,
                        borderColor: `${theme.colors.accent}20`,
                        backgroundColor: `${theme.colors.background}20`,
                        color: textColor
                      }}
                    >
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-all shadow-md"
                        style={{ 
                          backgroundColor: `${theme.colors.accent}20`,
                          border: `1.5px solid ${theme.colors.accent}40`,
                          color: theme.colors.accent
                        }}
                      >
                        {IconComp ? (
                          <IconComp className="w-5 h-5" color={theme.colors.accent} />
                        ) : (
                          <span className="text-sm font-bold" style={{ color: theme.colors.accent }}>{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <span className={`${bulletSize} leading-relaxed font-medium`}>{parsed.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Image Column */}
              <div className="order-1 lg:order-2">
                <div 
                  className="relative rounded-2xl overflow-hidden shadow-xl border group/image transition-all hover:scale-[1.01] sticky top-8"
                  style={{ borderColor: `${theme.colors.accent}25` }}
                >
                  <div 
                    className="absolute -inset-1 rounded-2xl blur-xl opacity-20 group-hover/image:opacity-35 transition-opacity"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title}
                    className="relative z-10 w-full h-auto object-cover rounded-2xl"
                    style={{ maxHeight: '400px', minHeight: '200px' }}
                  />
                  <div 
                    className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${theme.colors.background}85`,
                      color: textColor,
                      border: `1px solid ${theme.colors.accent}30`
                    }}
                  >
                    <Wand2 className="w-2.5 h-2.5" style={{ color: theme.colors.accent }} />
                    AI
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bullets WITHOUT Image - Original Layout */}
          {slide.bullets && slide.bullets.length > 0 && !isFlowchart && (!hasImage || isHero) && (
            <div className="grid gap-4 mt-10">
              {slide.bullets.map((bullet, idx) => {
                const parsed = parseIconBullet(bullet);
                const IconComp = parsed.IconComponent;
                
                return (
                  <div 
                    key={idx} 
                    className="flex items-start gap-4 glass-card rounded-2xl p-6 transition-all group/item hover:scale-[1.02] hover-lift scale-bounce"
                    style={{ 
                      animationDelay: `${idx * 0.1}s`,
                      borderColor: `${theme.colors.accent}25`,
                      backgroundColor: `${theme.colors.background}25`,
                      color: textColor
                    }}
                  >
                    {/* Icon with glow effect */}
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center group-hover/item:scale-110 group-hover/item:pulse-glow transition-all shadow-lg relative overflow-hidden"
                      style={{ 
                        backgroundColor: `${theme.colors.accent}25`,
                        border: `2px solid ${theme.colors.accent}50`,
                        color: theme.colors.accent
                      }}
                    >
                      {/* Inner glow */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        style={{ 
                          background: `radial-gradient(circle, ${theme.colors.accent}40 0%, transparent 70%)`
                        }}
                      />
                      {IconComp ? (
                        <IconComp className="w-7 h-7 relative z-10" color={theme.colors.accent} />
                      ) : (
                        <span className="text-xl font-bold relative z-10" style={{ color: theme.colors.accent }}>{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <span className={`${bulletSize} font-medium leading-relaxed opacity-95`} style={{ color: textColor }}>
                        {parsed.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Flowchart/Process View */}
          {isFlowchart && slide.bullets && slide.bullets.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-10 flex-wrap">
              {slide.bullets.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4" style={{ color: textColor }}>
                  <div 
                    className="relative px-6 py-4 rounded-xl backdrop-blur-sm border transition-all hover:scale-105"
                    style={{ 
                      borderColor: `${textColor}30`,
                      backgroundColor: `${theme.colors.background}30`,
                      color: textColor
                    }}
                  >
                    <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: theme.colors.accent, color: '#fff' }}>
                      {idx + 1}
                    </span>
                    <span className="text-lg font-medium">{step}</span>
                  </div>
                  {idx < (slide.bullets?.length || 0) - 1 && (
                    <ArrowLeft className="w-6 h-6 rotate-180 opacity-50" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {slide.cta && (
            <button 
              className="mt-12 px-10 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3 mx-auto"
              style={{ 
                backgroundColor: textColor,
                color: theme.colors.background
              }}
            >
              {slide.cta} <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
