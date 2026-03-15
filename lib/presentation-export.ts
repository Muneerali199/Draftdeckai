import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  SLIDE_LAYOUT, PAD, SAFE, SPLIT, COVER, CONTENT,
  FONT, LINE, PARA_BEFORE, FONT_FACE, insetMargins,
  fitTextInBox, fitBullets,
} from '@/lib/slide-layout-tokens';

/**
 * Export presentation to various formats
 */

export interface ExportOptions {
  format: 'png' | 'pdf' | 'pptx';
  quality?: number;
  includeSlideNumbers?: boolean;
}

/**
 * Export single slide as PNG
 */
export async function exportSlideAsPNG(
  slideElement: HTMLElement,
  slideName: string = 'slide'
): Promise<void> {
  try {
    const canvas = await html2canvas(slideElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      proxy: '/api/proxy-image', // Use our proxy for external images
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slideName}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png', 1.0);
  } catch (error) {
    console.error('Error exporting slide as PNG:', error);
    throw new Error('Failed to export slide as PNG');
  }
}

/**
 * Export all slides as PNG (ZIP)
 */
export async function exportAllSlidesAsPNG(
  slideElements: HTMLElement[],
  presentationName: string = 'presentation'
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (let i = 0; i < slideElements.length; i++) {
    try {
      const canvas = await html2canvas(slideElements[i], {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });

      zip.file(`slide-${i + 1}.png`, blob);
    } catch (error) {
      console.error(`Error exporting slide ${i + 1}:`, error);
    }
  }

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${presentationName}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export presentation as PDF
 */
export async function exportAsPDF(
  slideElements: HTMLElement[],
  presentationName: string = 'presentation'
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1920, 1080], // 16:9 aspect ratio
    });

    for (let i = 0; i < slideElements.length; i++) {
      const canvas = await html2canvas(slideElements[i], {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (i > 0) {
        pdf.addPage();
      }

      // Add image to PDF (fill the page)
      pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080, undefined, 'FAST');
    }

    pdf.save(`${presentationName}.pdf`);
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    throw new Error('Failed to export as PDF');
  }
}

/**
 * Export presentation as PPTX
 */
/**
 * Helper to convert URL to Base64
 */
async function getBase64FromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image to base64:', error);
    return '';
  }
}

/**
 * Helper to normalize hex color to 6 digits
 */
function normalizeHex(hex: string): string {
  if (!hex) return 'FFFFFF';
  
  // Remove hash and whitespace
  hex = hex.replace('#', '').trim();
  
  // Expand 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  return hex.toUpperCase();
}

/**
 * Export presentation as PPTX (Native)
 */
export async function exportAsPPTX(
  slideElements: HTMLElement[],
  presentationName: string = 'presentation',
  slides?: any[],
  theme?: any
): Promise<void> {
  try {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();

    pptx.layout = SLIDE_LAYOUT;
    pptx.author = 'DraftDeckAI';
    pptx.company = 'DraftDeckAI';
    pptx.revision = '1';
    pptx.subject = presentationName;
    pptx.title = presentationName;

    // Determine Global Theme Colors
    let globalBgColor = 'FFFFFF';
    let globalTextColor = '000000';

    console.log('🎨 Exporting PPTX with theme:', theme);

    if (theme && theme.colors) {
      // Explicit overrides for known dark themes
      if (theme.id === 'alien' || theme.id === 'fluo' || theme.id === 'vortex' || theme.type === 'dark') {
         // Force valid dark hexes
         if (theme.id === 'alien') globalBgColor = '000000';
         else if (theme.id === 'fluo') globalBgColor = '111111';
         else if (theme.id === 'vortex') globalBgColor = '020617';
         else globalBgColor = normalizeHex(theme.colors.background);
         
         // Ensure text is light
         globalTextColor = 'FFFFFF'; 
      } else {
         globalBgColor = normalizeHex(theme.colors.background);
         globalTextColor = normalizeHex(theme.colors.foreground);
      }
    }

    console.log('🎨 Calculated Colors - BG:', globalBgColor, 'Text:', globalTextColor);

    // Safety check: Ensure contrast
    if (globalBgColor === 'FFFFFF' && globalTextColor === 'FFFFFF') {
      globalTextColor = '000000';
    }
    if ((globalBgColor === '000000' || globalBgColor === '111111' || globalBgColor === '020617') && globalTextColor === '000000') {
      globalTextColor = 'FFFFFF';
    }

    // If no structured data is provided, fall back to image capture (legacy)
    if (!slides || slides.length === 0) {
      console.warn('No structured slide data provided, falling back to image capture');
      for (let i = 0; i < slideElements.length; i++) {
        const canvas = await html2canvas(slideElements[i], {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        const slide = pptx.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
      }
    } else {
      // Native Generation
      for (const slideData of slides) {
        const slide = pptx.addSlide();
        
        // 1. Set Native Background Property
        slide.background = { color: globalBgColor };
        
        // 2. Add Full-Screen Rectangle (Absolute Failsafe)
        // This physically covers the white slide with the theme color
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: { color: globalBgColor },
          line: { width: 0 } // No border
        });

        const textColor = globalTextColor;
        const hasImage = !!slideData.imageUrl;
        const margins = insetMargins();

        // Title
        const titleFit = fitTextInBox({
          text: slideData.title || '',
          fontSize: FONT.title,
          minFontSize: FONT.MIN_BODY,
          boxW: CONTENT.title.w,
          boxH: CONTENT.title.h,
          lineSpacing: LINE.title,
        });
        slide.addText(slideData.title, {
          x: CONTENT.title.x, y: CONTENT.title.y,
          w: CONTENT.title.w, h: CONTENT.title.h,
          fontSize: titleFit.fontSize,
          bold: true,
          color: textColor,
          align: 'center',
          fontFace: FONT_FACE,
          lineSpacingMultiple: 1.1,
          margin: margins,
        });

        // Subtitle
        if (slideData.subtitle) {
          slide.addText(slideData.subtitle, {
            x: PAD.left, y: 1.9, w: SAFE.w, h: 0.6,
            fontSize: FONT.subtitle,
            color: textColor,
            align: 'center',
            fontFace: FONT_FACE,
            margin: margins,
          });
        }

        // Dynamic Y position after title area
        const bodyY = slideData.subtitle ? 2.6 : 2.0;
        const bodyW = hasImage ? SPLIT.textW : SAFE.w;
        const bodyH = hasImage ? CONTENT.bullets_split.h : CONTENT.bullets_full.h;

        // Main Content
        if (slideData.content) {
          const bodyFit = fitTextInBox({
            text: slideData.content,
            fontSize: FONT.body,
            minFontSize: FONT.MIN_BODY,
            boxW: bodyW,
            boxH: bodyH,
            lineSpacing: LINE.body,
          });
          slide.addText(slideData.content, {
            x: PAD.left, y: bodyY, w: bodyW, h: bodyFit.expandedH,
            fontSize: bodyFit.fontSize,
            color: textColor,
            align: 'left',
            fontFace: FONT_FACE,
            valign: 'top',
            lineSpacing: bodyFit.lineSpacing,
            margin: margins,
          });
        }

        // Bullets
        if (slideData.bullets && slideData.bullets.length > 0) {
          const bulletFit = fitBullets({
            bullets: slideData.bullets,
            fontSize: FONT.bullet,
            minFontSize: FONT.MIN_BULLET,
            boxW: bodyW,
            boxH: bodyH,
            lineSpacing: LINE.bullet,
            paraSpaceBefore: PARA_BEFORE.bullet,
          });
          const bulletItems = slideData.bullets.map((b: string) => ({
            text: b,
            options: { fontSize: bulletFit.fontSize, color: textColor, breakLine: true }
          }));
          slide.addText(bulletItems, {
            x: PAD.left, y: bodyY, w: bodyW, h: bulletFit.expandedH,
            align: 'left',
            bullet: true,
            fontFace: FONT_FACE,
            valign: 'top',
            lineSpacing: bulletFit.lineSpacing,
            paraSpaceBefore: PARA_BEFORE.bullet,
            margin: margins,
          });
        }

        // Image
        if (slideData.imageUrl) {
          try {
            const base64Data = await getBase64FromUrl(slideData.imageUrl);
            if (base64Data) {
              slide.addImage({
                data: base64Data,
                x: CONTENT.image.x, y: CONTENT.image.y,
                w: CONTENT.image.w, h: CONTENT.image.h,
                sizing: { type: 'contain', w: CONTENT.image.w, h: CONTENT.image.h }
              });
            }
          } catch (err) {
            console.error('Failed to add image to slide:', err);
          }
        }
      }
    }

    await pptx.writeFile({ fileName: `${presentationName}.pptx` });
  } catch (error) {
    console.error('Error exporting as PPTX:', error);
    throw new Error('Failed to export as PPTX');
  }
}

/**
 * Main export function
 */
export async function exportPresentation(
  slideElements: HTMLElement[],
  presentationName: string,
  options: ExportOptions,
  slides?: any[],
  theme?: any
): Promise<void> {
  if (slideElements.length === 0) {
    throw new Error('No slides to export');
  }

  switch (options.format) {
    case 'png':
      if (slideElements.length === 1) {
        await exportSlideAsPNG(slideElements[0], presentationName);
      } else {
        await exportAllSlidesAsPNG(slideElements, presentationName);
      }
      break;

    case 'pdf':
      await exportAsPDF(slideElements, presentationName);
      break;

    case 'pptx':
      await exportAsPPTX(slideElements, presentationName, slides, theme);
      break;

    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}
