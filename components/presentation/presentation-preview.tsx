"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Quote, Maximize2, Minimize2, Play, Pause, RotateCcw, Image as ImageIcon, Edit3 } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { PostGenerationImageEditor } from "./post-generation-image-editor";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Legend
} from "recharts";

interface PresentationPreviewProps {
  slides: any[];
  template: string;
  onSlidesUpdate?: (updatedSlides: any[]) => void;
  allowImageEditing?: boolean;
}

export function PresentationPreview({ 
  slides, 
  template,
  onSlidesUpdate,
  allowImageEditing = true 
}: PresentationPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: number]: boolean}>({});
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editingSlideIndex, setEditingSlideIndex] = useState<number>(0);
  const { theme } = useTheme();

  const handleEditImage = (slideIndex: number) => {
    setEditingSlideIndex(slideIndex);
    setIsImageEditorOpen(true);
  };

  const handleImageUpdate = (slideIndex: number, imageUrl: string) => {
    if (!onSlidesUpdate) return;
    
    const updatedSlides = [...slides];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      image: imageUrl
    };
    onSlidesUpdate(updatedSlides);
  };

  const handleImageRemove = (slideIndex: number) => {
    if (!onSlidesUpdate) return;
    
    const updatedSlides = [...slides];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      image: undefined
    };
    onSlidesUpdate(updatedSlides);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.getElementById('presentation-container')?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleAutoPlay = useCallback(() => {
    if (isPlaying) {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        setAutoPlayInterval(null);
      }
      setIsPlaying(false);
    } else {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);
      setAutoPlayInterval(interval);
      setIsPlaying(true);
    }
  }, [isPlaying, autoPlayInterval, nextSlide]);

  const resetPresentation = useCallback(() => {
    setCurrentSlide(0);
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      setAutoPlayInterval(null);
    }
    setIsPlaying(false);
  }, [autoPlayInterval]);

  const handleImageError = useCallback((slideIndex: number) => {
    setImageLoadErrors(prev => ({ ...prev, [slideIndex]: true }));
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
          setAutoPlayInterval(null);
        }
        setIsPlaying(false);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    document.addEventListener('fullscreenchange', () => {
      setIsFullscreen(!!document.fullscreenElement);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('fullscreenchange', () => {
        setIsFullscreen(!!document.fullscreenElement);
      });
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    };
  }, [nextSlide, prevSlide, toggleFullscreen, autoPlayInterval]);

  const renderChart = (chart: any) => {
    if (!chart || !chart.data) return null;

    const chartColors = chart.colors || ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    
    const chartTheme = {
      stroke: theme === 'dark' ? 'white' : 'black',
      fill: theme === 'dark' ? 'white' : 'black',
    };

    const commonProps = {
      data: chart.data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart {...commonProps}>
              {chart.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />}
              <XAxis
                dataKey="name"
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
              />
              <YAxis
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
                label={{ value: chart.yAxis, angle: -90, position: 'insideLeft', style: chartTheme }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                  color: theme === 'dark' ? 'white' : 'black',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
              <Bar dataKey="value" fill={chartColors[0]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={30}
                paddingAngle={2}
              >
                {chart.data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                  color: theme === 'dark' ? 'white' : 'black',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart {...commonProps}>
              {chart.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />}
              <XAxis
                dataKey="name"
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
              />
              <YAxis
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
                label={{ value: chart.yAxis, angle: -90, position: 'insideLeft', style: chartTheme }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                  color: theme === 'dark' ? 'white' : 'black',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColors[0]}
                strokeWidth={2}
                dot={{ fill: chartColors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartColors[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart {...commonProps}>
              {chart.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />}
              <XAxis
                dataKey="name"
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
              />
              <YAxis
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
                label={{ value: chart.yAxis, angle: -90, position: 'insideLeft', style: chartTheme }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                  color: theme === 'dark' ? 'white' : 'black',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColors[0]}
                fill={chartColors[0]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart {...commonProps}>
              {chart.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />}
              <XAxis
                dataKey="name"
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
              />
              <YAxis
                dataKey="value"
                tick={{ ...chartTheme, fontSize: 10 }}
                axisLine={{ stroke: chartTheme.stroke }}
                label={{ value: chart.yAxis, angle: -90, position: 'insideLeft', style: chartTheme }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                  color: theme === 'dark' ? 'white' : 'black',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
              <Scatter dataKey="value" fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getTemplateStyles = (template: string) => {
    // Determine if the template is originally dark-themed
    const isDarkTemplate = ['tech-modern', 'elegant-dark'].includes(template);
    const isLightThemeMode = theme !== 'dark';
    
    // Define base styles for each template
    const baseStyles = {
      'modern-business': {
        lightBg: 'bg-gradient-to-br from-blue-50 to-white',
        darkBg: 'bg-gradient-to-br from-blue-950 to-slate-900',
        lightText: 'text-blue-900',
        darkText: 'text-blue-100',
        lightAccent: 'text-blue-600',
        darkAccent: 'text-blue-400',
        lightBorder: 'border-blue-200',
        darkBorder: 'border-blue-700',
        lightCardBg: 'bg-white/80 backdrop-blur-sm',
        darkCardBg: 'bg-slate-800/80 backdrop-blur-sm',
        lightShadow: 'shadow-blue-100',
        darkShadow: 'shadow-blue-900/50'
      },
      'creative-gradient': {
        lightBg: 'bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50',
        darkBg: 'bg-gradient-to-br from-purple-950 via-pink-950 to-orange-950',
        lightText: 'text-purple-900',
        darkText: 'text-purple-100',
        lightAccent: 'text-purple-600',
        darkAccent: 'text-purple-400',
        lightBorder: 'border-purple-200',
        darkBorder: 'border-purple-700',
        lightCardBg: 'bg-white/90 backdrop-blur-sm',
        darkCardBg: 'bg-slate-800/90 backdrop-blur-sm',
        lightShadow: 'shadow-purple-100',
        darkShadow: 'shadow-purple-900/50'
      },
      'minimalist-pro': {
        lightBg: 'bg-gradient-to-br from-gray-50 to-white',
        darkBg: 'bg-gradient-to-br from-gray-900 to-slate-900',
        lightText: 'text-gray-800',
        darkText: 'text-gray-100',
        lightAccent: 'text-gray-600',
        darkAccent: 'text-gray-400',
        lightBorder: 'border-gray-200',
        darkBorder: 'border-gray-700',
        lightCardBg: 'bg-white/95 backdrop-blur-sm',
        darkCardBg: 'bg-slate-800/95 backdrop-blur-sm',
        lightShadow: 'shadow-gray-100',
        darkShadow: 'shadow-gray-900/50'
      },
      'tech-modern': {
        lightBg: 'bg-gradient-to-br from-slate-100 to-cyan-50',
        darkBg: 'bg-gradient-to-br from-slate-900 to-gray-900',
        lightText: 'text-slate-900',
        darkText: 'text-white',
        lightAccent: 'text-cyan-600',
        darkAccent: 'text-cyan-400',
        lightBorder: 'border-cyan-300',
        darkBorder: 'border-cyan-600',
        lightCardBg: 'bg-white/80 backdrop-blur-sm',
        darkCardBg: 'bg-slate-800/80 backdrop-blur-sm',
        lightShadow: 'shadow-cyan-100',
        darkShadow: 'shadow-cyan-500/20'
      },
      'elegant-dark': {
        lightBg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
        darkBg: 'bg-gradient-to-br from-gray-900 to-black',
        lightText: 'text-gray-900',
        darkText: 'text-white',
        lightAccent: 'text-yellow-600',
        darkAccent: 'text-yellow-400',
        lightBorder: 'border-yellow-300',
        darkBorder: 'border-yellow-600',
        lightCardBg: 'bg-white/80 backdrop-blur-sm',
        darkCardBg: 'bg-gray-800/80 backdrop-blur-sm',
        lightShadow: 'shadow-yellow-100',
        darkShadow: 'shadow-yellow-500/20'
      },
      'startup-pitch': {
        lightBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
        darkBg: 'bg-gradient-to-br from-green-950 to-emerald-950',
        lightText: 'text-green-900',
        darkText: 'text-green-100',
        lightAccent: 'text-green-600',
        darkAccent: 'text-green-400',
        lightBorder: 'border-green-200',
        darkBorder: 'border-green-700',
        lightCardBg: 'bg-white/90 backdrop-blur-sm',
        darkCardBg: 'bg-slate-800/90 backdrop-blur-sm',
        lightShadow: 'shadow-green-100',
        darkShadow: 'shadow-green-900/50'
      }
    };
    
    const style = baseStyles[template as keyof typeof baseStyles] || baseStyles['modern-business'];
    
    // Return theme-adaptive styles
    return {
      background: isLightThemeMode ? style.lightBg : style.darkBg,
      text: isLightThemeMode ? style.lightText : style.darkText,
      accent: isLightThemeMode ? style.lightAccent : style.darkAccent,
      border: isLightThemeMode ? style.lightBorder : style.darkBorder,
      cardBg: isLightThemeMode ? style.lightCardBg : style.darkCardBg,
      shadow: isLightThemeMode ? style.lightShadow : style.darkShadow
    };
  };

  const renderSlideContent = (slide: any, slideIndex: number) => {
    const templateStyles = getTemplateStyles(template);

    const baseClasses = cn(
      "h-full w-full transition-all duration-300 ease-in-out relative overflow-hidden flex flex-col",
      templateStyles.background,
      templateStyles.text
    );

    const backgroundImage = slide.image && !imageLoadErrors[slideIndex] 
      ? `url(${slide.image})` 
      : undefined;

    switch (slide.layout) {
      case "cover":
        return (
          <div 
            className={baseClasses}
            style={{
              backgroundImage,
              backgroundSize: "cover",
              backgroundPosition: slide.imagePosition || "center",
            }}
          >
            {/* Adaptive overlay - darker for images to ensure text readability */}
            <div className={cn(
              "absolute inset-0",
              backgroundImage 
                ? "bg-gradient-to-br from-black/60 via-black/40 to-black/60" 
                : theme === 'dark' 
                  ? "bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50" 
                  : "bg-gradient-to-br from-white/30 via-white/10 to-white/30"
            )}></div>
            <div className={cn(
              "relative z-10 h-full flex flex-col items-center justify-center p-3 sm:p-4 lg:p-5 text-center",
              backgroundImage ? "text-white" : ""
            )}>
              <div className="max-w-full w-full px-1 sm:px-2">
                <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight" style={{ wordBreak: 'break-word', fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}>
                  {slide.title}
                </h1>
                {slide.content && (
                  <p className="text-xs sm:text-sm md:text-base lg:text-base opacity-90 max-w-full leading-relaxed mb-3 mx-auto"
                     style={{
                       wordBreak: 'break-word',
                       overflowWrap: 'break-word',
                       display: '-webkit-box',
                       WebkitLineClamp: 2,
                       WebkitBoxOrient: 'vertical',
                       overflow: 'hidden',
                       fontSize: 'clamp(0.75rem, 1.2vw, 1rem)',
                       maxHeight: '15vh'
                     }}>
                    {slide.content}
                  </p>
                )}
              </div>
            </div>
            {/* Edit Image Button */}
            {allowImageEditing && !isFullscreen && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEditImage(slideIndex)}
                className="absolute top-4 right-4 z-20 opacity-0 hover:opacity-100 transition-opacity"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Image
              </Button>
            )}
            
            {slide.image && imageLoadErrors[slideIndex] && (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center",
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <ImageIcon className={cn("h-16 w-16", theme === 'dark' ? 'text-gray-600' : 'text-gray-400')} />
              </div>
            )}
            {slide.image && (
              <div className="hidden">
                {/* Hidden image for preloading and error detection */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* Preload image for error detection (hidden) */}
                <Image
                  src={slide.image}
                  alt="preload"
                  onError={() => handleImageError(slideIndex)}
                  style={{ display: 'none' }}
                  width={1}
                  height={1}
                />
              </div>
            )}
          </div>
        );

      case "split":
        return (
          <div className={baseClasses}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 h-full p-4 sm:p-6">
              {/* Left Content - 60% */}
              <div className="lg:col-span-3 flex flex-col justify-center space-y-4 overflow-hidden">
                <h2 className={cn("text-lg sm:text-xl md:text-xl lg:text-2xl font-bold leading-tight", templateStyles.accent)} style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}>
                  {slide.title}
                </h2>
                {slide.content && (
                  <p className="text-sm sm:text-base md:text-base leading-relaxed opacity-90" style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)' }}>
                    {slide.content}
                  </p>
                )}
                {slide.bullets && (
                  <ul className="space-y-3 text-xs sm:text-sm md:text-sm">
                    {slide.bullets.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 flex-shrink-0", templateStyles.accent.replace('text-', 'bg-'))}></div>
                        <span className="leading-relaxed" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)' }}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Right Image - 40% */}
              <div className="lg:col-span-2 flex items-center justify-center relative group">
                {slide.image && !imageLoadErrors[slideIndex] ? (
                  <div className={cn("rounded-xl overflow-hidden relative w-full h-full max-h-[60vh]", templateStyles.shadow)}>
                    <Image
                      src={slide.image}
                      alt={slide.imageAlt || slide.title || 'Slide image'}
                      className="w-full h-full object-contain"
                      onError={() => handleImageError(slideIndex)}
                      width={400}
                      height={300}
                    />
                    {allowImageEditing && !isFullscreen && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditImage(slideIndex)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => allowImageEditing && !isFullscreen && handleEditImage(slideIndex)}
                    className={cn(
                      "w-full h-full max-h-[60vh] rounded-xl flex flex-col items-center justify-center gap-3",
                      templateStyles.border,
                      "border-2 border-dashed",
                      templateStyles.cardBg,
                      allowImageEditing && !isFullscreen && "hover:border-yellow-400 cursor-pointer transition-all"
                    )}
                  >
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                    {allowImageEditing && !isFullscreen && (
                      <span className="text-xs text-muted-foreground">Click to add image</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case "chart":
        return (
          <div className={cn(baseClasses, "p-4 sm:p-6")}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 h-full">
              {/* Left Content - Takes 60% */}
              <div className="lg:col-span-3 flex flex-col justify-center space-y-4 overflow-hidden">
                <h2 className={cn("text-lg sm:text-xl md:text-xl lg:text-2xl font-bold leading-tight", templateStyles.accent)} style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}>
                  {slide.title}
                </h2>
                {slide.content && (
                  <p className="text-sm sm:text-base md:text-base leading-relaxed opacity-90" style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)' }}>
                    {slide.content}
                  </p>
                )}
                {slide.bullets && Array.isArray(slide.bullets) && (
                  <ul className="space-y-3 text-xs sm:text-sm md:text-sm overflow-y-auto">
                    {slide.bullets.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 flex-shrink-0", templateStyles.accent.replace('text-', 'bg-'))}></div>
                        <span className="leading-relaxed" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)' }}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Chart Info Badge */}
                {slide.charts && (
                  <div className={cn(
                    "mt-4 p-3 rounded-xl border-2",
                    templateStyles.border,
                    templateStyles.cardBg
                  )}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", templateStyles.accent.replace('text-', 'bg-'))}>
                        <span className="text-white text-base font-bold">📊</span>
                      </div>
                      <div>
                        <p className="font-semibold text-xs">{slide.charts.title || 'Data Visualization'}</p>
                        <p className="text-[10px] opacity-70">
                          {slide.charts.type?.charAt(0).toUpperCase() + slide.charts.type?.slice(1) || 'Bar'} Chart • {slide.charts.data?.length || 0} data points
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Chart - Takes 40% */}
              <div className="lg:col-span-2 flex items-center justify-center relative group">
                {slide.charts && (
                  <div className="w-full h-full max-h-[60vh] flex items-center justify-center">
                    {renderChart(slide.charts)}
                  </div>
                )}
                {slide.image && !imageLoadErrors[slideIndex] ? (
                  <div className={cn("rounded-2xl overflow-hidden relative w-full", templateStyles.shadow, "shadow-2xl")}>
                    <Image
                      src={slide.image}
                      alt={slide.imageAlt || slide.title || 'Slide image'}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: '450px' }}
                      onError={() => handleImageError(slideIndex)}
                      width={800}
                      height={450}
                    />
                    {/* Edit Image Button */}
                    {allowImageEditing && !isFullscreen && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditImage(slideIndex)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => allowImageEditing && !isFullscreen && handleEditImage(slideIndex)}
                    className={cn(
                      "w-full h-96 rounded-2xl flex flex-col items-center justify-center gap-4",
                      templateStyles.border,
                      "border-2 border-dashed",
                      templateStyles.cardBg,
                      allowImageEditing && !isFullscreen && "hover:border-yellow-400 cursor-pointer transition-all"
                    )}
                  >
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                    {allowImageEditing && !isFullscreen && (
                      <span className="text-sm text-muted-foreground">Click to add image</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case "list":
        return (
          <div className={cn(baseClasses, "p-4 sm:p-6")}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 h-full">
              {/* Left Content - 60% */}
              <div className="lg:col-span-3 flex flex-col justify-center space-y-4 overflow-hidden">
                <h2 className={cn("text-lg sm:text-xl md:text-xl lg:text-2xl font-bold leading-tight", templateStyles.accent)} style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}>
                  {slide.title}
                </h2>
                {slide.content && (
                  <p className="text-sm sm:text-base md:text-base leading-relaxed opacity-90 mb-3" style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.95rem)' }}>
                    {slide.content}
                  </p>
                )}
                {slide.bullets && (
                  <ul className="space-y-3 text-xs sm:text-sm md:text-sm overflow-y-auto">
                    {slide.bullets.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 group">
                        <div className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs shadow-md",
                          templateStyles.accent.replace('text-', 'bg-'),
                          "group-hover:scale-110 transition-transform"
                        )}>
                          {i + 1}
                        </div>
                        <span className="leading-relaxed" style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)' }}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Right Image - 40% */}
              <div className="lg:col-span-2 flex items-center justify-center relative group">
                {slide.image && !imageLoadErrors[slideIndex] ? (
                  <div className={cn("rounded-xl overflow-hidden relative w-full h-full max-h-[60vh]", templateStyles.shadow)}>
                    <Image
                      src={slide.image}
                      alt={slide.imageAlt || slide.title}
                      className="w-full h-full object-contain"
                      width={400}
                      height={300}
                      onError={() => handleImageError(slideIndex)}
                    />
                    {allowImageEditing && !isFullscreen && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditImage(slideIndex)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => allowImageEditing && !isFullscreen && handleEditImage(slideIndex)}
                    className={cn(
                      "w-full h-full max-h-[60vh] rounded-xl flex flex-col items-center justify-center gap-3",
                      templateStyles.border,
                      "border-2 border-dashed",
                      templateStyles.cardBg,
                      allowImageEditing && !isFullscreen && "hover:border-yellow-400 cursor-pointer transition-all"
                    )}
                  >
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                    {allowImageEditing && !isFullscreen && (
                      <span className="text-xs text-muted-foreground">Click to add image</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case "process":
        return (
          <div className={cn(baseClasses, "p-8 sm:p-12")}>
            <div className="h-full flex flex-col">
              <div className="mb-10">
                <h2 className={cn("text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight", templateStyles.accent)}>
                  {slide.title}
                </h2>
                {slide.content && (
                  <p className="text-lg sm:text-xl opacity-90 leading-relaxed max-w-4xl">
                    {slide.content}
                  </p>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 w-full max-w-5xl">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="group">
                      <div className="flex flex-col items-center text-center">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl mb-5 flex items-center justify-center text-white font-bold text-2xl shadow-xl",
                          templateStyles.accent.replace('text-', 'bg-'),
                          "group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                        )}>
                          {step}
                        </div>
                        <div className={cn(
                          "w-full p-5 rounded-xl",
                          templateStyles.cardBg,
                          templateStyles.border,
                          "border-2",
                          templateStyles.shadow,
                          "group-hover:shadow-xl transition-shadow"
                        )}>
                          <h3 className="font-bold text-lg mb-3">Step {step}</h3>
                          <p className="text-sm leading-relaxed opacity-80">
                            {slide.bullets && slide.bullets[step - 1] 
                              ? slide.bullets[step - 1] 
                              : `Process description for step ${step}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={cn(baseClasses, "p-4 sm:p-6")}>
            <div className="h-full flex flex-col justify-center max-w-full">
              <h2 className={cn("text-xl sm:text-2xl md:text-2xl lg:text-2xl font-bold mb-4 leading-tight", templateStyles.accent)} style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }}>
                {slide.title}
              </h2>
              <div className="space-y-4 flex-1 overflow-hidden">
                {slide.content && (
                  <p className="text-sm sm:text-base md:text-base lg:text-base leading-relaxed opacity-90" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>{slide.content}</p>
                )}
                {slide.bullets && (
                  <ul className="space-y-3 text-xs sm:text-sm md:text-sm lg:text-sm">
                    {slide.bullets.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs shadow-md",
                          templateStyles.accent.replace('text-', 'bg-')
                        )}>
                          {i + 1}
                        </div>
                        <span className="leading-relaxed" style={{ fontSize: 'clamp(0.7rem, 1.3vw, 0.9rem)' }}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  if (!slides.length) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No slides to display
      </div>
    );
  }

  return (
    <div 
      id="presentation-container" 
      className={cn(
        "relative w-full overflow-hidden",
        isFullscreen 
          ? "fixed inset-0 z-50 bg-black aspect-auto" 
          : "aspect-video"
      )}
      style={{
        maxHeight: isFullscreen ? '100vh' : '75vh'
      }}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
          {currentSlide + 1} / {slides.length}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={resetPresentation}
          className="h-10 w-10 rounded-full bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleAutoPlay}
          className="h-10 w-10 rounded-full bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="h-10 w-10 rounded-full bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Slide Content */}
      <div className={cn(
        "h-full w-full overflow-hidden rounded-lg flex flex-col",
        isFullscreen && "rounded-none"
      )}>
        {renderSlideContent(slides[currentSlide], currentSlide)}
      </div>

      {/* Navigation */}
      <div className={cn(
        "absolute inset-x-0 bottom-4 flex justify-between items-center px-4",
        isFullscreen && "px-8"
      )}>
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="h-12 w-12 rounded-full bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        {/* Slide Indicators */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                index === currentSlide 
                  ? "bg-white" 
                  : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="h-12 w-12 rounded-full bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Keyboard Shortcuts Help */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
          <div className="space-y-1">
            <div>← → Space: Navigate</div>
            <div>F: Fullscreen</div>
            <div>Esc: Exit</div>
          </div>
        </div>
      )}

      {/* Image Editor Dialog */}
      {allowImageEditing && slides[editingSlideIndex] && (
        <PostGenerationImageEditor
          isOpen={isImageEditorOpen}
          onClose={() => setIsImageEditorOpen(false)}
          slideIndex={editingSlideIndex}
          slideTitle={slides[editingSlideIndex]?.title || ''}
          slideContent={slides[editingSlideIndex]?.content || slides[editingSlideIndex]?.bullets?.join(', ') || ''}
          currentImage={slides[editingSlideIndex]?.image}
          onImageUpdate={handleImageUpdate}
          onImageRemove={handleImageRemove}
        />
      )}
    </div>
  );
}