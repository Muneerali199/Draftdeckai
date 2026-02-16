"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PresentationPreview } from "@/components/presentation/presentation-preview";
import { AIPresentationAssistant } from "@/components/presentation/ai-presentation-assistant";
import { PresentationTemplates } from "@/components/presentation/presentation-templates";
import { SlideOutlinePreview } from "@/components/presentation/slide-outline-preview";
import { UrlInputSection } from "@/components/presentation/url-input-section";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, Sparkles, Presentation as LayoutPresentation, Lock, Download, Wand2, Sliders as Slides, Palette, Eye, ArrowRight, CheckCircle, Play, Brain, Zap, Star, Share2, Copy, Globe, ExternalLink, Mail, MessageCircle, Twitter, Linkedin, Facebook, Send, Link as LinkIcon } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createClient } from "@/lib/supabase/client";
import type PptxGenJS from 'pptxgenjs';
import { RESUME_TEMPLATES } from "@/lib/resume-template-data";
import {
  SLIDE_LAYOUT, PAD, SAFE, SPLIT, COVER, CONTENT,
  FONT, LINE, PARA_BEFORE, FONT_FACE, insetMargins,
  fitTextInBox, fitBullets,
} from '@/lib/slide-layout-tokens';

type GenerationStep = 'input' | 'outline' | 'theme' | 'generated';
type InputMode = 'text' | 'url';

interface PresentationGeneratorProps {
  templateId?: string | null;
}

export function PresentationGenerator({ templateId }: PresentationGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [slideOutlines, setSlideOutlines] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("modern-business");
  const [pageCount, setPageCount] = useState(8);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>('input');
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [presentationId, setPresentationId] = useState<string>('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [extractedContent, setExtractedContent] = useState<string>('');
  const { toast } = useToast();
  const { user } = useUser();
  const supabase = createClient();

  const MAX_FREE_PAGES = 8;
  const MAX_PRO_PAGES = 100;
  const isPro = false; // This would be connected to your auth/subscription system

  // Load template data if templateId is provided
  useEffect(() => {
    if (templateId) {
      const template = RESUME_TEMPLATES.find(t => t.id === templateId && t.type === 'presentation');
      if (template) {
        setSelectedTemplate(templateId);
        setPrompt(`Create a presentation based on: ${template.title} - ${template.description}`);
        
        toast({
          title: "✨ Template Loaded!",
          description: `Using ${template.title}. Customize the prompt or generate directly.`,
        });
      }
    }
  }, [templateId, toast]);

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
    setGenerationStage('🌐 Fetching content from URL...');

    try {
      const response = await fetch('/api/fetch-url-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch URL content');
      }

      const data = await response.json();
      
      // Set the extracted content as the prompt
      const contentSummary = `Create a presentation based on this content from ${data.title}:\n\n${data.content}`;
      setExtractedContent(data.content);
      setPrompt(contentSummary);

      toast({
        title: "✅ Content Extracted Successfully!",
        description: `Extracted ${data.wordCount} words from "${data.title}". Ready to generate presentation!`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to fetch URL",
        description: error.message || "Could not extract content from the URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingUrl(false);
      setGenerationStage('');
    }
  };

  const generateSlideOutlines = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe the presentation you want to generate",
        variant: "destructive",
      });
      return;
    }

    if (pageCount > (isPro ? MAX_PRO_PAGES : MAX_FREE_PAGES)) {
      toast({
        title: "Page limit exceeded",
        description: isPro
          ? `Maximum ${MAX_PRO_PAGES} pages allowed`
          : `Upgrade to Pro to create presentations with up to ${MAX_PRO_PAGES} pages`,
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
        
        // Handle authentication errors
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to create presentations.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle credit/payment errors
        if (response.status === 402) {
          const creditWord = errorData.creditsRequired === 1 ? 'credit' : 'credits';
          const slideWord = pageCount === 1 ? 'slide' : 'slides';
          toast({
            title: "Not Enough Credits",
            description: errorData.message || `You need ${errorData.creditsRequired} ${creditWord} for a ${pageCount}-${slideWord} presentation. Please upgrade your plan.`,
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate outline');
      }

      const data = await response.json();
      setSlideOutlines(data.outlines);
      setCurrentStep('outline');

      toast({
        title: "🎯 AI Outline Created!",
        description: `${data.outlines.length} slides intelligently structured with professional images and charts. Choose your style!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate outline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFullPresentation = async () => {
    setIsGenerating(true);
    setCurrentStep('generated');
    setGenerationProgress(0);
    setGenerationStage('Initializing AI...');

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      setGenerationStage('🧠 AI analyzing your topic...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setGenerationStage('✨ Generating slide content...');
      setGenerationProgress(20);

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
        clearInterval(progressInterval);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate presentation');
      }

      setGenerationStage('🖼️ Fetching unique images for each slide...');
      setGenerationProgress(50);

      const data = await response.json();
      
      setGenerationStage('🎨 Applying professional design...');
      setGenerationProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      setGenerationStage('📊 Adding charts and visualizations...');
      setGenerationProgress(95);
      await new Promise(resolve => setTimeout(resolve, 500));

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStage('✅ Complete!');
      
      setSlides(data.slides);

      toast({
        title: "🎉 Professional Presentation Ready!",
        description: `${data.slides.length} slides created with unique images, professional design, and interactive charts!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate presentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStage('');
    }
  };

  const exportToPDF = async () => {
    if (!slides.length) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      console.log(`📄 Exporting ${slides.length} slides to PDF...`);
      
      for (let i = 0; i < slides.length; i++) {
        if (i > 0) pdf.addPage();
        
        const slide = slides[i];
        console.log(`📄 Slide ${i + 1}:`, { 
          title: slide.title, 
          hasImage: !!slide.image,
          imageUrl: slide.image?.substring(0, 50) + '...'
        });
        
        // Add background based on template
        const templateStyles = getTemplateBackground(selectedTemplate);
        pdf.setFillColor(templateStyles.r, templateStyles.g, templateStyles.b);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        
        // Add title with professional formatting
        const slideTitle = slide.title || 'Untitled Slide';
        const titleWidth = slide.image ? pdfWidth - 530 : pdfWidth - 100;
        
        // Adjust font size based on title length and image presence
        let titleFontSize = slide.image ? 36 : 44;
        const titleLines = pdf.splitTextToSize(slideTitle, titleWidth);
        
        // Reduce font size if too many lines
        if (titleLines.length > 2) {
          titleFontSize = slide.image ? 30 : 38;
        }
        
        pdf.setFontSize(titleFontSize);
        pdf.setTextColor(templateStyles.titleR, templateStyles.titleG, templateStyles.titleB);
        pdf.setFont('helvetica', 'bold');
        pdf.text(titleLines, 50, 55);
        
        // Dynamic spacing after title
        let yPos = 55 + (titleLines.length * (titleFontSize * 1.3));
        
        // Add image if available
        if (slide.image) {
          try {
            let imageData = slide.image;
            
            // Check if image needs conversion from URL to base64
            if (slide.image.startsWith('http')) {
              try {
                console.log(`🖼️ Fetching image via proxy for slide ${i + 1}...`);
                
                // Use proxy API to bypass CSP/CORS
                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(slide.image)}`;
                const proxyResponse = await fetch(proxyUrl);
                
                if (!proxyResponse.ok) {
                  console.error(`❌ Proxy failed: ${proxyResponse.status}`);
                  throw new Error('Proxy failed');
                }
                
                const proxyData = await proxyResponse.json();
                
                console.log(`🔍 Proxy response for slide ${i + 1}:`, {
                  success: proxyData.success,
                  hasDataUrl: !!proxyData.dataUrl,
                  dataUrlStart: proxyData.dataUrl?.substring(0, 50)
                });
                
                if (proxyData.success && proxyData.dataUrl) {
                  imageData = proxyData.dataUrl;
                  console.log(`✅ Image fetched via proxy for slide ${i + 1}`);
                } else {
                  throw new Error('Invalid proxy response');
                }
              } catch (fetchError) {
                console.error(`❌ Error fetching image for slide ${i + 1}:`, fetchError);
                // Failed to fetch image, skip it
                imageData = null;
              }
            }
            
            console.log(`🔍 Image data check for slide ${i + 1}:`, {
              hasImageData: !!imageData,
              isString: typeof imageData === 'string',
              startsWithData: imageData?.startsWith('data:'),
              first50: imageData?.substring(0, 50)
            });
            
            // Add image to PDF with better positioning
            if (imageData && typeof imageData === 'string' && imageData.startsWith('data:')) {
              const imgWidth = 380;
              const imgHeight = 270;
              const imgX = pdfWidth - imgWidth - 50;
              const imgY = 70;
              
              // Determine format from data URL
              let format = 'JPEG';
              if (imageData.includes('image/png')) format = 'PNG';
              else if (imageData.includes('image/webp')) format = 'WEBP';
              
              // Add border/shadow effect with rectangle
              pdf.setDrawColor(200, 200, 200);
              pdf.setLineWidth(2);
              pdf.rect(imgX - 2, imgY - 2, imgWidth + 4, imgHeight + 4);
              
              pdf.addImage(imageData, format, imgX, imgY, imgWidth, imgHeight);
              console.log(`✅ Image added to PDF for slide ${i + 1}`);
            } else {
              console.warn(`⚠️ No valid image data for slide ${i + 1}`, {
                imageData: imageData?.substring(0, 100)
              });
            }
          } catch (error) {
            console.error(`❌ Error adding image to PDF for slide ${i + 1}:`, error);
          }
        } else {
          console.warn(`⚠️ Slide ${i + 1} has no image property`);
        }
        
        // Add content with better typography
        if (slide.content) {
          const contentFontSize = slide.image ? 16 : 20;
          pdf.setFontSize(contentFontSize);
          pdf.setFont('helvetica', 'normal');
          const contentColor = getTextColorForTemplate(selectedTemplate);
          pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
          const contentWidth = slide.image ? pdfWidth - 500 : pdfWidth - 100;
          const splitContent = pdf.splitTextToSize(slide.content, contentWidth);
          pdf.text(splitContent, 50, yPos);
          yPos += splitContent.length * (contentFontSize + 6) + 30;
        }
        
        // Add bullets with improved formatting
        if (slide.bullets && Array.isArray(slide.bullets)) {
          const bulletFontSize = slide.image ? 14 : 18;
          pdf.setFontSize(bulletFontSize);
          const contentColor = getTextColorForTemplate(selectedTemplate);
          pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
          const contentWidth = slide.image ? pdfWidth - 500 : pdfWidth - 120;
          
          slide.bullets.forEach((bullet: string, idx: number) => {
            // Ensure we don't go off page
            if (yPos > pdfHeight - 90) return;
            
            // Add bullet number or circle
            pdf.setFont('helvetica', 'bold');
            pdf.setFillColor(templateStyles.accentR, templateStyles.accentG, templateStyles.accentB);
            pdf.circle(62, yPos - 3, 5, 'F');
            
            // Add bullet text
            pdf.setFont('helvetica', 'normal');
            const bulletText = pdf.splitTextToSize(bullet, contentWidth - 50);
            pdf.text(bulletText, 80, yPos);
            yPos += bulletText.length * (bulletFontSize + 4) + 15;
          });
        }
        
        // Add chart if available - render actual chart
        if (slide.charts && slide.charts.data && Array.isArray(slide.charts.data)) {
          try {
            // Create chart visualization
            const chartX = slide.image ? 50 : pdfWidth - 380;
            const chartY = slide.image ? pdfHeight - 180 : yPos;
            const chartWidth = 360;
            const chartHeight = 150;
            
            // Add chart title
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            const contentColor = getTextColorForTemplate(selectedTemplate);
            pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
            pdf.text(slide.charts.title || 'Data Visualization', chartX, chartY - 10);
            
            // Draw simple bar chart
            if (slide.charts.type === 'bar' || !slide.charts.type) {
              const maxValue = Math.max(...slide.charts.data.map((d: any) => d.value || 0));
              const barWidth = (chartWidth - 40) / slide.charts.data.length;
              const chartData = slide.charts.data.slice(0, 6); // Max 6 bars
              
              chartData.forEach((item: any, idx: number) => {
                const value = item.value || 0;
                const barHeight = (value / maxValue) * (chartHeight - 40);
                const x = chartX + (idx * barWidth) + 10;
                const y = chartY + chartHeight - barHeight - 20;
                
                // Draw bar
                pdf.setFillColor(templateStyles.accentR, templateStyles.accentG, templateStyles.accentB);
                pdf.rect(x, y, barWidth - 10, barHeight, 'F');
                
                // Add value label
                pdf.setFontSize(9);
                pdf.setTextColor(50, 50, 50);
                pdf.text(String(value), x + (barWidth - 10) / 2, y - 5, { align: 'center' });
                
                // Add category label
                const label = (item.name || item.label || '').substring(0, 8);
                pdf.text(label, x + (barWidth - 10) / 2, chartY + chartHeight - 5, { 
                  align: 'center',
                  maxWidth: barWidth - 5
                });
              });
              
              // Draw axes
              pdf.setDrawColor(150, 150, 150);
              pdf.setLineWidth(1);
              pdf.line(chartX, chartY + chartHeight - 20, chartX + chartWidth, chartY + chartHeight - 20);
              pdf.line(chartX, chartY, chartX, chartY + chartHeight - 20);
            }
            
            // Draw simple pie chart for pie/doughnut types
            else if (slide.charts.type === 'pie' || slide.charts.type === 'doughnut') {
              const centerX = chartX + chartWidth / 2;
              const centerY = chartY + chartHeight / 2;
              const radius = Math.min(chartWidth, chartHeight) / 3;
              
              const total = slide.charts.data.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
              let currentAngle = -90;
              
              const colors = [
                [templateStyles.accentR, templateStyles.accentG, templateStyles.accentB],
                [16, 185, 129],
                [245, 158, 11],
                [239, 68, 68],
                [139, 92, 246],
                [6, 182, 212]
              ];
              
              slide.charts.data.slice(0, 6).forEach((item: any, idx: number) => {
                const value = item.value || 0;
                const angle = (value / total) * 360;
                const color = colors[idx % colors.length];
                
                pdf.setFillColor(color[0], color[1], color[2]);
                
                // Draw pie slice
                const startAngle = (currentAngle * Math.PI) / 180;
                const endAngle = ((currentAngle + angle) * Math.PI) / 180;
                
                pdf.circle(centerX, centerY, radius, 'F');
                
                currentAngle += angle;
              });
              
              // Add legend
              pdf.setFontSize(9);
              slide.charts.data.slice(0, 6).forEach((item: any, idx: number) => {
                const color = colors[idx % colors.length];
                const legendY = chartY + 20 + (idx * 15);
                
                pdf.setFillColor(color[0], color[1], color[2]);
                pdf.rect(chartX + chartWidth - 100, legendY - 8, 10, 10, 'F');
                
                pdf.setTextColor(50, 50, 50);
                const label = `${item.name || item.label}: ${item.value}`;
                pdf.text(label.substring(0, 20), chartX + chartWidth - 85, legendY);
              });
            }
          } catch (chartError) {
            // Error rendering chart - using text fallback
            // Fallback to text label
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            const contentColor = getTextColorForTemplate(selectedTemplate);
            pdf.setTextColor(contentColor.r, contentColor.g, contentColor.b);
            pdf.text(`📊 ${slide.charts.title || 'Chart Data'}`, 50, pdfHeight - 60);
          }
        }
        
        // Add slide number with accent color
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(templateStyles.accentR, templateStyles.accentG, templateStyles.accentB);
        pdf.text(`${i + 1} / ${slides.length}`, pdfWidth - 80, pdfHeight - 25);
      }

      console.log(`✅ PDF generation complete! Saving file...`);
      pdf.save(`${prompt.slice(0, 30)}-presentation.pdf`);
      console.log(`🎉 PDF saved successfully!`);
      
      toast({
        title: "📄 PDF Exported with Images!",
        description: "Your professional presentation with images has been downloaded",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export presentation to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPNG = async () => {
    if (!slides.length) return;
    setIsExporting(true);

    try {
      toast({
        title: "🖼️ Exporting to PNG...",
        description: `Capturing ${slides.length} slide${slides.length > 1 ? 's' : ''}. Please wait...`,
      });

      // Get the presentation preview container
      const presentationPreview = document.getElementById('presentation-preview');
      if (!presentationPreview) {
        throw new Error('Presentation preview not found');
      }

      // Use JSZip for multiple slides
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Function to wait for slide to render
      const waitForSlideRender = () => new Promise(resolve => setTimeout(resolve, 500));

      // Get all slide indicator buttons to click through slides
      const slideIndicators = presentationPreview.querySelectorAll('button[class*="rounded-full"]');
      
      if (slideIndicators.length >= slides.length) {
        // Capture each slide by clicking through the indicators
        for (let i = 0; i < slides.length; i++) {
          // Click the slide indicator to switch to this slide
          const indicator = slideIndicators[i] as HTMLButtonElement;
          indicator.click();
          
          // Wait for the slide to render
          await waitForSlideRender();
          
          // Find the slide content container
          const slideContainer = presentationPreview.querySelector('[id="presentation-container"]');
          if (!slideContainer) continue;
          
          // Capture the slide
          const canvas = await html2canvas(slideContainer as HTMLElement, {
            scale: 2,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: true,
            imageTimeout: 15000,
          });

          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
          });

          zip.file(`${prompt.slice(0, 30).trim() || 'presentation'}-slide-${i + 1}.png`, blob);
        }
      } else {
        // Fallback: capture current view only
        const presentationContainer = document.getElementById('presentation-container');
        if (!presentationContainer) {
          throw new Error('Presentation container not found');
        }

        const canvas = await html2canvas(presentationContainer, {
          scale: 2,
          backgroundColor: null,
          logging: false,
          useCORS: true,
          allowTaint: true,
          imageTimeout: 15000,
        });

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
        });

        zip.file(`${prompt.slice(0, 30).trim() || 'presentation'}-slide.png`, blob);
      }

      // Download the result
      if (slides.length === 1) {
        // Single slide - download directly
        const files = Object.keys(zip.files);
        if (files.length > 0) {
          const blob = await zip.files[files[0]].async('blob');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${prompt.slice(0, 30).trim() || 'presentation'}-slide.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Multiple slides - download as ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${prompt.slice(0, 30).trim() || 'presentation'}-slides.zip`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "✅ PNG Export Complete!",
        description: slides.length > 1 
          ? `${slides.length} slides exported as PNG images in a ZIP file`
          : "Slide exported as PNG image",
      });
    } catch (error) {
      console.error('PNG export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export presentation to PNG. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPPTX = async () => {
    if (!slides.length) return;
    setIsExporting(true);

    try {
      // Dynamically create a new instance of PptxGen
      const PptxGenJSModule = await import('pptxgenjs');
      const pptx = new PptxGenJSModule.default();
      pptx.layout = SLIDE_LAYOUT;
      const margins = insetMargins();
      
      // Define master slide with template colors
      const templateStyles = getTemplateColors(selectedTemplate);

      console.log(`📊 Exporting ${slides.length} slides to PPTX...`);
      
      // Generate slides
      for (let index = 0; index < slides.length; index++) {
        const slide = slides[index];
        const pptxSlide = pptx.addSlide();

        // Set slide background
        pptxSlide.background = { color: templateStyles.background };

        // Determine layout based on content
        const hasImage = !!slide.image;
        const hasChart = !!slide.charts;
        const hasBullets = slide.bullets && Array.isArray(slide.bullets) && slide.bullets.length > 0;
        const isCover = index === 0;

        // DEBUG: Log image status
        console.log(`📊 Slide ${index + 1}:`, {
          hasImage,
          imageUrl: slide.image?.substring(0, 60) + '...',
          hasBullets,
          hasChart
        });

        // --- COVER SLIDE LAYOUT ---
        if (isCover) {
          const coverTitleFit = fitTextInBox({
            text: slide.title || '',
            fontSize: FONT.coverTitle,
            minFontSize: FONT.title,
            boxW: COVER.title.w,
            boxH: COVER.title.h,
            lineSpacing: LINE.title,
          });
          pptxSlide.addText(slide.title, {
            x: COVER.title.x,
            y: COVER.title.y,
            w: COVER.title.w,
            h: COVER.title.h,
            fontSize: coverTitleFit.fontSize,
            bold: true,
            color: templateStyles.textColor,
            fontFace: FONT_FACE,
            valign: 'middle',
            align: 'left',
            margin: margins,
          });

          if (slide.content) {
            pptxSlide.addText(slide.content, {
              x: COVER.subtitle.x,
              y: COVER.subtitle.y,
              w: COVER.subtitle.w,
              h: COVER.subtitle.h,
              fontSize: FONT.subtitle,
              color: templateStyles.accentColor,
              fontFace: FONT_FACE,
              valign: 'top',
              align: 'left',
              lineSpacing: LINE.body,
              margin: margins,
            });
          }

          if (hasImage && slide.image) {
            try {
              let imagePath = slide.image;
              let isBase64 = false;
              
              if (slide.image.startsWith('http')) {
                try {
                  console.log(`🖼️ Fetching cover image via proxy...`);
                  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(slide.image)}`;
                  const proxyResponse = await fetch(proxyUrl);
                  
                  if (proxyResponse.ok) {
                    const proxyData = await proxyResponse.json();
                    if (proxyData.success && proxyData.dataUrl) {
                      imagePath = proxyData.dataUrl;
                      isBase64 = true;
                      console.log(`✅ Cover image fetched via proxy`);
                    }
                  }
                } catch (e) {
                  console.warn('Cover image fetch failed, using URL:', e);
                }
              } else if (slide.image.startsWith('data:image')) {
                isBase64 = true;
              }

              pptxSlide.addImage({
                [isBase64 ? 'data' : 'path']: imagePath,
                x: COVER.image.x,
                y: COVER.image.y,
                w: COVER.image.w,
                h: COVER.image.h,
                sizing: { type: 'cover', w: COVER.image.w, h: COVER.image.h }
              });
            } catch (e) {
              console.error('Error adding cover image:', e);
            }
          }
        } 
        // --- CONTENT SLIDE LAYOUT ---
        else {
          const titleFit = fitTextInBox({
            text: slide.title || '',
            fontSize: FONT.title,
            minFontSize: FONT.MIN_BODY,
            boxW: CONTENT.title.w,
            boxH: CONTENT.title.h,
            lineSpacing: LINE.title,
          });
          pptxSlide.addText(slide.title, {
            x: CONTENT.title.x,
            y: CONTENT.title.y,
            w: CONTENT.title.w,
            h: CONTENT.title.h,
            fontSize: titleFit.fontSize,
            bold: true,
            color: templateStyles.textColor,
            fontFace: FONT_FACE,
            valign: 'top',
            margin: margins,
          });

          let contentY = CONTENT.body_split.y;
          const contentWidth = hasImage ? SPLIT.textW : SAFE.w;
          const bulletBoxH = hasImage ? CONTENT.bullets_split.h : CONTENT.bullets_full.h;

          // Content/Description
          if (slide.content) {
            const bodyFit = fitTextInBox({
              text: slide.content,
              fontSize: FONT.body,
              minFontSize: FONT.MIN_BODY,
              boxW: contentWidth,
              boxH: hasImage ? CONTENT.body_split.h : CONTENT.body_full.h,
              lineSpacing: LINE.body,
            });
            pptxSlide.addText(slide.content, {
              x: PAD.left,
              y: contentY,
              w: contentWidth,
              h: bodyFit.expandedH,
              fontSize: bodyFit.fontSize,
              color: templateStyles.textColor,
              fontFace: FONT_FACE,
              valign: 'top',
              lineSpacing: bodyFit.lineSpacing,
              margin: margins,
            });
            contentY += bodyFit.expandedH + 0.1;
          }

          // Bullets
          if (hasBullets) {
            const bulletFit = fitBullets({
              bullets: slide.bullets,
              fontSize: FONT.bullet,
              minFontSize: FONT.MIN_BULLET,
              boxW: contentWidth,
              boxH: bulletBoxH,
              lineSpacing: LINE.bullet,
              paraSpaceBefore: PARA_BEFORE.bullet,
            });
            pptxSlide.addText(slide.bullets.map((bullet: string) => ({
              text: bullet,
              options: { fontSize: bulletFit.fontSize, color: templateStyles.textColor, breakLine: true }
            })), {
              x: PAD.left,
              y: contentY,
              w: contentWidth,
              h: bulletFit.expandedH,
              fontFace: FONT_FACE,
              bullet: { type: 'number', marginPt: 20 },
              valign: 'top',
              lineSpacing: bulletFit.lineSpacing,
              paraSpaceBefore: PARA_BEFORE.bullet,
              margin: margins,
            });
          }

          // Image (Right side)
          if (hasImage && slide.image) {
            try {
              let imagePath = slide.image;
              let isBase64 = false;
              
              if (slide.image.startsWith('http')) {
                try {
                  console.log(`🖼️ Fetching slide ${index + 1} image via proxy...`);
                  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(slide.image)}`;
                  const proxyResponse = await fetch(proxyUrl);
                  
                  if (proxyResponse.ok) {
                    const proxyData = await proxyResponse.json();
                    if (proxyData.success && proxyData.dataUrl) {
                      imagePath = proxyData.dataUrl;
                      isBase64 = true;
                      console.log(`✅ Slide ${index + 1} image fetched via proxy`);
                    }
                  }
                } catch (e) {
                  console.warn(`Image fetch failed for slide ${index + 1}, using URL:`, e);
                }
              } else if (slide.image.startsWith('data:image')) {
                isBase64 = true;
              }

              pptxSlide.addImage({
                [isBase64 ? 'data' : 'path']: imagePath,
                x: CONTENT.image.x,
                y: CONTENT.image.y,
                w: CONTENT.image.w,
                h: CONTENT.image.h,
                sizing: { type: 'cover', w: CONTENT.image.w, h: CONTENT.image.h },
                rounding: true
              });
            } catch (e) {
              console.error('Error adding slide image:', e);
            }
          }

          // Chart (if exists)
          if (hasChart && slide.charts && slide.charts.data) {
             try {
                const chartData = slide.charts.data;
                const chartLabels = chartData.map((item: any) => item.name || item.label);
                const chartValues = chartData.map((item: any) => item.value || item.data);
                
                const chartX = hasImage ? PAD.left : SPLIT.imageX;
                const chartW = hasImage ? SPLIT.textW : SPLIT.imageW + 1;
                const chartY = hasBullets ? (CONTENT.bullets_split.y + CONTENT.bullets_split.h + 0.2) : contentY;

                pptxSlide.addChart(pptx.charts.BAR, [
                  { name: slide.charts.title || 'Data', labels: chartLabels, values: chartValues }
                ], {
                  x: chartX,
                  y: chartY,
                  w: chartW,
                  h: 3,
                  chartColors: [templateStyles.accentColor]
                });
             } catch (e) { console.error('Chart error', e); }
          }
        }

        // Slide Number
        pptxSlide.addText(`${index + 1} / ${slides.length}`, {
          x: SAFE.w - 0.5,
          y: SAFE.h + PAD.top - 0.1,
          w: 1.3,
          h: 0.3,
          fontSize: FONT.slideNum,
          color: templateStyles.accentColor,
          align: 'right',
          fontFace: FONT_FACE,
        });
      }

      console.log(`✅ PPT generation complete! Saving file...`);
      await pptx.writeFile({
        fileName: `${prompt.slice(0, 30).trim() || 'Presentation'}.pptx`
      });
      console.log(`🎉 PPT saved successfully!`);

      toast({
        title: "📊 PowerPoint Exported!",
        description: "Your presentation has been downloaded.",
      });
    } catch (error) {
      console.error("PPTX export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export presentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      // Do not reset input immediately so user can download again if needed
      // resetToInput(); 
    }
  };

  const resetToInput = () => {
    setCurrentStep('input');
    setSlideOutlines([]);
    setSlides([]);
    setPrompt("");
    setWebsiteUrl("");
    setExtractedContent("");
    setShareUrl('');
    setPresentationId('');
  };

  const saveAndSharePresentation = async (isPublic: boolean = true) => {
    if (!slides.length) return;
    
    setIsSaving(true);
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        console.log('Session:', session);
        toast({
          title: "Authentication Required",
          description: "Please sign in to save and share presentations.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/presentations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: prompt.slice(0, 100) || 'Untitled Presentation',
          slides,
          template: selectedTemplate,
          prompt,
          isPublic
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save presentation');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setPresentationId(data.id);

      if (isPublic) {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: "🎉 Presentation Shared!",
          description: "Share link copied to clipboard. Anyone can now view your presentation!",
        });
      } else {
        toast({
          title: "💾 Presentation Saved!",
          description: "Your presentation has been saved privately.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save presentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Check out this presentation!');
    const body = encodeURIComponent(`I created this amazing presentation using DraftDeckAI. Check it out:\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Check out this presentation I created with DraftDeckAI: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent('Check out this amazing presentation I created with DraftDeckAI!');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent('Check out this presentation I created with DraftDeckAI!');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DraftDeckAI Presentation',
          text: 'Check out this presentation I created!',
          url: shareUrl
        });
        toast({
          title: "Shared successfully!",
          description: "Presentation shared via Web Share API",
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      toast({
        title: "Not supported",
        description: "Web Share API is not supported on this device",
        variant: "destructive",
      });
    }
  };

  const goToThemeSelection = () => {
    setCurrentStep('theme');
  };

  const applyNewThemeToSlides = async () => {
    if (!slides.length || !slideOutlines.length) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStage('🎨 Applying new theme...');

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 300);

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
        clearInterval(progressInterval);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to apply new theme');
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStage('✅ Theme Applied!');
      
      setSlides(data.slides);
      setCurrentStep('generated');

      toast({
        title: "🎨 Theme Applied Successfully!",
        description: `Your presentation now uses the ${selectedTemplate} theme!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to apply new theme. Please try again.",
        variant: "destructive",
      });
      setCurrentStep('generated');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStage('');
    }
  };

  const getTemplateBackground = (template: string) => {
    const backgrounds = {
      'modern-business': { 
        r: 248, g: 250, b: 252,
        titleR: 30, titleG: 58, titleB: 138,
        accentR: 59, accentG: 130, accentB: 246
      },
      'creative-gradient': { 
        r: 252, g: 248, b: 255,
        titleR: 124, titleG: 45, titleB: 146,
        accentR: 168, accentG: 85, accentB: 247
      },
      'minimalist-pro': { 
        r: 249, g: 250, b: 251,
        titleR: 55, titleG: 65, titleB: 81,
        accentR: 107, accentG: 114, accentB: 128
      },
      'tech-modern': { 
        r: 15, g: 23, b: 42,
        titleR: 255, titleG: 255, titleB: 255,
        accentR: 6, accentG: 182, accentB: 212
      },
      'elegant-dark': { 
        r: 17, g: 24, b: 39,
        titleR: 255, titleG: 255, titleB: 255,
        accentR: 251, accentG: 191, accentB: 36
      },
      'startup-pitch': { 
        r: 240, g: 253, b: 244,
        titleR: 6, titleG: 95, titleB: 70,
        accentR: 16, accentG: 185, accentB: 129
      }
    };
    return backgrounds[template as keyof typeof backgrounds] || backgrounds['modern-business'];
  };

  const getTextColorForTemplate = (template: string) => {
    const textColors = {
      'modern-business': { r: 30, g: 58, b: 138 },      // Dark blue
      'creative-gradient': { r: 124, g: 45, b: 146 },   // Purple
      'minimalist-pro': { r: 55, g: 65, b: 81 },        // Dark gray
      'tech-modern': { r: 226, g: 232, b: 240 },        // Light gray for dark bg
      'elegant-dark': { r: 226, g: 232, b: 240 },       // Light gray for dark bg
      'startup-pitch': { r: 6, g: 95, b: 70 }           // Dark green
    };
    return textColors[template as keyof typeof textColors] || textColors['modern-business'];
  };

  const getTemplateColors = (template: string) => {
    const colors = {
      'modern-business': { background: 'F8FAFC', textColor: '1E3A8A', accentColor: '3B82F6' },
      'creative-gradient': { background: 'FCF8FF', textColor: '7C2D92', accentColor: 'A855F7' },
      'minimalist-pro': { background: 'F9FAFB', textColor: '374151', accentColor: '6B7280' },
      'tech-modern': { background: '0F172A', textColor: 'FFFFFF', accentColor: '06B6D4' },
      'elegant-dark': { background: '111827', textColor: 'FFFFFF', accentColor: 'FBBF24' },
      'startup-pitch': { background: 'F0FDF4', textColor: '065F46', accentColor: '10B981' }
    };
    return colors[template as keyof typeof colors] || colors['modern-business'];
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-4 mb-4 sm:mb-6 md:mb-8 overflow-x-auto pb-2 px-2">
      <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-full transition-all whitespace-nowrap ${
        currentStep === 'input' ? 'bolt-gradient text-white shadow-lg' : 'glass-effect hover:scale-105'
      }`}>
        <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        <span className="text-[10px] sm:text-xs md:text-sm font-medium">1. Describe</span>
      </div>
      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
      <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-full transition-all whitespace-nowrap ${
        currentStep === 'outline' ? 'bolt-gradient text-white shadow-lg' : 'glass-effect hover:scale-105'
      }`}>
        <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        <span className="text-[10px] sm:text-xs md:text-sm font-medium">2. AI Structure</span>
      </div>
      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
      <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-full transition-all whitespace-nowrap ${
        currentStep === 'theme' ? 'bolt-gradient text-white shadow-lg' : 'glass-effect hover:scale-105'
      }`}>
        <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        <span className="text-[10px] sm:text-xs md:text-sm font-medium">3. Style</span>
      </div>
      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
      <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-full transition-all whitespace-nowrap ${
        currentStep === 'generated' ? 'bolt-gradient text-white shadow-lg' : 'glass-effect hover:scale-105'
      }`}>
        <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        <span className="text-[10px] sm:text-xs md:text-sm font-medium">4. Present</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {renderStepIndicator()}

      {/* Step 1: Input */}
      {currentStep === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-effect mb-3 sm:mb-4 shimmer">
                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                <span className="text-xs sm:text-sm font-medium">AI-Powered Creation</span>
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 bolt-gradient-text">
                What&apos;s your presentation about?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Our AI will create a professional presentation with Canva-style design, 
                high-quality images, and meaningful charts
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageCount" className="text-sm font-medium flex items-center gap-2">
                  <Slides className="h-4 w-4 text-muted-foreground" />
                  Number of Slides
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="pageCount"
                    type="number"
                    min="1"
                    max={isPro ? MAX_PRO_PAGES : MAX_FREE_PAGES}
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.min(parseInt(e.target.value) || 1, isPro ? MAX_PRO_PAGES : MAX_FREE_PAGES))}
                    className="w-24 glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20"
                    disabled={isGenerating || isFetchingUrl}
                  />
                  {!isPro && (
                    <div className="flex items-center text-xs text-muted-foreground glass-effect px-3 py-2 rounded-full">
                      <Lock className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Max {MAX_FREE_PAGES} slides (Pro: {MAX_PRO_PAGES})</span>
                      <span className="sm:hidden">Max {MAX_FREE_PAGES}</span>
                    </div>
                  )}
                </div>
              </div>

              <UrlInputSection
                prompt={prompt}
                setPrompt={setPrompt}
                isGenerating={isGenerating}
              />

              <Button
                onClick={generateSlideOutlines}
                disabled={isGenerating || isFetchingUrl || !prompt.trim()}
                className="w-full bolt-gradient text-white font-semibold py-4 rounded-xl hover:scale-105 transition-all duration-300 bolt-glow relative overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2 relative z-10">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>AI is analyzing your topic...</span>
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
          </div>

          <div className="space-y-4">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect mb-3">
                <Star className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium">Professional Features</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bolt-gradient-text">Canva-Style Quality</h2>
            </div>

            <Card className="glass-effect border border-yellow-400/20 p-6 relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-10"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bolt-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Professional Images</h3>
                    <p className="text-sm text-muted-foreground">High-quality Pexels images selected by AI for each slide</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bolt-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Interactive Charts</h3>
                    <p className="text-sm text-muted-foreground">Meaningful data visualizations with professional styling</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bolt-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Canva-Style Design</h3>
                    <p className="text-sm text-muted-foreground">Professional templates with consistent branding</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bolt-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    <Play className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Full-Screen Presentation</h3>
                    <p className="text-sm text-muted-foreground">Present like a pro with smooth transitions and controls</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Outline Preview */}
      {currentStep === 'outline' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">AI Structure Complete</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bolt-gradient-text">
              🎯 Perfect! Your presentation structure is ready
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Our AI analyzed your topic and created an intelligent slide flow with professional images, 
              meaningful charts, and compelling content. Now choose your style!
            </p>
          </div>

          <SlideOutlinePreview outlines={slideOutlines} />

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={resetToInput}
              variant="outline"
              className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
            >
              ← Edit Description
            </Button>
            <Button
              onClick={goToThemeSelection}
              className="bolt-gradient text-white font-semibold hover:scale-105 transition-all duration-300"
            >
              <Palette className="mr-2 h-4 w-4" />
              Choose Professional Style →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Theme Selection */}
      {currentStep === 'theme' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4">
              <Palette className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Professional Templates</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bolt-gradient-text">
              🎨 Choose your professional style
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Select a Canva-style template that matches your audience and purpose. 
              Each template includes optimized colors, typography, and visual elements.
            </p>
          </div>

          <PresentationTemplates
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => setCurrentStep(slides.length > 0 ? 'generated' : 'outline')}
              variant="outline"
              className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
            >
              ← Back to Structure
            </Button>
            <Button
              onClick={slides.length > 0 ? applyNewThemeToSlides : generateFullPresentation}
              disabled={isGenerating}
              className="bolt-gradient text-white font-semibold hover:scale-105 transition-all duration-300 px-8 py-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {slides.length > 0 ? 'Applying theme...' : 'Creating your presentation...'}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {slides.length > 0 ? 'Apply This Theme' : 'Generate Professional Presentation'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Loading State with Progress */}
      {isGenerating && currentStep === 'generated' && (
        <div className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <div className="glass-effect p-8 sm:p-12 rounded-2xl border border-yellow-400/30 text-center">
              {/* Animated Icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bolt-gradient rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative bolt-gradient p-4 rounded-full animate-bounce">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Stage Text */}
              <h3 className="text-xl sm:text-2xl font-bold mb-3 bolt-gradient-text">
                {generationStage || 'Creating Your Presentation...'}
              </h3>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bolt-gradient transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(generationProgress)}% Complete
                </p>
              </div>

              {/* Feature List */}
              <div className="grid grid-cols-2 gap-4 mt-8 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Unique Images</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>AI Content</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Pro Design</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>Charts & Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Generated Presentation */}
      {currentStep === 'generated' && !isGenerating && slides.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Professional Presentation Ready!</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bolt-gradient-text">
              🎉 Your Canva-Style Presentation is Ready!
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Complete with professional design, high-quality images, interactive charts, and compelling content. 
              Present in full-screen mode or export to PowerPoint!
            </p>
          </div>

          {slides.length > 0 && (
            <div id="presentation-preview" className="glass-effect border border-yellow-400/20 rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 shimmer opacity-10"></div>
              <div className="relative z-10">
                <PresentationPreview 
                  slides={slides} 
                  template={selectedTemplate}
                  onSlidesUpdate={setSlides}
                  allowImageEditing={true}
                />
              </div>
            </div>
          )}

          {/* Enhanced Share Section with Dialog */}
          {shareUrl && (
            <div className="glass-effect p-6 rounded-xl border border-green-400/20 bg-green-50/10">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect mb-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Presentation Shared</span>
                </div>
                <h3 className="text-lg font-semibold bolt-gradient-text">Your presentation is live!</h3>
                <p className="text-sm text-muted-foreground">Share it with the world</p>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg"
                />
                <Button onClick={copyShareLink} size="sm" variant="outline" title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => window.open(shareUrl, '_blank')} 
                  size="sm"
                  variant="outline"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Advanced Share Options Dialog */}
              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bolt-gradient text-white"
                    size="lg"
                  >
                    <Share2 className="mr-2 h-5 w-5" />
                    More Sharing Options
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bolt-gradient-text">Share Presentation</DialogTitle>
                    <DialogDescription>
                      Share your presentation across multiple platforms
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    {/* Link Section */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Share Link</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg"
                        />
                        <Button onClick={copyShareLink} size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Social Media Grid */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Share Via</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={shareViaEmail}
                          variant="outline"
                          className="justify-start h-auto py-3 hover:border-blue-400/50 hover:bg-blue-50/10"
                        >
                          <Mail className="mr-2 h-5 w-5 text-blue-600" />
                          <span>Email</span>
                        </Button>
                        
                        <Button
                          onClick={shareViaWhatsApp}
                          variant="outline"
                          className="justify-start h-auto py-3 hover:border-green-400/50 hover:bg-green-50/10"
                        >
                          <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
                          <span>WhatsApp</span>
                        </Button>
                        
                        <Button
                          onClick={shareViaTwitter}
                          variant="outline"
                          className="justify-start h-auto py-3 hover:border-sky-400/50 hover:bg-sky-50/10"
                        >
                          <Twitter className="mr-2 h-5 w-5 text-sky-500" />
                          <span>Twitter</span>
                        </Button>
                        
                        <Button
                          onClick={shareViaLinkedIn}
                          variant="outline"
                          className="justify-start h-auto py-3 hover:border-blue-400/50 hover:bg-blue-50/10"
                        >
                          <Linkedin className="mr-2 h-5 w-5 text-blue-700" />
                          <span>LinkedIn</span>
                        </Button>
                        
                        <Button
                          onClick={shareViaFacebook}
                          variant="outline"
                          className="justify-start h-auto py-3 hover:border-blue-400/50 hover:bg-blue-50/10"
                        >
                          <Facebook className="mr-2 h-5 w-5 text-blue-600" />
                          <span>Facebook</span>
                        </Button>
                        
                        <Button
                          onClick={shareViaTelegram}
                          variant="outline"
                          className="justify-start h-auto py-3 hover:border-sky-400/50 hover:bg-sky-50/10"
                        >
                          <Send className="mr-2 h-5 w-5 text-sky-500" />
                          <span>Telegram</span>
                        </Button>
                      </div>
                    </div>

                    {/* Web Share API (Mobile) */}
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <Button
                        onClick={shareViaWebShare}
                        variant="outline"
                        className="w-full justify-center h-auto py-3 border-purple-400/30 hover:border-purple-400/50 hover:bg-purple-50/10"
                      >
                        <Share2 className="mr-2 h-5 w-5 text-purple-600" />
                        <span>Share via System</span>
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={resetToInput}
              variant="outline"
              className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
            >
              <Brain className="mr-2 h-4 w-4" />
              Create New Presentation
            </Button>
            <Button
              onClick={() => setCurrentStep('theme')}
              variant="outline"
              className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
            >
              <Palette className="mr-2 h-4 w-4" />
              Change Style
            </Button>
            
            {/* Share button */}
            {!shareUrl && (
              <Button
                onClick={() => saveAndSharePresentation(true)}
                disabled={isSaving}
                className="bolt-gradient text-white font-semibold hover:scale-105 transition-all duration-300"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Share Presentation
              </Button>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={exportToPNG}
                disabled={isExporting}
                variant="outline"
                className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                PNG
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={isExporting}
                variant="outline"
                className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                PDF
              </Button>
              <Button
                onClick={exportToPPTX}
                disabled={isExporting}
                variant="outline"
                className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                PowerPoint
              </Button>
            </div>
          </div>

          {/* AI Assistant for Real-Time Edits */}
          <AIPresentationAssistant
            slides={slides}
            onSlidesUpdate={setSlides}
            template={selectedTemplate}
            prompt={prompt}
          />
        </div>
      )}
    </div>
  );
}
