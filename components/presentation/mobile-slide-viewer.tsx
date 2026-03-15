"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DiagramPreview } from "@/components/diagram/diagram-preview";
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Download,
  Share2,
  FileDown,
  Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface MobileSlideViewerProps {
  slides: any[];
  onClose: () => void;
}

export function MobileSlideViewer({ slides, onClose }: MobileSlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

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

  const isCodeVisual = (slide: any) => {
    const visualType = normalizeVisualType(slide.visual_type || slide.visualType);
    return ['svg_code', 'mermaid', 'html_tailwind', 'chart_data'].includes(visualType);
  };

  const renderCodeVisual = (slide: any) => {
    const visualType = normalizeVisualType(slide.visual_type || slide.visualType);
    const visualContent = slide.visual_content ?? slide.visualContent;

    if (visualType === 'mermaid' && typeof visualContent === 'string') {
      return (
        <div className="w-full rounded-xl overflow-hidden border-2 border-blue-200 bg-white p-2">
          <DiagramPreview code={visualContent} />
        </div>
      );
    }

    if (visualType === 'svg_code' && typeof visualContent === 'string') {
      return (
        <div className="w-full rounded-xl overflow-hidden border-2 border-blue-200 bg-white p-3">
          <div dangerouslySetInnerHTML={{ __html: sanitizeMarkup(visualContent) }} />
        </div>
      );
    }

    if (visualType === 'html_tailwind' && typeof visualContent === 'string') {
      return (
        <div className="w-full rounded-xl overflow-hidden border-2 border-blue-200 bg-white p-3 text-slate-900">
          <div dangerouslySetInnerHTML={{ __html: sanitizeMarkup(visualContent) }} />
        </div>
      );
    }

    if (visualType === 'chart_data') {
      const chartData = slide.chartData || slide.charts || visualContent;
      if (!chartData?.data || !Array.isArray(chartData.data)) {
        return null;
      }
      return (
        <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-lg">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 {chartData.title || 'Data Visualization'}
          </h3>
          <div className="space-y-2">
            {chartData.data.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: chartData.colors?.[idx] || '#3B82F6' }}
                />
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium flex-1">
                  {item.name}
                </span>
                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    toast({
      title: "📄 Exporting to PDF...",
      description: "Creating your presentation PDF",
    });

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080]
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Create a temporary slide element
        const slideElement = document.createElement('div');
        slideElement.style.width = '1920px';
        slideElement.style.height = '1080px';
        slideElement.style.position = 'absolute';
        slideElement.style.left = '-9999px';
        slideElement.style.background = '#ffffff';
        slideElement.style.padding = '80px';
        slideElement.style.boxSizing = 'border-box';
        slideElement.style.display = 'flex';
        slideElement.style.flexDirection = 'column';
        slideElement.style.justifyContent = 'flex-start';
        slideElement.style.gap = '40px';

        // Title
        const title = document.createElement('h1');
        title.textContent = slide.title;
        title.style.fontSize = '72px';
        title.style.fontWeight = 'bold';
        title.style.color = '#1a1a1a';
        title.style.lineHeight = '1.2';
        slideElement.appendChild(title);

        // Image - displayed as content element
        if (slide.imageUrl) {
          const imageContainer = document.createElement('div');
          imageContainer.style.width = '100%';
          imageContainer.style.maxHeight = '500px';
          imageContainer.style.borderRadius = '16px';
          imageContainer.style.overflow = 'hidden';
          imageContainer.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)';
          
          const img = document.createElement('img');
          img.src = slide.imageUrl;
          img.style.width = '100%';
          img.style.height = 'auto';
          img.style.maxHeight = '500px';
          img.style.objectFit = 'cover';
          img.crossOrigin = 'anonymous';
          
          imageContainer.appendChild(img);
          slideElement.appendChild(imageContainer);
        }

        // Chart - displayed as content element
        if (slide.chartData && slide.chartData.data) {
          const chartContainer = document.createElement('div');
          chartContainer.style.padding = '30px';
          chartContainer.style.background = 'linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%)';
          chartContainer.style.borderRadius = '16px';
          chartContainer.style.border = '2px solid #93c5fd';
          
          const chartTitle = document.createElement('h3');
          chartTitle.textContent = '📊 ' + (slide.chartData.title || 'Data Visualization');
          chartTitle.style.fontSize = '36px';
          chartTitle.style.fontWeight = 'bold';
          chartTitle.style.color = '#1a1a1a';
          chartTitle.style.marginBottom = '20px';
          chartContainer.appendChild(chartTitle);
          
          slide.chartData.data.forEach((item: any, idx: number) => {
            const dataRow = document.createElement('div');
            dataRow.style.display = 'flex';
            dataRow.style.alignItems = 'center';
            dataRow.style.gap = '15px';
            dataRow.style.marginBottom = '15px';
            
            const dot = document.createElement('div');
            dot.style.width = '16px';
            dot.style.height = '16px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = slide.chartData.colors?.[idx] || '#3B82F6';
            
            const label = document.createElement('span');
            label.textContent = item.name;
            label.style.fontSize = '28px';
            label.style.color = '#374151';
            label.style.flex = '1';
            
            const value = document.createElement('span');
            value.textContent = String(item.value);
            value.style.fontSize = '28px';
            value.style.fontWeight = 'bold';
            value.style.color = '#1a1a1a';
            
            dataRow.appendChild(dot);
            dataRow.appendChild(label);
            dataRow.appendChild(value);
            chartContainer.appendChild(dataRow);
          });
          
          slideElement.appendChild(chartContainer);
        }

        // Content text
        if (slide.content) {
          const contentText = document.createElement('p');
          contentText.textContent = slide.content;
          contentText.style.fontSize = '32px';
          contentText.style.color = '#374151';
          contentText.style.lineHeight = '1.6';
          slideElement.appendChild(contentText);
        }

        // Bullets
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletList = document.createElement('ul');
          bulletList.style.listStyle = 'none';
          bulletList.style.padding = '0';
          bulletList.style.margin = '0';
          
          slide.bullets.forEach((bullet: string, idx: number) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'start';
            li.style.marginBottom = '20px';
            li.style.gap = '20px';
            
            const badge = document.createElement('span');
            badge.textContent = String(idx + 1);
            badge.style.width = '50px';
            badge.style.height = '50px';
            badge.style.borderRadius = '50%';
            badge.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
            badge.style.color = 'white';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.fontWeight = 'bold';
            badge.style.fontSize = '24px';
            badge.style.flexShrink = '0';
            
            const text = document.createElement('span');
            text.textContent = bullet;
            text.style.fontSize = '28px';
            text.style.color = '#1f2937';
            text.style.lineHeight = '1.5';
            
            li.appendChild(badge);
            li.appendChild(text);
            bulletList.appendChild(li);
          });
          
          slideElement.appendChild(bulletList);
        }

        document.body.appendChild(slideElement);

        // Capture the slide
        const canvas = await html2canvas(slideElement, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        });

        document.body.removeChild(slideElement);

        // Add to PDF
        if (i > 0) {
          pdf.addPage();
        }
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
      }

      // Save the PDF
      pdf.save('presentation.pdf');
      
      toast({
        title: "✅ PDF Downloaded!",
        description: `${slides.length} slides exported successfully`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Could not create PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-3 sm:p-4 flex items-center justify-between border-b-2 border-gray-700">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-3 py-1 rounded-full">
          {currentSlide + 1} / {slides.length}
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button
            onClick={exportToPDF}
            disabled={isExporting}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 disabled:opacity-50"
            title="Export to PDF"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-full max-w-4xl my-auto">
          <Card className="w-full shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden border-4 border-gray-700 bg-white dark:bg-gray-900">
            <div className="w-full min-h-[60vh] sm:min-h-[70vh] overflow-y-auto">
              {/* Slide Container */}
              <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6">
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  {slide.title}
                </h1>

                {/* Code-driven visuals */}
                {isCodeVisual(slide) && renderCodeVisual(slide)}
                
                {/* Image - legacy slides */}
                {!isCodeVisual(slide) && slide.imageUrl && (
                  <div className="w-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-200 dark:border-gray-700">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className={`w-full h-auto max-h-[40vh] object-cover ${
                        slide.imagePosition === 'top' ? 'object-top' :
                        slide.imagePosition === 'bottom' ? 'object-bottom' :
                        slide.imagePosition === 'left' ? 'object-left' :
                        slide.imagePosition === 'right' ? 'object-right' :
                        'object-center'
                      }`}
                      loading="eager"
                    />
                  </div>
                )}

                {/* Chart Display */}
                {!isCodeVisual(slide) && slide.chartData && (
                  <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-lg">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
                      📊 {slide.chartData.title || 'Data Visualization'}
                    </h3>
                    <div className="space-y-2">
                      {slide.chartData.data && slide.chartData.data.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: slide.chartData.colors?.[idx] || '#3B82F6' }}
                          />
                          <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium flex-1">
                            {item.name}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Content */}
                {slide.content && (
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                    {slide.content}
                  </p>
                )}
                
                {/* Bullets */}
                {slide.bullets && slide.bullets.length > 0 && (
                  <ul className="space-y-3 sm:space-y-4">
                    {slide.bullets.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm sm:text-base font-bold">{i + 1}</span>
                        </div>
                        <span className="flex-1 text-sm sm:text-base md:text-lg text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3 sm:p-4 border-t-2 border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <Button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <ChevronLeft className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          
          {/* Progress Dots */}
          <div className="flex gap-1 sm:gap-1.5 px-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 w-8 sm:w-10 h-2 sm:h-2.5 shadow-lg'
                    : 'bg-gray-600 hover:bg-gray-500 w-2 sm:w-2.5 h-2 sm:h-2.5'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-5 w-5 sm:ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
