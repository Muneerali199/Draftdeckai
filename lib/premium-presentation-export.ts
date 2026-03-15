import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  SLIDE_W, SLIDE_H, SLIDE_LAYOUT, PAD, SAFE, SPLIT, GAP, COVER, CONTENT,
  FONT, LINE, PARA_BEFORE, FONT_FACE, INSETS, insetMargins,
  fitTextInBox, fitBullets,
} from '@/lib/slide-layout-tokens';

/**
 * Premium Presentation Export System
 * Creates stunning exports that match the preview quality
 */

export interface PremiumExportOptions {
  format: 'png' | 'pdf' | 'pptx';
  quality?: 'standard' | 'high' | 'ultra';
  includeAnimations?: boolean;
  preserveGradients?: boolean;
  captureMode?: 'preview-parity' | 'legacy-fixed';
  targetSize?: { width: number; height: number };
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

    // Guard for late-loading web fonts that can still mutate layout after fonts.ready.
    const fontsApi = document.fonts as FontFaceSet & { status?: string };
    if (fontsApi.status && fontsApi.status !== 'loaded') {
      await Promise.race([
        fontsApi.ready,
        new Promise(resolve => setTimeout(resolve, 1200)),
      ]);
    }
  }

  // Allow a couple of paint ticks so font metrics and computed layout settle.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Small delay for CSS transitions to settle
  await new Promise(resolve => setTimeout(resolve, 80));
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

function getTargetSize(options: PremiumExportOptions): { width: number; height: number } {
  const width = options.targetSize?.width ?? 1920;
  const height = options.targetSize?.height ?? 1080;
  return {
    width: Math.max(320, Math.round(width)),
    height: Math.max(180, Math.round(height)),
  };
}

function normalizeCanvasToTarget(
  sourceCanvas: HTMLCanvasElement,
  targetSize: { width: number; height: number }
): HTMLCanvasElement {
  const target = document.createElement('canvas');
  target.width = targetSize.width;
  target.height = targetSize.height;
  const ctx = target.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, target.width, target.height);

  const scale = Math.min(
    target.width / sourceCanvas.width,
    target.height / sourceCanvas.height
  );
  const drawW = Math.round(sourceCanvas.width * scale);
  const drawH = Math.round(sourceCanvas.height * scale);
  const x = Math.round((target.width - drawW) / 2);
  const y = Math.round((target.height - drawH) / 2);

  ctx.drawImage(sourceCanvas, x, y, drawW, drawH);
  return target;
}

async function captureSlideParityCanvas(
  element: HTMLElement,
  scale: number
): Promise<{ canvas: HTMLCanvasElement; measured: { width: number; height: number } }> {
  const rect = element.getBoundingClientRect();
  const measured = {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.animation = 'none';
  clone.style.width = `${measured.width}px`;
  clone.style.height = `${measured.height}px`;
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.margin = '0';
  clone.style.maxWidth = `${measured.width}px`;
  clone.style.maxHeight = `${measured.height}px`;
  clone.style.overflow = 'hidden';
  clone.setAttribute('data-export-mode', 'pdf');
  clone.style.setProperty('--dd-export-target-w', `${measured.width}px`);
  clone.style.setProperty('--dd-export-target-h', `${measured.height}px`);
  clone.style.setProperty('--dd-export-scale', String(scale));

  hideUIElementsForExport(clone);
  document.body.appendChild(clone);

  try {
    await waitForResources(clone);

    const canvas = await html2canvas(clone, {
      scale,
      backgroundColor: null,
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 20000,
      width: measured.width,
      height: measured.height,
      windowWidth: measured.width,
      windowHeight: measured.height,
      onclone: (clonedDoc) => {
        const clonedElement =
          (clonedDoc.body.querySelector('[data-slide-card]') as HTMLElement | null) ||
          (clonedDoc.body.firstElementChild as HTMLElement | null);
        if (clonedElement) {
          clonedElement.setAttribute('data-export-mode', 'pdf');
          hideUIElementsInExport(clonedElement);
          clonedElement.style.backdropFilter = 'none';
        }
      },
    });

    if (process.env.NODE_ENV === 'development') {
      const measuredRatio = measured.width / measured.height;
      const canvasRatio = canvas.width / canvas.height;
      const titleRect = element.querySelector('[data-slide-title]')?.getBoundingClientRect();
      const bodyRect = element.querySelector('[data-slide-body]')?.getBoundingClientRect();
      const visualRect = element.querySelector('[data-slide-visual]')?.getBoundingClientRect();
      const bulletsRect = element.querySelector('[data-slide-bullets]')?.getBoundingClientRect();
      console.debug('[Export parity]', {
        measuredWidth: measured.width,
        measuredHeight: measured.height,
        measuredRatio,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasRatio,
        regions: {
          title: titleRect ? { x: Math.round(titleRect.x), y: Math.round(titleRect.y), w: Math.round(titleRect.width), h: Math.round(titleRect.height) } : null,
          body: bodyRect ? { x: Math.round(bodyRect.x), y: Math.round(bodyRect.y), w: Math.round(bodyRect.width), h: Math.round(bodyRect.height) } : null,
          visual: visualRect ? { x: Math.round(visualRect.x), y: Math.round(visualRect.y), w: Math.round(visualRect.width), h: Math.round(visualRect.height) } : null,
          bullets: bulletsRect ? { x: Math.round(bulletsRect.x), y: Math.round(bulletsRect.y), w: Math.round(bulletsRect.width), h: Math.round(bulletsRect.height) } : null,
        },
      });
    }

    return { canvas, measured };
  } finally {
    document.body.removeChild(clone);
  }
}

async function captureSlideLegacyCanvas(
  element: HTMLElement,
  scale: number
): Promise<HTMLCanvasElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.animation = 'none';
  clone.style.width = '1920px';
  clone.style.height = '1080px';
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.margin = '0';

  hideUIElementsForExport(clone);
  document.body.appendChild(clone);

  try {
    await waitForResources(clone);

    return await html2canvas(clone, {
      scale,
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
  } finally {
    document.body.removeChild(clone);
  }
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
  const captureMode = options.captureMode || 'preview-parity';
  const targetSize = getTargetSize(options);
  
  // Create PDF with 16:9 aspect ratio
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [targetSize.width, targetSize.height],
    compress: true,
    hotfixes: ['px_scaling']
  });

  for (let i = 0; i < slideElements.length; i++) {
    const element = slideElements[i];
    const capturedCanvas =
      captureMode === 'legacy-fixed'
        ? await captureSlideLegacyCanvas(element, scale)
        : (await captureSlideParityCanvas(element, scale)).canvas;

    const normalizedCanvas = normalizeCanvasToTarget(capturedCanvas, targetSize);
    const imgData = normalizedCanvas.toDataURL('image/jpeg', 0.96);

    if (i > 0) {
      pdf.addPage([targetSize.width, targetSize.height], 'landscape');
    }

    pdf.addImage(
      imgData,
      'JPEG',
      0,
      0,
      targetSize.width,
      targetSize.height,
      undefined,
      'MEDIUM'
    );
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
  pptx.layout = SLIDE_LAYOUT;
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
      {
        rect: { 
          x: SLIDE_W - 4, y: -1, w: 4, h: 4,
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
      x: SLIDE_W - 1.8, y: 0.3, w: 1.3, h: 0.4,
      fontSize: FONT.slideNum,
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
  slide.addShape(pptx.ShapeType.ellipse, {
    x: SLIDE_W - 4.5, y: -1, w: 4.5, h: 4.5,
    fill: { color: accentColor, transparency: 90 },
    line: { width: 0 }
  });
  
  slide.addShape(pptx.ShapeType.ellipse, {
    x: -1, y: SLIDE_H - 3, w: 3, h: 3,
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
  const margins = insetMargins();
  slide.addText(data.title, {
    x: PAD.left, y: 2, w: SAFE.w, h: 1.8,
    fontSize: FONT.coverTitle,
    bold: true,
    color: textColor,
    align: 'center',
    fontFace: FONT_FACE,
    margin: margins,
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: PAD.left, y: 4, w: SAFE.w, h: 0.8,
      fontSize: FONT.subtitle,
      color: textColor,
      align: 'center',
      fontFace: FONT_FACE,
      transparency: 20,
      margin: margins,
    });
  }

  if (data.cta) {
    slide.addText(data.cta, {
      x: (SLIDE_W - 3) / 2, y: 5.2, w: 3, h: 0.6,
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
  const margins = insetMargins();
  slide.addText(data.title, {
    x: PAD.left, y: PAD.top, w: SAFE.w, h: 1.0,
    fontSize: FONT.title,
    bold: true,
    color: textColor,
    fontFace: FONT_FACE,
    margin: margins,
  });

  if (!data.stats) return;

  const statsCount = data.stats.length;
  const cardWidth = statsCount <= 2 ? 4.5 : statsCount === 3 ? 3.5 : 2.8;
  const startX = (SLIDE_W - (cardWidth * statsCount + 0.3 * (statsCount - 1))) / 2;

  data.stats.forEach((stat, idx) => {
    const x = startX + idx * (cardWidth + 0.3);
    
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x, y: 2.2, w: cardWidth, h: 3.5,
      fill: { color: cardColor, transparency: 70 },
      line: { color: accentColor, width: 1, transparency: 70 },
      rectRadius: 0.15
    });

    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + cardWidth/2 - 0.35, y: 2.4, w: 0.7, h: 0.7,
      fill: { color: accentColor, transparency: 80 },
      line: { color: accentColor, width: 1, transparency: 50 }
    });

    slide.addText(stat.value, {
      x: x, y: 3.3, w: cardWidth, h: 0.8,
      fontSize: FONT.title,
      bold: true,
      color: accentColor,
      align: 'center',
      fontFace: FONT_FACE,
      margin: margins,
    });

    slide.addText(stat.label, {
      x: x, y: 4.3, w: cardWidth, h: 0.5,
      fontSize: FONT.bullet,
      color: textColor,
      align: 'center',
      fontFace: FONT_FACE,
      margin: margins,
    });

    if (stat.context) {
      slide.addText(stat.context, {
        x: x, y: 4.9, w: cardWidth, h: 0.4,
        fontSize: FONT.slideNum,
        color: textColor,
        align: 'center',
        fontFace: FONT_FACE,
        transparency: 40,
        margin: margins,
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
  const margins = insetMargins();
  const halfW = +((SAFE.w - GAP) / 2).toFixed(2);
  const rightX = +(PAD.left + halfW + GAP).toFixed(2);

  slide.addText(data.title, {
    x: PAD.left, y: PAD.top, w: SAFE.w, h: 1.0,
    fontSize: FONT.title,
    bold: true,
    color: textColor,
    fontFace: FONT_FACE,
    margin: margins,
  });

  if (!data.comparison) return;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: PAD.left, y: 2.0, w: halfW, h: 4.5,
    fill: { color: cardColor, transparency: 70 },
    line: { color: 'EF4444', width: 2 },
    rectRadius: 0.15
  });

  slide.addText(data.comparison.leftTitle || 'Before', {
    x: PAD.left, y: 2.1, w: halfW, h: 0.5,
    fontSize: FONT.body,
    bold: true,
    color: 'EF4444',
    align: 'center',
    fontFace: FONT_FACE,
    margin: margins,
  });

  const leftBullets = data.comparison.left.map(item => ({
    text: `• ${item}`,
    options: { fontSize: FONT.bullet, color: textColor, breakLine: true }
  }));
  slide.addText(leftBullets, {
    x: PAD.left + 0.2, y: 2.7, w: halfW - 0.4, h: 3.5,
    fontFace: FONT_FACE,
    valign: 'top',
    lineSpacing: LINE.bullet,
    margin: margins,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: rightX, y: 2.0, w: halfW, h: 4.5,
    fill: { color: accentColor, transparency: 90 },
    line: { color: '22C55E', width: 2 },
    rectRadius: 0.15
  });

  slide.addText(data.comparison.rightTitle || 'After', {
    x: rightX, y: 2.1, w: halfW, h: 0.5,
    fontSize: FONT.body,
    bold: true,
    color: '22C55E',
    align: 'center',
    fontFace: FONT_FACE,
    margin: margins,
  });

  const rightBullets = data.comparison.right.map(item => ({
    text: `✓ ${item}`,
    options: { fontSize: FONT.bullet, color: textColor, breakLine: true }
  }));
  slide.addText(rightBullets, {
    x: rightX + 0.2, y: 2.7, w: halfW - 0.4, h: 3.5,
    fontFace: FONT_FACE,
    valign: 'top',
    lineSpacing: LINE.bullet,
    margin: margins,
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
  const margins = insetMargins();
  const cardW = SLIDE_W - 2.5 - PAD.right;

  slide.addText(data.title, {
    x: PAD.left, y: PAD.top, w: SAFE.w, h: 1.0,
    fontSize: FONT.title,
    bold: true,
    color: textColor,
    fontFace: FONT_FACE,
    margin: margins,
  });

  if (!data.timeline) return;

  slide.addShape(pptx.ShapeType.rect, {
    x: 1.5, y: 2.0, w: 0.05, h: 4.5,
    fill: { color: accentColor, transparency: 60 },
    line: { width: 0 }
  });

  data.timeline.forEach((item, idx) => {
    const y = 2.1 + idx * 1.2;

    slide.addShape(pptx.ShapeType.ellipse, {
      x: 1.25, y: y, w: 0.5, h: 0.5,
      fill: { color: accentColor },
      line: { width: 0 }
    });

    slide.addText(item.date, {
      x: 1.25, y: y, w: 0.5, h: 0.5,
      fontSize: 8,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fontFace: FONT_FACE
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 2.0, y: y - 0.1, w: cardW, h: 1.0,
      fill: { color: cardColor, transparency: 70 },
      line: { color: accentColor, width: 1, transparency: 80 },
      rectRadius: 0.1
    });

    slide.addText(item.title, {
      x: 2.2, y: y, w: cardW - 0.4, h: 0.45,
      fontSize: FONT.bullet,
      bold: true,
      color: textColor,
      fontFace: FONT_FACE,
      margin: margins,
    });

    if (item.description) {
      slide.addText(item.description, {
        x: 2.2, y: y + 0.45, w: cardW - 0.4, h: 0.4,
        fontSize: FONT.caption,
        color: textColor,
        fontFace: FONT_FACE,
        transparency: 30,
        margin: margins,
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
  const margins = insetMargins();
  const quoteCardW = SAFE.w - 1.0;
  const quoteCardX = PAD.left + 0.5;
  const avatarX = SLIDE_W / 2 - 0.3;

  slide.addText(data.title, {
    x: PAD.left, y: PAD.top, w: SAFE.w, h: 1.0,
    fontSize: FONT.title,
    bold: true,
    color: textColor,
    fontFace: FONT_FACE,
    margin: margins,
  });

  if (!data.testimonial) return;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: quoteCardX, y: 2.0, w: quoteCardW, h: 3.5,
    fill: { color: cardColor, transparency: 70 },
    line: { color: accentColor, width: 1, transparency: 70 },
    rectRadius: 0.2
  });

  slide.addText('"', {
    x: quoteCardX + 0.2, y: 1.8, w: 1, h: 1,
    fontSize: 72,
    color: accentColor,
    fontFace: 'Georgia',
    transparency: 70
  });

  slide.addText(data.testimonial.quote, {
    x: quoteCardX + 0.5, y: 2.5, w: quoteCardW - 1.0, h: 2.0,
    fontSize: FONT.body,
    italic: true,
    color: textColor,
    fontFace: 'Georgia',
    align: 'center',
    valign: 'middle',
    lineSpacing: LINE.body,
    margin: margins,
  });

  slide.addShape(pptx.ShapeType.ellipse, {
    x: avatarX, y: 4.8, w: 0.6, h: 0.6,
    fill: { color: accentColor },
    line: { width: 0 }
  });

  slide.addText(data.testimonial.author.charAt(0).toUpperCase(), {
    x: avatarX, y: 4.8, w: 0.6, h: 0.6,
    fontSize: FONT.body,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: FONT_FACE
  });

  slide.addText(data.testimonial.author, {
    x: avatarX + 0.7, y: 4.85, w: 3, h: 0.3,
    fontSize: FONT.bullet,
    bold: true,
    color: textColor,
    fontFace: FONT_FACE,
    margin: margins,
  });

  if (data.testimonial.role) {
    slide.addText(data.testimonial.role, {
      x: avatarX + 0.7, y: 5.15, w: 3, h: 0.25,
      fontSize: FONT.caption,
      color: textColor,
      fontFace: FONT_FACE,
      transparency: 40,
      margin: margins,
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
  const margins = insetMargins();

  slide.addText(data.title, {
    x: PAD.left, y: PAD.top, w: SAFE.w, h: 1.0,
    fontSize: FONT.title,
    bold: true,
    color: textColor,
    fontFace: FONT_FACE,
    margin: margins,
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: PAD.left, y: 1.5, w: SAFE.w, h: 0.5,
      fontSize: FONT.body,
      color: textColor,
      fontFace: FONT_FACE,
      transparency: 20,
      margin: margins,
    });
  }

  const contentY = data.subtitle ? 2.2 : 1.8;
  
  if (data.bullets && data.bullets.length > 0) {
    data.bullets.forEach((bullet, idx) => {
      const y = contentY + idx * 0.85;
      
      slide.addShape(pptx.ShapeType.roundRect, {
        x: PAD.left, y: y, w: SAFE.w, h: 0.75,
        fill: { color: cardColor, transparency: 80 },
        line: { color: accentColor, width: 1, transparency: 85 },
        rectRadius: 0.1
      });

      slide.addShape(pptx.ShapeType.ellipse, {
        x: PAD.left + 0.2, y: y + 0.12, w: 0.5, h: 0.5,
        fill: { color: accentColor, transparency: 80 },
        line: { color: accentColor, width: 1, transparency: 60 }
      });

      slide.addText(`${idx + 1}`, {
        x: PAD.left + 0.2, y: y + 0.12, w: 0.5, h: 0.5,
        fontSize: FONT.bullet,
        bold: true,
        color: accentColor,
        align: 'center',
        valign: 'middle',
        fontFace: FONT_FACE
      });

      const cleanText = bullet.replace(/<Icon:\w+>\s*/g, '').replace(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[✓•⚡🛡️👥🌍🎯🚀❤️⭐📈⏰🔒🏆💡📊💰📱☁️💻🎨]\s*/u, '');
      
      slide.addText(cleanText, {
        x: PAD.left + 0.9, y: y + 0.12, w: SAFE.w - 1.1, h: 0.5,
        fontSize: FONT.body,
        color: textColor,
        fontFace: FONT_FACE,
        valign: 'middle',
        margin: margins,
      });
    });
  } else if (data.content) {
    const bodyFit = fitTextInBox({
      text: data.content,
      fontSize: FONT.body,
      minFontSize: FONT.MIN_BODY,
      boxW: SAFE.w,
      boxH: 4.0,
      lineSpacing: LINE.body,
    });
    slide.addText(data.content, {
      x: PAD.left, y: contentY, w: SAFE.w, h: bodyFit.expandedH,
      fontSize: bodyFit.fontSize,
      color: textColor,
      fontFace: FONT_FACE,
      valign: 'top',
      lineSpacing: bodyFit.lineSpacing,
      margin: margins,
    });
  }

  if (data.cta) {
    slide.addText(data.cta + ' →', {
      x: (SLIDE_W - 3) / 2, y: 6.2, w: 3, h: 0.5,
      fontSize: FONT.bullet,
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
