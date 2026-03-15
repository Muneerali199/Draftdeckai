/**
 * Slide Layout Tokens — single source of truth for preview ↔ PPTX export parity.
 *
 * All spatial values are in **inches** targeting PptxGenJS `LAYOUT_WIDE` (13.33″ × 7.5″).
 * Font sizes are in **points**.
 *
 * The preview component (`presentation-preview.tsx`) uses Tailwind:
 *   p-12 → ~5.6 % horizontal padding  →  0.75″
 *   grid-cols-5, col-span-3 / col-span-2  →  60 % / 40 %
 *   gap-8 → ~3.75 %  →  0.5″
 *
 * These tokens mirror those proportions so the exported PPTX matches the on-screen layout.
 */

// ---------------------------------------------------------------------------
// Slide dimensions
// ---------------------------------------------------------------------------
export const SLIDE_W = 13.33;
export const SLIDE_H = 7.5;
export const SLIDE_LAYOUT = 'LAYOUT_WIDE' as const;

// ---------------------------------------------------------------------------
// Padding & safe area
// ---------------------------------------------------------------------------
export const PAD = {
  left: 0.75,
  right: 0.75,
  top: 0.6,
  bottom: 0.5,
} as const;

export const SAFE = {
  x: PAD.left,
  y: PAD.top,
  w: SLIDE_W - PAD.left - PAD.right,   // 11.83
  h: SLIDE_H - PAD.top - PAD.bottom,   // 6.4
} as const;

export const GAP = 0.5; // gap between text column and image column

// ---------------------------------------------------------------------------
// Content / image split (60 % / 40 % of safe area, minus gap)
// ---------------------------------------------------------------------------
const splitContentRatio = 3 / 5;
const availableForSplit = SAFE.w - GAP;

const _splitTextW = +(availableForSplit * splitContentRatio).toFixed(2);
const _splitImageW = +(availableForSplit * (1 - splitContentRatio)).toFixed(2);

export const SPLIT = {
  textW: _splitTextW,         // ~6.80
  imageW: _splitImageW,       // ~4.53
  imageX: +(PAD.left + _splitTextW + GAP).toFixed(2), // ~8.05
} as const;

// ---------------------------------------------------------------------------
// Region tokens — cover slide
// ---------------------------------------------------------------------------
export const COVER = {
  title:    { x: PAD.left, y: 1.5,  w: SPLIT.textW, h: 2.5 },
  subtitle: { x: PAD.left, y: 4.2,  w: SPLIT.textW, h: 1.5 },
  image:    { x: SPLIT.imageX, y: 0, w: SLIDE_W - SPLIT.imageX, h: SLIDE_H },
} as const;

// ---------------------------------------------------------------------------
// Region tokens — content slide
// ---------------------------------------------------------------------------
export const CONTENT = {
  title:         { x: PAD.left, y: PAD.top, w: SAFE.w,      h: 1.2 },
  body_split:    { x: PAD.left, y: 1.9,     w: SPLIT.textW, h: 1.5 },
  body_full:     { x: PAD.left, y: 1.9,     w: SAFE.w,      h: 2.0 },
  bullets_split: { x: PAD.left, y: 2.0,     w: SPLIT.textW, h: 4.2 },
  bullets_full:  { x: PAD.left, y: 2.0,     w: SAFE.w,      h: 4.5 },
  image:         { x: SPLIT.imageX, y: 1.0, w: SPLIT.imageW, h: 5.5 },
} as const;

// ---------------------------------------------------------------------------
// Font sizes (pt) — aligned with preview CSS rendered sizes
// ---------------------------------------------------------------------------
export const FONT = {
  coverTitle: 44,
  title:      36,
  subtitle:   24,
  body:       18,
  bullet:     16,
  caption:    12,
  slideNum:   10,
  MIN_BODY:   12,
  MIN_BULLET: 11,
} as const;

// ---------------------------------------------------------------------------
// Line spacing (pt) and paragraph spacing
// ---------------------------------------------------------------------------
export const LINE = {
  title:  52,
  body:   28,
  bullet: 26,
} as const;

export const PARA_BEFORE = {
  title:  0,
  body:   6,
  bullet: 8,
} as const;

// ---------------------------------------------------------------------------
// Internal text-box margins — eliminates platform-default drift
// ---------------------------------------------------------------------------
export const INSETS = {
  left:   0.1,
  right:  0.1,
  top:    0.05,
  bottom: 0.05,
} as const;

/**
 * Return INSETS as a [top, right, bottom, left] tuple in inches,
 * suitable for the PptxGenJS `margin` text option.
 */
export function insetMargins(): [number, number, number, number] {
  return [INSETS.top, INSETS.right, INSETS.bottom, INSETS.left];
}

// ---------------------------------------------------------------------------
// Font family — matches Calibri in PPTX, which closely approximates Inter in
// the browser preview.
// ---------------------------------------------------------------------------
export const FONT_FACE = 'Calibri';

// ---------------------------------------------------------------------------
// Text-fit utilities
// ---------------------------------------------------------------------------

interface FitResult {
  fontSize: number;
  lineSpacing: number;
  needsExpand: boolean;
  expandedH: number;
}

/**
 * Estimate whether `text` fits inside a box at the given font size and, if
 * not, shrink the font (down to `minFontSize`) or flag that the box must grow.
 *
 * Uses the Calibri average character width heuristic (≈ 0.52 × fontSize in pt
 * → width in pt, converted to inches via /72).
 */
export function fitTextInBox(params: {
  text: string;
  fontSize: number;
  minFontSize: number;
  boxW: number;
  boxH: number;
  lineSpacing: number;
  bulletIndent?: number;
}): FitResult {
  const { text, minFontSize, boxW, boxH, bulletIndent = 0 } = params;
  let fs = params.fontSize;
  let ls = params.lineSpacing;

  const effectiveInsets = (INSETS.left + INSETS.right);

  while (fs >= minFontSize) {
    const avgCharW = (fs * 0.52) / 72; // inches per char
    const effectiveW = boxW - bulletIndent - effectiveInsets;
    const charsPerLine = Math.floor(effectiveW / avgCharW);
    if (charsPerLine < 1) break;

    const lines = text.split('\n').reduce(
      (sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)),
      0,
    );
    const heightInches = lines * (ls / 72);

    if (heightInches <= boxH) {
      return { fontSize: fs, lineSpacing: ls, needsExpand: false, expandedH: boxH };
    }
    fs -= 2;
    ls = Math.round(fs * 1.55);
  }

  // At minimum size — compute needed height
  const avgCharW = (minFontSize * 0.52) / 72;
  const effectiveW = boxW - bulletIndent - effectiveInsets;
  const charsPerLine = Math.max(1, Math.floor(effectiveW / avgCharW));
  const lines = text.split('\n').reduce(
    (sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)),
    0,
  );
  const minLs = Math.round(minFontSize * 1.55);
  const needed = lines * (minLs / 72);

  return {
    fontSize: minFontSize,
    lineSpacing: minLs,
    needsExpand: needed > boxH,
    expandedH: Math.max(boxH, needed),
  };
}

/**
 * Fit an array of bullet strings inside a text box, accounting for
 * per-bullet paragraph spacing overhead.
 */
export function fitBullets(params: {
  bullets: string[];
  fontSize: number;
  minFontSize: number;
  boxW: number;
  boxH: number;
  lineSpacing: number;
  paraSpaceBefore: number;
}): FitResult {
  const combined = params.bullets.join('\n');
  const overhead = params.bullets.length * (params.paraSpaceBefore / 72);
  return fitTextInBox({
    text: combined,
    fontSize: params.fontSize,
    minFontSize: params.minFontSize,
    boxW: params.boxW,
    boxH: params.boxH - overhead,
    lineSpacing: params.lineSpacing,
    bulletIndent: 0.35,
  });
}
