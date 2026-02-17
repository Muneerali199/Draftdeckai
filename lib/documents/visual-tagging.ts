/**
 * DraftDeckAI Productivity Engine - Visual Tagging System
 * Parses visual tags and generates diagram/chart code
 */

import { VisualTag, VisualType, ChartData } from '@/types/documents';

export interface ParsedVisual {
  type: VisualType;
  content: string;
  title: string;
  mermaidCode?: string;
  chartData?: ChartData;
}

// Regex pattern to find visual tags in content
const VISUAL_TAG_REGEX = /\[DIAGRAM:\s*(\w+)\s*\]/gi;

/**
 * Extract visual tags from document content
 */
export function extractVisualTags(content: string): { content: string; visuals: ParsedVisual[] } {
  const visuals: ParsedVisual[] = [];
  let match;
  let cleanedContent = content;

  while ((match = VISUAL_TAG_REGEX.exec(content)) !== null) {
    const visualType = match[1].toLowerCase() as VisualType;
    const visual = generateVisual(visualType, match.index);
    visuals.push(visual);
    
    // Replace tag with placeholder for rendering
    cleanedContent = cleanedContent.replace(match[0], `{{VISUAL:${visuals.length - 1}}}`);
  }

  return { content: cleanedContent, visuals };
}

/**
 * Generate visual based on type
 */
function generateVisual(type: VisualType, seed: number): ParsedVisual {
  switch (type) {
    case 'gantt-chart':
      return {
        type,
        title: 'Project Timeline',
        content: 'Gantt chart showing project phases and milestones',
        mermaidCode: generateGanttChart(seed),
      };
    case 'flowchart':
      return {
        type,
        title: 'Process Flow',
        content: 'Flowchart depicting the process workflow',
        mermaidCode: generateFlowchart(seed),
      };
    case 'pie-chart':
      return {
        type,
        title: 'Distribution',
        content: 'Pie chart showing percentage distribution',
        chartData: generatePieChartData(seed),
      };
    case 'bar-chart':
      return {
        type,
        title: 'Comparison Data',
        content: 'Bar chart comparing key metrics',
        chartData: generateBarChartData(seed),
      };
    case 'line-chart':
      return {
        type,
        title: 'Trend Analysis',
        content: 'Line chart showing trends over time',
        chartData: generateLineChartData(seed),
      };
    case 'timeline':
      return {
        type,
        title: 'Timeline',
        content: 'Visual timeline of events',
        mermaidCode: generateTimeline(seed),
      };
    case 'mind-map':
      return {
        type,
        title: 'Concept Map',
        content: 'Mind map showing relationships',
        mermaidCode: generateMindMap(seed),
      };
    case 'table':
      return {
        type,
        title: 'Data Table',
        content: 'Structured data presentation',
        mermaidCode: generateTable(seed),
      };
    default:
      return {
        type: 'flowchart',
        title: 'Diagram',
        content: 'Visual representation',
        mermaidCode: generateFlowchart(seed),
      };
  }
}

/**
 * Generate Mermaid Gantt chart code
 */
function generateGanttChart(seed: number): string {
  return `\`\`\`mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Requirements    :a1, 2025-01-01, 7d
    Design          :a2, after a1, 7d
    section Phase 2
    Development     :a3, after a2, 14d
    Testing         :a4, after a3, 7d
    section Phase 3
    Deployment      :a5, after a4, 3d
    Review          :a6, after a5, 2d
\`\`\``;
}

/**
 * Generate Mermaid Flowchart code
 */
function generateFlowchart(seed: number): string {
  return `\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E
\`\`\``;
}

/**
 * Generate Mermaid Timeline code
 */
function generateTimeline(seed: number): string {
  return `\`\`\`mermaid
timeline
    title Project Milestones
    2025 Q1 : Planning
            : Requirements
            : Design
    2025 Q2 : Development
            : Testing
            : Launch
\`\`\``;
}

/**
 * Generate Mermaid Mind Map code
 */
function generateMindMap(seed: number): string {
  return `\`\`\`mermaid
mindmap
  root((Product))
    Features
      Core
      Advanced
      Premium
    Users
      Individual
      Team
      Enterprise
    Technology
      Frontend
      Backend
      Database
\`\`\``;
}

/**
 * Generate Mermaid Table code
 */
function generateTable(seed: number): string {
  return `\`\`\`mermaid
| Category | Item | Status | Priority |
|----------|------|--------|----------|
| Feature  | Login | Done   | High     |
| Feature  | Signup| Done   | High     |
| Bug      | UX    | Open   | Medium   |
\`\`\``;
}

/**
 * Generate pie chart data
 */
function generatePieChartData(seed: number): ChartData {
  return {
    labels: ['Completed', 'In Progress', 'Pending', 'Blocked'],
    datasets: [{
      label: 'Task Status',
      data: [45, 30, 20, 5],
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
      borderColor: '#ffffff',
    }],
  };
}

/**
 * Generate bar chart data
 */
function generateBarChartData(seed: number): ChartData {
  return {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Budget Utilization',
      data: [25, 45, 70, 90],
      backgroundColor: ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'],
      borderColor: '#ffffff',
    }],
  };
}

/**
 * Generate line chart data
 */
function generateLineChartData(seed: number): ChartData {
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Growth Rate',
      data: [10, 25, 40, 55, 75, 95],
      backgroundColor: ['rgba(99, 102, 241, 0.2)'],
      borderColor: '#6366F1',
    }],
  };
}

/**
 * Replace visual placeholders with actual content
 */
export function renderVisuals(content: string, visuals: ParsedVisual[]): string {
  let renderedContent = content;
  
  visuals.forEach((visual, index) => {
    const placeholder = `{{VISUAL:${index}}}`;
    const visualHtml = generateVisualHtml(visual);
    renderedContent = renderedContent.replace(placeholder, visualHtml);
  });
  
  return renderedContent;
}

/**
 * Generate HTML for visual display
 */
function generateVisualHtml(visual: ParsedVisual): string {
  if (visual.mermaidCode) {
    return `
<div class="visual-container my-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
  <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">${visual.title}</h4>
  <div class="mermaid-diagram" data-mermaid="${encodeURIComponent(visual.mermaidCode)}">
    ${visual.mermaidCode}
  </div>
</div>`;
  }
  
  if (visual.chartData) {
    return `
<div class="visual-container my-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
  <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">${visual.title}</h4>
  <div class="chart-container" data-chart-type="${visual.type}" data-chart='${JSON.stringify(visual.chartData)}'>
    <canvas class="chart-canvas"></canvas>
  </div>
</div>`;
  }
  
  return '';
}

/**
 * Parse Mermaid diagram from AI response
 */
export function parseMermaidFromResponse(response: string): string | null {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/;
  const match = response.match(mermaidRegex);
  return match ? match[1].trim() : null;
}

/**
 * Create a visual tag from Mermaid code
 */
export function createVisualTagFromMermaid(
  type: VisualType,
  mermaidCode: string,
  title: string
): VisualTag {
  return {
    id: `visual-${Date.now()}`,
    type,
    title,
    mermaidCode,
  };
}

/**
 * Create a visual tag from chart data
 */
export function createVisualTagFromChart(
  type: VisualType,
  chartData: ChartData,
  title: string
): VisualTag {
  return {
    id: `visual-${Date.now()}`,
    type,
    title,
    chartData,
  };
}
