'use client';

import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Play, Download, Copy, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ResumeLatexEditorProps {
  data: any;
  onChange: (data: any) => void;
  onPdfGenerated?: (pdfUrl: string | null) => void;
}

// Generate LaTeX from resume data
function generateLatexFromData(data: any): string {
  const escapeLatex = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  };

  const experienceSection = data.experience?.map((exp: any) => `
\\subsection*{${escapeLatex(exp.title)} | ${escapeLatex(exp.company)}}
\\textit{${escapeLatex(exp.location)}} \\hfill ${escapeLatex(exp.date)}
\\begin{itemize}
${exp.description?.map((d: string) => `  \\item ${escapeLatex(d)}`).join('\n') || ''}
\\end{itemize}
`).join('\n') || '';

  const educationSection = data.education?.map((edu: any) => `
\\subsection*{${escapeLatex(edu.degree)}}
\\textit{${escapeLatex(edu.institution)}, ${escapeLatex(edu.location)}} \\hfill ${escapeLatex(edu.date)}
${edu.gpa ? `\\\\GPA: ${escapeLatex(edu.gpa)}` : ''}
`).join('\n') || '';

  const skillsSection = Object.entries(data.skills || {}).map(([category, skills]: [string, any]) =>
    `\\textbf{${escapeLatex(category.charAt(0).toUpperCase() + category.slice(1))}:} ${Array.isArray(skills) ? skills.map(s => escapeLatex(s)).join(', ') : escapeLatex(String(skills))}`
  ).join(' \\\\\n') || '';

  const projectsSection = data.projects?.map((proj: any) => `
\\subsection*{${escapeLatex(proj.name)}}
${escapeLatex(proj.description)}
\\\\\\textit{Technologies: ${proj.technologies?.map((t: string) => escapeLatex(t)).join(', ') || ''}}
`).join('\n') || '';

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\geometry{margin=0.75in}
\\setlist[itemize]{nosep, leftmargin=*}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titleformat{\\subsection}{\\bfseries}{}{0em}{}
\\titlespacing{\\section}{0pt}{12pt}{6pt}
\\titlespacing{\\subsection}{0pt}{8pt}{4pt}

\\begin{document}

% Header
\\begin{center}
{\\LARGE \\textbf{${escapeLatex(data.name)}}}\\\\[4pt]
${escapeLatex(data.email)} | ${escapeLatex(data.phone)} | ${escapeLatex(data.location)}\\\\
${data.linkedin ? `\\href{https://${data.linkedin}}{${escapeLatex(data.linkedin)}}` : ''} ${data.github ? `| \\href{https://${data.github}}{${escapeLatex(data.github)}}` : ''}
\\end{center}

% Professional Summary
\\section*{Professional Summary}
${escapeLatex(data.summary)}

% Work Experience
\\section*{Work Experience}
${experienceSection}

% Education
\\section*{Education}
${educationSection}

% Skills
\\section*{Technical Skills}
${skillsSection}

% Projects
${data.projects?.length > 0 ? `\\section*{Projects}
${projectsSection}` : ''}

\\end{document}
`;
}

export function ResumeLatexEditor({ data, onChange, onPdfGenerated }: ResumeLatexEditorProps) {
  const [latexCode, setLatexCode] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  // Initialize LaTeX from data
  useEffect(() => {
    const latex = generateLatexFromData(data);
    setLatexCode(latex);
  }, [data]);

  // Handle compilation
  const handleCompile = useCallback(async () => {
    if (!latexCode.trim()) {
      toast.error('Please enter some LaTeX code');
      return;
    }

    setIsCompiling(true);
    setCompileError(null);
    setCompileSuccess(false);

    try {
      const response = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latexCode }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/pdf')) {
          // PDF returned directly
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          onPdfGenerated?.(url);
          setCompileSuccess(true);
          toast.success('LaTeX compiled successfully!');
        } else {
          // JSON response (likely an error or status message)
          const result = await response.json();
          if (result.success === false) {
            throw new Error(result.message || 'Compilation failed');
          }
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compilation failed');
      }
    } catch (error: any) {
      console.error('Compilation error:', error);
      setCompileError(error.message || 'Failed to compile LaTeX');
      toast.error(error.message || 'Failed to compile LaTeX');
    } finally {
      setIsCompiling(false);
    }
  }, [latexCode, onPdfGenerated]);

  // Copy LaTeX to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(latexCode);
      toast.success('LaTeX code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  }, [latexCode]);

  // Download LaTeX as .tex file
  const handleDownload = useCallback(() => {
    const blob = new Blob([latexCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded resume.tex');
  }, [latexCode]);

  // Editor mount handler
  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">LaTeX Code Editor</h2>
          {compileSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              Compiled
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            Download .tex
          </Button>
          <Button
            onClick={handleCompile}
            size="sm"
            disabled={isCompiling}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Compile PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {compileError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex-shrink-0">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Compilation Error</p>
            <p className="text-red-600">{compileError}</p>
            <p className="text-xs text-red-500 mt-1">
              Tip: You can download the .tex file and compile it in Overleaf for detailed error messages.
            </p>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 border rounded-lg overflow-hidden min-h-[400px]">
        <Editor
          height="100%"
          defaultLanguage="latex"
          value={latexCode}
          onChange={(value) => setLatexCode(value || '')}
          onMount={handleEditorMount}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            folding: true,
            renderWhitespace: 'selection',
          }}
        />
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 flex-shrink-0">
        <RefreshCw className="w-3 h-3 inline mr-1" />
        Changes to the form will regenerate the LaTeX code. Click "Compile PDF" to preview the output.
      </p>
    </div>
  );
}
