import OpenAI from "openai";

const NEBIUS_BASE_URL =
  process.env.NEBIUS_BASE_URL ||
  process.env.QWEN_BASE_URL ||
  "https://api.tokenfactory.nebius.com/v1/";
const DEFAULT_NEBIUS_MODEL = process.env.QWEN_MODEL || "Qwen/Qwen3-Coder-480B-A35B-Instruct";
const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;

type NebiusTextModel =
  | "Qwen/Qwen3-Coder-480B-A35B-Instruct"
  | "Qwen/Qwen3-235B-A22B-Instruct-2507"
  | "Qwen/Qwen3-30B-A3B-Instruct-2507"
  | "Qwen/Qwen2.5-72B-Instruct"
  | "Qwen/QwQ-32B"
  | "deepseek-ai/DeepSeek-V3.2";

interface PresentationGenerationSettings {
  language?: string;
  audience?: string;
  tone?: string;
  textDensity?: string;
  purpose?: string;
  llmModel?: string;
}

type VisualType = "svg_code" | "mermaid" | "html_tailwind" | "chart_data";
type VisualArchetype = "dashboard_analytics" | "mobile_app_workflow" | "ops_control_center";
type ThemeTokens = Partial<Record<"--dd-bg" | "--dd-card" | "--dd-fg" | "--dd-accent" | "--dd-border", string>>;

interface VisualQualityResult {
  score: number;
  reasons: string[];
}

interface StrategistSlide {
  id: number;
  title: string;
  layout: string;
  visual_type: VisualType;
  visual_strategy: string;
  key_points: string[];
}

interface StrategistPlan {
  tone: string;
  audience: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  slides: StrategistSlide[];
}

interface CodeDrivenSlide {
  id: number;
  layout: string;
  title: string;
  body_text: string;
  bullet_points: string[];
  visual_type: VisualType;
  visual_content: string | Record<string, unknown>;
  chart_data?: Record<string, unknown> | null;
}

export interface CodeDrivenDeck {
  theme: {
    font: string;
    background: string;
    accent_color: string;
    tokens?: ThemeTokens;
    palette: {
      primary: string;
      secondary: string;
      accent: string;
    };
    tone: string;
    audience: string;
  };
  slides: CodeDrivenSlide[];
}

let qwenClient: OpenAI | null = null;

function getQwenClient(): OpenAI {
  if (!NEBIUS_API_KEY) {
    throw new Error("NEBIUS_API_KEY is not configured.");
  }
  if (!qwenClient) {
    qwenClient = new OpenAI({
      baseURL: NEBIUS_BASE_URL,
      apiKey: NEBIUS_API_KEY,
    });
  }
  return qwenClient;
}

function extractJsonFromText(rawText: string): string {
  const trimmed = rawText.trim();

  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch?.[1]) {
    return markdownMatch[1].trim();
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return trimmed;
}

async function callQwenJson(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 9000,
  model: NebiusTextModel = DEFAULT_NEBIUS_MODEL as NebiusTextModel
): Promise<any> {
  const client = getQwenClient();

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    const text = Array.isArray(content)
      ? content.map((entry: any) => (typeof entry === "string" ? entry : entry?.text || "")).join("")
      : content || "";

    if (!text) {
      throw new Error("Empty response from Qwen.");
    }

    const jsonText = extractJsonFromText(text);
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`Failed to parse Qwen JSON response: ${error instanceof Error ? error.message : "Unknown parse error"}`);
    }
  } catch (error) {
    // Re-throw API errors with more context
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        throw new Error(`Nebius API 404 error: Invalid API key or model ('${model}'). Please check your NEBIUS_API_KEY and QWEN_MODEL environment variables.`);
      }
      if (error.message.includes('401')) {
        throw new Error(`Nebius API 401 error: Invalid or missing API key. Please check your NEBIUS_API_KEY environment variable.`);
      }
    }
    throw error;
  }
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const color = typeof value === "string" ? value.trim() : "";
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : fallback;
}

function normalizeNebiusModel(value: unknown): NebiusTextModel {
  const model = typeof value === "string" ? value.trim() : "";
  const lower = model.toLowerCase();

  if (
    lower === "deepseek-ai/deepseek-v3.2" ||
    lower === "deepseek-v3.2" ||
    lower === "deepseek"
  ) {
    return "deepseek-ai/DeepSeek-V3.2";
  }

  if (
    lower === "qwen/qwen3-235b-a22b-instruct-2507" ||
    lower === "qwen3-235b" ||
    lower === "qwen"
  ) {
    return "Qwen/Qwen3-235B-A22B-Instruct-2507";
  }

  return DEFAULT_NEBIUS_MODEL as NebiusTextModel;
}

function normalizeGenerationSettings(input: PresentationGenerationSettings | undefined): Required<PresentationGenerationSettings> {
  return {
    language: typeof input?.language === "string" && input.language.trim() ? input.language.trim() : "English",
    audience: typeof input?.audience === "string" && input.audience.trim() ? input.audience.trim() : "Business stakeholders",
    tone: typeof input?.tone === "string" && input.tone.trim() ? input.tone.trim() : "Professional",
    textDensity: typeof input?.textDensity === "string" && input.textDensity.trim() ? input.textDensity.trim() : "concise",
    purpose: typeof input?.purpose === "string" && input.purpose.trim() ? input.purpose.trim() : "General presentation",
    llmModel: normalizeNebiusModel(input?.llmModel),
  };
}

function normalizeThemeTokens(input: ThemeTokens | undefined, fallbackAccent: string): Required<ThemeTokens> {
  return {
    "--dd-bg": normalizeHexColor(input?.["--dd-bg"], "#0f172a"),
    "--dd-card": normalizeHexColor(input?.["--dd-card"], "#1e293b"),
    "--dd-fg": normalizeHexColor(input?.["--dd-fg"], "#e2e8f0"),
    "--dd-accent": normalizeHexColor(input?.["--dd-accent"], fallbackAccent),
    "--dd-border": normalizeHexColor(input?.["--dd-border"], "#334155"),
  };
}

function normalizeVisualType(value: unknown, index = 0): VisualType {
  const type = typeof value === "string" ? value.toLowerCase().trim() : "";

  if (["svg", "svg_code", "svgcode", "vector"].includes(type)) return "svg_code";
  if (["mermaid", "diagram", "logic"].includes(type)) return "mermaid";
  if (["html", "html_tailwind", "mockup", "tailwind"].includes(type)) return "html_tailwind";
  if (["chart", "chart_data", "data", "recharts", "data_visual"].includes(type)) return "chart_data";

  const fallbackOrder: VisualType[] = ["html_tailwind", "mermaid", "svg_code", "chart_data"];
  return fallbackOrder[index % fallbackOrder.length];
}

function normalizeLayout(value: unknown, visualType: VisualType): string {
  const layout = typeof value === "string" ? value.trim() : "";
  if (layout) return layout;

  if (visualType === "chart_data" || visualType === "mermaid") return "center_visual";
  if (visualType === "html_tailwind") return "card_mockup";
  return "split_right";
}

function toStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function pickChartData(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function sanitizeMermaidText(text: string): string {
  return text.replace(/[{}\[\]<>"]/g, "").trim();
}

function extractTopicPhrase(input: string, fallback: string): string {
  const words = sanitizeMermaidText(input)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4);
  if (!words.length) return fallback;
  return words.slice(0, 2).join(" ");
}

function countMatches(input: string, pattern: RegExp): number {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

function inferVisualArchetype(slideTitle: string, slideBody: string, index: number): VisualArchetype {
  const text = `${slideTitle} ${slideBody}`.toLowerCase();
  if (/(mobile|app|onboarding|journey|activation|signup|retention)/.test(text)) {
    return "mobile_app_workflow";
  }
  if (/(ops|operations|system|incident|security|pipeline|control|monitoring)/.test(text)) {
    return "ops_control_center";
  }
  return index % 3 === 1 ? "mobile_app_workflow" : index % 3 === 2 ? "ops_control_center" : "dashboard_analytics";
}

function inferPreferredVisualTypeByTitle(title: string, body: string): VisualType | null {
  const text = `${title} ${body}`.toLowerCase();
  if (/(architecture|system design|data flow|solution architecture|platform flow)/.test(text)) {
    return "mermaid";
  }
  if (/(user experience|ux|user flow|journey|wireframe|interface|dashboard|app screen|product walkthrough|tech stack|stack)/.test(text)) {
    return "html_tailwind";
  }
  if (/(metrics|kpi|revenue|growth|forecast|trend|financial|usage)/.test(text)) {
    return "chart_data";
  }
  if (/(vision|innovation|security|global|future|concept)/.test(text)) {
    return "svg_code";
  }
  return null;
}

function scoreVisualContent(
  visualType: VisualType,
  visualContent: string | Record<string, unknown>,
  chartData: Record<string, unknown> | null
): VisualQualityResult {
  const reasons: string[] = [];
  let score = 0;

  if (visualType === "chart_data") {
    const source = chartData || (typeof visualContent === "object" ? visualContent as Record<string, unknown> : null);
    const data = Array.isArray(source?.data) ? source?.data : [];
    const chartType = typeof source?.type === "string" ? source.type.toLowerCase() : "";
    if (data.length >= 5) score += 40;
    else reasons.push("chart has fewer than 5 data points");
    if (["bar", "line", "pie", "area", "scatter"].includes(chartType)) score += 20;
    else reasons.push("chart type is missing or unsupported");
    if (data.every((entry: any) => typeof entry?.name === "string" && Number.isFinite(Number(entry?.value)))) score += 20;
    else reasons.push("chart data entries are malformed");
    if (Array.isArray(source?.colors) && source!.colors.length >= 3) score += 20;
    else reasons.push("chart color palette is underspecified");
    return { score, reasons };
  }

  if (typeof visualContent !== "string") {
    return { score: 0, reasons: ["visual content is not a string payload"] };
  }

  const text = visualContent.trim();
  if (!text) return { score: 0, reasons: ["visual content is empty"] };

  if (visualType === "mermaid") {
    const nodeCount = countMatches(text, /\[[^\]]+\]/g) + countMatches(text, /\([^)]+\)/g);
    const edgeCount = countMatches(text, /-->|==>|-.->|---/g);
    const hasSubgraph = /\bsubgraph\b/i.test(text);
    const longEnough = text.length >= 220;
    const crossingRisk = countMatches(text, /<-->|x--x|\/\\/g);
    if (nodeCount >= 6) score += 30; else reasons.push("mermaid has fewer than 6 nodes");
    if (edgeCount >= 5) score += 25; else reasons.push("mermaid has fewer than 5 edges");
    if (hasSubgraph) score += 20; else reasons.push("mermaid missing grouped lanes/sections");
    if (longEnough) score += 15; else reasons.push("mermaid code is too short");
    if (crossingRisk === 0) score += 10; else reasons.push("mermaid likely has crossing-heavy links");
    return { score, reasons };
  }

  if (visualType === "svg_code") {
    const primitiveCount =
      countMatches(text, /<(rect|circle|ellipse|path|line|polyline|polygon)\b/gi);
    const hasViewBox = /viewBox\s*=\s*["'][^"']+["']/i.test(text);
    const hasDefs = /<defs>/i.test(text);
    const hasTextLayer = /<text\b/i.test(text);
    if (primitiveCount >= 12) score += 35; else reasons.push("svg has fewer than 12 geometric primitives");
    if (hasViewBox) score += 20; else reasons.push("svg missing viewBox");
    if (hasDefs) score += 15; else reasons.push("svg missing gradient/defs layering");
    if (hasTextLayer) score += 10; else reasons.push("svg missing labeled focal text");
    if (text.length >= 520) score += 20; else reasons.push("svg is too short for premium depth");
    return { score, reasons };
  }

  if (visualType === "html_tailwind") {
    const divCount = countMatches(text, /<div\b|<section\b|<article\b/gi);
    const laneCount = countMatches(text, /<aside\b|grid-template-columns|grid-cols-|display\s*:\s*grid/gi);
    const hasInlineStyle = /style\s*=\s*["']/i.test(text);
    const hasTopBar = /(top bar|header|toolbar)/i.test(text) || /<header\b/i.test(text);
    const hasNav = /(side nav|sidebar|navigation)/i.test(text) || /nav/i.test(text);
    const hasKpis = /(kpi|metric|revenue|retention|conversion)/i.test(text);
    const hasChartArea = /(primary chart|chart area|sparkline|trend|pipeline)/i.test(text);
    const hasActivity = /(activity|timeline|events|updates)/i.test(text);
    const hasStatusChips = /(chip|status|badge)/i.test(text);
    const hasThemeVars = /--dd-|var\(--dd-/i.test(text);
    if (divCount >= 16) score += 16; else reasons.push("html mockup has too few structural blocks");
    if (laneCount >= 2) score += 10; else reasons.push("html mockup missing robust two-column structure");
    if (hasInlineStyle) score += 10; else reasons.push("html mockup missing inline styles");
    if (hasTopBar) score += 12; else reasons.push("html mockup missing top bar");
    if (hasNav) score += 12; else reasons.push("html mockup missing left navigation");
    if (hasKpis) score += 12; else reasons.push("html mockup missing KPI row");
    if (hasChartArea) score += 12; else reasons.push("html mockup missing primary chart area");
    if (hasActivity) score += 12; else reasons.push("html mockup missing activity area");
    if (hasStatusChips) score += 8; else reasons.push("html mockup missing status chips");
    if (hasThemeVars) score += 8; else reasons.push("html mockup missing theme token variables");
    return { score, reasons };
  }

  return { score: 0, reasons: ["unknown visual type"] };
}

function isWeakVisualContent(
  visualType: VisualType,
  visualContent: string | Record<string, unknown>,
  chartData: Record<string, unknown> | null
): boolean {
  const score = scoreVisualContent(visualType, visualContent, chartData).score;
  return score < getVisualQualityThreshold(visualType);
}

function getVisualQualityThreshold(visualType: VisualType): number {
  if (visualType === "html_tailwind") return 82;
  if (visualType === "svg_code") return 72;
  if (visualType === "mermaid") return 72;
  return 70;
}

function buildFallbackChartData(title: string, archetype: VisualArchetype, index = 0): Record<string, unknown> {
  const dataByArchetype: Record<VisualArchetype, Array<{ name: string; value: number }>> = {
    dashboard_analytics: [
      { name: "Q1", value: 24 },
      { name: "Q2", value: 36 },
      { name: "Q3", value: 48 },
      { name: "Q4", value: 63 },
      { name: "Q5", value: 72 },
    ],
    mobile_app_workflow: [
      { name: "Discovery", value: 38 },
      { name: "Signup", value: 59 },
      { name: "Activate", value: 66 },
      { name: "Retain", value: 72 },
      { name: "Expand", value: 81 },
    ],
    ops_control_center: [
      { name: "Ingest", value: 31 },
      { name: "Detect", value: 46 },
      { name: "Triage", value: 58 },
      { name: "Resolve", value: 69 },
      { name: "Stabilize", value: 77 },
    ],
  };
  const variance = (index % 5) - 2;
  const variedData = dataByArchetype[archetype].map((point, pointIndex) => ({
    ...point,
    value: Math.max(10, point.value + variance * (pointIndex + 1) * 2),
  }));
  const yAxisLabel = extractTopicPhrase(title, "Performance");

  return {
    type: "bar",
    title: title || "Key Metrics",
    data: variedData,
    xAxis: archetype === "dashboard_analytics" ? "Stage" : "Lifecycle",
    yAxis: `${yAxisLabel} Index`,
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    showLegend: true,
    showGrid: true,
  };
}

function buildFallbackVisualContent(
  visualType: VisualType,
  slideTitle: string,
  accent: string,
  index: number,
  slideBody = "",
  themeTokens?: Required<ThemeTokens>
): string | Record<string, unknown> {
  const title = sanitizeMermaidText(slideTitle || `Slide ${index + 1}`);
  const topic = extractTopicPhrase(slideTitle, "Business");
  const archetype = inferVisualArchetype(slideTitle, slideBody, index);
  const tokens = themeTokens || normalizeThemeTokens(undefined, accent);

  if (visualType === "mermaid") {
    if (archetype === "mobile_app_workflow") {
      return `flowchart LR
  A[${topic} Discovery] --> B[Personalized Onboarding]
  B --> C[In-App Activation]
  C --> D[Feature Recommendations]
  D --> E[Habit Trigger Loop]
  E --> F[Upsell Moment]
  F --> G[Retention Expansion]
  B -. quality gate .-> D
  C -. behavior signal .-> E`;
    }
    if (archetype === "ops_control_center") {
      return `flowchart LR
  A[${topic} Signals] --> B[Event Correlator]
  B --> C[Priority Classifier]
  C --> D[Runbook Engine]
  D --> E[Automated Mitigation]
  E --> F[Audit Trail]
  F --> G[Stability Review]
  C -. escalation path .-> F
  D -. compliance gate .-> G`;
    }
    return `flowchart LR
  A[${topic} Signal] --> B[Insight Model]
  B --> C[Priority Stack]
  C --> D[Initiative Launch]
  D --> E[Performance Tracking]
  E --> F[Business KPI Lift]
  F --> G[Optimization Cycle]
  B -. governance check .-> E
  C -. risk review .-> F`;
  }

  if (visualType === "svg_code") {
    return `<svg viewBox="0 0 920 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${tokens["--dd-card"]}" />
      <stop offset="100%" stop-color="${tokens["--dd-bg"]}" />
    </linearGradient>
    <linearGradient id="line${index}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${tokens["--dd-accent"]}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${tokens["--dd-accent"]}" stop-opacity="0.85" />
    </linearGradient>
  </defs>
  <rect x="20" y="20" width="880" height="380" rx="28" fill="url(#g${index})" stroke="${tokens["--dd-border"]}" />
  <circle cx="190" cy="214" r="88" fill="${tokens["--dd-accent"]}" fill-opacity="0.24" />
  <circle cx="190" cy="214" r="46" fill="${tokens["--dd-accent"]}" fill-opacity="0.5" />
  <rect x="320" y="96" width="510" height="44" rx="12" fill="${tokens["--dd-accent"]}" fill-opacity="0.24" />
  <rect x="320" y="162" width="422" height="28" rx="10" fill="${tokens["--dd-border"]}" fill-opacity="0.35" />
  <rect x="320" y="208" width="472" height="28" rx="10" fill="${tokens["--dd-border"]}" fill-opacity="0.28" />
  <rect x="320" y="254" width="392" height="28" rx="10" fill="${tokens["--dd-border"]}" fill-opacity="0.22" />
  <path d="M274 214 L316 214" stroke="url(#line${index})" stroke-width="6" stroke-linecap="round" />
  <path d="M744 308 C792 292, 812 264, 848 230" stroke="${tokens["--dd-accent"]}" stroke-width="5" fill="none" stroke-linecap="round" />
  <circle cx="848" cy="230" r="9" fill="${tokens["--dd-accent"]}" />
  <line x1="40" y1="70" x2="230" y2="70" stroke="${tokens["--dd-border"]}" stroke-opacity="0.55" />
  <line x1="40" y1="350" x2="230" y2="350" stroke="${tokens["--dd-border"]}" stroke-opacity="0.55" />
  <text x="320" y="336" fill="${tokens["--dd-fg"]}" font-size="27" font-family="Inter, Arial, sans-serif" font-weight="700">${title}</text>
  <text x="320" y="364" fill="${tokens["--dd-fg"]}" fill-opacity="0.72" font-size="14" font-family="Inter, Arial, sans-serif">Enterprise-grade code-rendered illustration</text>
</svg>`;
  }

  if (visualType === "chart_data") {
    return buildFallbackChartData(slideTitle, archetype, index);
  }

  const mockTitle = slideTitle || "Executive Mockup";
  const baseCard = `background:var(--dd-card);border:1px solid var(--dd-border);border-radius:14px;`;
  const commonShell = `max-width:860px;margin:0 auto;padding:20px;border-radius:24px;border:1px solid var(--dd-border);background:linear-gradient(135deg,var(--dd-card) 0%,var(--dd-bg) 100%);color:var(--dd-fg);font-family:Inter,Segoe UI,Arial,sans-serif;`;

  if (archetype === "mobile_app_workflow") {
    return `<div style="${commonShell}">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div style="font-size:14px;font-weight:700;">${mockTitle}</div>
    <div style="display:flex;gap:8px;">
      <span style="height:8px;width:8px;border-radius:999px;background:var(--dd-accent);display:inline-block;"></span>
      <span style="height:8px;width:8px;border-radius:999px;background:var(--dd-border);display:inline-block;"></span>
      <span style="height:8px;width:8px;border-radius:999px;background:var(--dd-border);display:inline-block;"></span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:14px;">
    <aside style="${baseCard}padding:12px;display:grid;gap:8px;">
      <div style="font-size:11px;opacity:.75;">Navigation</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-accent) 18%, transparent);">Home</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Campaigns</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Users</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Settings</div>
    </aside>
    <section style="display:grid;gap:10px;">
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">Activation</div><div style="font-size:18px;font-weight:700;">72%</div></div>
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">MAU</div><div style="font-size:18px;font-weight:700;">142K</div></div>
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">Retention</div><div style="font-size:18px;font-weight:700;">89%</div></div>
      </div>
      <div style="${baseCard}padding:12px;">
        <div style="font-size:12px;font-weight:600;margin-bottom:8px;">Activity Feed</div>
        <div style="display:grid;gap:8px;">
          <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 7%, transparent);display:flex;justify-content:space-between;"><span>Onboarding flow updated</span><span style="font-size:10px;opacity:.7;">2m</span></div>
          <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 7%, transparent);display:flex;justify-content:space-between;"><span>A/B test hit target</span><span style="font-size:10px;opacity:.7;">14m</span></div>
          <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 7%, transparent);display:flex;justify-content:space-between;"><span>Status chips: <b>Live</b> <b>Stable</b></span><span style="font-size:10px;opacity:.7;">1h</span></div>
        </div>
      </div>
    </section>
  </div>
</div>`;
  }

  if (archetype === "ops_control_center") {
    return `<div style="${commonShell}">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div style="font-size:14px;font-weight:700;">${mockTitle}</div>
    <div style="font-size:11px;padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--dd-accent) 20%, transparent);">Ops Control</div>
  </div>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:14px;">
    <aside style="${baseCard}padding:12px;display:grid;gap:8px;">
      <div style="font-size:11px;opacity:.75;">Systems</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-accent) 18%, transparent);">Core API</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Queue Cluster</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Billing Node</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Incident Hub</div>
    </aside>
    <section style="display:grid;gap:10px;">
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">Latency</div><div style="font-size:18px;font-weight:700;">82ms</div></div>
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">Availability</div><div style="font-size:18px;font-weight:700;">99.98%</div></div>
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">Open Alerts</div><div style="font-size:18px;font-weight:700;">7</div></div>
      </div>
      <div style="${baseCard}padding:12px;display:grid;gap:8px;">
        <div style="display:flex;justify-content:space-between;"><span style="font-size:12px;font-weight:600;">Primary Throughput</span><span style="font-size:11px;opacity:.7;">72%</span></div>
        <div style="height:10px;border-radius:999px;background:color-mix(in srgb,var(--dd-fg) 10%, transparent);"><div style="height:10px;width:72%;border-radius:999px;background:var(--dd-accent);"></div></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:12px;font-weight:600;">Recovery SLA</span><span style="font-size:11px;opacity:.7;">93%</span></div>
        <div style="height:10px;border-radius:999px;background:color-mix(in srgb,var(--dd-fg) 10%, transparent);"><div style="height:10px;width:93%;border-radius:999px;background:var(--dd-accent);"></div></div>
        <div style="font-size:11px;">Status chips: <b>Healthy</b> <b>Guarded</b> <b>Audited</b></div>
      </div>
    </section>
  </div>
</div>`;
  }

  return `<div style="${commonShell}">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div style="font-size:14px;font-weight:700;">${mockTitle}</div>
    <div style="font-size:11px;padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--dd-accent) 18%, transparent);">Enterprise Premium</div>
  </div>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:14px;">
    <aside style="${baseCard}padding:12px;display:grid;gap:8px;">
      <div style="font-size:11px;opacity:.75;">Navigation</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-accent) 18%, transparent);">Overview</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Pipeline</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Forecast</div>
      <div style="padding:8px;border-radius:10px;background:color-mix(in srgb,var(--dd-fg) 8%, transparent);">Settings</div>
    </aside>
    <section style="display:grid;gap:10px;">
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">Revenue</div><div style="font-size:18px;font-weight:700;">$1.28M</div></div>
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">Win Rate</div><div style="font-size:18px;font-weight:700;">41%</div></div>
        <div style="${baseCard}padding:10px;"><div style="font-size:11px;opacity:.7;">NPS</div><div style="font-size:18px;font-weight:700;">73</div></div>
      </div>
      <div style="${baseCard}padding:12px;display:grid;gap:8px;">
        <div style="font-size:12px;font-weight:600;">Primary Chart Area</div>
        <div style="height:10px;border-radius:999px;background:color-mix(in srgb,var(--dd-fg) 10%, transparent);"><div style="height:10px;width:68%;border-radius:999px;background:var(--dd-accent);"></div></div>
        <div style="height:10px;border-radius:999px;background:color-mix(in srgb,var(--dd-fg) 10%, transparent);"><div style="height:10px;width:54%;border-radius:999px;background:var(--dd-accent);"></div></div>
        <div style="height:10px;border-radius:999px;background:color-mix(in srgb,var(--dd-fg) 10%, transparent);"><div style="height:10px;width:82%;border-radius:999px;background:var(--dd-accent);"></div></div>
        <div style="font-size:11px;">Activity list: Quarterly sync completed | Forecast adjusted | Status chips: <b>Live</b> <b>Stable</b></div>
      </div>
    </section>
  </div>
</div>`;
}

function normalizeStrategistPlan(
  rawPlan: any,
  outlines: any[],
  pageCount: number
): StrategistPlan {
  const fallbackPrimary = "#1e3a8a";
  const fallbackSecondary = "#0f172a";
  const fallbackAccent = "#38bdf8";

  const rawSlides = Array.isArray(rawPlan?.slides) ? rawPlan.slides : outlines;

  const slides: StrategistSlide[] = Array.from({ length: pageCount }, (_, index) => {
    const source = rawSlides[index] || outlines[index] || {};
    const title = (typeof source.title === "string" && source.title.trim())
      ? source.title.trim()
      : `Slide ${index + 1}`;

    const visualType = normalizeVisualType(
      source.visual_type || source.visualType || source.visual_strategy || source.type,
      index
    );

    const strategy =
      (typeof source.visual_strategy === "string" && source.visual_strategy.trim()) ||
      (typeof source.description === "string" && source.description.trim()) ||
      `Use ${visualType} for slide ${index + 1}.`;

    return {
      id: index + 1,
      title,
      layout: normalizeLayout(source.layout, visualType),
      visual_type: visualType,
      visual_strategy: strategy,
      key_points: toStringArray(
        source.key_points || source.keyPoints || source.bullets || source.bulletPoints,
        []
      ),
    };
  });

  return {
    tone: (typeof rawPlan?.tone === "string" && rawPlan.tone.trim()) ? rawPlan.tone.trim() : "Confident and modern",
    audience: (typeof rawPlan?.audience === "string" && rawPlan.audience.trim()) ? rawPlan.audience.trim() : "Business stakeholders",
    palette: {
      primary: normalizeHexColor(rawPlan?.palette?.primary, fallbackPrimary),
      secondary: normalizeHexColor(rawPlan?.palette?.secondary, fallbackSecondary),
      accent: normalizeHexColor(rawPlan?.palette?.accent, fallbackAccent),
    },
    slides,
  };
}

async function repairVisualContentWithQwen({
  visualType,
  title,
  bodyText,
  bulletPoints,
  layout,
  currentVisual,
  currentChartData,
  failureReasons,
  themeTokens,
  model,
}: {
  visualType: VisualType;
  title: string;
  bodyText: string;
  bulletPoints: string[];
  layout: string;
  currentVisual: string | Record<string, unknown>;
  currentChartData: Record<string, unknown> | null;
  failureReasons: string[];
  themeTokens: Required<ThemeTokens>;
  model: NebiusTextModel;
}): Promise<{ visual_content: string | Record<string, unknown>; chart_data: Record<string, unknown> | null } | null> {
  try {
    const systemPrompt = `You are repairing a single weak presentation visual.
Return strict JSON only:
{
  "visual_content": "string or object",
  "chart_data": { "type": "bar|line|pie|area|scatter", "data": [{ "name": "Q1", "value": 10 }] } | null
}
Rules:
- Keep enterprise premium quality, no toy wireframes.
- html_tailwind must include: header bar, left navigation, KPI row, primary chart area, activity list, status chips.
- mermaid must include grouped lanes/sections and clear directional flow.
- svg_code must include viewBox, layered depth, 12+ primitives, and balanced whitespace.
- Respect these theme tokens if visual_type is html_tailwind or svg_code:
  var(--dd-bg), var(--dd-card), var(--dd-fg), var(--dd-accent), var(--dd-border).`;

    const userPrompt = JSON.stringify(
      {
        visual_type: visualType,
        title,
        layout,
        body_text: bodyText,
        bullet_points: bulletPoints,
        failure_reasons: failureReasons,
        theme_tokens: themeTokens,
        current_visual: currentVisual,
        current_chart_data: currentChartData,
      },
      null,
      2
    );

    const repaired = await callQwenJson(systemPrompt, userPrompt, 2600, model);
    const candidateVisual =
      repaired?.visual_content && (typeof repaired.visual_content === "string" || typeof repaired.visual_content === "object")
        ? repaired.visual_content
        : currentVisual;
    const candidateChartData = pickChartData(repaired?.chart_data || repaired?.chartData || null) || currentChartData;
    return {
      visual_content: candidateVisual,
      chart_data: candidateChartData,
    };
  } catch {
    return null;
  }
}

async function normalizeCodeDrivenDeck(
  rawDeck: any,
  strategistPlan: StrategistPlan,
  outlines: any[],
  themeTokens?: ThemeTokens,
  model: NebiusTextModel = DEFAULT_NEBIUS_MODEL as NebiusTextModel
): Promise<CodeDrivenDeck> {
  const rawSlides = Array.isArray(rawDeck?.slides) ? rawDeck.slides : [];
  const pageCount = strategistPlan.slides.length;
  const accentColor = normalizeHexColor(
    rawDeck?.theme?.accent_color || rawDeck?.theme?.accentColor,
    strategistPlan.palette.accent
  );
  const normalizedThemeTokens = normalizeThemeTokens(themeTokens, accentColor);

  const slides: CodeDrivenSlide[] = Array.from({ length: pageCount }, (_, index) => {
    const source = rawSlides[index] || {};
    const strategySlide = strategistPlan.slides[index];
    const outlineSlide = outlines[index] || {};

    const visualType = normalizeVisualType(
      source.visual_type || source.visualType || strategySlide.visual_type,
      index
    );
    const chartData = pickChartData(source.chart_data || source.chartData || source.visual_content);
    const visualContent = (() => {
      const provided = source.visual_content || source.visualContent;
      if (typeof provided === "string" && provided.trim()) return provided;
      if (provided && typeof provided === "object") return provided as Record<string, unknown>;
      if (visualType === "chart_data" && chartData) return chartData;
      return buildFallbackVisualContent(
        visualType,
        source.title || strategySlide.title,
        accentColor,
        index,
        source.body_text || source.bodyText || source.content || "",
        normalizedThemeTokens
      );
    })();

    const upgradedVisualContent = isWeakVisualContent(visualType, visualContent, chartData)
      ? buildFallbackVisualContent(
          visualType,
          source.title || strategySlide.title,
          accentColor,
          index,
          source.body_text || source.bodyText || source.content || "",
          normalizedThemeTokens
        )
      : visualContent;

    const bodyText =
      (typeof source.body_text === "string" && source.body_text.trim()) ||
      (typeof source.bodyText === "string" && source.bodyText.trim()) ||
      (typeof source.content === "string" && source.content.trim()) ||
      (typeof outlineSlide.content === "string" && outlineSlide.content.trim()) ||
      "";

    const bulletPoints = toStringArray(
      source.bullet_points || source.bulletPoints || source.bullets || outlineSlide.bullets || outlineSlide.bulletPoints,
      strategySlide.key_points
    );

    return {
      id: index + 1,
      layout: normalizeLayout(source.layout || strategySlide.layout, visualType),
      title: (typeof source.title === "string" && source.title.trim()) ? source.title.trim() : strategySlide.title,
      body_text: bodyText,
      bullet_points: bulletPoints,
      visual_type: visualType,
      visual_content: upgradedVisualContent,
      chart_data: visualType === "chart_data"
        ? (
          (chartData && !isWeakVisualContent("chart_data", upgradedVisualContent, chartData)
            ? chartData
            : buildFallbackChartData(
                source.title || strategySlide.title,
                inferVisualArchetype(
                  source.title || strategySlide.title,
                  source.body_text || source.bodyText || source.content || "",
                  index
                ),
                index
              ))
        )
        : null,
    };
  });

  // Align visual type to slide intent keywords so project decks include stronger architecture/UX/stack coverage.
  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    const preferredType = inferPreferredVisualTypeByTitle(slide.title, slide.body_text);
    if (!preferredType || preferredType === slide.visual_type) continue;

    slides[i] = {
      ...slide,
      visual_type: preferredType,
      layout: normalizeLayout(slide.layout, preferredType),
      visual_content: buildFallbackVisualContent(
        preferredType,
        slide.title,
        accentColor,
        i,
        slide.body_text || "",
        normalizedThemeTokens
      ),
      chart_data: preferredType === "chart_data"
        ? buildFallbackChartData(
            slide.title,
            inferVisualArchetype(slide.title, slide.body_text || "", i),
            i
          )
        : null,
    };
  }

  const requiredMix: Partial<Record<VisualType, number>> =
    pageCount >= 6
      ? { html_tailwind: 2, mermaid: 1, svg_code: 1, chart_data: 1 }
      : pageCount >= 4
        ? { html_tailwind: 1, mermaid: 1, svg_code: 1, chart_data: 1 }
        : { html_tailwind: 1, svg_code: 1 };

  const counts = slides.reduce((acc, slide) => {
    acc[slide.visual_type] = (acc[slide.visual_type] || 0) + 1;
    return acc;
  }, {} as Record<VisualType, number>);

  const pickConvertibleIndex = (targetType: VisualType): number => {
    for (let i = slides.length - 1; i >= 0; i -= 1) {
      const currentType = slides[i].visual_type;
      const requiredCurrent = requiredMix[currentType] || 0;
      if (currentType !== targetType && (counts[currentType] || 0) > requiredCurrent) {
        return i;
      }
    }
    return slides.findIndex((slide) => slide.visual_type !== targetType);
  };

  (Object.keys(requiredMix) as VisualType[]).forEach((targetType) => {
    const required = requiredMix[targetType] || 0;
    while ((counts[targetType] || 0) < required) {
      const idx = pickConvertibleIndex(targetType);
      if (idx < 0) break;

      const prevType = slides[idx].visual_type;
      counts[prevType] = Math.max((counts[prevType] || 1) - 1, 0);

      slides[idx] = {
        ...slides[idx],
        visual_type: targetType,
        layout: normalizeLayout(slides[idx].layout, targetType),
        visual_content: buildFallbackVisualContent(
          targetType,
          slides[idx].title,
          accentColor,
          idx,
          slides[idx].body_text || "",
          normalizedThemeTokens
        ),
        chart_data: targetType === "chart_data"
          ? buildFallbackChartData(
              slides[idx].title,
              inferVisualArchetype(slides[idx].title, slides[idx].body_text || "", idx),
              idx
            )
          : null,
      };

      counts[targetType] = (counts[targetType] || 0) + 1;
    }
  });

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    const baselineScore = scoreVisualContent(slide.visual_type, slide.visual_content, slide.chart_data || null);
    const qualityThreshold = getVisualQualityThreshold(slide.visual_type);
    if (baselineScore.score >= qualityThreshold) continue;

    const repaired = await repairVisualContentWithQwen({
      visualType: slide.visual_type,
      title: slide.title,
      bodyText: slide.body_text,
      bulletPoints: slide.bullet_points,
      layout: slide.layout,
      currentVisual: slide.visual_content,
      currentChartData: slide.chart_data || null,
      failureReasons: baselineScore.reasons.slice(0, 5),
      themeTokens: normalizedThemeTokens,
      model,
    });

    if (repaired) {
      const repairedScore = scoreVisualContent(slide.visual_type, repaired.visual_content, repaired.chart_data);
      if (repairedScore.score >= qualityThreshold && repairedScore.score > baselineScore.score) {
        slides[i] = {
          ...slide,
          visual_content: repaired.visual_content,
          chart_data: slide.visual_type === "chart_data"
            ? (repaired.chart_data || buildFallbackChartData(
                slide.title,
                inferVisualArchetype(slide.title, slide.body_text || "", i),
                i
              ))
            : null,
        };
        continue;
      }
    }

    slides[i] = {
      ...slide,
      visual_content: buildFallbackVisualContent(
        slide.visual_type,
        slide.title,
        accentColor,
        i,
        slide.body_text || "",
        normalizedThemeTokens
      ),
      chart_data: slide.visual_type === "chart_data"
        ? buildFallbackChartData(
            slide.title,
            inferVisualArchetype(slide.title, slide.body_text || "", i),
            i
          )
        : null,
    };
  }

  // Ensure assets are not near-duplicates across slides.
  const seenVisualSignatures = new Set<string>();
  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    const rawSignature =
      typeof slide.visual_content === "string"
        ? slide.visual_content.toLowerCase().replace(/\s+/g, " ").slice(0, 240)
        : JSON.stringify(slide.visual_content || {});
    const signature = `${slide.visual_type}:${rawSignature}`;

    if (!seenVisualSignatures.has(signature)) {
      seenVisualSignatures.add(signature);
      continue;
    }

    slides[i] = {
      ...slide,
      visual_content: buildFallbackVisualContent(
        slide.visual_type,
        slide.title,
        accentColor,
        i,
        slide.body_text || "",
        normalizedThemeTokens
      ),
      chart_data: slide.visual_type === "chart_data"
        ? buildFallbackChartData(
            slide.title,
            inferVisualArchetype(slide.title, slide.body_text || "", i),
            i
          )
        : null,
    };
    const replacedSignature =
      typeof slides[i].visual_content === "string"
        ? slides[i].visual_content.toLowerCase().replace(/\s+/g, " ").slice(0, 240)
        : JSON.stringify(slides[i].visual_content || {});
    seenVisualSignatures.add(`${slides[i].visual_type}:${replacedSignature}`);
  }

  return {
    theme: {
      font: (typeof rawDeck?.theme?.font === "string" && rawDeck.theme.font.trim()) ? rawDeck.theme.font.trim() : "Inter",
      background: (typeof rawDeck?.theme?.background === "string" && rawDeck.theme.background.trim()) ? rawDeck.theme.background.trim() : "bg-slate-900",
      accent_color: accentColor,
      tokens: normalizedThemeTokens,
      palette: {
        primary: normalizeHexColor(rawDeck?.theme?.palette?.primary, strategistPlan.palette.primary),
        secondary: normalizeHexColor(rawDeck?.theme?.palette?.secondary, strategistPlan.palette.secondary),
        accent: accentColor,
      },
      tone: strategistPlan.tone,
      audience: strategistPlan.audience,
    },
    slides,
  };
}

export async function generateCodeDrivenPresentation({
  prompt,
  outlines,
  themeHint,
  themeTokens,
  settings,
  model,
}: {
  prompt: string;
  outlines: any[];
  themeHint?: string;
  themeTokens?: ThemeTokens;
  settings?: PresentationGenerationSettings;
  model?: string;
}): Promise<CodeDrivenDeck> {
  const pageCount = outlines.length > 0 ? outlines.length : 8;
  const normalizedSettings = normalizeGenerationSettings({
    ...settings,
    llmModel: model || settings?.llmModel,
  });
  const selectedModel = normalizeNebiusModel(normalizedSettings.llmModel);
  const normalizedInputTokens = normalizeThemeTokens(themeTokens, "#38bdf8");
  const compactOutline = outlines.slice(0, pageCount).map((slide: any, index: number) => ({
    id: index + 1,
    title: slide?.title || `Slide ${index + 1}`,
    content: slide?.content || slide?.description || "",
    bullets: slide?.bullets || slide?.bulletPoints || [],
    type: slide?.type || slide?.layout || "content",
  }));

  const strategistSystemPrompt = `You are the Strategist Agent for DraftDeckAI.
Output valid JSON only. No markdown and no commentary.
You analyze a presentation title and produce:
1) tone
2) audience
3) palette with primary, secondary, accent hex colors
4) slides array with exactly the requested number of slides
Design direction requirements:
- Build a coherent visual story across slides, not isolated cards.
- Keep readability high on both light and dark themes.
- Prefer premium compositions with whitespace, hierarchy, and clear focal points.
- Keep slide intent specific so coder output is visually strong, not generic.
- Make strategies theme-adaptive: visuals must still look correct if the user switches theme later.
- Do not allow toy wireframes; strategy quality must be boardroom-ready.
- If a deck has multiple html_tailwind slides, assign different mock archetypes (e.g., executive dashboard, product workflow, ops command center).
- Tie each slide visual strategy tightly to the slide title/topic so labels and structure are context-aware.
- Strictly honor requested language, audience level, tone, and text density.
- For project/product/technical decks with 6+ slides, include:
  1) one UX/user-flow slide (mermaid journey or flowchart)
  2) one system architecture slide (mermaid with subgraph layers: Client, API, Services, Data)
  3) one tech stack slide (mermaid or html_tailwind showing technologies)
- Architecture diagrams should show clear layer separation and data flow direction.
Each slide must include:
- id
- title
- layout
- visual_type (one of: svg_code, mermaid, html_tailwind, chart_data)
- visual_strategy
- key_points (array)
Balance visual_type choices across the deck.
If requested_slide_count is 6 or more, include at least:
- 2 html_tailwind slides for UI mockups
- 1 mermaid slide for logic/process
- 1 svg_code slide for abstract illustration
- 1 chart_data slide for quantitative insight.`;

  const strategistUserPrompt = JSON.stringify(
    {
      title: prompt,
      preferred_theme: themeHint || "",
      theme_tokens: normalizedInputTokens,
      generation_preferences: normalizedSettings,
      requested_slide_count: pageCount,
      existing_outline: compactOutline,
    },
    null,
    2
  );

  const strategistRaw = await callQwenJson(strategistSystemPrompt, strategistUserPrompt, 4500, selectedModel);
  const strategistPlan = normalizeStrategistPlan(strategistRaw, compactOutline, pageCount);

  const coderSystemPrompt = `You are the Coder Agent for DraftDeckAI.
You produce JSON only.
Return exactly this object shape:
{
  "theme": {
    "font": "string",
    "background": "string",
    "accent_color": "#RRGGBB",
    "palette": {
      "primary": "#RRGGBB",
      "secondary": "#RRGGBB",
      "accent": "#RRGGBB"
    }
  },
  "slides": [
    {
      "id": 1,
      "layout": "split_right|center_visual|card_mockup|cover|split|chart|list|process",
      "title": "string",
      "body_text": "string",
      "bullet_points": ["string"],
      "visual_type": "svg_code|mermaid|html_tailwind|chart_data",
      "visual_content": "string or object",
      "chart_data": { "type": "bar|line|pie|area|scatter", "data": [{ "name": "Q1", "value": 10 }] }
    }
  ]
}
Rules:
- visual_content must be valid for the visual_type.
- All visuals must look premium in a 16:9 presentation card.
- Keep visuals render-safe: no giant fixed sizes; target a safe canvas around width<=900 and height<=420.
- Avoid repetitive design. Each slide visual should feel distinct.
- Each slide must have a unique asset composition; do not reuse the same mockup skeleton or same diagram labels across slides.
- Reflect the presentation title and each slide title directly in labels, node names, and UI sections.
- Strictly honor generation preferences for language, audience level, tone, and text density.
- Build visuals so they adapt to theme changes after generation (light/dark/colorful themes).
- Avoid hardcoding brand colors; favor neutral structure + accentable elements.
- Never output toy wireframes. Every visual should be enterprise-grade and boardroom-ready.
- For mermaid, output syntactically valid Mermaid code starting with diagram type (flowchart TD, sequenceDiagram, classDiagram, etc.).
- For mermaid architecture diagrams, use flowchart TD or flowchart LR with clear directional flow.
- For mermaid, produce at least 6-8 nodes and 5+ edges with short, business-relevant labels (1-3 words max).
- For mermaid, enforce lane/section grouping using subgraph blocks for logical sections (e.g., subgraph Frontend, subgraph Backend, subgraph Database).
- For mermaid, avoid crossing-heavy spaghetti graphs by using clear hierarchy (TD for top-down, LR for left-right).
- For mermaid, avoid floating lane-title nodes that dominate the canvas; keep labels concise and prioritize readable node spacing.
- For mermaid system architecture, include: Client/Frontend layer, API Gateway, Services/Microservices, Data layer (Database/Cache).
- For mermaid sequence diagrams, use participant declarations and clear message flow with arrows (->> for request, -->> for response).
- For mermaid, use appropriate node shapes: [Rectangle] for processes, {{Database}} for data stores, ({Circle}) for start/end, {Diamond} for decisions.
- For mermaid, apply styling hints using classDef for consistent colors (e.g., classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff).

Example mermaid architecture patterns:
1) Modern Web App Architecture:
flowchart TD
  subgraph Client["Client Layer"]
    A[Web Browser]
    B[Mobile App]
  end
  subgraph Edge["Edge Layer"]
    C[CDN]
    D[Load Balancer]
  end
  subgraph API["API Layer"]
    E[API Gateway]
    F[Auth Service]
    G[Business Logic]
  end
  subgraph Data["Data Layer"]
    H[(PostgreSQL)]
    I[(Redis Cache)]
    J[(S3 Storage)]
  end
  A & B --> D
  D --> E
  E --> F & G
  G --> H & I & J
  classDef client fill:#3b82f6,stroke:#1e40af,color:#fff
  classDef edge fill:#10b981,stroke:#047857,color:#fff
  classDef api fill:#8b5cf6,stroke:#6d28d9,color:#fff
  classDef data fill:#f59e0b,stroke:#b45309,color:#fff
  class A,B client
  class C,D edge
  class E,F,G api
  class H,I,J data

2) Microservices Flow:
flowchart LR
  A[Client] --> B[API Gateway]
  B --> C[User Service]
  B --> D[Order Service]
  B --> E[Payment Service]
  C --> F[(Users DB)]
  D --> G[(Orders DB)]
  E --> H[(Payments DB)]
  D --> E
- For svg_code, output full <svg> markup with clean geometric composition.
- For svg_code, use viewBox, avoid huge fixed width/height, and include 12+ primitives with layered depth, a focal cluster, and balanced whitespace.
- For html_tailwind, output clean HTML without script tags and with inline style attributes for critical visual styling.
- For html_tailwind, do not use external images; use div/span blocks only.
- For html_tailwind, MUST include top header bar, left side navigation, KPI metrics row, primary chart area, activity list, and status chips.
- For html_tailwind, if multiple mockup slides exist, each must use a distinct archetype and layout rhythm.
- For html_tailwind, avoid absolute positioning for major blocks and avoid overflow-prone widths.
- For html_tailwind, prefer using CSS variables when possible: var(--dd-bg), var(--dd-card), var(--dd-fg), var(--dd-accent), var(--dd-border).
- For html_tailwind, produce premium wireframe-quality UI blocks (clean grid, hierarchy, spacing) with no scrolling required in a 16:9 frame.
- For chart_data, output realistic values with 5-7 labeled points.
- Before final output, do an internal quality check and upgrade any weak/placeholder visual.`;

  const coderUserPrompt = JSON.stringify(
    {
      title: prompt,
      preferred_theme: themeHint || "",
      generation_preferences: normalizedSettings,
      render_constraints: {
        canvas: "16:9 slide safe area",
        max_visual_width: 900,
        max_visual_height: 420,
        premium_goal: "executive-grade deck quality with clean hierarchy and spacing",
      },
      theme_tokens: ["--dd-bg", "--dd-card", "--dd-fg", "--dd-accent", "--dd-border"],
      resolved_theme_tokens: normalizedInputTokens,
      strategist_plan: strategistPlan,
      reference_outline: compactOutline,
    },
    null,
    2
  );

  const coderRaw = await callQwenJson(coderSystemPrompt, coderUserPrompt, 12000, selectedModel);
  return await normalizeCodeDrivenDeck(coderRaw, strategistPlan, compactOutline, normalizedInputTokens, selectedModel);
}
