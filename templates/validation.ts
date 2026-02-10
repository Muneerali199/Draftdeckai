// Template Validation and Quality Assurance for DraftDeckAI
// This module provides validation functions to ensure template quality and consistency

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 quality score
}

export interface TemplateContent {
  id: string;
  title: string;
  description: string;
  type: 'resume' | 'presentation' | 'letter' | 'cv';
  content: any;
  metadata?: {
    industry?: string;
    difficulty?: string;
    tags?: string[];
    lastUpdated?: string;
  };
}

// Validation Rules
export const validationRules = {
  title: {
    minLength: 10,
    maxLength: 100,
    required: true
  },
  description: {
    minLength: 50,
    maxLength: 500,
    required: true
  },
  content: {
    required: true,
    minSections: 3
  },
  metadata: {
    tagsMinCount: 2,
    tagsMaxCount: 10
  }
};

// Quality Standards
export const qualityStandards = {
  professionalLanguage: {
    bannedWords: ['awesome', 'amazing', 'incredible', 'fantastic'],
    preferredWords: ['professional', 'comprehensive', 'effective', 'strategic']
  },
  formatting: {
    consistentHeadings: true,
    properBulletPoints: true,
    standardSections: true
  },
  completeness: {
    hasExamples: true,
    hasGuidance: true,
    hasCustomizationTips: true
  }
};

/**
 * Validates a template against quality standards
 */
export function validateTemplate(template: TemplateContent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Basic validation
  if (!template.title || template.title.length < validationRules.title.minLength) {
    errors.push(`Title must be at least ${validationRules.title.minLength} characters`);
    score -= 15;
  }

  if (!template.description || template.description.length < validationRules.description.minLength) {
    errors.push(`Description must be at least ${validationRules.description.minLength} characters`);
    score -= 15;
  }

  if (!template.content) {
    errors.push('Template content is required');
    score -= 25;
  }

  // Type-specific validation
  const typeValidation = validateByType(template);
  errors.push(...typeValidation.errors);
  warnings.push(...typeValidation.warnings);
  score -= typeValidation.scoreDeduction;

  // Content quality validation
  const qualityValidation = validateContentQuality(template);
  warnings.push(...qualityValidation.warnings);
  score -= qualityValidation.scoreDeduction;

  // Metadata validation
  if (template.metadata) {
    const metadataValidation = validateMetadata(template.metadata);
    warnings.push(...metadataValidation.warnings);
    score -= metadataValidation.scoreDeduction;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score)
  };
}

/**
 * Validates template based on its type
 */
function validateByType(template: TemplateContent): { errors: string[], warnings: string[], scoreDeduction: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let scoreDeduction = 0;

  switch (template.type) {
    case 'resume':
      return validateResumeTemplate(template);
    case 'presentation':
      return validatePresentationTemplate(template);
    case 'letter':
      return validateLetterTemplate(template);
    case 'cv':
      return validateCVTemplate(template);
    default:
      errors.push('Invalid template type');
      scoreDeduction = 20;
  }

  return { errors, warnings, scoreDeduction };
}

/**
 * Validates resume template structure
 */
function validateResumeTemplate(template: TemplateContent): { errors: string[], warnings: string[], scoreDeduction: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let scoreDeduction = 0;

  const requiredSections = ['personalInfo', 'sections'];
  const content = template.content;

  for (const section of requiredSections) {
    if (!content[section]) {
      errors.push(`Resume template missing required section: ${section}`);
      scoreDeduction += 10;
    }
  }

  if (content.sections && content.sections.length < 3) {
    warnings.push('Resume should have at least 3 sections (experience, education, skills)');
    scoreDeduction += 5;
  }

  return { errors, warnings, scoreDeduction };
}

/**
 * Validates presentation template structure
 */
function validatePresentationTemplate(template: TemplateContent): { errors: string[], warnings: string[], scoreDeduction: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let scoreDeduction = 0;

  const content = template.content;

  if (!content.title) {
    errors.push('Presentation template missing title');
    scoreDeduction += 10;
  }

  if (!content.slides || !Array.isArray(content.slides)) {
    errors.push('Presentation template missing slides array');
    scoreDeduction += 15;
  } else if (content.slides.length < 5) {
    warnings.push('Presentation should have at least 5 slides for completeness');
    scoreDeduction += 5;
  }

  return { errors, warnings, scoreDeduction };
}

/**
 * Validates letter template structure
 */
function validateLetterTemplate(template: TemplateContent): { errors: string[], warnings: string[], scoreDeduction: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let scoreDeduction = 0;

  const requiredSections = ['recipient', 'content'];
  const content = template.content;

  for (const section of requiredSections) {
    if (!content[section]) {
      errors.push(`Letter template missing required section: ${section}`);
      scoreDeduction += 10;
    }
  }

  if (content.content && !content.content.greeting) {
    warnings.push('Letter should include a proper greeting');
    scoreDeduction += 3;
  }

  return { errors, warnings, scoreDeduction };
}

/**
 * Validates CV template structure
 */
function validateCVTemplate(template: TemplateContent): { errors: string[], warnings: string[], scoreDeduction: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let scoreDeduction = 0;

  const requiredSections = ['personalInfo', 'sections'];
  const content = template.content;

  for (const section of requiredSections) {
    if (!content[section]) {
      errors.push(`CV template missing required section: ${section}`);
      scoreDeduction += 10;
    }
  }

  if (content.sections && content.sections.length < 5) {
    warnings.push('Academic CV should have at least 5 sections for comprehensiveness');
    scoreDeduction += 5;
  }

  return { errors, warnings, scoreDeduction };
}

/**
 * Validates content quality
 */
function validateContentQuality(template: TemplateContent): { warnings: string[], scoreDeduction: number } {
  const warnings: string[] = [];
  let scoreDeduction = 0;

  const text = JSON.stringify(template.content).toLowerCase();

  // Check for unprofessional language
  for (const word of qualityStandards.professionalLanguage.bannedWords) {
    if (text.includes(word.toLowerCase())) {
      warnings.push(`Consider replacing "${word}" with more professional language`);
      scoreDeduction += 2;
    }
  }

  // Check for placeholder content
  if (text.includes('[placeholder]') || text.includes('lorem ipsum')) {
    warnings.push('Template contains placeholder content that should be replaced');
    scoreDeduction += 5;
  }

  // Check for sufficient detail
  if (text.length < 1000) {
    warnings.push('Template content seems too brief for professional use');
    scoreDeduction += 5;
  }

  return { warnings, scoreDeduction };
}

/**
 * Validates template metadata
 */
function validateMetadata(metadata: any): { warnings: string[], scoreDeduction: number } {
  const warnings: string[] = [];
  let scoreDeduction = 0;

  if (!metadata.industry) {
    warnings.push('Template should specify target industry');
    scoreDeduction += 3;
  }

  if (!metadata.difficulty) {
    warnings.push('Template should specify difficulty level');
    scoreDeduction += 3;
  }

  if (!metadata.tags || metadata.tags.length < validationRules.metadata.tagsMinCount) {
    warnings.push(`Template should have at least ${validationRules.metadata.tagsMinCount} tags`);
    scoreDeduction += 3;
  }

  if (!metadata.lastUpdated) {
    warnings.push('Template should include last updated date');
    scoreDeduction += 2;
  }

  return { warnings, scoreDeduction };
}

/**
 * Generates a quality report for a template
 */
export function generateQualityReport(template: TemplateContent): string {
  const validation = validateTemplate(template);
  
  let report = `Template Quality Report: ${template.title}\n`;
  report += `Overall Score: ${validation.score}/100\n\n`;

  if (validation.errors.length > 0) {
    report += `Errors (${validation.errors.length}):\n`;
    validation.errors.forEach((error, index) => {
      report += `${index + 1}. ${error}\n`;
    });
    report += '\n';
  }

  if (validation.warnings.length > 0) {
    report += `Warnings (${validation.warnings.length}):\n`;
    validation.warnings.forEach((warning, index) => {
      report += `${index + 1}. ${warning}\n`;
    });
    report += '\n';
  }

  if (validation.isValid && validation.warnings.length === 0) {
    report += 'Template meets all quality standards!\n';
  }

  return report;
}

/**
 * Batch validates multiple templates
 */
export function validateTemplates(templates: TemplateContent[]): { [key: string]: ValidationResult } {
  const results: { [key: string]: ValidationResult } = {};
  
  templates.forEach(template => {
    results[template.id] = validateTemplate(template);
  });

  return results;
}

export default {
  validateTemplate,
  generateQualityReport,
  validateTemplates,
  validationRules,
  qualityStandards
};
