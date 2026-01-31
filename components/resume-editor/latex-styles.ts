// LaTeX Typography and Spacing Constants
// These values match exact LaTeX measurements for pixel-perfect PDF mimicry

export const latexStyles = {
    // Page dimensions (A4)
    page: {
        width: '210mm',
        minHeight: '297mm',
        maxWidth: '210mm',
        padding: '19.05mm', // 0.75in exact LaTeX margin
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
        sizeLARGE: '17.28pt', // \LARGE (1.5 × \large)
        lineHeight: 1.2,
        color: '#000000',
    },

    // Text alignment
    text: {
        align: 'justify' as const,
        hyphens: 'auto' as const,
    },

    // Section headers (\section* in LaTeX)
    section: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '14pt',
        fontWeight: 'bold' as const,
        textTransform: 'uppercase' as const,
        borderBottom: '0.4pt solid #000000', // \titlerule is exactly 0.4pt
        paddingBottom: '3pt',
        marginTop: '12pt', // \titlespacing{section}{0pt}{12pt}{6pt}
        marginBottom: '6pt',
        letterSpacing: '0.5pt',
        lineHeight: 1.2,
        color: '#000000',
    },

    // Subsection headers (\subsection* in LaTeX)
    subsection: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        fontWeight: 'bold' as const,
        marginTop: '8pt', // \titlespacing{subsection}{0pt}{8pt}{4pt}
        marginBottom: '4pt',
        lineHeight: 1.2,
        color: '#000000',
    },

    // Header section (center environment with name)
    header: {
        textAlign: 'center' as const,
        marginBottom: '12pt',
    },

    // Name (uses \LARGE in LaTeX)
    name: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '17.28pt', // \LARGE = 1.44 × base
        fontWeight: 'bold' as const,
        marginBottom: '4pt',
        lineHeight: 1.2,
        color: '#000000',
    },

    // Contact info
    contact: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        lineHeight: 1.2,
        color: '#000000',
    },

    // Job/position titles
    jobTitle: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        fontWeight: 'bold' as const,
        lineHeight: 1.2,
        color: '#000000',
    },

    // Company/institution names (italic in LaTeX)
    company: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        fontStyle: 'italic' as const,
        lineHeight: 1.2,
        color: '#000000',
    },

    // Dates (bold, right-aligned)
    date: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        fontWeight: 'bold' as const,
        lineHeight: 1.2,
        whiteSpace: 'nowrap' as const,
        color: '#000000',
    },

    // Bullet list (itemize environment)
    bulletList: {
        listStyle: 'none' as const,
        paddingLeft: 0,
        margin: 0,
    },

    // Bullet item
    bulletItem: {
        position: 'relative' as const,
        paddingLeft: '15pt',
        marginBottom: 0,
        lineHeight: 1.2,
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        color: '#000000',
    },

    // Bullet marker style (for the • character)
    bulletMarker: {
        position: 'absolute' as const,
        left: 0,
        fontSize: '11pt',
        lineHeight: 1.2,
    },

    // Paragraph
    paragraph: {
        marginBottom: 0,
        textIndent: 0,
        lineHeight: 1.2,
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        color: '#000000',
    },

    // Skills inline display
    skillsInline: {
        fontFamily: "'Computer Modern', 'Latin Modern Roman', 'Times New Roman', serif",
        fontSize: '11pt',
        lineHeight: 1.2,
        color: '#000000',
    },
};

// Type for the styles object
export type LatexStyles = typeof latexStyles;
