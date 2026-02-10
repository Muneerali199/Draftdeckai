import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Premium Presentation Export System
 * Creates stunning exports that match the preview quality
 */

export interface PremiumExportOptions {
  format: 'png' | 'pdf' | 'pptx';
  quality?: 'standard' | 'high' | 'ultra';
  includeAnimations?: boolean;
  preserveGradients?: boolean;
}

interface SlideData {
  slideNumber: number;
  type: string;
  title: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  stats?: { value: string; label: string; context?: string }[];
  comparison?: { leftTitle?: string; rightTitle?: string; left: string[]; right: string[] };
  timeline?: { date: string; title: string; description?: string }[];
  mockup?: { type: string; title?: string; elements: { type: string; content: string }[] };
  icons?: { icon: string; label: string }[];
  testimonial?: { quote: string; author: string; role?: string };
  chartData?: any;
  imageUrl?: string;
  cta?: string;
}

interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  accent: string;
  border: string;
}

/**
 * Get scale factor based on quality setting
 */
function getScaleFactor(quality: string): number {
  switch (quality) {
    case 'ultra': return 4;
    case 'high': return 3;
    default: return 2;
  }
}

/**
 * Wait for all images and fonts to load
 */
async function waitForResources(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });
  
  await Promise.all(imagePromises);
  
  // Wait for fonts
  if (document.fonts) {
    await document.fonts.ready;
  }
  
  // Small delay for CSS animations to settle
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Hide UI elements that shouldn't appear in exports
 * Returns array of hidden elements for later restoration
 */
function hideUIElementsForExport(element: HTMLElement): HTMLElement[] {
  const hiddenElements: HTMLElement[] = [];

  // Primary selector: data-export-hide attribute (most reliable)
  const dataHideElements = element.querySelectorAll('[data-export-hide="true"]');
  dataHideElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.dataset.originalDisplay = htmlEl.style.display;
    htmlEl.style.display = 'none';
    hiddenElements.push(htmlEl);
  });

  // Fallback: Find elements by text content
  const allElements = element.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    const text = htmlEl.innerText?.trim();
    
    // Skip if already hidden or if it's a text node inside something already hidden
    if (htmlEl.style.display === 'none' || !text) return;
    
    // Hide "SLIDE X" badges
    if (/^SLIDE\s*\d+$/i.test(text)) {
      htmlEl.dataset.originalDisplay = htmlEl.style.display;
      htmlEl.style.display = 'none';
      hiddenElements.push(htmlEl);
      return;
    }
    
    // Hide "Click to edit" text
    if (/click to edit/i.test(text) && text.length < 50) {
      htmlEl.dataset.originalDisplay = htmlEl.style.display;
      htmlEl.style.display = 'none';
      hiddenElements.push(htmlEl);
    }
  });

  // Hide group-hover elements that only show on hover
  const hoverElements = element.querySelectorAll('[class*="group-hover"]');
  hoverElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style.display !== 'none') {
      htmlEl.dataset.originalDisplay = htmlEl.style.display;
      htmlEl.style.display = 'none';
      hiddenElements.push(htmlEl);
    }
  });

  // Hide any edit indicators
  const editIndicators = element.querySelectorAll('[class*="edit-indicator"], [data-edit-indicator]');
  editIndicators.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style.display !== 'none') {
      htmlEl.dataset.originalDisplay = htmlEl.style.display;
      htmlEl.style.display = 'none';
      hiddenElements.push(htmlEl);
    }
  });

  return hiddenElements;
}

/**
 * Restore hidden UI elements after export
 */
function showUIElementsAfterExport(elements: HTMLElement[]): void {
  elements.forEach(el => {
    el.style.display = el.dataset.originalDisplay || '';
    delete el.dataset.originalDisplay;
  });
}

/**
 * Helper function to hide UI elements that shouldn't appear in exports
 */
function hideUIElementsInExport(el: HTMLElement): void {
  // Hide edit buttons and controls
  const controlElements = el.querySelectorAll('button, [class*="edit"], [class*="control"]');
  controlElements.forEach(elem => {
    (elem as HTMLElement).style.display = 'none';
  });
  
  // Hide slide number badges
  const allDivs = el.querySelectorAll('div');
  allDivs.forEach(div => {
    const text = (div as HTMLElement).innerText?.trim();
    if (text && /^SLIDE\s*\d+$/i.test(text)) {
      (div as HTMLElement).style.display = 'none';
    }
  });
}

/**
 * Premium PNG Export - High quality with all effects
 */
export async function exportPremiumPNG(
  slideElements: HTMLElement[],
  presentationName: string,
  options: PremiumExportOptions = { format: 'png', quality: 'high' }
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const scale = getScaleFactor(options.quality || 'high');

  for (let i = 0; i < slideElements.length; i++) {
    const element = slideElements[i];
    
    // Wait for resources
    await waitForResources(element);
    
    // Clone element to avoid modifying original
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.animation = 'none';
    clone.style.width = '1920px';
    clone.style.height = '1080px';
    clone.style.position = 'fixed';
    clone.style.left = '-10000px';
    clone.style.top = '0';
    clone.style.margin = '0';
    
    // Hide UI elements that shouldn't be in export
    hideUIElementsForExport(clone);
    
    // Temporarily append to get computed styles
    document.body.appendChild(clone);
    
    try {
      const canvas = await html2canvas(clone, {
        scale: scale,
        backgroundColor: null, // Preserve transparent backgrounds
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        width: 1920,
        height: 1080,
        windowWidth: 1920,
        windowHeight: 1080,
        onclone: (clonedDoc) => {
          // Hide UI elements in the cloned document
          const clonedElement = clonedDoc.body.querySelector('[data-slide-card]') || clonedDoc.body.firstElementChild;
          if (clonedElement) {
            hideUIElementsInExport(clonedElement as HTMLElement);
            (clonedElement as HTMLElement).style.backdropFilter = 'none';
          }
          
          // Also hide slide badges by finding them directly
          const badges = clonedDoc.querySelectorAll('div');
          badges.forEach(el => {
            const text = el.innerText?.trim();
            if (text && /^SLIDE\s*\d+$/i.test(text)) {
              el.style.display = 'none';
            }
          });
        }
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });

      zip.file(`${presentationName}-slide-${i + 1}.png`, blob);
    } finally {
      document.body.removeChild(clone);
    }
  }

  if (slideElements.length === 1) {
    // Single slide - download directly
    const files = zip.files;
    const fileName = Object.keys(files)[0];
    const blob = await files[fileName].async('blob');
    downloadBlob(blob, `${presentationName}.png`);
  } else {
    // Multiple slides - download as ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    downloadBlob(zipBlob, `${presentationName}-slides.zip`);
  }
}

/**
 * Premium PDF Export - High quality landscape slides
 */
export async function exportPremiumPDF(
  slideElements: HTMLElement[],
  presentationName: string,
  options: PremiumExportOptions = { format: 'pdf', quality: 'high' }
): Promise<void> {
  const scale = getScaleFactor(options.quality || 'high');
  
  // Create PDF with 16:9 aspect ratio
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080],
    compress: true,
    hotfixes: ['px_scaling']
  });

  for (let i = 0; i < slideElements.length; i++) {
    const element = slideElements[i];
    
    // Clone and enforce standard HD resolution
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.animation = 'none';
    clone.style.width = '1920px';
    clone.style.height = '1080px';
    clone.style.position = 'fixed';
    clone.style.left = '-10000px';
    clone.style.top = '0';
    clone.style.margin = '0';
    
    // Hide UI elements before capture
    hideUIElementsForExport(clone);
    
    document.body.appendChild(clone);
    
    try {
      await waitForResources(clone);
      
      const canvas = await html2canvas(clone, {
        scale: scale,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        width: 1920,
        height: 1080,
        windowWidth: 1920,
        windowHeight: 1080,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      if (i > 0) {
        pdf.addPage([1920, 1080], 'landscape');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080, undefined, 'MEDIUM');
    } finally {
      // Clean up clone
      document.body.removeChild(clone);
    }
  }

  pdf.save(`${presentationName}.pdf`);
}

/**
 * Premium PPTX Export - Native PowerPoint with rich formatting
 */
export async function exportPremiumPPTX(
  slides: SlideData[],
  presentationName: string,
  theme: { id: string; name: string; colors: ThemeColors; type: string },
  options: PremiumExportOptions = { format: 'pptx', quality: 'high' }
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  // Setup presentation
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'DraftDeckAI';
  pptx.company = 'DraftDeckAI';
  pptx.title = presentationName;
  pptx.subject = 'AI Generated Presentation';

  // Theme colors
  const bgColor = normalizeHex(theme.colors.background);
  const textColor = normalizeHex(theme.colors.foreground);
  const accentColor = normalizeHex(theme.colors.accent);
  const cardColor = normalizeHex(theme.colors.card);

  // Define master slide with theme
  pptx.defineSlideMaster({
    title: 'DRAFTDECKAI_MASTER',
    background: { color: bgColor },
    objects: [
      // Decorative gradient circle (top right)
      {
        rect: { 
          x: 8, y: -1, w: 3, h: 3,
          fill: { color: accentColor, transparency: 85 }
        }
      }
    ]
  });

  for (const slideData of slides) {
    const slide = pptx.addSlide({ masterName: 'DRAFTDECKAI_MASTER' });
    
    // Background
    slide.background = { color: bgColor };
    
    // Add decorative elements based on slide type
    addDecorativeElements(slide, pptx, slideData.type, accentColor, bgColor);
    
    // Slide number badge
    slide.addText(`SLIDE ${slideData.slideNumber}`, {
      x: 8.5, y: 0.3, w: 1.3, h: 0.4,
      fontSize: 10,
      bold: true,
      color: textColor,
      fill: { color: cardColor, transparency: 50 },
      align: 'center',
      valign: 'middle'
    });

    // Render based on slide type
    if (slideData.type === 'hero' || slideData.type === 'cover' || slideData.type === 'title') {
      renderHeroSlide(slide, pptx, slideData, textColor, accentColor, cardColor);
    } else if (slideData.stats && slideData.stats.length > 0) {
      renderStatsSlide(slide, pptx, slideData, textColor, accentColor, cardColor);
    } else if (slideData.comparison) {
      renderComparisonSlide(slide, pptx, slideData, textColor, accentColor, cardColor);
    } else if (slideData.timeline && slideData.timeline.length > 0) {
      renderTimelineSlide(slide, pptx, slideData, textColor, accentColor, cardColor);
    } else if (slideData.testimonial) {
      renderTestimonialSlide(slide, pptx, slideData, textColor, accentColor, cardColor);
    } else {
      renderContentSlide(slide, pptx, slideData, textColor, accentColor, cardColor);
    }
  }

  await pptx.writeFile({ fileName: `${presentationName}.pptx` });
}

/**
 * Add decorative background elements
 */
function addDecorativeElements(
  slide: any, 
  pptx: any, 
  slideType: string, 
  accentColor: string,
  bgColor: string
): void {
  // Top-right gradient blob
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 7.5, y: -1, w: 3.5, h: 3.5,
    fill: { color: accentColor, transparency: 90 },
    line: { width: 0 }
  });
  
  // Bottom-left gradient blob
  slide.addShape(pptx.ShapeType.ellipse, {
    x: -1, y: 4, w: 2.5, h: 2.5,
    fill: { color: accentColor, transparency: 92 },
    line: { width: 0 }
  });
}

/**
 * Render Hero/Cover slide
 */
function renderHeroSlide(
  slide: any,
  pptx: any,
  data: SlideData,
  textColor: string,
  accentColor: string,
  cardColor: string
): void {
  // Large centered title
  slide.addText(data.title, {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 48,
    bold: true,
    color: textColor,
    align: 'center',
    fontFace: 'Arial'
  });

  // Subtitle
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.5, y: 3.5, w: 9, h: 0.8,
      fontSize: 24,
      color: textColor,
      align: 'center',
      fontFace: 'Arial',
      transparency: 20
    });
  }

  // CTA Button
  if (data.cta) {
    slide.addText(data.cta, {
      x: 3.5, y: 4.5, w: 3, h: 0.6,
      fontSize: 16,
      bold: true,
      color: bgColorToTextColor(accentColor),
      fill: { color: accentColor },
      align: 'center',
      valign: 'middle',
      shape: pptx.ShapeType.roundRect,
      rectRadius: 0.2
    });
  }
}

/**
 * Render Stats/KPI slide with cards
 */
function renderStatsSlide(
  slide: any,
  pptx: any,
  data: SlideData,
  textColor: string,
  accentColor: string,
  cardColor: string
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32,
    bold: true,
    color: textColor,
    fontFace: 'Arial'
  });

  if (!data.stats) return;

  const statsCount = data.stats.length;
  const cardWidth = statsCount <= 2 ? 3.5 : statsCount === 3 ? 2.8 : 2.2;
  const startX = (10 - (cardWidth * statsCount + 0.3 * (statsCount - 1))) / 2;

  data.stats.forEach((stat, idx) => {
    const x = startX + idx * (cardWidth + 0.3);
    
    // Card background with glassmorphism effect
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x, y: 1.8, w: cardWidth, h: 2.8,
      fill: { color: cardColor, transparency: 70 },
      line: { color: accentColor, width: 1, transparency: 70 },
      rectRadius: 0.15
    });

    // Icon placeholder (circle)
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + cardWidth/2 - 0.35, y: 2, w: 0.7, h: 0.7,
      fill: { color: accentColor, transparency: 80 },
      line: { color: accentColor, width: 1, transparency: 50 }
    });

    // Stat value with gradient-like effect
    slide.addText(stat.value, {
      x: x, y: 2.8, w: cardWidth, h: 0.8,
      fontSize: 36,
      bold: true,
      color: accentColor,
      align: 'center',
      fontFace: 'Arial'
    });

    // Stat label
    slide.addText(stat.label, {
      x: x, y: 3.6, w: cardWidth, h: 0.5,
      fontSize: 14,
      color: textColor,
      align: 'center',
      fontFace: 'Arial'
    });

    // Context
    if (stat.context) {
      slide.addText(stat.context, {
        x: x, y: 4.1, w: cardWidth, h: 0.4,
        fontSize: 10,
        color: textColor,
        align: 'center',
        fontFace: 'Arial',
        transparency: 40
      });
    }
  });
}

/**
 * Render Comparison slide
 */
function renderComparisonSlide(
  slide: any,
  pptx: any,
  data: SlideData,
  textColor: string,
  accentColor: string,
  cardColor: string
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32,
    bold: true,
    color: textColor,
    fontFace: 'Arial'
  });

  if (!data.comparison) return;

  // Left card (Before)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 1.5, w: 4.5, h: 3.5,
    fill: { color: cardColor, transparency: 70 },
    line: { color: 'EF4444', width: 2 }, // Red border
    rectRadius: 0.15
  });

  slide.addText(data.comparison.leftTitle || 'Before', {
    x: 0.5, y: 1.6, w: 4.5, h: 0.5,
    fontSize: 20,
    bold: true,
    color: 'EF4444',
    align: 'center',
    fontFace: 'Arial'
  });

  // Left items
  const leftBullets = data.comparison.left.map(item => ({
    text: `• ${item}`,
    options: { fontSize: 14, color: textColor, breakLine: true }
  }));
  slide.addText(leftBullets, {
    x: 0.7, y: 2.2, w: 4.1, h: 2.5,
    fontFace: 'Arial',
    valign: 'top'
  });

  // Right card (After)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.2, y: 1.5, w: 4.5, h: 3.5,
    fill: { color: accentColor, transparency: 90 },
    line: { color: '22C55E', width: 2 }, // Green border
    rectRadius: 0.15
  });

  slide.addText(data.comparison.rightTitle || 'After', {
    x: 5.2, y: 1.6, w: 4.5, h: 0.5,
    fontSize: 20,
    bold: true,
    color: '22C55E',
    align: 'center',
    fontFace: 'Arial'
  });

  // Right items
  const rightBullets = data.comparison.right.map(item => ({
    text: `✓ ${item}`,
    options: { fontSize: 14, color: textColor, breakLine: true }
  }));
  slide.addText(rightBullets, {
    x: 5.4, y: 2.2, w: 4.1, h: 2.5,
    fontFace: 'Arial',
    valign: 'top'
  });
}

/**
 * Render Timeline slide
 */
function renderTimelineSlide(
  slide: any,
  pptx: any,
  data: SlideData,
  textColor: string,
  accentColor: string,
  cardColor: string
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32,
    bold: true,
    color: textColor,
    fontFace: 'Arial'
  });

  if (!data.timeline) return;

  // Vertical line
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.2, y: 1.5, w: 0.05, h: 3.5,
    fill: { color: accentColor, transparency: 60 },
    line: { width: 0 }
  });

  data.timeline.forEach((item, idx) => {
    const y = 1.6 + idx * 1.1;

    // Circle node
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.95, y: y, w: 0.5, h: 0.5,
      fill: { color: accentColor },
      line: { width: 0 }
    });

    // Date inside circle
    slide.addText(item.date, {
      x: 0.95, y: y, w: 0.5, h: 0.5,
      fontSize: 8,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fontFace: 'Arial'
    });

    // Content card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.7, y: y - 0.1, w: 7.5, h: 0.9,
      fill: { color: cardColor, transparency: 70 },
      line: { color: accentColor, width: 1, transparency: 80 },
      rectRadius: 0.1
    });

    // Title
    slide.addText(item.title, {
      x: 1.9, y: y, w: 7, h: 0.4,
      fontSize: 14,
      bold: true,
      color: textColor,
      fontFace: 'Arial'
    });

    // Description
    if (item.description) {
      slide.addText(item.description, {
        x: 1.9, y: y + 0.4, w: 7, h: 0.35,
        fontSize: 11,
        color: textColor,
        fontFace: 'Arial',
        transparency: 30
      });
    }
  });
}

/**
 * Render Testimonial slide
 */
function renderTestimonialSlide(
  slide: any,
  pptx: any,
  data: SlideData,
  textColor: string,
  accentColor: string,
  cardColor: string
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32,
    bold: true,
    color: textColor,
    fontFace: 'Arial'
  });

  if (!data.testimonial) return;

  // Quote card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1, y: 1.5, w: 8, h: 3,
    fill: { color: cardColor, transparency: 70 },
    line: { color: accentColor, width: 1, transparency: 70 },
    rectRadius: 0.2
  });

  // Large quote mark
  slide.addText('"', {
    x: 1.2, y: 1.3, w: 1, h: 1,
    fontSize: 72,
    color: accentColor,
    fontFace: 'Georgia',
    transparency: 70
  });

  // Quote text
  slide.addText(data.testimonial.quote, {
    x: 1.5, y: 2, w: 7, h: 1.5,
    fontSize: 18,
    italic: true,
    color: textColor,
    fontFace: 'Georgia',
    align: 'center',
    valign: 'middle'
  });

  // Author avatar circle
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 4.3, y: 3.6, w: 0.6, h: 0.6,
    fill: { color: accentColor },
    line: { width: 0 }
  });

  // Author initial
  slide.addText(data.testimonial.author.charAt(0).toUpperCase(), {
    x: 4.3, y: 3.6, w: 0.6, h: 0.6,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial'
  });

  // Author name
  slide.addText(data.testimonial.author, {
    x: 5, y: 3.65, w: 3, h: 0.3,
    fontSize: 14,
    bold: true,
    color: textColor,
    fontFace: 'Arial'
  });

  // Author role
  if (data.testimonial.role) {
    slide.addText(data.testimonial.role, {
      x: 5, y: 3.95, w: 3, h: 0.25,
      fontSize: 11,
      color: textColor,
      fontFace: 'Arial',
      transparency: 40
    });
  }
}

/**
 * Render standard content slide
 */
function renderContentSlide(
  slide: any,
  pptx: any,
  data: SlideData,
  textColor: string,
  accentColor: string,
  cardColor: string
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32,
    bold: true,
    color: textColor,
    fontFace: 'Arial'
  });

  // Subtitle
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.5, y: 1.2, w: 9, h: 0.5,
      fontSize: 18,
      color: textColor,
      fontFace: 'Arial',
      transparency: 20
    });
  }

  // Content or Bullets
  const contentY = data.subtitle ? 1.9 : 1.5;
  
  if (data.bullets && data.bullets.length > 0) {
    data.bullets.forEach((bullet, idx) => {
      const y = contentY + idx * 0.8;
      
      // Bullet card
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.5, y: y, w: 9, h: 0.7,
        fill: { color: cardColor, transparency: 80 },
        line: { color: accentColor, width: 1, transparency: 85 },
        rectRadius: 0.1
      });

      // Number circle
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 0.7, y: y + 0.1, w: 0.5, h: 0.5,
        fill: { color: accentColor, transparency: 80 },
        line: { color: accentColor, width: 1, transparency: 60 }
      });

      slide.addText(`${idx + 1}`, {
        x: 0.7, y: y + 0.1, w: 0.5, h: 0.5,
        fontSize: 14,
        bold: true,
        color: accentColor,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial'
      });

      // Clean bullet text (remove icon markers)
      const cleanText = bullet.replace(/<Icon:\w+>\s*/g, '').replace(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[✓•⚡🛡️👥🌍🎯🚀❤️⭐📈⏰🔒🏆💡📊💰📱☁️💻🎨]\s*/u, '');
      
      slide.addText(cleanText, {
        x: 1.4, y: y + 0.15, w: 7.8, h: 0.5,
        fontSize: 16,
        color: textColor,
        fontFace: 'Arial',
        valign: 'middle'
      });
    });
  } else if (data.content) {
    slide.addText(data.content, {
      x: 0.5, y: contentY, w: 9, h: 3,
      fontSize: 16,
      color: textColor,
      fontFace: 'Arial',
      valign: 'top'
    });
  }

  // CTA
  if (data.cta) {
    slide.addText(data.cta + ' →', {
      x: 3.5, y: 4.5, w: 3, h: 0.5,
      fontSize: 14,
      bold: true,
      color: bgColorToTextColor(accentColor),
      fill: { color: textColor },
      align: 'center',
      valign: 'middle',
      shape: pptx.ShapeType.roundRect,
      rectRadius: 0.2
    });
  }
}

/**
 * Normalize hex color
 */
function normalizeHex(hex: string): string {
  if (!hex) return 'FFFFFF';
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  return hex.toUpperCase();
}

/**
 * Get contrasting text color for background
 */
function bgColorToTextColor(bgHex: string): string {
  const hex = normalizeHex(bgHex);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '000000' : 'FFFFFF';
}

/**
 * Download blob helper
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Main premium export function
 */
export async function exportPremiumPresentation(
  slideElements: HTMLElement[],
  slides: SlideData[],
  presentationName: string,
  theme: { id: string; name: string; colors: ThemeColors; type: string },
  options: PremiumExportOptions
): Promise<void> {
  if (!slideElements.length && !slides.length) {
    throw new Error('No slides to export');
  }

  switch (options.format) {
    case 'png':
      await exportPremiumPNG(slideElements, presentationName, options);
      break;

    case 'pdf':
      await exportPremiumPDF(slideElements, presentationName, options);
      break;

    case 'pptx':
      await exportPremiumPPTX(slides, presentationName, theme, options);
      break;

    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}
