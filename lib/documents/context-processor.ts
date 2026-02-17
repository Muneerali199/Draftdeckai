/**
 * DraftDeckAI Productivity Engine - Context File Processor
 * Handles file uploads and extracts content for RAG
 */

import { ContextFile } from '@/types/documents';

export interface FileUploadResult {
  success: boolean;
  file?: ContextFile;
  error?: string;
}

/**
 * Supported file types for context upload
 */
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'application/json': 'json',
} as const;

export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES;

/**
 * Process uploaded file and extract content
 */
export async function processContextFile(file: File): Promise<FileUploadResult> {
  try {
    const fileType = SUPPORTED_FILE_TYPES[file.type as SupportedFileType];
    
    if (!fileType) {
      return {
        success: false,
        error: `Unsupported file type: ${file.type}. Supported types: PDF, CSV, DOCX, TXT, JSON`,
      };
    }

    // Read file content
    const content = await readFileContent(file);
    
    // Extract structured data based on file type
    const extractedData = await extractStructuredData(content, fileType);

    const contextFile: ContextFile = {
      id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: fileType,
      content: content.substring(0, 100000), // Limit to 100KB for AI context
      extractedData,
      uploadedAt: new Date(),
    };

    return {
      success: true,
      file: contextFile,
    };
  } catch (error) {
    console.error('Error processing context file:', error);
    return {
      success: false,
      error: 'Failed to process file. Please try again.',
    };
  }
}

/**
 * Read file content as text
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => reject(new Error('File read error'));
    
    if (file.type === 'application/pdf') {
      // For PDFs, we'd need a PDF parser library
      // For now, read as text (will be garbled but can be improved)
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  });
}

/**
 * Extract structured data from content based on file type
 */
async function extractStructuredData(content: string, type: ContextFile['type']): Promise<any> {
  switch (type) {
    case 'csv':
      return parseCSV(content);
    case 'json':
      return parseJSON(content);
    case 'pdf':
      return { type: 'pdf', pages: estimatePageCount(content) };
    case 'docx':
      return { type: 'docx', paragraphs: content.split('\n').length };
    case 'txt':
      return { type: 'txt', lines: content.split('\n').length };
    default:
      return null;
  }
}

/**
 * Parse CSV content into structured data
 */
function parseCSV(content: string): { headers: string[]; rows: any[] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return { headers, rows };
}

/**
 * Parse JSON content
 */
function parseJSON(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return { error: 'Invalid JSON' };
  }
}

/**
 * Estimate page count from content
 */
function estimatePageCount(content: string): number {
  // Rough estimate: ~3000 characters per page
  return Math.ceil(content.length / 3000);
}

/**
 * Extract key insights from context files
 */
export function extractKeyInsights(contextFiles: ContextFile[]): string[] {
  const insights: string[] = [];
  
  contextFiles.forEach(file => {
    // Extract named entities, key metrics, and important statements
    const content = file.content;
    
    // Extract numbers and percentages
    const numbers = content.match(/\d+(?:\.\d+)?%?/g) || [];
    if (numbers.length > 0) {
      insights.push(`[${file.name}] Contains ${numbers.length} numerical data points`);
    }
    
    // Extract dates
    const dates = content.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi) || [];
    if (dates.length > 0) {
      insights.push(`[${file.name}] Timeline data available (${dates.length} dates found)`);
    }
    
    // Extract for CSV data
    if (file.type === 'csv' && file.extractedData?.headers) {
      insights.push(`[${file.name}] CSV with ${file.extractedData.headers.length} columns: ${file.extractedData.headers.join(', ')}`);
    }
  });
  
  return insights;
}

/**
 * Build citations from context files
 */
export function buildCitations(contextFiles: ContextFile[]): string {
  return contextFiles.map((file, index) => 
    `[${index + 1}] ${file.name} (${file.type.toUpperCase()})`
  ).join('\n');
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Get file icon based on type
 */
export function getFileIcon(type: ContextFile['type']): string {
  switch (type) {
    case 'pdf':
      return 'file-text';
    case 'csv':
      return 'table';
    case 'docx':
      return 'file-word';
    case 'txt':
      return 'file';
    case 'json':
      return 'code';
    default:
      return 'file';
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
