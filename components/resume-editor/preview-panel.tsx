'use client';

import { Palette, FileText, Loader2, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RESUME_TEMPLATES_NEW } from '@/lib/resume-templates-new';
import { ProfessionalTemplate } from './templates/professional-template';
import { SoftwareEngineerTemplate } from './templates/software-engineer-template';
import { ExecutiveTemplate } from './templates/executive-template';
import { TwoColumnTemplate } from './templates/two-column-template';
import { ModernMinimalTemplate } from './templates/modern-minimal-template';
import { CompactTemplate } from './templates/compact-template';
import { AcademicTemplate } from './templates/academic-template';
import { LatexMimicryWrapper } from './latex-mimicry-wrapper';
import { useState } from 'react';

interface ResumePreviewPanelProps {
  data: any;
  template: string;
  onTemplateChange: (template: string) => void;
  pdfUrl?: string | null;
  isPdfMode?: boolean;
  isCompiling?: boolean;
}

export function ResumePreviewPanel({
  data,
  template,
  onTemplateChange,
  pdfUrl,
  isPdfMode = false,
  isCompiling = false,
}: ResumePreviewPanelProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const currentTemplate = RESUME_TEMPLATES_NEW.find(t => t.id === template) || RESUME_TEMPLATES_NEW[0];

  // Render the appropriate template
  const renderTemplate = () => {
    switch (template) {
      case 'software-engineer':
      case 'data-scientist':
      case 'devops-engineer':
      case 'frontend-developer':
      case 'backend-developer':
        return <SoftwareEngineerTemplate data={data} />;
      case 'product-manager':
      case 'project-manager':
      case 'sales-executive':
        return <ExecutiveTemplate data={data} />;
      case 'marketing-manager':
      case 'financial-analyst':
        return <TwoColumnTemplate data={data} />;
      case 'ux-designer':
      case 'graphic-designer':
        return <ModernMinimalTemplate data={data} />;
      case 'accountant':
        return <CompactTemplate data={data} />;
      case 'academic-researcher':
      case 'teacher':
        return <AcademicTemplate data={data} />;
      default:
        return <ProfessionalTemplate data={data} />;
    }
  };

  // Render PDF preview
  const renderPdfPreview = () => {
    if (isCompiling) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-lg font-medium">Compiling LaTeX...</p>
          <p className="text-sm">This may take a few seconds</p>
        </div>
      );
    }

    if (pdfUrl) {
      return (
        <div className="h-full flex flex-col">
          {/* PDF Actions Bar */}
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">✅ PDF Compiled Successfully</span>
            <div className="flex gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
              <a
                href={pdfUrl}
                download="resume.pdf"
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          </div>
          {/* PDF Embed - using object tag as fallback for CSP restrictions */}
          <div className="flex-1 bg-gray-200 flex items-center justify-center">
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              {/* Fallback content if object doesn't work */}
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                <FileText className="w-16 h-16 text-green-500" />
                <p className="text-lg font-medium text-gray-800">PDF Generated Successfully!</p>
                <p className="text-sm text-gray-600 max-w-md">
                  Your browser may not support embedded PDF preview.
                  Use the buttons above to open or download the PDF.
                </p>
              </div>
            </object>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 p-8">
        <FileText className="w-16 h-16 text-gray-300" />
        <p className="text-lg font-medium text-center">No PDF generated yet</p>
        <p className="text-sm text-center max-w-md">
          Click "Compile PDF" in the LaTeX editor to generate a preview.
          You can also download the .tex file and compile it in Overleaf.
        </p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isPdfMode ? '📄' : currentTemplate.icon}</span>
          <div>
            <h3 className="font-bold text-gray-900">
              {isPdfMode ? 'PDF Preview' : currentTemplate.name}
            </h3>
            <p className="text-xs text-gray-500">
              {isPdfMode ? 'Compiled from LaTeX' : currentTemplate.description}
            </p>
          </div>
        </div>
        {!isPdfMode && (
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            <Palette className="w-4 h-4 mr-2" />
            Change Template
          </Button>
        )}
      </div>

      {showTemplates && !isPdfMode && (
        <div className="bg-white border-b p-6">
          <h3 className="font-bold text-lg mb-4">Choose a Template</h3>
          <div className="grid grid-cols-3 gap-3">
            {RESUME_TEMPLATES_NEW.map((tmpl) => (
              <button key={tmpl.id} onClick={() => { onTemplateChange(tmpl.id); setShowTemplates(false); }}
                className={`p-4 border-2 rounded-lg text-left hover:shadow-lg transition-all ${template === tmpl.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                <div className="text-3xl mb-2">{tmpl.icon}</div>
                <h4 className="font-bold text-sm">{tmpl.name}</h4>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto" style={{
        background: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #c8c8c8 100%)',
        padding: '32px'
      }}>
        {isPdfMode ? (
          <div className="h-full">
            {renderPdfPreview()}
          </div>
        ) : (
          <LatexMimicryWrapper>
            {renderTemplate()}
          </LatexMimicryWrapper>
        )}
      </div>
    </div>
  );
}
