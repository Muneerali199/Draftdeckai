import { Template } from "@/types";

export const TEMPLATE_TYPES = ["resume", "presentation", "letter", "cv"] as const;

export const getTemplateTypeLabel = (type: string): string => {
  switch (type) {
    case 'resume':
      return 'Resume';
    case 'presentation':
      return 'Presentation';
    case 'letter':
      return 'Cover Letter';
    case 'cv':
      return 'CV';
    default:
      return 'Document';
  }
};

export const getTemplateTypeIcon = (type: string) => {
  switch (type) {
    case 'resume':
      return '📄';
    case 'presentation':
      return '📊';
    case 'letter':
      return '✉️';
    case 'cv':
      return '📑';
    default:
      return '📄';
  }
};

export const getDefaultTemplateContent = (type: string): any => {
  const baseContent = {
    sections: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  switch (type) {
    case 'resume':
      return {
        ...baseContent,
        personalInfo: {
          name: '',
          email: '',
          phone: '',
          location: '',
          website: '',
          summary: '',
        },
        sections: [
          { id: 'experience', title: 'Work Experience', items: [] },
          { id: 'education', title: 'Education', items: [] },
          { id: 'skills', title: 'Skills', items: [] },
        ],
      };
    case 'presentation':
      return {
        ...baseContent,
        title: 'Untitled Presentation',
        slides: [
          {
            id: '1',
            type: 'title',
            content: {
              title: 'Untitled Presentation',
              subtitle: 'Created with DraftDeckAI',
            },
          },
        ],
      };
    case 'letter':
      return {
        ...baseContent,
        recipient: {
          name: '',
          position: '',
          company: '',
          address: '',
        },
        content: {
          greeting: 'Dear Hiring Manager,',
          body: '\n\n',
          closing: 'Sincerely,',
          signature: '',
        },
      };
    case 'cv':
      return {
        ...baseContent,
        personalInfo: {
          name: '',
          email: '',
          phone: '',
          address: '',
          website: '',
          summary: '',
        },
        sections: [
          { id: 'experience', title: 'Professional Experience', items: [] },
          { id: 'education', title: 'Education', items: [] },
          { id: 'skills', title: 'Technical Skills', items: [] },
          { id: 'publications', title: 'Publications', items: [] },
          { id: 'awards', title: 'Awards & Honors', items: [] },
        ],
      };
    default:
      return baseContent;
  }
};

export const validateTemplateContent = (type: string, content: any): boolean => {
  if (!content) return false;
  
  const requiredFields: Record<string, string[]> = {
    resume: ['personalInfo', 'sections'],
    presentation: ['title', 'slides'],
    letter: ['recipient', 'content'],
    cv: ['personalInfo', 'sections'],
  };

  const typeFields = requiredFields[type as keyof typeof requiredFields] || [];
  return typeFields.every(field => content[field] !== undefined);
};

export const getTemplatePreview = (template: Template): string => {
  if (!template.content) return 'No content available';
  
  switch (template.type) {
    case 'resume':
    case 'cv':
      return template.content.personalInfo?.summary || 'No summary available';
    case 'presentation':
      return template.content.slides?.[0]?.content?.title || 'No title available';
    case 'letter':
      return template.content.content?.body?.substring(0, 100) + '...' || 'No content available';
    default:
      return 'Preview not available';
  }
};
