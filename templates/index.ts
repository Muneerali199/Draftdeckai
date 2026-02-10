// Professional Template Index for DraftDeckAI
// This file exports all available professional templates organized by category

export interface TemplateMetadata {
  id: string;
  title: string;
  description: string;
  category: 'resume' | 'presentation' | 'letter' | 'cv';
  industry: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  filePath: string;
  lastUpdated: string;
  usageCount?: number;
  rating?: number;
}

// Resume Templates
export const resumeTemplates: TemplateMetadata[] = [
  {
    id: 'software-engineer-resume',
    title: 'Software Engineer Resume',
    description: 'Professional resume template optimized for software engineering positions with emphasis on technical skills and project experience',
    category: 'resume',
    industry: 'technology',
    difficulty: 'intermediate',
    tags: ['software-engineer', 'technical', 'programming', 'development'],
    filePath: 'templates/resume/software-engineer-resume.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 2847,
    rating: 4.9
  },
  {
    id: 'marketing-manager-resume',
    title: 'Marketing Manager Resume',
    description: 'Strategic marketing resume template highlighting campaign management, analytics, and growth achievements',
    category: 'resume',
    industry: 'marketing',
    difficulty: 'intermediate',
    tags: ['marketing', 'digital-marketing', 'campaign-management', 'analytics'],
    filePath: 'templates/resume/marketing-manager-resume.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 1892,
    rating: 4.7
  },
  {
    id: 'healthcare-professional-resume',
    title: 'Healthcare Professional Resume',
    description: 'Comprehensive resume template for nurses, medical technicians, and healthcare professionals',
    category: 'resume',
    industry: 'healthcare',
    difficulty: 'intermediate',
    tags: ['healthcare', 'nursing', 'medical', 'patient-care'],
    filePath: 'templates/resume/healthcare-professional-resume.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 1456,
    rating: 4.8
  }
];

// Presentation Templates
export const presentationTemplates: TemplateMetadata[] = [
  {
    id: 'startup-pitch-deck',
    title: 'Startup Pitch Deck',
    description: 'Comprehensive pitch deck template for startups seeking investment, covering all essential elements investors expect',
    category: 'presentation',
    industry: 'startup',
    difficulty: 'advanced',
    tags: ['startup', 'pitch-deck', 'investment', 'fundraising'],
    filePath: 'templates/presentation/startup-pitch-deck.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 3247,
    rating: 4.9
  },
  {
    id: 'sales-presentation',
    title: 'Sales Presentation Template',
    description: 'Professional sales presentation template for client meetings, product demos, and proposal presentations',
    category: 'presentation',
    industry: 'sales',
    difficulty: 'intermediate',
    tags: ['sales', 'client-presentation', 'proposal', 'business-development'],
    filePath: 'templates/presentation/sales-presentation.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 2156,
    rating: 4.8
  }
];

// Letter Templates
export const letterTemplates: TemplateMetadata[] = [
  {
    id: 'professional-cover-letter',
    title: 'Professional Cover Letter',
    description: 'Comprehensive cover letter template that highlights your qualifications and enthusiasm for the position',
    category: 'letter',
    industry: 'general',
    difficulty: 'beginner',
    tags: ['cover-letter', 'job-application', 'professional', 'career'],
    filePath: 'templates/letter/professional-cover-letter.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 4521,
    rating: 4.8
  },
  {
    id: 'business-proposal-letter',
    title: 'Business Proposal Letter',
    description: 'Professional business proposal letter template for presenting business opportunities and partnerships',
    category: 'letter',
    industry: 'business',
    difficulty: 'intermediate',
    tags: ['business-proposal', 'partnership', 'professional', 'opportunity'],
    filePath: 'templates/letter/business-proposal-letter.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 1876,
    rating: 4.7
  }
];

// CV Templates
export const cvTemplates: TemplateMetadata[] = [
  {
    id: 'academic-cv',
    title: 'Academic CV Template',
    description: 'Comprehensive CV template for academic professionals, researchers, and professors seeking academic positions',
    category: 'cv',
    industry: 'academia',
    difficulty: 'advanced',
    tags: ['academic', 'research', 'professor', 'phd'],
    filePath: 'templates/cv/academic-cv.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 987,
    rating: 4.9
  },
  {
    id: 'medical-professional-cv',
    title: 'Medical Professional CV',
    description: 'Specialized CV template for physicians, medical professionals, and healthcare practitioners',
    category: 'cv',
    industry: 'healthcare',
    difficulty: 'advanced',
    tags: ['medical', 'physician', 'healthcare', 'clinical'],
    filePath: 'templates/cv/medical-professional-cv.md',
    lastUpdated: '2024-01-09T00:00:00Z',
    usageCount: 756,
    rating: 4.8
  }
];

// All Templates Combined
export const allTemplates: TemplateMetadata[] = [
  ...resumeTemplates,
  ...presentationTemplates,
  ...letterTemplates,
  ...cvTemplates
];

// Template Categories
export const templateCategories = {
  resume: resumeTemplates,
  presentation: presentationTemplates,
  letter: letterTemplates,
  cv: cvTemplates
};

// Template Statistics
export const templateStats = {
  totalTemplates: allTemplates.length,
  categoryCounts: {
    resume: resumeTemplates.length,
    presentation: presentationTemplates.length,
    letter: letterTemplates.length,
    cv: cvTemplates.length
  },
  industries: [...new Set(allTemplates.map(t => t.industry))],
  difficultyLevels: ['beginner', 'intermediate', 'advanced'],
  lastUpdated: '2024-01-09T00:00:00Z'
};

// Helper Functions
export function getTemplateById(id: string): TemplateMetadata | undefined {
  return allTemplates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): TemplateMetadata[] {
  return allTemplates.filter(template => template.category === category);
}

export function getTemplatesByIndustry(industry: string): TemplateMetadata[] {
  return allTemplates.filter(template => template.industry === industry);
}

export function getTemplatesByDifficulty(difficulty: string): TemplateMetadata[] {
  return allTemplates.filter(template => template.difficulty === difficulty);
}

export function searchTemplates(query: string): TemplateMetadata[] {
  const lowercaseQuery = query.toLowerCase();
  return allTemplates.filter(template => 
    template.title.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.industry.toLowerCase().includes(lowercaseQuery)
  );
}

// Template Quality Assurance
export const templateQualityStandards = {
  criteria: [
    'Industry-standard formatting and structure',
    'Comprehensive content with real examples',
    'Professional language and tone',
    'Customization guidance included',
    'Current with industry best practices',
    'Error-free and well-proofread'
  ],
  lastReview: '2024-01-09T00:00:00Z',
  nextReview: '2024-04-09T00:00:00Z'
};

export default {
  allTemplates,
  templateCategories,
  templateStats,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByIndustry,
  getTemplatesByDifficulty,
  searchTemplates,
  templateQualityStandards
};
