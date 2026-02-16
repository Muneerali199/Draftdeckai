/**
 * DraftDeckAI Productivity Engine - Document Types
 * Structured Document System with Context Awareness
 */

export type DocumentType = 
  | 'business-proposal'
  | 'project-report' 
  | 'academic-research'
  | 'requirements-spec';

export type DocumentTone = 'startup' | 'academic' | 'professional' | 'casual';

export type VisualType = 
  | 'gantt-chart'
  | 'flowchart'
  | 'pie-chart'
  | 'bar-chart'
  | 'line-chart'
  | 'timeline'
  | 'mind-map'
  | 'table';

export interface VisualTag {
  id: string;
  type: VisualType;
  title: string;
  description?: string;
  data?: any;
  mermaidCode?: string;
  chartData?: ChartData;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  visualTags?: VisualTag[];
  callout?: {
    type: 'info' | 'warning' | 'success' | 'tip';
    title: string;
    content: string;
  };
}

export interface DocumentOutline {
  id: string;
  title: string;
  documentType: DocumentType;
  sections: {
    id: string;
    title: string;
    description: string;
    order: number;
  }[];
  approved: boolean;
}

export interface ContextFile {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'docx' | 'txt' | 'json';
  content: string;
  extractedData?: any;
  uploadedAt: Date;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  documentType: DocumentType;
  tone: DocumentTone;
  outline: DocumentOutline;
  sections: DocumentSection[];
  contextFiles: ContextFile[];
  citations: Citation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Citation {
  id: string;
  source: string;
  content: string;
  page?: number;
  contextFileId?: string;
}

// Document Blueprints - Hardcoded structures for each document type
export interface DocumentBlueprint {
  type: DocumentType;
  name: string;
  description: string;
  icon: string;
  sections: BlueprintSection[];
  requiredInputs: RequiredInput[];
}

export interface BlueprintSection {
  id: string;
  title: string;
  description: string;
  order: number;
  optional?: boolean;
  visualTypes?: VisualType[];
  promptTemplate: string;
}

export interface RequiredInput {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'file';
  required: boolean;
  placeholder?: string;
  options?: string[];
  accept?: string; // for file inputs
}

// User Input Forms
export interface BusinessProposalInput {
  clientName: string;
  problemStatement: string;
  proposedSolution: string;
  pricingModel: string;
  timelineEstimation: string;
  tone?: DocumentTone;
}

export interface ProjectReportInput {
  projectName: string;
  reportingPeriod: string;
  keyAchievements: string;
  roadblocks: string;
  budgetUsed: number;
  budgetTotal: number;
  nextSteps: string;
  status: 'red' | 'amber' | 'green';
  tone?: DocumentTone;
}

export interface AcademicResearchInput {
  researchTopic: string;
  targetAudience: string;
  keyFindings: string;
  citationStyle: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
  methodology?: string;
  dataFiles?: ContextFile[];
  tone?: DocumentTone;
}

export interface RequirementsSpecInput {
  productName: string;
  userPersona: string;
  coreFeatures: string;
  constraints: string;
  techStackPreference?: string;
  platform: 'mobile' | 'web' | 'desktop' | 'hybrid';
  tone?: DocumentTone;
}

export type DocumentInput = 
  | BusinessProposalInput 
  | ProjectReportInput 
  | AcademicResearchInput 
  | RequirementsSpecInput;
