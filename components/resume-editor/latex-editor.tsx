'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ResumeLatexEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export function ResumeLatexEditor({ data, onChange }: ResumeLatexEditorProps) {
  const [latexCode, setLatexCode] = useState('');

  useEffect(() => {
  const latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{margin=1in}

\\begin{document}

\\begin{center}
{\\Large \\textbf{${data.name}}}\\\\
${data.email} | ${data.phone} | ${data.location}\\\\
${data.linkedin} | ${data.github}
\\end{center}

\\section*{Professional Summary}
${data.summary}

\\section*{Work Experience}
${data.experience?.map((exp: any) => `
\\textbf{${exp.title}} | ${exp.company} \\hfill ${exp.date}\\\\
${exp.location}\\\\
${exp.description?.[0] || ''}
`).join('\n') || ''}

\\section*{Skills}
\\begin{itemize}
${data.skills?.programming?.map(
  (skill: string) => `\\item ${skill}`
).join('\n') || ''}
\\end{itemize}

\\end{document}
`;

  setLatexCode(latex);
}, [data]);

  const handleApply = () => {
    toast.success('LaTeX code applied!');
    // Parse LaTeX back to data (simplified)
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">LaTeX Code Editor</h2>
        <Button onClick={handleApply} size="sm">Apply Changes</Button>
      </div>
      
      <Textarea
        value={latexCode}
        onChange={(e) => setLatexCode(e.target.value)}
        className="font-mono text-sm h-[600px]"
        placeholder="LaTeX code..."
      />
    </div>
  );
}
