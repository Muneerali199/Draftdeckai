
import { ResumeTemplate } from './resume-templates-new';

// Helper to escape LaTeX special characters
export const escapeLatex = (text: string | null | undefined) => {
    if (!text) return '';
    return String(text)
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

// ==========================================
// 1. PROFESSIONAL / FINANCE / BUSINESS TEMPLATE
// Classic Serif, conservative layout
// ==========================================
const generateProfessionalLatex = (data: any) => {
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
        `\\textbf{${escapeLatex(category.charAt(0).toUpperCase() + category.slice(1))}:} ${Array.isArray(skills) ? skills.map((s: string) => escapeLatex(s)).join(', ') : escapeLatex(String(skills))}`
    ).join(' \\\\\n') || '';

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{mathptmx} % Times New Roman
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\geometry{margin=0.75in}
\\setlist[itemize]{nosep, leftmargin=*}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titleformat{\\subsection}{\\bfseries}{}{0em}{}
\\titlespacing{\\section}{0pt}{12pt}{6pt}
\\titlespacing{\\subsection}{0pt}{8pt}{4pt}

\\begin{document}

% Header
\\begin{center}
{\\LARGE \\textbf{${escapeLatex(data.name)}}}\\\\[4pt]
${escapeLatex(data.location)} | ${escapeLatex(data.email)} | ${escapeLatex(data.phone)}\\\\
${data.linkedin ? `\\href{https://${data.linkedin}}{LinkedIn}` : ''} ${data.github ? `| \\href{https://${data.github}}{GitHub}` : ''}
\\end{center}

% Professional Summary
${data.summary ? `\\section*{Professional Summary}
${escapeLatex(data.summary)}` : ''}

% Work Experience
${data.experience?.length > 0 ? `\\section*{Professional Experience}
${experienceSection}` : ''}

% Education
${data.education?.length > 0 ? `\\section*{Education}
${educationSection}` : ''}

% Skills
${Object.keys(data.skills || {}).length > 0 ? `\\section*{Skills}
${skillsSection}` : ''}

% Certification
${data.certifications?.length > 0 ? `\\section*{Certifications}
${data.certifications.map((c: any) => `${escapeLatex(c.name)} (${escapeLatex(c.issuer)})`).join(', ')}` : ''}

\\end{document}`;
};

// ==========================================
// 2. TECH / ENGINEERING TEMPLATE
// Modern Sans-Serif, skills-focused, compact
// ==========================================
const generateTechLatex = (data: any) => {
    const experienceSection = data.experience?.map((exp: any) => `
\\textbf{${escapeLatex(exp.title)}} \\hfill ${escapeLatex(exp.date)} \\\\
\\textit{${escapeLatex(exp.company)}} -- ${escapeLatex(exp.location)}
\\begin{itemize}
${exp.description?.map((d: string) => `  \\item ${escapeLatex(d)}`).join('\n') || ''}
\\end{itemize}
`).join('\\vspace{4pt}\n') || '';

    const skillsSection = Object.entries(data.skills || {}).map(([category, skills]: [string, any]) =>
        `\\textbf{${escapeLatex(category.charAt(0).toUpperCase() + category.slice(1))}:} ${Array.isArray(skills) ? skills.map((s: string) => escapeLatex(s)).join(', ') : escapeLatex(String(skills))}`
    ).join(' \\\\\n') || '';

    const projectsSection = data.projects?.map((proj: any) => `
\\textbf{${escapeLatex(proj.name)}} \\\\
${escapeLatex(proj.description)} \\\\
\\textit{Stack: ${proj.technologies?.map((t: string) => escapeLatex(t)).join(', ') || ''}}
`).join('\\vspace{6pt}\n') || '';

    return `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lato} % Lato Font (Sans Serif)
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\definecolor{primary}{RGB}{37, 99, 235} % Blue

\\geometry{margin=0.5in}
\\setlist[itemize]{nosep, leftmargin=1.2em}
\\titleformat{\\section}{\\large\\bfseries\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}

\\begin{document}

% Header
\\begin{center}
{\\Huge \\textbf{${escapeLatex(data.name)}}} \\\\[4pt]
${escapeLatex(data.email)} $\\cdot$ ${escapeLatex(data.phone)} $\\cdot$ ${escapeLatex(data.location)} \\\\
\\href{https://${data.linkedin}}{${escapeLatex(data.linkedin)}} $\\cdot$ \\href{https://${data.github}}{${escapeLatex(data.github)}}
\\end{center}

% Skills (Top for Tech)
${Object.keys(data.skills || {}).length > 0 ? `\\section*{Technical Skills}
${skillsSection}` : ''}

% Work Experience
${data.experience?.length > 0 ? `\\section*{Experience}
${experienceSection}` : ''}

% Projects
${data.projects?.length > 0 ? `\\section*{Key Projects}
${projectsSection}` : ''}

% Education
${data.education?.length > 0 ? `\\section*{Education}
${data.education.map((edu: any) => `\\textbf{${escapeLatex(edu.institution)}} \\hfill ${escapeLatex(edu.date)} \\\\ ${escapeLatex(edu.degree)} ${edu.gpa ? `(GPA: ${escapeLatex(edu.gpa)})` : ''}`).join('\\\\\n')}` : ''}

\\end{document}`;
};

// ==========================================
// 3. CREATIVE / DESIGN TEMPLATE
// Stylish, minimal, maybe header color
// ==========================================
const generateCreativeLatex = (data: any) => {
    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{raleway} % Raleway font
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\definecolor{accent}{RGB}{236, 72, 153} % Pink/Magenta

\\geometry{margin=0.75in}
\\setlist[itemize]{nosep, leftmargin=*}
\\titleformat{\\section}{\\Large\\bfseries\\color{accent}}{}{0em}{}
\\titlespacing{\\section}{0pt}{14pt}{6pt}

\\begin{document}

% Header
{\\fontsize{30}{36}\\selectfont \\textbf{${escapeLatex(data.name)}}} \\\\[8pt]
\\color{gray} ${escapeLatex(data.location)} \\hspace{10pt} ${escapeLatex(data.email)} \\hspace{10pt} ${escapeLatex(data.phone)} \\\\
\\href{https://${data.linkedin}}{LinkedIn} \\hspace{5pt} \\href{https://${data.github}}{Portfolio/GitHub}
\\normalcolor
\\vspace{10pt}
\\hrule
\\vspace{10pt}

% Summary
${data.summary ? `\\section*{Profile}
${escapeLatex(data.summary)}` : ''}

% Experience
${data.experience?.length > 0 ? `\\section*{Experience}
${data.experience.map((exp: any) => `
\\textbf{${escapeLatex(exp.title)}} \\hfill ${escapeLatex(exp.date)} \\\\
\\textit{${escapeLatex(exp.company)}} \\\\
\\begin{itemize}
${exp.description?.map((d: string) => `  \\item ${escapeLatex(d)}`).join('\n') || ''}
\\end{itemize}
`).join('\\vspace{8pt}\n')}` : ''}

% Education
${data.education?.length > 0 ? `\\section*{Education}
${data.education.map((edu: any) => `
\\textbf{${escapeLatex(edu.institution)}} \\hfill ${escapeLatex(edu.date)} \\\\
${escapeLatex(edu.degree)}
`).join('\\vspace{4pt}\n')}` : ''}

% Skills
${Object.keys(data.skills || {}).length > 0 ? `\\section*{Skills}
\\begin{itemize}
${Object.entries(data.skills || {}).map(([category, skills]: [string, any]) =>
        `\\item \\textbf{${escapeLatex(category)}:} ${Array.isArray(skills) ? skills.map((s: string) => escapeLatex(s)).join(', ') : escapeLatex(String(skills))}`
    ).join('\n')}
\\end{itemize}` : ''}

\\end{document}`;
};

// ==========================================
// 4. ACADEMIC / CV TEMPLATE
// Dense, many sections, serif
// ==========================================
const generateAcademicLatex = (data: any) => {
    return `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{ebgaramond} % Garamond
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\geometry{margin=1in}
\\setlist[itemize]{nosep, leftmargin=*}
\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

\\begin{document}

% Header
\\begin{center}
{\\LARGE \\textbf{${escapeLatex(data.name)}}} \\\\[4pt]
${escapeLatex(data.location)} $\\cdot$ ${escapeLatex(data.email)} $\\cdot$ ${escapeLatex(data.phone)}
\\end{center}

% Education
${data.education?.length > 0 ? `\\section*{Education}
${data.education.map((edu: any) => `
\\textbf{${escapeLatex(edu.institution)}} \\hfill ${escapeLatex(edu.date)} \\\\
${escapeLatex(edu.degree)} ${edu.gpa ? `\\\\ GPA: ${escapeLatex(edu.gpa)}` : ''}
`).join('\\vspace{6pt}\n')}` : ''}

% Research/Work Experience
${data.experience?.length > 0 ? `\\section*{Research \\& Professional Experience}
${data.experience.map((exp: any) => `
\\textbf{${escapeLatex(exp.title)}} \\hfill ${escapeLatex(exp.date)} \\\\
${escapeLatex(exp.company)}
\\begin{itemize}
${exp.description?.map((d: string) => `  \\item ${escapeLatex(d)}`).join('\n') || ''}
\\end{itemize}
`).join('\\vspace{6pt}\n')}` : ''}

% Publications (Placeholder using projects/desc for now if needed, or just standard projects)
${data.projects?.length > 0 ? `\\section*{Projects \\& Research}
${data.projects.map((proj: any) => `
\\textbf{${escapeLatex(proj.name)}} \\\\
${escapeLatex(proj.description)}
`).join('\\vspace{4pt}\n')}` : ''}

% Certifications/Awards
${data.certifications?.length > 0 ? `\\section*{Certifications \\& Awards}
\\begin{itemize}
${data.certifications.map((c: any) => `\\item ${escapeLatex(c.name)} - ${escapeLatex(c.issuer)} (${escapeLatex(c.date)})`).join('\n')}
\\end{itemize}` : ''}

% Skills
${Object.keys(data.skills || {}).length > 0 ? `\\section*{Skills}
${Object.entries(data.skills || {}).map(([category, skills]: [string, any]) =>
        `\\textbf{${escapeLatex(category)}:} ${Array.isArray(skills) ? skills.map((s: string) => escapeLatex(s)).join(', ') : escapeLatex(String(skills))}`
    ).join(' \\\\\n')}` : ''}

\\end{document}`;
};


// ==========================================
// MAIN DISPATCHER
// ==========================================
export const getLatexForTemplate = (templateId: string, data: any) => {
    // Normalize ID
    const id = templateId?.toLowerCase() || 'professional';

    // Map templates to generators
    // Tech
    if (['software-engineer', 'data-scientist', 'devops-engineer', 'frontend-developer', 'backend-developer'].includes(id)) {
        return generateTechLatex(data);
    }

    // Creative
    if (['ux-designer', 'graphic-designer'].includes(id)) {
        return generateCreativeLatex(data);
    }

    // Academic
    if (['academic-researcher', 'teacher'].includes(id)) {
        return generateAcademicLatex(data);
    }

    // Default / Business / Finance
    // 'professional', 'product-manager', 'marketing-manager', 'project-manager', 
    // 'sales-executive', 'financial-analyst', 'accountant'
    return generateProfessionalLatex(data);
};
