"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Presentation,
  Network,
  Globe,
  Megaphone,
  Calendar,
  Download,
  Eye,
  Trash2,
  Loader2,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Mail,
  Edit,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { getThemeById } from "@/lib/presentation-themes";
import { SlideCard, Slide } from "@/components/presentation/real-time-generator";
import { ResumePreview } from "@/components/resume/resume-preview";

type ContentType = "resume" | "presentation" | "diagram" | "letter";

interface HistoryItem {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  preview_url?: string;
  data?: any;
}

const contentTypeConfig = {
  resume: {
    icon: FileText,
    label: "Resumes",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    route: "/resume-editor",
    gradient: "from-blue-500 to-cyan-500",
  },
  presentation: {
    icon: Presentation,
    label: "Presentations",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    route: "/presentation",
    gradient: "from-purple-500 to-pink-500",
  },
  diagram: {
    icon: Network,
    label: "Diagrams",
    color: "text-green-500",
    bgColor: "bg-green-50",
    route: "/diagram",
    gradient: "from-green-500 to-emerald-500",
  },
  letter: {
    icon: Mail,
    label: "Letters",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    route: "/letter",
    gradient: "from-orange-500 to-amber-500",
  },
};

// Helper function to get document description
function getPresentationSlides(raw: any): any[] {
  const content = raw?.content || raw || {};
  const directSlides = content.slides ?? raw?.slides;
  if (Array.isArray(directSlides)) return directSlides;
  if (Array.isArray(directSlides?.slides)) return directSlides.slides;
  if (Array.isArray(content?.outlines)) return content.outlines;
  return [];
}

function getPresentationThemeId(raw: any): string {
  const content = raw?.content || raw || {};
  return content.themeId || content.template || raw?.themeId || raw?.template || 'peach';
}

function getDocumentDescription(doc: any): string {
  const content = doc.content || {};
  switch (doc.type) {
    case 'resume':
      return content.resumeData?.name || content.name || 'Resume';
    case 'presentation':
      const slides = getPresentationSlides(doc);
      return `${slides.length || 0} slides`;
    case 'diagram':
      return content.type || 'Diagram';
    case 'letter':
      return content.letter_type || content.type || 'Letter';
    default:
      return doc.type || 'Document';
  }
}

const ResumePreviewMini = ({ data, title }: { data: any, title: string }) => {
  const [scale, setScale] = useState(0.2);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          // A4 base width is approx 794px for standard display
          setScale(width / 794);
        }
      }
    };

    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Unwrap resume data
  let resumeData = data;
  if (data?.resumeData) resumeData = data.resumeData;
  const template = data?.template || data?.templateId || 'modern';

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative cursor-pointer overflow-hidden bg-white"
    >
      <div 
        className="absolute top-0 left-0 origin-top-left" 
        style={{ 
          width: '794px', // A4 width at 96 DPI
          height: '1123px', // A4 height
          transform: `scale(${scale})`,
        }}
      >
        <ResumePreview
          resume={resumeData}
          template={template}
          showControls={false}
          layoutMode="fixed"
        />
      </div>
    </div>
  );
};

const PresentationPreview = ({ slides, title, themeId }: { slides: Slide[], title: string, themeId?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [scale, setScale] = useState(0.2);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = getThemeById(themeId || 'peach');

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          setScale(width / 1200);
        }
      }
    };

    updateScale();
    
    const observer = new ResizeObserver(() => {
      updateScale();
    });
    
    observer.observe(containerRef.current);
    
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    if (!isHovered || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  if (!slides || slides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
        <Presentation className="h-8 w-8" style={{ color: theme.colors.accent }} />
      </div>
    );
  }

  const slide = slides[currentIndex] || slides[0];

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative group/slideshow cursor-pointer flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: theme.colors.background }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentIndex(0);
      }}
    >
      <div 
        className="absolute top-0 left-0 origin-top-left" 
        style={{ 
          width: '1200px', 
          height: '675px', // 16:9 for 1200px width
          transform: `scale(${scale})`,
        }}
      >
        <SlideCard
          slide={slide}
          theme={theme}
          getGradientClass={() => theme.colors.gradient}
          isPreview={true}
        />
      </div>

      {/* Slide number indicator */}
      <div className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md font-bold z-20"
        style={{ backgroundColor: `${theme.colors.foreground}cc`, color: theme.colors.background }}>
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Progress bar */}
      {isHovered && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 z-20" style={{ backgroundColor: `${theme.colors.muted}80` }}>
          <div
            className="h-full transition-all duration-300"
            style={{ backgroundColor: theme.colors.accent, width: `${((currentIndex + 1) / slides.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export function HistoryDashboard() {
  const [activeTab, setActiveTab] = useState<ContentType | "all">("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    resume: 0,
    presentation: 0,
    diagram: 0,
    letter: 0,
  });
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter items when dependencies change
  useEffect(() => {
    let filtered = items;

    // Filter by type
    if (activeTab !== "all") {
      filtered = filtered.filter((item) => item.type === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [activeTab, searchQuery, items]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // Use getSession() for rate limit avoidance (reads from local cache)
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      console.log('📋 Fetching history for user:', user.id);

      // Fetch from all sources in parallel
      const [documentsResult, resumes, presentations, diagrams, letters] = await Promise.all([
        supabase.from("documents").select("*").eq("user_id", user.id),
        fetchResumes(user.id),
        fetchPresentations(user.id),
        fetchDiagrams(user.id),
        fetchLetters(user.id),
      ]);

      const { data: documents } = documentsResult;

      // Map documents to history items
      const docItems: HistoryItem[] = (documents || []).map((doc: any) => {
        const content = doc.content || {};
        const data = doc.type === 'resume' ? (content.resumeData || content) : content;

        return {
          id: doc.id,
          type: doc.type as ContentType,
          title: doc.title || `Untitled ${doc.type}`,
          description: getDocumentDescription(doc),
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          data: data,
        };
      });

      // Merge all items and deduplicate by ID
      const mergedMap = new Map<string, HistoryItem>();

      // Add legacy items first
      [...resumes, ...presentations, ...diagrams, ...letters].forEach(item => {
        mergedMap.set(item.id, item);
      });

      // Add (and potentially overwrite with better data) document items
      docItems.forEach(item => {
        mergedMap.set(item.id, item);
      });

      const allItems = Array.from(mergedMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // DEBUG: Log the final merged items
      console.log('📊 Final History Items:', allItems.length, 'items');
      allItems.forEach((item, idx) => {
        if (item.type === 'resume') {
          console.log(`📝 Resume ${idx + 1}:`, item.id, item.title, 'data keys:', Object.keys(item.data || {}));
        }
      });

      setItems(allItems);

      // Calculate stats
      setStats({
        total: allItems.length,
        resume: allItems.filter(i => i.type === 'resume').length,
        presentation: allItems.filter(i => i.type === 'presentation').length,
        diagram: allItems.filter(i => i.type === 'diagram').length,
        letter: allItems.filter(i => i.type === 'letter').length,
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResumes = async (userId: string): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "resume")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resumes:", error);
      return [];
    }

    return (data as any[] || []).map((doc) => {
      const content = doc.content || {};
      
      // DEBUG: Log the raw content structure
      console.log('📄 Raw Resume Document:', doc.id, content);
      
      // Pass the full content object which contains resumeData
      // The preview component will unwrap it properly
      return {
        id: doc.id,
        type: "resume" as ContentType,
        title: doc.title || "Untitled Resume",
        description: content.resumeData?.personal_info?.name || content.resumeData?.personalInfo?.name || 
                    content.personal_info?.name || content.personalInfo?.name || "",
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        data: content, // Pass the full content object
      };
    });
  };

  const fetchPresentations = async (userId: string): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching presentations:", error);
      return [];
    }

    return (data as any[] || []).map((pres) => {
      const slides = getPresentationSlides(pres);
      return ({
      id: pres.id,
      type: "presentation" as ContentType,
      title: pres.title || "Untitled Presentation",
      description: `${slides.length || 0} slides`,
      created_at: pres.created_at,
      updated_at: pres.updated_at,
      data: pres,
    })});
  };

  const fetchDiagrams = async (userId: string): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("diagrams")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching diagrams:", error);
      return [];
    }

    return (data as any[] || []).map((diagram) => ({
      id: diagram.id,
      type: "diagram" as ContentType,
      title: diagram.title || "Untitled Diagram",
      description: diagram.type || "Diagram",
      created_at: diagram.created_at,
      updated_at: diagram.updated_at,
      data: diagram,
    }));
  };

  const fetchLetters = async (userId: string): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("letters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching letters:", error);
      return [];
    }

    return (data as any[] || []).map((letter) => ({
      id: letter.id,
      type: "letter" as ContentType,
      title: letter.subject || letter.title || "Untitled Letter",
      description: letter.letter_type || "Letter",
      created_at: letter.created_at,
      updated_at: letter.updated_at,
      data: letter,
    }));
  };

  // filterItems is now inlined in useEffect above

  const handleView = (item: HistoryItem) => {
    const config = contentTypeConfig[item.type];
    router.push(`${config.route}?id=${item.id}`);
  };

  // Render visual preview based on content type
  const renderPreview = (item: HistoryItem) => {
    // Helper to get nested data with multiple possible paths
    const getData = (data: any, ...paths: string[]): any => {
      if (!data) return null;
      for (const path of paths) {
        const keys = path.split('.');
        let value = data;
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined) break;
        }
        if (value !== undefined && value !== null) return value;
      }
      return null;
    };

    switch (item.type) {
      case "resume":
        return <ResumePreviewMini data={item.data} title={item.title} />;

      case "presentation":
        const slides = getPresentationSlides(item.data);
        const themeId = getPresentationThemeId(item.data);
        return <PresentationPreview slides={slides} title={item.title} themeId={themeId} />;

      case "diagram":
        return (
          <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <Network className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-[8px] font-medium text-gray-700 text-center">
              {item.data?.type || item.data?.diagramType || "Diagram"}
            </div>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-green-200 border border-green-300" />
              ))}
            </div>
            <div className="flex gap-0.5 mt-1">
              <div className="w-6 h-0.5 bg-green-300" />
              <div className="w-6 h-0.5 bg-green-300" />
            </div>
          </div>
        );

      case "letter":
        // Handle different letter data structures
        const letterData = item.data?.letterData || item.data;
        const recipientName = getData(letterData, 'to.name', 'recipient.name', 'recipientName', 'to');
        const senderName = getData(letterData, 'from.name', 'sender.name', 'senderName', 'from');
        const letterContent = getData(letterData, 'content', 'body', 'letterContent', 'text');
        const letterType = getData(letterData, 'letter_type', 'letterType', 'type');
        const letterDate = getData(letterData, 'date', 'createdAt');
        const subject = getData(letterData, 'subject', 'title');

        return (
          <div className="p-3 text-[6px] leading-tight h-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
            {letterDate && (
              <div className="mb-1 text-right text-gray-500 text-[5px]">
                {new Date(letterDate).toLocaleDateString()}
              </div>
            )}
            {subject && (
              <div className="mb-1 font-semibold text-gray-800 text-[7px]">
                Re: {subject}
              </div>
            )}
            <div className="mb-1">
              <div className="text-gray-700 font-medium">
                Dear {typeof recipientName === 'string' ? recipientName : 'Recipient'},
              </div>
            </div>
            <div className="text-gray-600 line-clamp-4">
              {typeof letterContent === 'string'
                ? letterContent.substring(0, 150) + (letterContent.length > 150 ? '...' : '')
                : letterType
                  ? `${letterType} letter`
                  : "Letter content..."}
            </div>
            <div className="mt-2 text-gray-700">
              <div>Sincerely,</div>
              <div className="font-medium">
                {typeof senderName === 'string' ? senderName : 'Sender'}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <FileText className="h-12 w-12 text-gray-300" />
          </div>
        );
    }
  };

  const handleDelete = async (item: HistoryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      // First try to delete from documents table
      const { error: docError } = await (supabase
        .from('documents' as any)
        .delete()
        .eq("id", item.id)) as { error: any };

      if (!docError) {
        toast({
          title: "Deleted",
          description: `${item.title} has been deleted`,
        });
        fetchHistory();
        return;
      }

      // Fallback: try individual table
      const tableName = `${item.type}s`;
      const { error } = await (supabase.from(tableName as any).delete().eq("id", item.id)) as { error: any };

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `${item.title} has been deleted`,
      });

      fetchHistory();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Background elements matching landing page */}
        <div className="absolute inset-0 mesh-gradient opacity-20"></div>
        <div className="floating-orb w-32 h-32 sm:w-48 sm:h-48 bolt-gradient opacity-15 top-20 -left-24"></div>
        <div className="floating-orb w-24 h-24 sm:w-36 sm:h-36 bolt-gradient opacity-20 bottom-20 -right-18"></div>
        <div className="floating-orb w-40 h-40 sm:w-56 sm:h-56 bolt-gradient opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

        <SiteHeader />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center glass-effect p-8 rounded-2xl">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your documents...</p>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex-1 p-4 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4 shimmer">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Document History</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bolt-gradient-text">
                Your Created Documents
              </span>
            </h1>
            <p className="text-muted-foreground">
              View and manage all your created content in one place
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="p-4 glass-effect border border-border/40 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold bolt-gradient-text">{stats.total}</p>
            </Card>

            {Object.entries(contentTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Card
                  key={type}
                  className={`p-4 glass-effect border border-border/40 cursor-pointer hover:scale-105 hover:shadow-lg transition-all ${activeTab === type ? 'ring-2 ring-yellow-400 border-yellow-400/50' : ''}`}
                  onClick={() => setActiveTab(type as ContentType)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <span className="text-sm text-muted-foreground">{config.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{stats[type as ContentType]}</p>
                </Card>
              );
            })}
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border/40 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 glass-effect bg-background/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType | "all")}>
            <TabsList className="mb-6 glass-effect border border-border/40">
              <TabsTrigger value="all" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-700 dark:data-[state=active]:text-yellow-400">All ({stats.total})</TabsTrigger>
              {Object.entries(contentTypeConfig).map(([type, config]) => (
                <TabsTrigger key={type} value={type} className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-700 dark:data-[state=active]:text-yellow-400">
                  {config.label} ({stats[type as ContentType]})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredItems.length === 0 ? (
                <Card className="p-12 text-center glass-effect border border-border/40">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bolt-gradient flex items-center justify-center">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-foreground text-lg font-medium">No content found</p>
                    <p className="text-muted-foreground text-sm">Start creating amazing documents!</p>
                    <Button
                      onClick={() => router.push("/")}
                      className="bolt-gradient text-white hover:scale-105 transition-transform"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Something New
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                  {filteredItems.map((item) => {
                    const config = contentTypeConfig[item.type];
                    const Icon = config.icon;
                    
                    // Dynamic background for the preview container
                    let containerBg = `bg-gradient-to-br ${config.gradient}`;
                    if (item.type === 'presentation') {
                      const themeId = getPresentationThemeId(item.data);
                      const theme = getThemeById(themeId);
                      // Use a subtle version of the theme background or the theme background itself
                      containerBg = ""; // We'll use inline style for PPT to be precise
                    }

                    return (
                      <Card
                        key={item.id}
                        className="group relative overflow-hidden glass-effect border border-border/40 hover:border-yellow-400/50 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                        onClick={() => handleView(item)}
                      >
                        {/* Preview Area */}
                        <div 
                          className={`relative ${item.type === 'presentation' ? 'aspect-video' : 'aspect-[3/4]'} ${item.type !== 'presentation' ? containerBg : ''} overflow-hidden`}
                          style={item.type === 'presentation' ? { backgroundColor: getThemeById(getPresentationThemeId(item.data)).colors.background } : {}}
                        >
                          {/* Document Preview Content */}
                          <div
                            className={`absolute inset-0 ${item.type === 'presentation' ? '' : 'bg-white dark:bg-gray-900 m-3 rounded-lg shadow-inner'} overflow-hidden`}
                          >
                            {renderPreview(item)}
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 hidden group-hover:flex items-center justify-center z-30">
                            <div className="flex gap-3">
                              <Button
                                size="sm"
                                className="bg-white text-gray-800 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(item);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Type Badge */}
                          <div className="absolute top-2 left-2">
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm`}>
                              <Icon className={`h-3 w-3 ${config.color}`} />
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{config.label.slice(0, -1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-4 bg-background/50">
                          <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:bolt-gradient-text transition-colors">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 invisible group-hover:visible transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(item);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
