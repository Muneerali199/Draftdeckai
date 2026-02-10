# AI Agent Prompt: Perfect LaTeX Mimicry for Resume HTML Preview

## Objective
Transform the existing HTML resume templates to achieve pixel-perfect visual mimicry of compiled LaTeX PDF output. The HTML preview should be indistinguishable from the actual LaTeX-compiled PDF in terms of fonts, typography, spacing, layout, pagination, and multi-page behavior. Create the illusion of real-time LaTeX compilation without any actual compilation step.

---

## Current State Analysis

### File Locations
- **Templates Directory**: `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume-editor/templates/`
  - `professional-template.tsx`
  - `academic-template.tsx`
  - `software-engineer-template.tsx`
  - `executive-template.tsx`
  - `two-column-template.tsx`
  - `modern-minimal-template.tsx`
  - `compact-template.tsx`
  - `data-scientist-template.tsx`

- **Preview Panel**: `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume-editor/preview-panel.tsx`
- **LaTeX Editor**: `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume-editor/latex-editor.tsx`
- **Global Styles**: `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/app/globals.css`

### Current LaTeX Configuration (from latex-editor.tsx)
```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{geometry}
\usepackage{hyperref}
\usepackage{enumitem}
\usepackage{titlesec}

\geometry{margin=0.75in}
\setlist[itemize]{nosep, leftmargin=*}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titleformat{\subsection}{\bfseries}{}{0em}{}
\titlespacing{\section}{0pt}{12pt}{6pt}
\titlespacing{\subsection}{0pt}{8pt}{4pt}
```

### Current Preview Panel Implementation
- A4 paper size: 210mm × 297mm
- Padding: 48px (needs to be changed to exact 0.75in = 19.05mm)
- No multi-page support currently
- Uses inline styles that approximate but don't match LaTeX exactly

---

## Implementation Requirements

### 1. Font System - Computer Modern (CRITICAL)

Load the official Computer Modern font family (LaTeX's default font) using @font-face in globals.css:

```css
/* Add to /mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/app/globals.css */

/* Computer Modern Roman (Serif) - Main text font */
@font-face {
  font-family: 'Computer Modern';
  src: url('https://cdn.jsdelivr.net/npm/computer-modern@0.1.0/cmunrm.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Computer Modern';
  src: url('https://cdn.jsdelivr.net/npm/computer-modern@0.1.0/cmunbx.woff2') format('woff2');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Computer Modern';
  src: url('https://cdn.jsdelivr.net/npm/computer-modern@0.1.0/cmunti.woff2') format('woff2');
  font-weight: normal;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: 'Computer Modern';
  src: url('https://cdn.jsdelivr.net/npm/computer-modern@0.1.0/cmunbi.woff2') format('woff2');
  font-weight: bold;
  font-style: italic;
  font-display: swap;
}

/* Computer Modern Sans Serif - For headers if needed */
@font-face {
  font-family: 'Computer Modern Sans';
  src: url('https://cdn.jsdelivr.net/npm/computer-modern@0.1.0/cmunsx.woff2') format('woff2');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

/* LaTeX-specific CSS class for the preview */
.latex-preview {
  font-family: 'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif;
  font-size: 11pt;
  line-height: 1.2; /* LaTeX default line spacing */
  color: #000000;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  -ms-hyphens: auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* LaTeX bullet styling */
.latex-bullets {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.latex-bullets li {
  position: relative;
  padding-left: 15pt;
  margin-bottom: 0;
  line-height: 1.2;
}

.latex-bullets li::before {
  content: '•';
  position: absolute;
  left: 0;
  font-size: 11pt;
  line-height: 1.2;
  color: #000000;
}

/* LaTeX section styling */
.latex-section {
  font-size: 14pt; /* \large in LaTeX */
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 0.4pt solid #000000; /* \titlerule is 0.4pt */
  padding-bottom: 3pt;
  margin-top: 12pt; /* \titlespacing before */
  margin-bottom: 6pt; /* \titlespacing after */
  letter-spacing: 0.5pt;
  line-height: 1.2;
}

/* LaTeX subsection styling */
.latex-subsection {
  font-size: 11pt;
  font-weight: bold;
  margin-top: 8pt;
  margin-bottom: 4pt;
  line-height: 1.2;
}

/* LaTeX italic for company/institution names */
.latex-italic {
  font-style: italic;
}

/* Page break styling */
.latex-page {
  width: 210mm;
  min-height: 297mm;
  max-width: 210mm;
  padding: 19.05mm; /* 0.75in exact LaTeX margin */
  margin: 0 auto 20px auto;
  background-color: #ffffff;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  box-sizing: border-box;
  position: relative;
  page-break-after: always;
  break-after: page;
}

.latex-page:last-child {
  margin-bottom: 0;
  page-break-after: auto;
  break-after: auto;
}

/* Page number indicator (optional visual cue) */
.latex-page-number {
  position: absolute;
  bottom: 10mm;
  right: 19.05mm;
  font-size: 11pt;
  color: #000000;
}
```

---

### 2. Multi-Page Support Implementation (CRITICAL)

Create a new wrapper component that intelligently handles content overflow across multiple pages:

**File**: `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume-editor/latex-mimicry-wrapper.tsx`

```typescript
'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LatexMimicryWrapperProps {
  children: React.ReactNode;
}

interface PageContent {
  id: number;
  content: React.ReactNode;
}

export function LatexMimicryWrapper({ children }: LatexMimicryWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageContent[]>([{ id: 1, content: children }]);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // Calculate content overflow and split into pages
    const calculatePages = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const contentHeight = container.scrollHeight;
      const pageHeight = 297 - 38.1; // A4 height minus top+bottom margins (19.05mm each)
      const pageHeightPx = pageHeight * 3.7795275591; // Convert mm to px (1mm = 3.7795275591px)

      if (contentHeight <= pageHeightPx) {
        // Content fits on single page
        setPages([{ id: 1, content: children }]);
        setIsCalculating(false);
        return;
      }

      // Multi-page logic needed
      // For now, render as single page but mark for future pagination
      setPages([{ id: 1, content: children }]);
      setIsCalculating(false);
    };

    calculatePages();
  }, [children]);

  if (isCalculating) {
    return (
      <div style={{ 
        width: '210mm', 
        height: '297mm', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        margin: '0 auto'
      }}>
        <span style={{ fontFamily: 'Computer Modern, serif', fontSize: '11pt' }}>
          Calculating layout...
        </span>
      </div>
    );
  }

  return (
    <div className="latex-preview-container">
      {pages.map((page, index) => (
        <div 
          key={page.id}
          className="latex-page"
          style={{
            width: '210mm',
            minHeight: '297mm',
            maxWidth: '210mm',
            padding: '19.05mm',
            margin: '0 auto 20px auto',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
            boxSizing: 'border-box',
            position: 'relative',
            fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
            fontSize: '11pt',
            lineHeight: 1.2,
            color: '#000000',
            textAlign: 'justify',
            hyphens: 'auto',
            WebkitHyphens: 'auto',
            msHyphens: 'auto',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            pageBreakAfter: index < pages.length - 1 ? 'always' : 'auto',
            breakAfter: index < pages.length - 1 ? 'page' : 'auto',
          }}
        >
          <div ref={index === 0 ? containerRef : undefined}>
            {page.content}
          </div>
          {pages.length > 1 && (
            <div className="latex-page-number" style={{
              position: 'absolute',
              bottom: '10mm',
              right: '19.05mm',
              fontSize: '11pt',
              color: '#000000',
            }}>
              {index + 1}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Alternative Simpler Approach** (if pagination is too complex):
Just use CSS columns or overflow detection with visual page break indicators:

```typescript
// Simpler version without complex pagination logic
export function LatexMimicryWrapper({ children }: LatexMimicryWrapperProps) {
  return (
    <div 
      className="latex-preview"
      style={{
        width: '210mm',
        minHeight: '297mm',
        maxWidth: '210mm',
        padding: '19.05mm',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        lineHeight: 1.2,
        color: '#000000',
        textAlign: 'justify',
        hyphens: 'auto',
        WebkitHyphens: 'auto',
        msHyphens: 'auto',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      {children}
    </div>
  );
}
```

---

### 3. Typography Specifications (EXACT LaTeX Measurements)

#### Base Text
- **Font**: Computer Modern Roman
- **Size**: 11pt (14.66px)
- **Line height**: 1.2 (LaTeX default, not browser default)
- **Color**: #000000 (pure black)
- **Text align**: justify (LaTeX default for article class)
- **Hyphenation**: enabled (CSS hyphens: auto)

#### Section Headers (\\section*)
- **Font**: Computer Modern Bold
- **Size**: 14pt (18.66px) - \\large in LaTeX
- **Weight**: bold (700)
- **Transform**: uppercase
- **Border-bottom**: 0.4pt solid #000000 (LaTeX \\titlerule is exactly 0.4pt)
- **Padding-bottom**: 3pt
- **Margin-top**: 12pt (\\titlespacing{\\section}{0pt}{12pt}{6pt} - before)
- **Margin-bottom**: 6pt (after)
- **Letter-spacing**: 0.5pt
- **Line-height**: 1.2

#### Subsection Headers (\\subsection*)
- **Font**: Computer Modern Bold
- **Size**: 11pt (same as body text)
- **Weight**: bold (700)
- **Margin-top**: 8pt (\\titlespacing{\\subsection}{0pt}{8pt}{4pt} - before)
- **Margin-bottom**: 4pt (after)
- **Line-height**: 1.2

#### Job Titles / Positions
- **Font**: Computer Modern Bold
- **Size**: 11pt
- **Weight**: bold (700)
- **Line-height**: 1.2

#### Company / Institution Names
- **Font**: Computer Modern Italic
- **Size**: 11pt
- **Style**: italic
- **Color**: #000000
- **Line-height**: 1.2

#### Dates
- **Font**: Computer Modern Bold
- **Size**: 11pt
- **Weight**: bold (700)
- **Alignment**: right-aligned
- **Line-height**: 1.2

#### Bullet Points (itemize environment)
- **List style**: none (custom implementation)
- **Bullet character**: • (\\textbullet in LaTeX)
- **Left margin**: 0pt (\\setlist[itemize]{leftmargin=*})
- **Item separation**: nosep (no extra space between items)
- **Line height**: 1.2
- **Implementation**: Use CSS ::before pseudo-element with bullet character

#### Header Section (Center Environment)
- **Name**:
  - Font: Computer Modern Bold
  - Size: 17.28pt (\\LARGE in LaTeX = 1.5 × \\large)
  - Weight: bold
  - Margin-bottom: 4pt
  - Line-height: 1.2
  - Text-align: center

- **Contact Info**:
  - Font: Computer Modern Roman
  - Size: 11pt
  - Line-height: 1.2
  - Text-align: center
  - Separator: | (pipe character with spaces)

---

### 4. Update Preview Panel

Modify `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume-editor/preview-panel.tsx`:

**Current implementation (lines 180-184)**:
```typescript
<div className="p-8">
  <div className="w-full max-w-[210mm] mx-auto bg-white shadow-2xl" style={{ minHeight: '297mm', padding: '48px' }}>
    {renderTemplate()}
  </div>
</div>
```

**New implementation**:
```typescript
import { LatexMimicryWrapper } from './latex-mimicry-wrapper';

// ... in the render method:
<div className="p-8">
  <LatexMimicryWrapper>
    {renderTemplate()}
  </LatexMimicryWrapper>
</div>
```

---

### 5. Update All Template Files

Modify each template in `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume-editor/templates/` to use LaTeX-matching styles:

#### Common Style Constants (create a shared file)

**File**: `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume-editor/latex-styles.ts`

```typescript
export const latexStyles = {
  // Page dimensions
  page: {
    width: '210mm',
    minHeight: '297mm',
    maxWidth: '210mm',
    padding: '19.05mm', // 0.75in exact
    margin: '0 auto',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
    boxSizing: 'border-box' as const,
  },

  // Typography
  font: {
    family: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
    sizeBase: '11pt',
    sizeLarge: '14pt', // \large
    sizeLARGE: '17.28pt', // \LARGE
    lineHeight: 1.2,
    color: '#000000',
  },

  // Text alignment
  text: {
    align: 'justify' as const,
    hyphens: 'auto' as const,
  },

  // Section headers
  section: {
    fontSize: '14pt',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    borderBottom: '0.4pt solid #000000',
    paddingBottom: '3pt',
    marginTop: '12pt',
    marginBottom: '6pt',
    letterSpacing: '0.5pt',
    lineHeight: 1.2,
  },

  // Subsection headers
  subsection: {
    fontSize: '11pt',
    fontWeight: 'bold' as const,
    marginTop: '8pt',
    marginBottom: '4pt',
    lineHeight: 1.2,
  },

  // Header (name)
  header: {
    textAlign: 'center' as const,
    marginBottom: '12pt',
  },

  name: {
    fontSize: '17.28pt',
    fontWeight: 'bold' as const,
    marginBottom: '4pt',
    lineHeight: 1.2,
  },

  contact: {
    fontSize: '11pt',
    lineHeight: 1.2,
  },

  // Job/position
  jobTitle: {
    fontSize: '11pt',
    fontWeight: 'bold' as const,
    lineHeight: 1.2,
  },

  // Company (italic)
  company: {
    fontSize: '11pt',
    fontStyle: 'italic' as const,
    lineHeight: 1.2,
  },

  // Date
  date: {
    fontSize: '11pt',
    fontWeight: 'bold' as const,
    lineHeight: 1.2,
    whiteSpace: 'nowrap' as const,
  },

  // Bullet list
  bulletList: {
    listStyle: 'none' as const,
    paddingLeft: 0,
    margin: 0,
  },

  bulletItem: {
    position: 'relative' as const,
    paddingLeft: '15pt',
    marginBottom: 0,
    lineHeight: 1.2,
  },

  // Paragraph
  paragraph: {
    marginBottom: 0,
    textIndent: 0,
    lineHeight: 1.2,
  },
};

// Helper function for bullet items
export const renderBulletItem = (text: string, key: string | number) => (
  <li key={key} style={latexStyles.bulletItem}>
    <span style={{ position: 'absolute', left: 0 }}>•</span>
    {text}
  </li>
);
```

#### Professional Template Transformation Example

**BEFORE** (current professional-template.tsx):
```typescript
export function ProfessionalTemplate({ data }: { data: any }) {
  return (
    <div style={{ color: '#000000', fontFamily: '"Garamond", "Georgia", serif', lineHeight: '1.7', padding: '40px 50px', maxWidth: '850px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
        <div style={{ borderTop: '3px solid #000000', borderBottom: '1px solid #000000', padding: '20px 0', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#000000', marginBottom: '0', letterSpacing: '3px', textTransform: 'uppercase' }}>
            {data.name}
          </h1>
        </div>
        <div style={{ fontSize: '11px', color: '#000000', letterSpacing: '0.5px', lineHeight: '1.8' }}>
          {data.email && <span style={{ marginRight: '14px' }}>{data.email}</span>}
          {data.phone && <span style={{ marginRight: '14px' }}>•  {data.phone}</span>}
          {data.location && <span style={{ marginRight: '14px' }}>•  {data.location}</span>}
          {data.linkedin && <span style={{ marginRight: '14px' }}>•  {data.linkedin}</span>}
          {data.github && <span>•  {data.github}</span>}
        </div>
      </div>
      
      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '4px' }}>
            PROFESSIONAL SUMMARY
          </h2>
          <p style={{ fontSize: '11px', color: '#000000', lineHeight: '1.6', textAlign: 'justify' }}>
            {data.summary}
          </p>
        </div>
      )}
      
      {/* Experience with wrong bullet styling */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '4px' }}>
            WORK EXPERIENCE
          </h2>
          {data.experience.map((exp: any, i: number) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', marginBottom: '2px' }}>
                    {exp.title}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#000000', fontStyle: 'italic' }}>
                    {exp.company}{exp.location && ` • ${exp.location}`}
                  </p>
                </div>
                <span style={{ fontSize: '11px', color: '#000000', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {exp.date}
                </span>
              </div>
              {exp.description && exp.description[0] && (
                <ul style={{ marginLeft: '20px', marginTop: '6px', fontSize: '11px', color: '#000000' }}>
                  {exp.description.map((desc: string, j: number) => (
                    <li key={j} style={{ marginBottom: '4px', lineHeight: '1.5' }}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* ... rest of sections ... */}
    </div>
  );
}
```

**AFTER** (LaTeX-matching):
```typescript
import { latexStyles, renderBulletItem } from '../latex-styles';

export function ProfessionalTemplate({ data }: { data: any }) {
  return (
    <div style={{
      fontFamily: latexStyles.font.family,
      fontSize: latexStyles.font.sizeBase,
      lineHeight: latexStyles.font.lineHeight,
      color: latexStyles.font.color,
      textAlign: latexStyles.text.align,
      hyphens: latexStyles.text.hyphens,
      WebkitHyphens: latexStyles.text.hyphens,
      msHyphens: latexStyles.text.hyphens,
    }}>
      {/* Header - Center Environment */}
      <div style={latexStyles.header}>
        <h1 style={latexStyles.name}>
          {data.name}
        </h1>
        <div style={latexStyles.contact}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span> | {data.phone}</span>}
          {data.location && <span> | {data.location}</span>}
          {data.linkedin && <span> | {data.linkedin}</span>}
          {data.github && <span> | {data.github}</span>}
        </div>
      </div>

      {/* Professional Summary Section */}
      {data.summary && (
        <div>
          <h2 style={latexStyles.section}>
            Professional Summary
          </h2>
          <p style={{
            ...latexStyles.paragraph,
            textAlign: 'justify',
          }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Work Experience Section */}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Work Experience
          </h2>
          {data.experience.map((exp: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? latexStyles.subsection.marginTop : 0 }}>
              {/* Job header: Title | Company, Location  Date */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2pt',
              }}>
                <div>
                  <span style={latexStyles.jobTitle}>
                    {exp.title}
                  </span>
                  <span style={latexStyles.company}>
                    {' | '}{exp.company}{exp.location && `, ${exp.location}`}
                  </span>
                </div>
                <span style={latexStyles.date}>
                  {exp.date}
                </span>
              </div>
              
              {/* Bullet points - LaTeX itemize style */}
              {exp.description && exp.description.length > 0 && (
                <ul style={latexStyles.bulletList}>
                  {exp.description.map((desc: string, j: number) => 
                    renderBulletItem(desc, j)
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education Section */}
      {data.education && data.education.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Education
          </h2>
          {data.education.map((edu: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? latexStyles.subsection.marginTop : 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <span style={latexStyles.jobTitle}>
                    {edu.degree}
                  </span>
                  <span style={latexStyles.company}>
                    {', '}{edu.institution || edu.school}{edu.location && `, ${edu.location}`}
                  </span>
                </div>
                <span style={latexStyles.date}>
                  {edu.date}
                </span>
              </div>
              {edu.gpa && (
                <p style={{ marginTop: '2pt', lineHeight: 1.2 }}>
                  GPA: {edu.gpa}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills Section */}
      {data.skills && Object.keys(data.skills).length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Technical Skills
          </h2>
          <div style={{ lineHeight: 1.2 }}>
            {Object.entries(data.skills).map(([category, skills]: [string, any], index: number) => (
              <div key={category} style={{ marginBottom: index < Object.keys(data.skills).length - 1 ? '4pt' : 0 }}>
                <span style={latexStyles.jobTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}:
                </span>
                <span>
                  {' '}{Array.isArray(skills) ? skills.join(', ') : String(skills)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Projects
          </h2>
          {data.projects.map((proj: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? latexStyles.subsection.marginTop : 0 }}>
              <div style={latexStyles.subsection}>
                {proj.name}
              </div>
              <p style={{ ...latexStyles.paragraph, textAlign: 'justify' }}>
                {proj.description}
              </p>
              {proj.technologies && proj.technologies.length > 0 && (
                <p style={{ marginTop: '2pt', lineHeight: 1.2 }}>
                  <span style={latexStyles.company}>Technologies: </span>
                  <span>{proj.technologies.join(', ')}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications Section */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Certifications
          </h2>
          {data.certifications.map((cert: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '4pt' : 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <span style={latexStyles.jobTitle}>
                  {cert.name}
                </span>
                <span style={{ fontSize: '11pt', lineHeight: 1.2 }}>
                  {cert.date}
                </span>
              </div>
              {cert.issuer && (
                <span style={latexStyles.company}>
                  {cert.issuer}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 6. Apply Changes to All Templates

Repeat the transformation process for all 8 templates:

1. **professional-template.tsx** - Classic professional layout (done above)
2. **academic-template.tsx** - Research/academic CV style
3. **software-engineer-template.tsx** - Tech-focused layout
4. **executive-template.tsx** - Executive/C-suite style
5. **two-column-template.tsx** - Two-column layout
6. **modern-minimal-template.tsx** - Minimal modern style
7. **compact-template.tsx** - Condensed single-page
8. **data-scientist-template.tsx** - Data science focused

Each template should:
- Import `latexStyles` from the shared styles file
- Use exact LaTeX measurements
- Apply Computer Modern font throughout
- Use proper italic styling for company/institution names
- Use LaTeX-style bullet points
- Match section header styling (uppercase, underline, spacing)
- Apply text justification

---

### 7. Multi-Page Content Overflow Detection (Advanced)

For true multi-page support that mimics LaTeX pagination:

```typescript
// Enhanced LatexMimicryWrapper with pagination
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface LatexMimicryWrapperProps {
  children: React.ReactNode;
}

interface PageData {
  id: number;
  height: number;
}

export function LatexMimicryWrapper({ children }: LatexMimicryWrapperProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number>(1);
  const [content, setContent] = useState<React.ReactNode>(children);

  useEffect(() => {
    setContent(children);
  }, [children]);

  useEffect(() => {
    if (!measureRef.current) return;

    const measureContent = () => {
      const element = measureRef.current;
      if (!element) return;

      // Get total content height
      const totalHeight = element.scrollHeight;
      
      // A4 page content height (minus margins)
      // 297mm - 2*19.05mm = 258.9mm
      const pageContentHeightMm = 258.9;
      const mmToPx = 3.7795275591;
      const pageContentHeightPx = pageContentHeightMm * mmToPx;

      // Calculate number of pages needed
      const numPages = Math.max(1, Math.ceil(totalHeight / pageContentHeightPx));
      setPages(numPages);
    };

    // Measure after render
    const timer = setTimeout(measureContent, 100);
    
    // Re-measure on window resize
    window.addEventListener('resize', measureContent);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureContent);
    };
  }, [content]);

  return (
    <>
      {/* Hidden measurement container */}
      <div 
        ref={measureRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',
          padding: '19.05mm',
          boxSizing: 'border-box',
          fontFamily: "'Computer Modern', serif",
          fontSize: '11pt',
          lineHeight: 1.2,
          visibility: 'hidden',
        }}
      >
        {content}
      </div>

      {/* Render pages */}
      <div className="latex-preview-container">
        {Array.from({ length: pages }, (_, i) => (
          <div 
            key={i}
            className="latex-page"
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '210mm',
              padding: '19.05mm',
              margin: '0 auto 20px auto',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              boxSizing: 'border-box',
              position: 'relative',
              fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
              fontSize: '11pt',
              lineHeight: 1.2,
              color: '#000000',
              textAlign: 'justify',
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              msHyphens: 'auto',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              pageBreakAfter: i < pages - 1 ? 'always' : 'auto',
              breakAfter: i < pages - 1 ? 'page' : 'auto',
              overflow: i === 0 ? 'visible' : 'hidden',
              maxHeight: i === 0 ? 'none' : '258.9mm',
            }}
          >
            {i === 0 ? content : (
              <div style={{ opacity: 0.5 }}>
                {/* Placeholder for overflow content - implement proper pagination logic */}
                <em>Content continues on page {i + 1}...</em>
              </div>
            )}
            
            {pages > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '10mm',
                right: '19.05mm',
                fontSize: '11pt',
                color: '#000000',
              }}>
                {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
```

**Note**: True content pagination (splitting content across pages at appropriate break points) is extremely complex in HTML. The above implementation detects when multiple pages are needed but doesn't intelligently split content. For a production implementation, consider:

1. Using a library like `react-pdf` or `paged.js` for proper pagination
2. Implementing manual page break hints in the data structure
3. Using CSS `break-inside: avoid` on sections to prevent awkward breaks

---

### 8. Visual Polish & Final Touches

#### Add subtle visual cues that enhance the LaTeX illusion:

```css
/* Add to globals.css */

/* Paper texture effect (optional) */
.latex-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(to right, rgba(0,0,0,0.02) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%),
    linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.02) 100%);
  pointer-events: none;
  z-index: 1;
}

/* Prevent orphans and widows */
.latex-preview p,
.latex-preview li {
  orphans: 3;
  widows: 3;
}

/* Prevent breaking inside important elements */
.latex-preview h2,
.latex-preview h3,
.latex-preview .subsection {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Smooth transitions for real-time updates */
.latex-preview * {
  transition: opacity 0.1s ease-in-out;
}
```

#### Update the preview panel background to look like a desk/workspace:

```typescript
// In preview-panel.tsx, update the background style:
<div className="flex-1 overflow-auto" style={{
  background: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%)',
  padding: '40px',
}}>
  <LatexMimicryWrapper>
    {renderTemplate()}
  </LatexMimicryWrapper>
</div>
```

---

## Testing Checklist

After implementation, verify the following:

### Typography
- [ ] Computer Modern font loads correctly (check Network tab for font requests)
- [ ] Text is pure black (#000000)
- [ ] Font size is exactly 11pt (not px approximations)
- [ ] Line height is exactly 1.2
- [ ] Text is justified with proper hyphenation

### Layout
- [ ] Page is exactly 210mm × 297mm (A4)
- [ ] Margins are exactly 19.05mm (0.75in) on all sides
- [ ] Content area is exactly 171.9mm × 258.9mm
- [ ] Shadow effect gives paper-like appearance

### Sections
- [ ] Section headers are 14pt, bold, uppercase
- [ ] Section headers have 0.4pt underline (not 1px)
- [ ] Section spacing: 12pt before, 6pt after
- [ ] Subsection spacing: 8pt before, 4pt after

### Content
- [ ] Job titles are bold
- [ ] Company names are italic
- [ ] Dates are bold and right-aligned
- [ ] Bullet points use • character with 15pt left padding
- [ ] No extra space between bullet items

### Multi-page
- [ ] Content overflow detection works
- [ ] Multiple pages render when content exceeds one page
- [ ] Page numbers appear when there are multiple pages
- [ ] Visual page break indicators (shadow, spacing) between pages

### Real-time Feel
- [ ] Updates happen instantly as user types
- [ ] No loading states or compilation delays
- [ ] Smooth transitions between states
- [ ] Matches the actual LaTeX PDF output when compiled

---

## Comparison with Actual LaTeX

To verify the mimicry is accurate:

1. Compile the LaTeX code from `latex-editor.tsx` using an online compiler
2. Screenshot the PDF output
3. Compare side-by-side with HTML preview
4. Check:
   - Font appearance (should be identical)
   - Line breaks and hyphenation
   - Spacing between elements
   - Section header appearance
   - Bullet point alignment
   - Overall proportions and layout

The HTML preview should be virtually indistinguishable from the compiled PDF.

---

## Performance Considerations

- Font loading: Computer Modern fonts are ~200KB total, load asynchronously
- Rendering: CSS-based approach is fast, no JavaScript calculations needed for basic layout
- Multi-page: Measurement logic runs only when content changes
- Memory: Minimal overhead, just standard React rendering

---

## Fallback Strategy

If Computer Modern fonts fail to load:

```css
.latex-preview {
  font-family: 'Computer Modern', 'Latin Modern Roman', 'Times New Roman', 'Georgia', serif;
  /* Times New Roman is closest fallback to Computer Modern */
}
```

The preview will still look professional and LaTeX-like even with fallback fonts.

---

## Summary

This implementation creates a perfect LaTeX mimicry by:

1. **Using the actual LaTeX font** (Computer Modern) via CDN
2. **Matching exact measurements** (11pt, 14pt, 0.75in margins, 0.4pt borders)
3. **Implementing LaTeX typography** (justified text, proper hyphenation, 1.2 line height)
4. **Creating multi-page support** with overflow detection
5. **Styling all elements** to match LaTeX output (sections, bullets, italics, bold)
6. **Providing real-time updates** with no compilation delay

The result is an HTML preview that looks identical to a compiled LaTeX PDF, creating the perfect illusion of real-time LaTeX compilation.
