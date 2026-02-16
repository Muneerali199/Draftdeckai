'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { exportPremiumPresentation } from '@/lib/premium-presentation-export';
import { createClient } from '@/lib/supabase/client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
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
import { DiagramPreview } from '@/components/diagram/diagram-preview';
import { PresentationVisualFrame } from './visual-frame';
import {
  getSlideMotionTransition,
  getSlideMotionVariants,
  isWheelNavigationLocked,
  PRESENTATION_WHEEL_LOCK_MS,
} from '@/lib/presentation-motion';

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
  visualType?: string;
  visualContent?: string | Record<string, unknown> | null;
  visual_type?: string;
  visual_content?: string | Record<string, unknown> | null;
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

const CODE_VISUAL_TYPES = ['svg_code', 'mermaid', 'html_tailwind', 'chart_data'] as const;
type CodeVisualType = (typeof CODE_VISUAL_TYPES)[number];

function normalizeVisualType(value: unknown): CodeVisualType | '' {
  if (typeof value !== 'string') return '';
  const type = value.trim().toLowerCase();

  if (['svg', 'svg_code', 'svgcode', 'vector'].includes(type)) return 'svg_code';
  if (['mermaid', 'diagram', 'logic'].includes(type)) return 'mermaid';
  if (['html', 'html_tailwind', 'tailwind', 'mockup'].includes(type)) return 'html_tailwind';
  if (['chart', 'chart_data', 'data', 'recharts'].includes(type)) return 'chart_data';

  return '';
}

function sanitizeMarkup(markup: string): string {
  return markup
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+=(["']).*?\1/gi, '')
    .replace(/javascript:/gi, '');
}

function normalizeMermaidMarkup(markup: string): string {
  if (!markup || typeof markup !== 'string') return '';
  return markup
    .replace(/"([^"]*?)\s+Lane"/gi, '"$1"')
    .replace(/\[([^\]]*?)\s+Lane\]/gi, '[$1]')
    .replace(/"governance check"/gi, '"Governance Check"')
    .replace(/"performance tracking"/gi, '"Performance Tracking"')
    .replace(/"optimization cycle"/gi, '"Optimization Cycle"');
}

function buildReadableMermaidFallback(slide: Slide): string {
  const topic = (slide.title || 'Business').replace(/[^\w\s-]/g, '').trim().split(/\s+/).slice(0, 2).join(' ') || 'Business';
  return `flowchart LR
  A[${topic} Signal] --> B[Insight Model]
  B --> C[Priority Plan]
  C --> D[Initiative Launch]
  D --> E[Performance Tracking]
  E --> F[KPI Impact]
  F --> G[Optimization Loop]
  B -. governance check .-> E
  C -. risk review .-> F`;
}

function getRenderableMermaidCode(markup: string, slide: Slide): string {
  const normalized = normalizeMermaidMarkup(markup || '');
  if (!normalized.trim()) return buildReadableMermaidFallback(slide);

  const laneWordCount = (normalized.match(/\b(outcome lane|execution lane|strategy lane)\b/gi) || []).length;
  const laneSubgraphCount = (normalized.match(/subgraph\s+[^\n]*lane/gi) || []).length;
  const nodeCount = (normalized.match(/\[[^\]]+\]/g) || []).length + (normalized.match(/\([^)]+\)/g) || []).length;

  if (laneWordCount >= 2 || laneSubgraphCount >= 2 || nodeCount < 5) {
    return buildReadableMermaidFallback(slide);
  }

  return normalized;
}

function stripThemeVisualWrapper(markup: string): string {
  if (!markup) return '';
  let result = markup.trim();
  let hadThemeWrapper = false;
  result = result.replace(/<style>[\s\S]*?<\/style>/gi, '');
  result = result.replace(/^<div[^>]*data-dd-theme-visual[^>]*>/i, () => {
    hadThemeWrapper = true;
    return '';
  });
  if (hadThemeWrapper) {
    result = result.replace(/<\/div>\s*$/i, '');
  }
  return result.trim();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function toRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function mixHex(baseHex: string, mixHexValue: string, amount: number): string {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHexValue);
  if (!base || !mix) return baseHex;
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(base.r + (mix.r - base.r) * t);
  const g = Math.round(base.g + (mix.g - base.g) * t);
  const b = Math.round(base.b + (mix.b - base.b) * t);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function buildThemeChartPalette(theme: PresentationTheme): string[] {
  return [
    theme.colors.accent,
    mixHex(theme.colors.accent, '#ffffff', 0.2),
    mixHex(theme.colors.accent, '#000000', 0.25),
    mixHex(theme.colors.foreground, theme.colors.accent, 0.35),
    mixHex(theme.colors.muted, theme.colors.accent, 0.45),
  ];
}

function applyThemeToMarkupColors(markup: string, theme: PresentationTheme): string {
  const map: Array<[RegExp, string]> = [
    [/#(?:4f46e5|6366f1|3b82f6|0ea5e9|38bdf8|2563eb|1d4ed8)/gi, theme.colors.accent],
    [/#(?:10b981|22c55e|16a34a|059669)/gi, mixHex(theme.colors.accent, '#22c55e', 0.35)],
    [/#(?:f59e0b|f97316|fb923c|fbbf24)/gi, mixHex(theme.colors.accent, '#f59e0b', 0.4)],
    [/#(?:ef4444|dc2626|b91c1c)/gi, mixHex(theme.colors.accent, '#ef4444', 0.35)],
    [/#(?:ffffff|fff|f8fafc|f9fafb)/gi, theme.colors.card],
    [/#(?:0f172a|111827|1f2937|334155|000000|020617)/gi, theme.colors.foreground],
    [/#(?:e2e8f0|cbd5e1|d1d5db|94a3b8)/gi, theme.colors.border],
  ];

  let result = markup;
  map.forEach(([pattern, color]) => {
    result = result.replace(pattern, color);
  });

  const paletteCycle = [
    theme.colors.card,
    theme.colors.accent,
    mixHex(theme.colors.accent, '#ffffff', 0.28),
    mixHex(theme.colors.accent, '#000000', 0.2),
    theme.colors.border,
    theme.colors.foreground,
  ];

  let idx = 0;
  result = result.replace(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g, () => {
    const color = paletteCycle[idx % paletteCycle.length];
    idx += 1;
    return color;
  });

  result = result
    .replace(/rgba?\([^)]+\)/gi, () => {
      const color = paletteCycle[idx % paletteCycle.length];
      idx += 1;
      return color;
    })
    .replace(/hsla?\([^)]+\)/gi, () => {
      const color = paletteCycle[idx % paletteCycle.length];
      idx += 1;
      return color;
    });

  return result;
}

function forceThemeOnSvg(markup: string, theme: PresentationTheme): string {
  let result = applyThemeToMarkupColors(markup, theme);
  const fillCycle = [
    theme.colors.card,
    toRgba(theme.colors.accent, 0.16),
    toRgba(theme.colors.accent, 0.3),
    mixHex(theme.colors.accent, '#ffffff', 0.25),
    mixHex(theme.colors.accent, '#000000', 0.16),
  ];
  const strokeCycle = [
    theme.colors.border,
    mixHex(theme.colors.accent, '#ffffff', 0.2),
    theme.colors.accent,
  ];

  let fillIndex = 0;
  result = result.replace(/fill\s*=\s*["']([^"']+)["']/gi, (full, value) => {
    const raw = String(value).trim().toLowerCase();
    if (raw === 'none' || raw.startsWith('url(') || raw === 'currentcolor' || raw === 'transparent') {
      return full;
    }
    const color = fillCycle[fillIndex % fillCycle.length];
    fillIndex += 1;
    return `fill="${color}"`;
  });

  result = result.replace(/fill\s*:\s*([^;"]+)/gi, (_full) => {
    const color = fillCycle[fillIndex % fillCycle.length];
    fillIndex += 1;
    return `fill:${color}`;
  });

  let strokeIndex = 0;
  result = result.replace(/stroke\s*=\s*["']([^"']+)["']/gi, (full, value) => {
    const raw = String(value).trim().toLowerCase();
    if (raw === 'none' || raw.startsWith('url(') || raw === 'transparent') {
      return full;
    }
    const color = strokeCycle[strokeIndex % strokeCycle.length];
    strokeIndex += 1;
    return `stroke="${color}"`;
  });

  result = result.replace(/stroke\s*:\s*([^;"]+)/gi, (_full) => {
    const color = strokeCycle[strokeIndex % strokeCycle.length];
    strokeIndex += 1;
    return `stroke:${color}`;
  });

  result = result.replace(/<text\b([^>]*)>/gi, (_full, attrs) => {
    const normalized = String(attrs);
    if (/fill\s*=\s*["'][^"']*["']/i.test(normalized)) {
      return `<text${normalized.replace(/fill\s*=\s*["'][^"']*["']/i, `fill="${theme.colors.foreground}"`)}>`;
    }
    return `<text${normalized} fill="${theme.colors.foreground}">`;
  });

  return result;
}

function forceThemeOnHtml(markup: string, theme: PresentationTheme): string {
  let result = applyThemeToMarkupColors(markup, theme);

  result = result
    .replace(/(--dd-bg\s*:\s*)([^;}"']+)/gi, `$1${theme.colors.background}`)
    .replace(/(--dd-card\s*:\s*)([^;}"']+)/gi, `$1${theme.colors.card}`)
    .replace(/(--dd-fg\s*:\s*)([^;}"']+)/gi, `$1${theme.colors.foreground}`)
    .replace(/(--dd-accent\s*:\s*)([^;}"']+)/gi, `$1${theme.colors.accent}`)
    .replace(/(--dd-border\s*:\s*)([^;}"']+)/gi, `$1${theme.colors.border}`)
    .replace(/(color\s*:\s*)([^;"']+)/gi, `$1${theme.colors.foreground}`)
    .replace(/(background-color\s*:\s*)([^;"']+)/gi, `$1${theme.colors.card}`)
    .replace(/(background\s*:\s*)([^;"']+)/gi, (_full, prefix: string, value: string) => {
      if (/gradient/i.test(value)) {
        return `${prefix}linear-gradient(135deg, ${theme.colors.card} 0%, ${theme.colors.background} 100%)`;
      }
      return `${prefix}${theme.colors.card}`;
    })
    .replace(/(border-color\s*:\s*)([^;"']+)/gi, `$1${theme.colors.border}`)
    .replace(/(border\s*:\s*)([^;"']+)/gi, (_full, prefix: string) => `${prefix}1px solid ${theme.colors.border}`)
    .replace(/(box-shadow\s*:\s*)([^;"']+)/gi, (_full, prefix: string) => `${prefix}0 14px 30px ${toRgba(theme.colors.foreground, 0.16)}`);

  const scopedCss = `<style>
  [data-dd-theme-visual] { color: ${theme.colors.foreground}; }
  [data-dd-theme-visual], [data-dd-theme-visual] * {
    --dd-bg: ${theme.colors.background} !important;
    --dd-card: ${theme.colors.card} !important;
    --dd-fg: ${theme.colors.foreground} !important;
    --dd-accent: ${theme.colors.accent} !important;
    --dd-border: ${theme.colors.border} !important;
  }
  [data-dd-theme-visual] * { border-color: ${theme.colors.border}; color: inherit; }
  [data-dd-theme-visual] [data-dd-accent] { color: ${theme.colors.accent}; }
  [data-dd-theme-visual] [data-dd-accent-bg] { background: ${toRgba(theme.colors.accent, 0.16)}; }
  </style>`;

  return `<div data-dd-theme-visual style="--dd-bg:${theme.colors.background};--dd-card:${theme.colors.card};--dd-fg:${theme.colors.foreground};--dd-accent:${theme.colors.accent};--dd-border:${theme.colors.border};">${scopedCss}${result}</div>`;
}

function buildPremiumSvgIllustration(slide: Slide, theme: PresentationTheme): string {
  const title = (slide.title || 'Concept').replace(/[<>&"]/g, '');
  const accentSoft = toRgba(theme.colors.accent, 0.28);
  const accentSoft2 = toRgba(theme.colors.accent, 0.15);
  const borderSoft = toRgba(theme.colors.border, 0.8);

  return `<svg viewBox="0 0 920 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.colors.card}" />
      <stop offset="100%" stop-color="${theme.colors.background}" />
    </linearGradient>
    <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.colors.accent}" />
      <stop offset="100%" stop-color="${mixHex(theme.colors.accent, '#ffffff', 0.35)}" />
    </linearGradient>
  </defs>
  <rect x="20" y="20" width="880" height="380" rx="26" fill="url(#bg-grad)" stroke="${borderSoft}" />
  <circle cx="190" cy="210" r="82" fill="${accentSoft}" />
  <circle cx="190" cy="210" r="42" fill="${theme.colors.accent}" />
  <rect x="320" y="95" width="510" height="42" rx="12" fill="${accentSoft}" />
  <rect x="320" y="158" width="420" height="28" rx="10" fill="${accentSoft2}" />
  <rect x="320" y="204" width="470" height="28" rx="10" fill="${accentSoft2}" />
  <rect x="320" y="250" width="380" height="28" rx="10" fill="${accentSoft2}" />
  <path d="M272 210 L318 210" stroke="url(#line-grad)" stroke-width="6" stroke-linecap="round" />
  <path d="M740 302 C792 286, 812 260, 846 228" stroke="${theme.colors.accent}" stroke-width="5" fill="none" stroke-linecap="round" />
  <circle cx="846" cy="228" r="9" fill="${theme.colors.accent}" />
  <text x="320" y="332" fill="${theme.colors.foreground}" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="700">${title}</text>
  <text x="320" y="360" fill="${toRgba(theme.colors.foreground, 0.72)}" font-size="14" font-family="Inter, Arial, sans-serif">Code-rendered illustration that follows active theme colors</text>
</svg>`;
}

function getRenderableSvgMarkup(markup: string, slide: Slide, theme: PresentationTheme): string {
  const clean = sanitizeMarkup(markup || '').trim();
  const looksLikeSvg = /^<svg[\s\S]*<\/svg>$/i.test(clean);
  if (!looksLikeSvg || clean.length < 180) {
    return buildPremiumSvgIllustration(slide, theme);
  }
  return forceThemeOnSvg(clean, theme);
}

function countMarkupMatches(input: string, pattern: RegExp): number {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type PremiumMockArchetype = 'executive_dashboard' | 'product_workflow' | 'ops_command_center';

function inferPremiumMockArchetype(slide: Slide, seed: number): PremiumMockArchetype {
  const text = `${slide.title || ''} ${slide.subtitle || ''} ${slide.content || ''}`.toLowerCase();
  if (/(mobile|app|onboarding|funnel|signup|journey|retention)/.test(text)) return 'product_workflow';
  if (/(ops|operation|pipeline|incident|monitor|control|security|command)/.test(text)) return 'ops_command_center';
  return seed % 3 === 1 ? 'product_workflow' : seed % 3 === 2 ? 'ops_command_center' : 'executive_dashboard';
}

function scoreHtmlMockupMarkup(markup: string): number {
  const text = markup.toLowerCase();
  const blockCount = countMarkupMatches(text, /<div\b|<section\b|<article\b|<aside\b|<header\b/g);
  const hasHeader = /<header\b|toolbar|top bar/.test(text);
  const hasLeftNav = /sidebar|side nav|navigation|<aside\b/.test(text);
  const hasKpiRow = /kpi|metric|revenue|retention|arr|growth|conversion/.test(text);
  const hasChartArea = /chart|trend|spark|progress|pipeline/.test(text);
  const hasActivity = /activity|timeline|events|updates|feed/.test(text);
  const hasStatusChips = /chip|status|badge|healthy|stable|live/.test(text);
  const hasInlineStyles = /style\s*=\s*["']/.test(text);
  const hasThemeVars = /--dd-|var\(--dd-/.test(text);

  let score = 0;
  if (blockCount >= 16) score += 25;
  if (hasHeader) score += 12;
  if (hasLeftNav) score += 12;
  if (hasKpiRow) score += 12;
  if (hasChartArea) score += 12;
  if (hasActivity) score += 12;
  if (hasStatusChips) score += 10;
  if (hasInlineStyles) score += 5;
  if (hasThemeVars) score += 10;
  return score;
}

function buildPremiumHtmlMockup(slide: Slide, theme: PresentationTheme): string {
  const seed = Math.max(0, (slide.slideNumber || 1) - 1);
  const archetype = inferPremiumMockArchetype(slide, seed);
  const title = escapeHtml(slide.title || 'Boardroom Mockup');
  const bulletA = escapeHtml(slide.bullets?.[0] || 'Acquisition +18%');
  const bulletB = escapeHtml(slide.bullets?.[1] || 'Activation 64%');
  const bulletC = escapeHtml(slide.bullets?.[2] || 'Retention 91%');
  const accentSoft = toRgba(theme.colors.accent, 0.16);
  const accentSoftStrong = toRgba(theme.colors.accent, 0.3);
  const panelBg = toRgba(theme.colors.card, 0.88);
  const rowBg = toRgba(theme.colors.foreground, 0.07);
  const shell = `max-width:860px;margin:0 auto;padding:18px;border-radius:24px;border:1px solid ${theme.colors.border};background:linear-gradient(135deg, ${theme.colors.card} 0%, ${theme.colors.background} 100%);box-shadow:0 22px 46px rgba(2,6,23,0.18);font-family:Inter,Segoe UI,Arial,sans-serif;color:${theme.colors.foreground};`;
  const nav = `border:1px solid ${theme.colors.border};border-radius:16px;padding:12px;background:${panelBg};display:grid;gap:8px;`;
  const card = `padding:12px;border-radius:14px;border:1px solid ${theme.colors.border};background:${panelBg};`;
  const statusChip = `display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;font-size:10px;font-weight:700;background:${accentSoft};color:${theme.colors.foreground};`;

  if (archetype === 'product_workflow') {
    return `<div style="${shell}">
  <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div style="font-size:14px;font-weight:700;letter-spacing:.02em;">${title}</div>
    <div style="display:flex;gap:8px;"><span style="${statusChip}">Journey</span><span style="${statusChip}">Live</span></div>
  </header>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:14px;">
    <aside style="${nav}">
      <div style="font-size:11px;opacity:.72;margin-bottom:4px;">Left Navigation</div>
      <div style="padding:8px;border-radius:10px;background:${accentSoft};font-size:12px;font-weight:600;">Overview</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Acquisition</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Onboarding</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Activation</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Retention</div>
    </aside>
    <section style="display:grid;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        <div style="${card}"><div style="font-size:11px;opacity:.7;">Signup Rate</div><div style="font-size:20px;font-weight:800;">42%</div></div>
        <div style="${card}"><div style="font-size:11px;opacity:.7;">Activation</div><div style="font-size:20px;font-weight:800;">64%</div></div>
        <div style="${card}"><div style="font-size:11px;opacity:.7;">D30 Retention</div><div style="font-size:20px;font-weight:800;">89%</div></div>
      </div>
      <div style="${card}">
        <div style="font-size:12px;font-weight:700;margin-bottom:10px;">Primary Chart Area: Funnel Stage Health</div>
        <div style="display:grid;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;"><div style="min-width:130px;font-size:12px;">${bulletA}</div><div style="height:10px;flex:1;background:${rowBg};border-radius:999px;"><div style="width:78%;height:10px;border-radius:999px;background:${theme.colors.accent};"></div></div></div>
          <div style="display:flex;align-items:center;gap:10px;"><div style="min-width:130px;font-size:12px;">${bulletB}</div><div style="height:10px;flex:1;background:${rowBg};border-radius:999px;"><div style="width:63%;height:10px;border-radius:999px;background:${accentSoftStrong};"></div></div></div>
          <div style="display:flex;align-items:center;gap:10px;"><div style="min-width:130px;font-size:12px;">${bulletC}</div><div style="height:10px;flex:1;background:${rowBg};border-radius:999px;"><div style="width:87%;height:10px;border-radius:999px;background:${mixHex(theme.colors.accent, '#ffffff', 0.3)};"></div></div></div>
        </div>
      </div>
      <div style="${card}">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Activity List</div>
        <div style="display:grid;gap:7px;">
          <div style="padding:8px;border-radius:10px;background:${rowBg};display:flex;justify-content:space-between;"><span>Onboarding experiment shipped</span><span style="opacity:.65;font-size:10px;">2m</span></div>
          <div style="padding:8px;border-radius:10px;background:${rowBg};display:flex;justify-content:space-between;"><span>Welcome flow completion improved</span><span style="opacity:.65;font-size:10px;">17m</span></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:9px;"><span style="${statusChip}">Status chip: Healthy</span><span style="${statusChip}">Status chip: Scaling</span></div>
      </div>
    </section>
  </div>
</div>`;
  }

  if (archetype === 'ops_command_center') {
    return `<div style="${shell}">
  <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div style="font-size:14px;font-weight:700;letter-spacing:.02em;">${title}</div>
    <div style="display:flex;gap:8px;"><span style="${statusChip}">Ops</span><span style="${statusChip}">Guarded</span></div>
  </header>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:14px;">
    <aside style="${nav}">
      <div style="font-size:11px;opacity:.72;margin-bottom:4px;">Left Navigation</div>
      <div style="padding:8px;border-radius:10px;background:${accentSoft};font-size:12px;font-weight:600;">Control Room</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">System Health</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Alert Stream</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Runbooks</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Audit Trail</div>
    </aside>
    <section style="display:grid;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        <div style="${card}"><div style="font-size:11px;opacity:.7;">Availability</div><div style="font-size:20px;font-weight:800;">99.97%</div></div>
        <div style="${card}"><div style="font-size:11px;opacity:.7;">P95 Latency</div><div style="font-size:20px;font-weight:800;">82ms</div></div>
        <div style="${card}"><div style="font-size:11px;opacity:.7;">Open Incidents</div><div style="font-size:20px;font-weight:800;">4</div></div>
      </div>
      <div style="${card}">
        <div style="font-size:12px;font-weight:700;margin-bottom:10px;">Primary Chart Area: Throughput + Recovery</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;">
          <div style="padding:10px;border-radius:12px;background:${rowBg};"><div style="font-size:11px;margin-bottom:6px;">Pipeline Throughput</div><div style="height:10px;border-radius:999px;background:${toRgba(theme.colors.foreground, 0.1)};"><div style="width:74%;height:10px;border-radius:999px;background:${theme.colors.accent};"></div></div></div>
          <div style="padding:10px;border-radius:12px;background:${rowBg};"><div style="font-size:11px;margin-bottom:6px;">Auto Recovery</div><div style="height:10px;border-radius:999px;background:${toRgba(theme.colors.foreground, 0.1)};"><div style="width:91%;height:10px;border-radius:999px;background:${mixHex(theme.colors.accent, '#ffffff', 0.26)};"></div></div></div>
        </div>
      </div>
      <div style="${card}">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Activity List</div>
        <div style="display:grid;gap:7px;">
          <div style="padding:8px;border-radius:10px;background:${rowBg};display:flex;justify-content:space-between;"><span>Autoscaling policy applied</span><span style="opacity:.65;font-size:10px;">5m</span></div>
          <div style="padding:8px;border-radius:10px;background:${rowBg};display:flex;justify-content:space-between;"><span>Incident #428 mitigated</span><span style="opacity:.65;font-size:10px;">19m</span></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:9px;"><span style="${statusChip}">Status chip: Stable</span><span style="${statusChip}">Status chip: Audited</span></div>
      </div>
    </section>
  </div>
</div>`;
  }

  return `<div style="${shell}">
  <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div style="font-size:14px;font-weight:700;letter-spacing:.02em;">${title}</div>
    <div style="display:flex;gap:8px;"><span style="${statusChip}">Executive</span><span style="${statusChip}">Boardroom</span></div>
  </header>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:14px;">
    <aside style="${nav}">
      <div style="font-size:11px;opacity:.72;margin-bottom:4px;">Left Navigation</div>
      <div style="padding:8px;border-radius:10px;background:${accentSoft};font-size:12px;font-weight:600;">Overview</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Analytics</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Pipeline</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Forecast</div>
      <div style="padding:8px;border-radius:10px;background:${rowBg};font-size:12px;">Settings</div>
    </aside>
    <section style="display:grid;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        <div style="${card}"><div style="font-size:11px;opacity:.7;">Revenue</div><div style="font-size:20px;font-weight:800;">$1.28M</div></div>
        <div style="${card}"><div style="font-size:11px;opacity:.7;">Win Rate</div><div style="font-size:20px;font-weight:800;">41%</div></div>
        <div style="${card}"><div style="font-size:11px;opacity:.7;">NPS</div><div style="font-size:20px;font-weight:800;">73</div></div>
      </div>
      <div style="${card}">
        <div style="font-size:12px;font-weight:700;margin-bottom:10px;">Primary Chart Area: KPI Momentum</div>
        <div style="display:grid;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;"><div style="min-width:130px;font-size:12px;">${bulletA}</div><div style="height:10px;flex:1;background:${rowBg};border-radius:999px;"><div style="width:76%;height:10px;border-radius:999px;background:${theme.colors.accent};"></div></div></div>
          <div style="display:flex;align-items:center;gap:10px;"><div style="min-width:130px;font-size:12px;">${bulletB}</div><div style="height:10px;flex:1;background:${rowBg};border-radius:999px;"><div style="width:61%;height:10px;border-radius:999px;background:${accentSoftStrong};"></div></div></div>
          <div style="display:flex;align-items:center;gap:10px;"><div style="min-width:130px;font-size:12px;">${bulletC}</div><div style="height:10px;flex:1;background:${rowBg};border-radius:999px;"><div style="width:86%;height:10px;border-radius:999px;background:${mixHex(theme.colors.accent, '#ffffff', 0.28)};"></div></div></div>
        </div>
      </div>
      <div style="${card}">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Activity List</div>
        <div style="display:grid;gap:7px;">
          <div style="padding:8px;border-radius:10px;background:${rowBg};display:flex;justify-content:space-between;"><span>Executive sync completed</span><span style="opacity:.65;font-size:10px;">4m</span></div>
          <div style="padding:8px;border-radius:10px;background:${rowBg};display:flex;justify-content:space-between;"><span>Quarterly forecast recalibrated</span><span style="opacity:.65;font-size:10px;">23m</span></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:9px;"><span style="${statusChip}">Status chip: Live</span><span style="${statusChip}">Status chip: Stable</span></div>
      </div>
    </section>
  </div>
</div>`;
}

function getRenderableHtmlMockup(markup: string, slide: Slide, theme: PresentationTheme): string {
  const clean = sanitizeMarkup(markup || '').trim();
  const hasInlineStyles = /style\s*=\s*["']/i.test(clean);
  const classHeavy = /class\s*=\s*["']/i.test(clean) && !hasInlineStyles;
  const qualityScore = scoreHtmlMockupMarkup(clean);

  // Strict quality gate so later mock diagrams don't degrade.
  if (!clean || clean.length < 140 || classHeavy || qualityScore < 84) {
    return buildPremiumHtmlMockup(slide, theme);
  }

  return forceThemeOnHtml(clean, theme);
}

function parseChartData(value: unknown): Slide['chartData'] | undefined {
  let source: any = value;

  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return undefined;
    }
  }

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return undefined;
  }

  const rawData = Array.isArray(source.data) ? source.data : [];
  const normalizedData = rawData
    .map((item: any) => {
      const name = typeof item?.name === 'string'
        ? item.name.trim()
        : typeof item?.label === 'string'
          ? item.label.trim()
          : '';
      const numericValue = typeof item?.value === 'number'
        ? item.value
        : parseFloat(String(item?.value ?? '').replace(/[^0-9.-]/g, ''));

      if (!name || Number.isNaN(numericValue)) return null;
      return { name, value: numericValue };
    })
    .filter(Boolean) as { name: string; value: number }[];

  if (normalizedData.length === 0) {
    return undefined;
  }

  const chartTypeRaw = typeof source.type === 'string' ? source.type.toLowerCase().trim() : 'bar';
  const chartType = ['bar', 'line', 'pie', 'area', 'radar', 'funnel'].includes(chartTypeRaw)
    ? chartTypeRaw as Slide['chartData']['type']
    : 'bar';

  const colors = Array.isArray(source.colors)
    ? source.colors.filter((entry: unknown): entry is string => typeof entry === 'string')
    : undefined;

  return {
    type: chartType,
    data: normalizedData,
    colors: colors && colors.length > 0 ? colors : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  };
}

function inferSlideType(rawSlide: any, visualType: CodeVisualType | ''): string {
  if (typeof rawSlide?.type === 'string' && rawSlide.type.trim()) {
    return rawSlide.type.trim().toLowerCase();
  }

  if (visualType === 'html_tailwind') return 'mockup';
  if (visualType === 'mermaid') return 'flowchart';
  if (visualType === 'chart_data') return 'data-viz';
  return 'content';
}

function sanitizeVisualPayload(
  visualType: CodeVisualType | '',
  visualContent: unknown
): string | Record<string, unknown> | null {
  if (visualType === 'svg_code' || visualType === 'mermaid' || visualType === 'html_tailwind') {
    if (typeof visualContent === 'string' && visualContent.trim().length > 0) {
      return visualContent.trim().slice(0, 25000);
    }
    return null;
  }

  if (visualType === 'chart_data') {
    if (typeof visualContent === 'string' && visualContent.trim().length > 0) return visualContent.trim();
    if (visualContent && typeof visualContent === 'object' && !Array.isArray(visualContent)) {
      return visualContent as Record<string, unknown>;
    }
  }

  return null;
}

function normalizeSlideRecord(rawSlide: any, index: number): Slide {
  const isFirstSlide = index === 0;
  const visualType = normalizeVisualType(rawSlide.visual_type || rawSlide.visualType);
  const normalizedVisualContent = sanitizeVisualPayload(
    isFirstSlide ? '' : visualType,
    rawSlide.visual_content ?? rawSlide.visualContent ?? null
  );
  const chartData = parseChartData(
    isFirstSlide
      ? null
      : (rawSlide.chartData || rawSlide.charts || (visualType === 'chart_data' ? normalizedVisualContent : null))
  );

  const bullets = Array.isArray(rawSlide.bullets || rawSlide.bullet_points || rawSlide.bulletPoints)
    ? (rawSlide.bullets || rawSlide.bullet_points || rawSlide.bulletPoints)
      .filter((entry: unknown) => typeof entry === 'string')
      .map((entry: string) => entry.trim())
      .filter(Boolean)
    : [];

  const title = typeof rawSlide.title === 'string' && rawSlide.title.trim()
    ? rawSlide.title.trim()
    : `Slide ${index + 1}`;
  const subtitle = typeof rawSlide.subtitle === 'string' && rawSlide.subtitle.trim()
    ? rawSlide.subtitle.trim()
    : undefined;
  const contentRaw =
    rawSlide.content || rawSlide.body_text || rawSlide.bodyText || rawSlide.description || '';
  const content = typeof contentRaw === 'string' ? contentRaw.trim() : '';

  return {
    slideNumber: Number(rawSlide.slideNumber) > 0 ? Number(rawSlide.slideNumber) : index + 1,
    type: isFirstSlide ? 'hero' : inferSlideType(rawSlide, visualType),
    layout: rawSlide.layout || 'split_right',
    title,
    subtitle,
    content,
    bullets,
    cta: typeof rawSlide.cta === 'string' ? rawSlide.cta.trim() || undefined : undefined,
    design: {
      background: rawSlide.design?.background || 'gradient-blue-purple',
      layout: rawSlide.design?.layout || rawSlide.layout || 'default',
    },
    imageUrl: typeof rawSlide.imageUrl === 'string'
      ? rawSlide.imageUrl
      : typeof rawSlide.image === 'string'
        ? rawSlide.image
        : undefined,
    visualType: isFirstSlide ? undefined : (visualType || undefined),
    visualContent: normalizedVisualContent,
    visual_type: isFirstSlide ? undefined : (visualType || undefined),
    visual_content: normalizedVisualContent,
    chartData,
    stats: Array.isArray(rawSlide.stats) ? rawSlide.stats : undefined,
    comparison: rawSlide.comparison && typeof rawSlide.comparison === 'object' ? rawSlide.comparison : undefined,
    timeline: Array.isArray(rawSlide.timeline) ? rawSlide.timeline : undefined,
    mockup: rawSlide.mockup && typeof rawSlide.mockup === 'object' ? rawSlide.mockup : undefined,
    icons: Array.isArray(rawSlide.icons) ? rawSlide.icons : undefined,
    logos: Array.isArray(rawSlide.logos) ? rawSlide.logos : undefined,
    testimonial: rawSlide.testimonial && typeof rawSlide.testimonial === 'object' ? rawSlide.testimonial : undefined,
  };
}

function normalizeGeneratedSlides(rawSlides: any[]): Slide[] {
  return (rawSlides || []).map((rawSlide: any, index: number) => normalizeSlideRecord(rawSlide, index));
}

function normalizeSlidesForExport(rawSlides: Slide[], theme: PresentationTheme): Slide[] {
  return (rawSlides || []).map((rawSlide, index) => {
    const normalized = normalizeSlideRecord(rawSlide, index);
    const safeBullets = (normalized.bullets || []).slice(0, 8).map((entry) => entry.slice(0, 240));
    const safeContent = (normalized.content || '').slice(0, 2200);
    const hasRenderableVisual =
      !!normalized.imageUrl ||
      !!(normalized.visualType && normalized.visualContent) ||
      !!(normalized.chartData && normalized.chartData.data?.length) ||
      !!(normalized.mockup?.elements?.length);

    return {
      ...normalized,
      bullets: safeBullets,
      chartData: normalized.chartData || (normalized.visualType === 'chart_data'
        ? {
            type: 'bar',
            data: [
              { name: 'Q1', value: 10 },
              { name: 'Q2', value: 15 },
              { name: 'Q3', value: 25 },
              { name: 'Q4', value: 35 },
            ],
            colors: buildThemeChartPalette(theme),
          }
        : undefined),
      content: safeContent || (safeBullets.length === 0 && !hasRenderableVisual ? 'Key insight' : safeContent),
    };
  });
}

type LayoutArchetype =
  | 'hero'
  | 'text-visual'
  | 'bullets-visual'
  | 'chart-first'
  | 'code-visual-first'
  | 'dense-text';

interface SlideLayoutProfile {
  archetype: LayoutArchetype;
  shellPaddingClass: string;
  contentWidthClass: string;
  textAlignClass: string;
  titleClass: string;
  subtitleClass: string;
  bodyClass: string;
  bulletClass: string;
  visualShellClass: string;
  visualFrameClass: string;
  chartHeight: number;
  imageMaxHeight: string;
  maxBodyLength: number;
  maxBullets: number;
}

function computeLayoutProfile({
  isHero,
  hasCodeVisual,
  hasChart,
  hasImage,
  hasBullets,
  contentLen,
}: {
  isHero: boolean;
  hasCodeVisual: boolean;
  hasChart: boolean;
  hasImage: boolean;
  hasBullets: boolean;
  contentLen: number;
}): SlideLayoutProfile {
  const hasVisual = hasCodeVisual || hasChart || hasImage;
  let archetype: LayoutArchetype = 'text-visual';

  if (isHero) archetype = 'hero';
  else if (hasChart) archetype = 'chart-first';
  else if (hasCodeVisual) archetype = 'code-visual-first';
  else if (hasBullets && hasVisual) archetype = 'bullets-visual';
  else if (!hasVisual && contentLen > 720) archetype = 'dense-text';

  const map: Record<LayoutArchetype, Omit<SlideLayoutProfile, 'archetype'>> = {
    hero: {
      shellPaddingClass: 'p-8 md:p-12 lg:p-14',
      contentWidthClass: 'max-w-6xl',
      textAlignClass: 'text-center',
      titleClass: contentLen > 280 ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-5xl md:text-6xl lg:text-7xl',
      subtitleClass: 'text-xl md:text-2xl lg:text-3xl',
      bodyClass: 'text-lg md:text-xl',
      bulletClass: 'text-lg md:text-xl',
      visualShellClass: 'mt-8 max-w-5xl mx-auto',
      visualFrameClass: 'max-h-[300px] md:max-h-[340px]',
      chartHeight: 300,
      imageMaxHeight: '320px',
      maxBodyLength: 650,
      maxBullets: 5,
    },
    'text-visual': {
      shellPaddingClass: 'p-8 md:p-10 lg:p-12',
      contentWidthClass: 'max-w-6xl',
      textAlignClass: 'text-left',
      titleClass: contentLen > 520 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl',
      subtitleClass: 'text-lg md:text-2xl',
      bodyClass: contentLen > 680 ? 'text-base md:text-lg' : 'text-lg md:text-xl',
      bulletClass: contentLen > 680 ? 'text-base md:text-lg' : 'text-lg md:text-xl',
      visualShellClass: 'mt-8 max-w-5xl',
      visualFrameClass: 'max-h-[300px] md:max-h-[360px]',
      chartHeight: 320,
      imageMaxHeight: '340px',
      maxBodyLength: 850,
      maxBullets: 6,
    },
    'bullets-visual': {
      shellPaddingClass: 'p-8 md:p-10 lg:p-12',
      contentWidthClass: 'max-w-6xl',
      textAlignClass: 'text-left',
      titleClass: 'text-3xl md:text-4xl',
      subtitleClass: 'text-lg md:text-xl',
      bodyClass: 'text-base md:text-lg',
      bulletClass: 'text-base md:text-lg',
      visualShellClass: 'mt-6 max-w-5xl',
      visualFrameClass: 'max-h-[280px] md:max-h-[330px]',
      chartHeight: 300,
      imageMaxHeight: '320px',
      maxBodyLength: 720,
      maxBullets: 7,
    },
    'chart-first': {
      shellPaddingClass: 'p-8 md:p-10 lg:p-12',
      contentWidthClass: 'max-w-6xl',
      textAlignClass: 'text-left',
      titleClass: 'text-3xl md:text-4xl',
      subtitleClass: 'text-lg md:text-xl',
      bodyClass: 'text-base md:text-lg',
      bulletClass: 'text-base md:text-lg',
      visualShellClass: 'mt-6 max-w-6xl',
      visualFrameClass: 'max-h-[360px] md:max-h-[420px]',
      chartHeight: 340,
      imageMaxHeight: '300px',
      maxBodyLength: 680,
      maxBullets: 5,
    },
    'code-visual-first': {
      shellPaddingClass: 'p-8 md:p-10 lg:p-12',
      contentWidthClass: 'max-w-6xl',
      textAlignClass: 'text-left',
      titleClass: 'text-3xl md:text-4xl',
      subtitleClass: 'text-lg md:text-xl',
      bodyClass: 'text-base md:text-lg',
      bulletClass: 'text-base md:text-lg',
      visualShellClass: 'mt-6 max-w-6xl',
      visualFrameClass: 'max-h-[320px] md:max-h-[380px]',
      chartHeight: 320,
      imageMaxHeight: '300px',
      maxBodyLength: 700,
      maxBullets: 6,
    },
    'dense-text': {
      shellPaddingClass: 'p-7 md:p-8 lg:p-10',
      contentWidthClass: 'max-w-4xl',
      textAlignClass: 'text-left',
      titleClass: 'text-2xl md:text-3xl',
      subtitleClass: 'text-base md:text-lg',
      bodyClass: 'text-sm md:text-base',
      bulletClass: 'text-sm md:text-base',
      visualShellClass: 'mt-6 max-w-4xl',
      visualFrameClass: 'max-h-[260px] md:max-h-[300px]',
      chartHeight: 280,
      imageMaxHeight: '280px',
      maxBodyLength: 980,
      maxBullets: 8,
    },
  };

  return {
    archetype,
    ...map[archetype],
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

  // Sync presentation ID to URL
  const syncPresentationIdToUrl = useCallback((id: string) => {
    if (!id || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
  }, []);

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

          setSlides(normalizeGeneratedSlides(loadedSlides));
          setTopic(data.title);
          setSelectedThemeId(loadedThemeId);
          setPresentationId(data.id);
          syncPresentationIdToUrl(data.id);
          // Switch to presentation view
          setView('presentation');

          console.log('✅ Loaded presentation:', data.title);
        }
      } catch (error) {
        console.error('Error loading presentation:', error);
      }
    }

    loadPresentation();
  }, [editId, supabase, syncPresentationIdToUrl]);

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
  const [presentSlideIndex, setPresentSlideIndex] = useState(0);
  const [presentDirection, setPresentDirection] = useState(1);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const presentWheelLockRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const visiblePresentationId = presentationId || editId;

  const handleCopyLink = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const navigatePresentSlides = useCallback((step: number) => {
    if (!slides.length) return;
    setPresentDirection(step >= 0 ? 1 : -1);
    setPresentSlideIndex((prev) => {
      const next = prev + step;
      if (next < 0) return 0;
      if (next > slides.length - 1) return slides.length - 1;
      return next;
    });
  }, [slides.length]);

  const jumpToPresentSlide = useCallback((target: number) => {
    if (!slides.length) return;
    setPresentDirection(target >= presentSlideIndex ? 1 : -1);
    setPresentSlideIndex(Math.max(0, Math.min(slides.length - 1, target)));
  }, [presentSlideIndex, slides.length]);

  const handleSavePresentation = async (isAutoSave = false) => {
    if (!isAutoSave) setIsSaving(true);
    const supabase = createClient();

    try {
      // Use getSession() for rate limit avoidance
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

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
          template: selectedThemeId,
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

      if (result?.id) {
        setPresentationId(result.id);
        syncPresentationIdToUrl(result.id);
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

  // Auto-save when generation completes
  useEffect(() => {
    if (!isStreaming && slides.length > 0 && !presentationId && view === 'presentation') {
      const timer = setTimeout(() => {
        handleSavePresentation(true);
      }, 2000); // Small delay to ensure state is settled
      return () => clearTimeout(timer);
    }
  }, [isStreaming, slides.length, presentationId, view]);

  useEffect(() => {
    if (!isPresenting) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPresenting(false);
        return;
      }
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        navigatePresentSlides(1);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigatePresentSlides(-1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPresenting, navigatePresentSlides]);

  useEffect(() => {
    if (!slides.length) {
      setPresentSlideIndex(0);
      return;
    }
    setPresentSlideIndex((prev) => Math.max(0, Math.min(prev, slides.length - 1)));
  }, [slides.length]);

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

  const handleGenerateOutline = async () => {
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
    console.log('handleFinalGenerate called');
    console.log('Topic:', topic);
    console.log('Outline length:', outline.length);
    console.log('Settings:', { textDensity, audience, tone, theme, imageSource });

    setSlides([]);
    setCurrentSlideText('');
    setView('presentation');
    setError(null);
    setProgress(10);
    setIsStreaming(true);
    console.log('View set to: presentation');

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
      extraKeywords,
      themeTokens: {
        '--dd-bg': currentTheme.colors.background,
        '--dd-card': currentTheme.colors.card,
        '--dd-fg': currentTheme.colors.foreground,
        '--dd-accent': currentTheme.colors.accent,
        '--dd-border': currentTheme.colors.border,
      },
    };

    try {
      setCurrentSlideText('Generating code-driven visuals...');
      setProgress(25);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to create presentations.');
      }

      const response = await fetch('/api/generate/presentation-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          outlines: finalOutline,
          prompt: topic,
          generationMode: 'code-driven',
          settings,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `API returned ${response.status}`);
      }

      setProgress(70);
      const normalizedSlides = normalizeGeneratedSlides(payload.slides || []);
      if (!normalizedSlides.length) {
        throw new Error('No slides were generated.');
      }

      setSlides(normalizedSlides);
      setCurrentSlideText('Rendering visuals...');
      setProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate presentation';
      console.error('Presentation generation failed:', err);
      setError(message);
      alert(`Failed to generate presentation: ${message}`);
    } finally {
      setIsStreaming(false);
      setCurrentSlideText('');
      setProgress(0);
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

      const normalizedExportSlides = normalizeSlidesForExport(slides, currentTheme);

      if (process.env.NODE_ENV === 'development') {
        const diagnostics = slideElements.map((el, idx) => {
          const rect = el.getBoundingClientRect();
          const titleRect = el.querySelector('[data-slide-title]')?.getBoundingClientRect();
          const bodyRect = el.querySelector('[data-slide-body]')?.getBoundingClientRect();
          const visualRect = el.querySelector('[data-slide-visual]')?.getBoundingClientRect();
          const bulletsRect = el.querySelector('[data-slide-bullets]')?.getBoundingClientRect();
          return {
            slide: idx + 1,
            preview: { w: Math.round(rect.width), h: Math.round(rect.height) },
            regions: {
              title: titleRect ? { w: Math.round(titleRect.width), h: Math.round(titleRect.height) } : null,
              body: bodyRect ? { w: Math.round(bodyRect.width), h: Math.round(bodyRect.height) } : null,
              visual: visualRect ? { w: Math.round(visualRect.width), h: Math.round(visualRect.height) } : null,
              bullets: bulletsRect ? { w: Math.round(bulletsRect.width), h: Math.round(bulletsRect.height) } : null,
            },
          };
        });
        console.debug('[Slide parity diagnostics]', diagnostics);
      }

      await exportPremiumPresentation(
        slideElements,
        normalizedExportSlides,
        topic || 'presentation',
        currentTheme,
        {
          format,
          quality: 'high',
          preserveGradients: true,
          captureMode: format === 'pdf' ? 'preview-parity' : undefined,
          targetSize: format === 'pdf' ? { width: 1920, height: 1080 } : undefined,
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
                <h1 className="text-lg font-bold professional-heading tracking-tight">DraftDeckAI</h1>
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
                              className={`h-1.5 rounded-full transition-all duration-500 ${idx <= loadingStep ? 'w-full bg-blue-500' : 'w-2 bg-muted'
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
          <div
            className="fixed inset-0 z-[200] bg-black/95 text-white"
            onWheel={(event) => {
              if (Math.abs(event.deltaY) < 8) return;
              if (isWheelNavigationLocked(presentWheelLockRef.current, PRESENTATION_WHEEL_LOCK_MS)) return;
              presentWheelLockRef.current = Date.now();
              event.preventDefault();
              navigatePresentSlides(event.deltaY > 0 ? 1 : -1);
            }}
          >
            <div className="absolute top-6 left-6 z-[210] rounded-full bg-black/70 border border-white/20 px-4 py-2 text-sm font-semibold">
              {presentSlideIndex + 1} / {slides.length}
            </div>

            <button
              onClick={() => setIsPresenting(false)}
              className="absolute top-5 right-5 z-[210] bg-black/70 hover:bg-black/85 border border-white/25 text-white rounded-full p-3 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigatePresentSlides(-1)}
              disabled={presentSlideIndex === 0}
              className="absolute left-6 top-1/2 z-[210] -translate-y-1/2 p-3 rounded-full bg-black/70 border border-white/25 hover:bg-black/85 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => navigatePresentSlides(1)}
              disabled={presentSlideIndex >= slides.length - 1}
              className="absolute right-6 top-1/2 z-[210] -translate-y-1/2 p-3 rounded-full bg-black/70 border border-white/25 hover:bg-black/85 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="h-full w-full flex items-center justify-center p-6 md:p-8">
              <div className="aspect-video w-full max-h-[88vh] shadow-2xl mx-auto" style={{ maxWidth: 'calc(88vh * 16 / 9)' }}>
                <AnimatePresence mode="wait" initial={false} custom={presentDirection}>
                  <motion.div
                    key={`present-slide-${presentSlideIndex}`}
                    custom={presentDirection}
                    variants={getSlideMotionVariants(!!prefersReducedMotion)}
                    transition={getSlideMotionTransition(!!prefersReducedMotion)}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="h-full"
                  >
                    <SlideCard
                      slide={slides[presentSlideIndex]}
                      theme={currentTheme}
                      getGradientClass={getGradientClass}
                      isPreview
                      isPresentMode
                      reducedMotion={!!prefersReducedMotion}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[210] flex items-center gap-2 rounded-full bg-black/70 border border-white/20 px-3 py-2">
              {slides.map((_, idx) => (
                <button
                  key={`present-dot-${idx}`}
                  onClick={() => jumpToPresentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all ${idx === presentSlideIndex ? 'w-7 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                />
              ))}
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-[11px] pointer-events-none">
              Use arrows, mouse wheel, or space key to navigate
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

                {visiblePresentationId && (
                  <div className="px-3 py-2 rounded-xl border border-border bg-card/80 text-xs sm:text-sm text-foreground">
                    <span className="opacity-70 mr-2">Presentation ID</span>
                    <span className="font-mono font-semibold">{visiblePresentationId}</span>
                  </div>
                )}

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
                      onClick={() => {
                        setPresentSlideIndex(0);
                        setPresentDirection(1);
                        presentWheelLockRef.current = 0;
                        setIsPresenting(true);
                      }}
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
                <div className="relative overflow-hidden flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-50 duration-500 rounded-3xl border border-border/60 bg-card/40">
                  <div className="pointer-events-none absolute inset-0">
                    {[...Array(9)].map((_, idx) => (
                      <div
                        key={`streamline-empty-${idx}`}
                        className="streamline-track"
                        style={{
                          top: `${8 + idx * 10}%`,
                          animationDelay: `${idx * 0.22}s`,
                        }}
                      />
                    ))}
                  </div>
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
                    DraftDeckAI is crafting your slides, designing layouts, and writing professional content...
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
                <div className="relative animate-pulse">
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                    {[...Array(7)].map((_, idx) => (
                      <div
                        key={`streamline-active-${idx}`}
                        className="streamline-track"
                        style={{
                          top: `${10 + idx * 12}%`,
                          animationDelay: `${idx * 0.18}s`,
                        }}
                      />
                    ))}
                  </div>
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
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${copySuccess
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
          @keyframes streamline {
            from { transform: translateX(-40%); opacity: 0; }
            20% { opacity: 0.55; }
            80% { opacity: 0.35; }
            to { transform: translateX(140%); opacity: 0; }
          }
          .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-fade-in-up { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .streamline-track {
            position: absolute;
            left: -38%;
            width: 52%;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.55) 42%, rgba(139,92,246,0.6) 70%, transparent 100%);
            filter: blur(0.15px);
            animation: streamline 2.6s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}

// Enhanced Slide Card Component with Icons, Diagrams, Images, and Charts
export function SlideCard({ slide, getGradientClass, theme, onUpdate, onAddImage, isPreview, isPresentMode, reducedMotion }: {
  slide: Slide;
  getGradientClass: (bg?: string) => string;
  theme: PresentationTheme;
  onUpdate?: (updatedSlide: Slide) => void;
  onAddImage?: () => void;
  isPreview?: boolean;
  isPresentMode?: boolean;
  reducedMotion?: boolean;
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
  const visualType = normalizeVisualType(slide.visualType || slide.visual_type);
  const visualContent = slide.visualContent ?? slide.visual_content ?? null;
  const isFirstSlide = Number(slide.slideNumber) === 1;
  const themedSvgMarkup =
    visualType === 'svg_code' && typeof visualContent === 'string'
      ? getRenderableSvgMarkup(visualContent, slide, theme)
      : '';
  const normalizedMermaidCode =
    visualType === 'mermaid' && typeof visualContent === 'string'
      ? getRenderableMermaidCode(visualContent, slide)
      : '';
  const themedHtmlMarkup =
    visualType === 'html_tailwind' && typeof visualContent === 'string'
      ? getRenderableHtmlMockup(visualContent, slide, theme)
      : visualType === 'html_tailwind'
        ? buildPremiumHtmlMockup(slide, theme)
        : '';
  const chartData = slide.chartData || (visualType === 'chart_data' ? parseChartData(visualContent) : undefined);
  const hasCodeVisual = !isFirstSlide && (visualType === 'svg_code' || visualType === 'mermaid' || visualType === 'html_tailwind');
  const hasChart = !isFirstSlide && chartData && chartData.data && chartData.data.length > 0;
  const hasImage = slide.imageUrl && slide.imageUrl.length > 0 && !hasCodeVisual;
  const hasStats = slide.stats && slide.stats.length > 0;
  const hasComparison = slide.comparison && (slide.comparison.left?.length > 0 || slide.comparison.right?.length > 0);
  const hasTimeline = slide.timeline && slide.timeline.length > 0;
  const hasMockup = slide.mockup && slide.mockup.elements?.length > 0;
  const hasIcons = slide.icons && slide.icons.length > 0;
  const hasLogos = slide.logos && slide.logos.length > 0;
  const hasTestimonial = slide.testimonial && slide.testimonial.quote;
  const isEditable = !!onUpdate;
  const [isDiagramEditorOpen, setIsDiagramEditorOpen] = useState(false);
  const [diagramDraft, setDiagramDraft] = useState('');
  const supportsDiagramSourceEditor = isEditable && ['html_tailwind', 'mermaid', 'svg_code'].includes(visualType);
  const isHtmlInlineEditable = isEditable && visualType === 'html_tailwind' && !isPresentMode;

  const updateDiagramVisualContent = (nextContent: string) => {
    if (!onUpdate) return;
    const cleaned = nextContent.trim();
    if (!cleaned) return;
    onUpdate({
      ...slide,
      visualContent: cleaned,
      visual_content: cleaned,
      visualType: visualType || slide.visualType,
      visual_type: visualType || slide.visual_type,
    });
  };

  useEffect(() => {
    if (typeof visualContent === 'string') {
      setDiagramDraft(visualContent);
      return;
    }
    setDiagramDraft('');
  }, [visualContent, slide.slideNumber, visualType]);

  // Dynamic import for Recharts
  const { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } =
    require('recharts');

  // Enhanced icon mapping for different slide types
  const getSlideIcon = (type: string) => {
    switch (type) {
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
  const parseIconBullet = (text: string): { IconComponent: React.FC<{ className?: string; color?: string }> | null; text: string; iconName: string } => {
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

  const chartColors = buildThemeChartPalette(theme);

  // Deterministic profile-driven typography and spacing based on content density + visual archetype.
  const getTotalContentLength = () => {
    let len = (slide.title?.length || 0) + (slide.subtitle?.length || 0) + (slide.content?.length || 0);
    if (slide.bullets) len += slide.bullets.reduce((acc, b) => acc + b.length, 0);
    return len;
  };

  const contentLen = getTotalContentLength();
  const layoutProfile = computeLayoutProfile({
    isHero,
    hasCodeVisual: !!hasCodeVisual,
    hasChart: !!hasChart,
    hasImage: !!hasImage,
    hasBullets: !!(slide.bullets && slide.bullets.length > 0),
    contentLen,
  });
  const safeBody = (slide.content || '').slice(0, layoutProfile.maxBodyLength);
  const safeBullets = (slide.bullets || []).slice(0, layoutProfile.maxBullets);
  const shouldAnimateText = !!isPresentMode && !isEditable;

  const animatePresentText = (node: ReactNode, delay = 0, y = 16): ReactNode => {
    if (!shouldAnimateText) return node;

    if (reducedMotion) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, delay }}
        >
          {node}
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {node}
      </motion.div>
    );
  };

  return (
    <div
      className={`group relative ${isPreview ? '' : 'rounded-[2rem] shadow-xl hover:shadow-2xl'} transition-all duration-500 overflow-hidden ${isPreview ? '' : 'border'}`}
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
        {!isPreview && (
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
        )}

        <div className="absolute inset-0 overflow-hidden">
          <div className={`min-h-full w-full ${layoutProfile.shellPaddingClass} flex flex-col items-center justify-center relative z-10`}>
            <div className={`${layoutProfile.contentWidthClass} ${layoutProfile.textAlignClass} w-full relative z-10`}>
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
              {animatePresentText(
                <h2
                  data-slide-title
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ ...slide, title: e.currentTarget.textContent || slide.title })}
                  className={`font-bold mb-8 leading-tight tracking-tight drop-shadow-md ${layoutProfile.titleClass} ${isEditable ? 'cursor-text hover:outline hover:outline-2 hover:outline-blue-500/50 rounded-lg px-2 -mx-2' : ''}`}
                  style={{ color: textColor }}
                >
                  {slide.title}
                </h2>,
                0.05,
                20
              )}

              {/* Subtitle */}
              {slide.subtitle && animatePresentText(
                <p
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ ...slide, subtitle: e.currentTarget.textContent || slide.subtitle })}
                  className={`${layoutProfile.subtitleClass} mb-10 font-light leading-relaxed drop-shadow-sm opacity-90 ${isEditable ? 'cursor-text hover:outline hover:outline-2 hover:outline-blue-500/50 rounded-lg px-2 -mx-2' : ''}`}
                  style={{ color: textColor }}
                >
                  {slide.subtitle}
                </p>,
                0.12,
                14
              )}

              {hasCodeVisual && animatePresentText(
                <div data-slide-visual className={layoutProfile.visualShellClass}>
                  <PresentationVisualFrame
                    frameClassName="shadow-xl"
                    contentClassName={layoutProfile.visualFrameClass}
                    borderColor={`${textColor}20`}
                    backgroundColor={`${theme.colors.background}20`}
                    fixedAspect
                    minHeightPx={220}
                    maxHeightPx={380}
                  >
                    {visualType === 'mermaid' && normalizedMermaidCode && (
                      <div className="h-full rounded-xl overflow-hidden" style={{ backgroundColor: theme.colors.card }}>
                        <DiagramPreview
                          code={normalizedMermaidCode}
                          compact={false}
                          fullScreen={!!isPresentMode}
                          themeColors={{
                            background: theme.colors.background,
                            foreground: textColor,
                            accent: theme.colors.accent,
                            border: theme.colors.border,
                            muted: theme.colors.muted,
                            card: theme.colors.card,
                          }}
                        />
                      </div>
                    )}
                    {visualType === 'svg_code' && themedSvgMarkup && (
                      <div className="h-full rounded-xl overflow-auto p-3 [&>svg]:w-full [&>svg]:h-auto" style={{ backgroundColor: theme.colors.card }} dangerouslySetInnerHTML={{ __html: themedSvgMarkup }} />
                    )}
                    {visualType === 'html_tailwind' && themedHtmlMarkup && (
                      <div className="h-full rounded-xl overflow-hidden p-2" style={{ backgroundColor: theme.colors.card }}>
                        <div className={`h-full w-full origin-top ${isPresentMode ? 'scale-[0.96]' : 'scale-[0.9]'}`}>
                          <div
                            className={`h-full [&_*]:max-w-full ${isHtmlInlineEditable ? 'outline-none cursor-text' : ''}`}
                            contentEditable={isHtmlInlineEditable}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              if (!isHtmlInlineEditable) return;
                              const editedMarkup = stripThemeVisualWrapper(e.currentTarget.innerHTML || '');
                              if (editedMarkup) updateDiagramVisualContent(editedMarkup);
                            }}
                            dangerouslySetInnerHTML={{ __html: themedHtmlMarkup }}
                          />
                        </div>
                      </div>
                    )}
                  </PresentationVisualFrame>
                  {supportsDiagramSourceEditor && !isPresentMode && (
                    <div data-export-hide="true" className="mt-3 rounded-xl border border-border/70 bg-card/80 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setIsDiagramEditorOpen((prev) => !prev);
                            if (!isDiagramEditorOpen && typeof visualContent === 'string') {
                              setDiagramDraft(visualContent);
                            }
                          }}
                          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          {isDiagramEditorOpen ? 'Hide Diagram Text Editor' : 'Edit Diagram Text'}
                        </button>
                        {visualType === 'html_tailwind' && (
                          <span className="text-[11px] text-muted-foreground">Tip: You can also click inside the mockup to edit text.</span>
                        )}
                      </div>

                      {isDiagramEditorOpen && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={diagramDraft}
                            onChange={(e) => setDiagramDraft(e.target.value)}
                            rows={8}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setIsDiagramEditorOpen(false);
                                setDiagramDraft(typeof visualContent === 'string' ? visualContent : '');
                              }}
                              className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                updateDiagramVisualContent(diagramDraft);
                                setIsDiagramEditorOpen(false);
                              }}
                              className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              Save Diagram Text
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>,
                0.18,
                18
              )}

              {/* Chart Visualization */}
              {hasChart && animatePresentText(
                <div data-slide-visual className={layoutProfile.visualShellClass}>
                  <PresentationVisualFrame
                    frameClassName="shadow-xl"
                    contentClassName="overflow-hidden"
                    borderColor={`${textColor}20`}
                    backgroundColor={`${theme.colors.background}20`}
                    minHeightPx={240}
                    maxHeightPx={420}
                  >
                    <ResponsiveContainer width="100%" height={layoutProfile.chartHeight}>
                    {chartData!.type === 'bar' && (
                      <BarChart data={chartData!.data}>
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

                    {chartData!.type === 'line' && (
                      <LineChart data={chartData!.data}>
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

                    {chartData!.type === 'pie' && (
                      <PieChart>
                        <Pie
                          data={chartData!.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData!.data.map((entry, index) => (
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
                  </PresentationVisualFrame>
                </div>,
                0.2,
                16
              )}

              {/* Stats Grid - Premium Glassmorphism KPI Cards with Animations */}
              {slide.stats && slide.stats.length > 0 && (
                <div data-slide-visual className={`grid gap-6 mt-10 ${slide.stats.length === 2 ? 'grid-cols-2' : slide.stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
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
                <div data-slide-visual className="grid grid-cols-2 gap-8 mt-10">
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
                <div data-slide-visual className="mt-10 relative">
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
                <div data-slide-visual className="mt-10 flex justify-center">
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
                <div data-slide-visual className={`grid gap-6 mt-10 ${slide.icons.length <= 3 ? 'grid-cols-3' : slide.icons.length === 4 ? 'grid-cols-4' : 'grid-cols-3 md:grid-cols-6'}`}>
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
                <div data-slide-visual className="mt-10 max-w-3xl mx-auto">
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
                      <div data-slide-visual className="mt-8 mb-8 flex justify-center w-full">
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
                            style={{ maxHeight: layoutProfile.imageMaxHeight, minHeight: '220px' }}
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
                    <div data-slide-visual className="mt-6 mb-8 flex justify-center">
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
                          style={{ maxHeight: layoutProfile.imageMaxHeight, minHeight: '160px' }}
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
                animatePresentText(
                  <p
                    data-slide-body
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdate?.({ ...slide, content: e.currentTarget.textContent || slide.content })}
                    className={`${layoutProfile.bodyClass} leading-relaxed font-medium max-w-3xl mx-auto drop-shadow-sm opacity-90 ${isEditable ? 'cursor-text hover:outline hover:outline-2 hover:outline-blue-500/50 rounded-lg px-2 -mx-2' : ''}`}
                    style={{ color: textColor }}
                  >
                    {safeBody}
                  </p>,
                  0.2,
                  14
                )
              )}

              {/* Bullets with Image - Smart Split Layout */}
              {safeBullets.length > 0 && !isFlowchart && hasImage && !isHero && (
                animatePresentText(
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                  {/* Bullets Column */}
                  <div data-slide-bullets className="space-y-4 order-2 lg:order-1">
                    {safeBullets.map((bullet, idx) => {
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
                            <span className={`${layoutProfile.bulletClass} leading-relaxed font-medium`}>{parsed.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Image Column */}
                  <div className="order-1 lg:order-2" data-slide-visual>
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
                        style={{ maxHeight: layoutProfile.imageMaxHeight, minHeight: '180px' }}
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
                </div>,
                0.24,
                14
                )
              )}

              {/* Bullets WITHOUT Image - Original Layout */}
              {safeBullets.length > 0 && !isFlowchart && (!hasImage || isHero) && (
                animatePresentText(
                <div data-slide-bullets className="grid gap-4 mt-10">
                  {safeBullets.map((bullet, idx) => {
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
                          <span className={`${layoutProfile.bulletClass} font-medium leading-relaxed opacity-95`} style={{ color: textColor }}>
                            {parsed.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>,
                0.24,
                14
                )
              )}

              {/* Flowchart/Process View */}
              {isFlowchart && safeBullets.length > 0 && (
                animatePresentText(
                <div data-slide-bullets className="flex flex-col md:flex-row items-center justify-center gap-6 mt-10 flex-wrap">
                  {safeBullets.map((step, idx) => (
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
                      {idx < safeBullets.length - 1 && (
                        <ArrowLeft className="w-6 h-6 rotate-180 opacity-50" />
                      )}
                    </div>
                  ))}
                </div>,
                0.24,
                14
                )
              )}

              {/* CTA */}
              {slide.cta && (
                animatePresentText(
                  <button
                    className="mt-12 px-10 py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center gap-3 mx-auto"
                    style={{
                      backgroundColor: textColor,
                      color: theme.colors.background
                    }}
                  >
                    {slide.cta} <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>,
                  0.3,
                  10
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


