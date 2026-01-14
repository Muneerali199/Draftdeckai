// Ultra Premium Presentation Prompt - 10x Better Than Gamma.app
// Creates world-class presentations with:
// - Rich visual slide types (stats, comparisons, timelines, mockups, etc.)
// - Professional data visualizations with realistic numbers
// - Compelling storytelling structure
// - Modern design patterns (glassmorphism, gradients, animations)

export interface UltraSlide {
  slideNumber: number;
  type: 
    | 'hero' 
    | 'stats' 
    | 'comparison' 
    | 'timeline' 
    | 'process' 
    | 'feature-grid' 
    | 'mockup' 
    | 'data-viz' 
    | 'testimonial' 
    | 'logo-cloud' 
    | 'bullets' 
    | 'quote' 
    | 'big-number' 
    | 'case-study'
    | 'team'
    | 'pricing'
    | 'roadmap'
    | 'before-after'
    | 'closing';
  layout: 'full' | 'split' | 'grid-2' | 'grid-3' | 'grid-4' | 'asymmetric' | 'centered';
  title: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  stats?: { value: string; label: string; context?: string; trend?: 'up' | 'down' | 'neutral' }[];
  comparison?: { 
    leftTitle: string; 
    left: string[]; 
    rightTitle: string; 
    right: string[];
    highlight?: 'left' | 'right';
  };
  timeline?: { date: string; title: string; description: string; icon?: string }[];
  icons?: { icon: string; label: string; description?: string }[];
  mockup?: { type: string; title?: string; elements: { type: string; content: string }[] };
  chartData?: { type: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'funnel'; data: { name: string; value: number }[] };
  testimonial?: { quote: string; author: string; role?: string; company?: string; avatar?: string };
  logos?: string[];
  cta?: string;
  imageUrl?: string;
  design?: {
    background?: string;
    accentColor?: string;
    layout?: string;
  };
}

/**
 * Creates the ultimate presentation prompt that generates 10x better content than Gamma
 */
export function createUltraPresentationPrompt(
  topic: string,
  audience: string,
  outline?: any[],
  settings?: {
    theme?: string;
    textDensity?: string;
    artStyle?: string;
    audience?: string;
    tone?: string;
    industry?: string;
  }
) {
  const outlineInstruction = outline
    ? `\n**STRICT OUTLINE TO FOLLOW:**\nYou MUST create exactly ${outline.length} slides matching this structure:\n${JSON.stringify(outline, null, 2)}\n`
    : '';

  const slideCount = outline?.length || 10;

  return `You are a WORLD-CLASS presentation designer who creates presentations that are 10X BETTER than Gamma, Pitch, Canva, or Beautiful.ai.

Your presentations are:
✨ VISUALLY STUNNING - Modern design with gradients, glassmorphism, and micro-animations
📊 DATA-RICH - Realistic statistics, charts, and metrics that tell a compelling story
🎯 STRATEGICALLY STRUCTURED - Clear narrative flow that builds to a powerful conclusion
💎 PREMIUM QUALITY - Every slide looks like it was designed by a top agency

**OUTPUT FORMAT: ULTRA-PREMIUM JSON**
Return a JSON array of slides. Each slide must have rich, varied content.

**CRITICAL RULES:**
1. NEVER create boring, text-heavy slides
2. EVERY slide must have a unique visual element (stats, chart, icons, mockup, comparison, etc.)
3. Use diverse slide types - NO more than 2 of the same type in a row
4. Include REALISTIC, SPECIFIC data (not generic placeholder numbers)
5. Create compelling headlines that make people want to read more
6. Each bullet point must be concise (max 8-10 words) and impactful

**SLIDE TYPE DISTRIBUTION (for ${slideCount} slides):**
- 1x hero (opening)
- 2-3x stats (with 3-4 big numbers each)
- 1-2x comparison (before/after, us vs them)
- 1-2x feature-grid (with icons)
- 1-2x data-viz (charts with realistic data)
- 1x timeline OR roadmap
- 1x testimonial OR logo-cloud
- 1x process (how it works)
- 1x closing (CTA)

**SLIDE TYPES AND THEIR STRUCTURE:**

1. **hero** - Epic opening that hooks the audience
   {
     "type": "hero",
     "layout": "centered",
     "title": "Bold, Action-Oriented Title That Demands Attention",
     "subtitle": "Compelling subtitle that explains the value proposition",
     "cta": "Clear call-to-action button text"
   }

2. **stats** - Big numbers that impress (USE FOR 20% OF SLIDES)
   {
     "type": "stats",
     "layout": "grid-3",
     "title": "The Numbers Speak for Themselves",
     "stats": [
       { "value": "94%", "label": "Customer Satisfaction", "context": "year over year", "trend": "up" },
       { "value": "$2.4M", "label": "Revenue Generated", "context": "in Q3 alone", "trend": "up" },
       { "value": "10x", "label": "Faster Processing", "context": "vs industry average", "trend": "up" }
     ]
   }

3. **comparison** - Side-by-side that sells (USE FOR PERSUASION)
   {
     "type": "comparison",
     "layout": "split",
     "title": "Why We're Different",
     "comparison": {
       "leftTitle": "❌ Traditional Way",
       "left": ["Manual processes taking hours", "Error-prone data entry", "Scattered information silos", "Frustrated teams"],
       "rightTitle": "✨ Our Solution",
       "right": ["Automated in seconds", "99.9% accuracy guaranteed", "Unified data platform", "Happy, productive teams"],
       "highlight": "right"
     }
   }

4. **feature-grid** - Benefits with icons (USE 15% OF SLIDES)
   {
     "type": "feature-grid",
     "layout": "grid-4",
     "title": "Everything You Need in One Platform",
     "icons": [
       { "icon": "Zap", "label": "Lightning Fast", "description": "Process millions of requests in milliseconds" },
       { "icon": "Shield", "label": "Enterprise Security", "description": "SOC 2 Type II & HIPAA compliant" },
       { "icon": "Globe", "label": "Global Scale", "description": "50+ data centers worldwide" },
       { "icon": "Users", "label": "Collaboration", "description": "Real-time team editing & comments" }
     ]
   }

5. **data-viz** - Charts that tell stories (USE 15% OF SLIDES)
   {
     "type": "data-viz",
     "layout": "split",
     "title": "Market Growth Trajectory",
     "subtitle": "Our path to market leadership",
     "chartData": {
       "type": "line",
       "data": [
         { "name": "2021", "value": 45 },
         { "name": "2022", "value": 78 },
         { "name": "2023", "value": 142 },
         { "name": "2024", "value": 234 },
         { "name": "2025 (proj)", "value": 380 }
       ]
     },
     "content": "5-year CAGR of 52% outpacing industry growth by 3x"
   }

6. **timeline** / **roadmap** - Journey visualization
   {
     "type": "timeline",
     "layout": "full",
     "title": "Our Journey to Success",
     "timeline": [
       { "date": "2020", "title": "Founded", "description": "Started with a vision to transform the industry", "icon": "Rocket" },
       { "date": "2021", "title": "Series A", "description": "$12M funding from top-tier VCs", "icon": "DollarSign" },
       { "date": "2022", "title": "100K Users", "description": "Milestone reached in just 18 months", "icon": "Users" },
       { "date": "2023", "title": "Global Expansion", "description": "Launched in 30+ countries", "icon": "Globe" }
     ]
   }

7. **testimonial** - Social proof that converts
   {
     "type": "testimonial",
     "layout": "centered",
     "title": "What Our Customers Say",
     "testimonial": {
       "quote": "This platform completely transformed how we operate. We've seen a 40% increase in productivity within the first month.",
       "author": "Sarah Chen",
       "role": "VP of Operations",
       "company": "Fortune 500 Tech Company",
       "avatar": "woman-professional"
     }
   }

8. **mockup** - Product showcase
   {
     "type": "mockup",
     "layout": "split",
     "title": "Intuitive Dashboard Design",
     "mockup": {
       "type": "laptop",
       "title": "Analytics Dashboard",
       "elements": [
         { "type": "header", "content": "Welcome back, Sarah" },
         { "type": "chart", "content": "Revenue Trend +23%" },
         { "type": "stats", "content": "4 KPIs: Users, Revenue, Churn, NPS" },
         { "type": "table", "content": "Recent Activity Feed" }
       ]
     }
   }

9. **process** - Step-by-step flow
   {
     "type": "process",
     "layout": "full",
     "title": "How It Works",
     "bullets": [
       "📤 Upload your data in any format",
       "🤖 AI automatically processes and cleans it",
       "📊 Get instant insights and visualizations",
       "🚀 Export or integrate with your existing tools"
     ],
     "content": "Get started in under 5 minutes with no technical expertise required"
   }

10. **logo-cloud** - Trust indicators
    {
      "type": "logo-cloud",
      "layout": "centered",
      "title": "Trusted by Industry Leaders",
      "subtitle": "Join 500+ companies already using our platform",
      "logos": ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Spotify", "Uber"]
    }

11. **closing** - Powerful finale
    {
      "type": "closing",
      "layout": "centered",
      "title": "Ready to Transform Your Business?",
      "subtitle": "Join thousands of companies already seeing results",
      "stats": [
        { "value": "Free", "label": "14-day trial", "context": "No credit card required" }
      ],
      "cta": "Get Started Today →"
    }

**ICON LIBRARY (Use these names in icons):**
Zap, Shield, Users, Globe, Target, Rocket, Heart, Star, Check, TrendUp, Clock, Lock, Award, Lightbulb, BarChart, DollarSign, Smartphone, Cloud, Code, Palette, Gift, Bell, Settings, Search, Filter, Layers, Database, Server, Cpu, Wifi, Download, Upload, Mail, Phone, MapPin, Calendar, Bookmark

**CHART TYPES:**
- bar: For comparisons between categories
- line: For trends over time
- pie: For proportions/percentages
- area: For cumulative values over time
- radar: For multi-dimensional comparisons
- funnel: For conversion/process metrics

**CONTENT CONTEXT:**
- **Topic**: ${topic}
- **Audience**: ${audience}
- **Tone**: ${settings?.tone || 'Professional yet engaging'}
- **Industry**: ${settings?.industry || 'General business'}
${outlineInstruction}

**CRITICAL: Generate REALISTIC Data**
- Use specific numbers, not round ones (e.g., "94%" not "90%", "$2.4M" not "$2M")
- Include context for stats (e.g., "vs last year", "industry average", "per month")
- Make chart data show a clear story/trend
- Reference real-world timelines and milestones

**RESPONSE FORMAT:**
Return ONLY a valid JSON array. No markdown, no explanations.
Start with [ and end with ]

Generate ${slideCount} premium slides now:`;
}

/**
 * Parse the ultra-premium slide format
 */
export function parseUltraSlide(slideData: any, index: number): UltraSlide {
  return {
    slideNumber: index + 1,
    type: slideData.type || 'bullets',
    layout: slideData.layout || 'full',
    title: slideData.title || `Slide ${index + 1}`,
    subtitle: slideData.subtitle,
    content: slideData.content,
    bullets: slideData.bullets,
    stats: slideData.stats,
    comparison: slideData.comparison,
    timeline: slideData.timeline,
    icons: slideData.icons,
    mockup: slideData.mockup,
    chartData: slideData.chartData,
    testimonial: slideData.testimonial,
    logos: slideData.logos,
    cta: slideData.cta,
    imageUrl: slideData.imageUrl,
    design: slideData.design || { background: 'gradient-blue-purple' }
  };
}

/**
 * Generate outline items from the ultra prompt
 */
export function createOutlineFromUltraSlides(slides: UltraSlide[]): any[] {
  return slides.map((slide, index) => ({
    title: slide.title,
    type: mapSlideTypeToOutlineType(slide.type),
    description: slide.subtitle || slide.content || getDescriptionFromSlide(slide),
    content: slide.content,
    bullets: slide.bullets || extractBulletsFromSlide(slide),
    chartData: slide.chartData,
    stats: slide.stats,
    comparison: slide.comparison,
    timeline: slide.timeline,
    icons: slide.icons,
    mockup: slide.mockup,
    testimonial: slide.testimonial,
    logos: slide.logos
  }));
}

function mapSlideTypeToOutlineType(type: string): string {
  const typeMap: Record<string, string> = {
    'hero': 'cover',
    'stats': 'chart',
    'comparison': 'split',
    'timeline': 'process',
    'process': 'process',
    'feature-grid': 'list',
    'mockup': 'split',
    'data-viz': 'chart',
    'testimonial': 'text',
    'logo-cloud': 'list',
    'bullets': 'list',
    'quote': 'text',
    'big-number': 'chart',
    'case-study': 'split',
    'team': 'list',
    'pricing': 'list',
    'roadmap': 'process',
    'before-after': 'split',
    'closing': 'cover'
  };
  return typeMap[type] || 'content';
}

function getDescriptionFromSlide(slide: UltraSlide): string {
  if (slide.stats?.length) {
    return `Key metrics: ${slide.stats.map(s => `${s.value} ${s.label}`).join(', ')}`;
  }
  if (slide.comparison) {
    return `Comparison between ${slide.comparison.leftTitle} and ${slide.comparison.rightTitle}`;
  }
  if (slide.timeline?.length) {
    return `Timeline showing ${slide.timeline.length} key milestones`;
  }
  if (slide.icons?.length) {
    return `${slide.icons.length} key features/benefits`;
  }
  if (slide.testimonial) {
    return `Customer testimonial from ${slide.testimonial.author}`;
  }
  return 'Professional slide content';
}

function extractBulletsFromSlide(slide: UltraSlide): string[] {
  if (slide.stats?.length) {
    return slide.stats.map(s => `${s.value} - ${s.label}`);
  }
  if (slide.comparison?.right?.length) {
    return slide.comparison.right;
  }
  if (slide.icons?.length) {
    return slide.icons.map(i => `${i.label}: ${i.description || ''}`);
  }
  if (slide.timeline?.length) {
    return slide.timeline.map(t => `${t.date}: ${t.title}`);
  }
  return [];
}
