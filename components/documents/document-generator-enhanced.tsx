/**
 * DraftDeckAI Productivity Engine - Enhanced Document Generator Component
 * Main component for generating structured documents with 4 options like presentation
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentType, DocumentInput, GeneratedDocument, DocumentOutline, ContextFile } from '@/types/documents';
import { getAllBlueprints, getBlueprint } from '@/lib/documents/blueprints';
import { generateOutlineAction, generateDocumentAction } from '@/app/actions/ai-actions';
import { approveOutline as approveOutlineFn } from '@/lib/documents/ai-generator';
import { processContextFile, FileUploadResult } from '@/lib/documents/context-processor';
import { exportDocument, ExportFormat } from '@/lib/documents/export';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Upload, 
  Download, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Briefcase,
  ClipboardList,
  GraduationCap,
  FileCode,
  Trash2,
  Eye,
  FileDown,
  Globe,
  Layout,
  ArrowLeft,
  Plus,
  Minus,
  X,
  PenTool,
  Wand2,
  List
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const documentTypeIcons = {
  'business-proposal': Briefcase,
  'project-report': ClipboardList,
  'academic-research': GraduationCap,
  'requirements-spec': FileCode,
};

type ViewState = 'dashboard' | 'input' | 'paste-text' | 'import-file' | 'webpage' | 'select-type' | 'input-data' | 'upload-context' | 'review-outline' | 'generating' | 'preview';

interface DocumentGeneratorEnhancedProps {
  onDocumentCreated?: () => void;
}

export function DocumentGeneratorEnhanced({ onDocumentCreated }: DocumentGeneratorEnhancedProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>('dashboard');
  const [currentStep, setCurrentStep] = useState<string>('dashboard');
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [outline, setOutline] = useState<DocumentOutline | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLatexMode, setIsLatexMode] = useState(false);
  
  // Dashboard states
  const [topic, setTopic] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [webpageUrl, setWebpageUrl] = useState('');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [slideCount, setSlideCount] = useState(5);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const loadingSteps = [
    'Analyzing your request...',
    'Researching best practices...',
    'Creating document structure...',
    'Crafting compelling content...',
    'Finalizing your document...',
  ];

  const blueprints = getAllBlueprints();

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const result: FileUploadResult = await processContextFile(file);
      
      if (result.success && result.file) {
        setContextFiles((prev) => [...prev, result.file!]);
        toast.success(`Uploaded: ${file.name}`);
      } else {
        toast.error(result.error || 'Failed to upload file');
      }
    }
  };

  const removeContextFile = (fileId: string) => {
    setContextFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    setFormData({});
    setView('input-data');
  };

  // Generate document outline
  const generateDocumentOutline = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    setProgress(25);

    try {
      const blueprint = getBlueprint(selectedType);
      const input = buildDocumentInput(selectedType, formData);

      const generatedOutline = await generateOutlineAction({
        documentType: selectedType,
        input,
        contextFiles,
      });

      setOutline(generatedOutline);
      setProgress(100);
      setView('review-outline');
    } catch (error) {
      toast.error('Failed to generate outline. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveOutline = () => {
    if (!outline) return;
    const approved = approveOutlineFn(outline);
    setOutline(approved);
    generateFullDocument();
  };

  const generateFullDocument = async () => {
    if (!selectedType || !outline) return;

    setIsLoading(true);
    setProgress(10);
    setView('generating');

    try {
      const input = buildDocumentInput(selectedType, formData);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 1000);

      const document = await generateDocumentAction({
        documentType: selectedType,
        input,
        contextFiles,
        tone: formData.tone,
      });

      clearInterval(progressInterval);
      
      // Save document to database
      const saveResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.title,
          documentType: selectedType,
          content: {
            tone: formData.tone,
            generatedAt: new Date().toISOString(),
            isLatex: isLatexMode,
          },
          metadata: {
            sections: document.sections,
            outline: document.outline,
            citations: document.citations,
            contextFiles: contextFiles.map(f => ({ id: f.id, name: f.name, type: f.type })),
          },
          sections: document.sections,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        console.error('Failed to save document to database:', errorData);
        toast.warning(`Document generated but not saved: ${errorData.error || 'Unknown error'}`);
      } else {
        const savedDoc = await saveResponse.json();
        toast.success('Document generated and saved!');
        
        // If LaTeX mode, we can also generate the .tex file directly or just let the editor handle it
        if (isLatexMode) {
          handleExportLatex(savedDoc.id);
        }

        // Call the callback if provided, otherwise redirect
        if (onDocumentCreated) {
          onDocumentCreated();
        }
        
        // Redirect to the document editor after a brief delay
        setTimeout(() => {
          router.push(`/documents/${savedDoc.id}`);
        }, 1500);
      }
      
      setGeneratedDocument(document);
      setProgress(100);
      setView('preview');
    } catch (error) {
      toast.error('Failed to generate document. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!generatedDocument) return;

    try {
      await exportDocument(generatedDocument, {
        format,
        includeVisuals: true,
        includeCitations: true,
      });
      toast.success(`Document exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export document');
      console.error(error);
    }
  };

  const handleExportLatex = async (docId?: string) => {
    if (!generatedDocument) return;
    
    try {
      toast.info('Generating LaTeX source...');
      
      const response = await fetch('/api/documents/latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId || `temp-${Date.now()}`, 
          title: generatedDocument.title,
          documentType: generatedDocument.documentType,
          sections: generatedDocument.sections
        })
      });
      
      if (!response.ok) {
        throw new Error('LaTeX generation failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedDocument.title.replace(/[^a-zA-Z0-9]/g, '_')}.tex`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('LaTeX source downloaded!');
    } catch (error) {
      console.error('LaTeX export error:', error);
      toast.error('Failed to generate LaTeX');
    }
  };

  const resetGenerator = () => {
    setView('dashboard');
    setCurrentStep('dashboard');
    setSelectedType(null);
    setFormData({});
    setContextFiles([]);
    setOutline(null);
    setGeneratedDocument(null);
    setProgress(0);
    setTopic('');
    setPastedText('');
    setWebpageUrl('');
  };

  // Helper function to build document input
  function buildDocumentInput(type: DocumentType, data: Record<string, any>): DocumentInput {
    return data as DocumentInput;
  }

  // Loading animation effect
  useEffect(() => {
    if (isGeneratingOutline) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGeneratingOutline]);

  // Render Dashboard View
  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16 pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-6 hover:scale-105 transition-transform duration-300">
          <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">AI-Powered Document Creation</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
          Create Professional <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Documents</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Transform your ideas into structured documents in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Generate Option */}
        <button
          onClick={() => setView('select-type')}
          className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="bg-white dark:bg-slate-900 w-full h-full rounded-[22px] p-8 flex flex-col relative overflow-hidden border border-gray-200 dark:border-slate-800 hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-left">Generate</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-left">Create from document templates.</p>
          </div>
        </button>

        {/* Paste Text Option */}
        <button
          onClick={() => setView('paste-text')}
          className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="bg-white dark:bg-slate-900 w-full h-full rounded-[22px] p-8 flex flex-col relative overflow-hidden border border-gray-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-left">Paste Text</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-left">Transform notes into documents.</p>
          </div>
        </button>

        {/* Import File Option */}
        <button
          onClick={() => setView('import-file')}
          className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="bg-white dark:bg-slate-900 w-full h-full rounded-[22px] p-8 flex flex-col relative overflow-hidden border border-gray-200 dark:border-slate-800 hover:border-orange-500/50 shadow-lg hover:shadow-orange-500/10 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-left">Import File</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-left">Convert PDF or Doc to structured doc.</p>
          </div>
        </button>

        {/* Webpage Option */}
        <button
          onClick={() => setView('webpage')}
          className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="bg-white dark:bg-slate-900 w-full h-full rounded-[22px] p-8 flex flex-col relative overflow-hidden border border-gray-200 dark:border-slate-800 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-left">Webpage</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-left">Turn any URL into structured doc.</p>
          </div>
        </button>
      </div>
    </div>
  );

  // Render Paste Text View
  const renderPasteText = () => (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white">
            Paste Your <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Text</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Transform your notes or content into a professional document.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 p-2">
          <div className="relative">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full px-6 py-6 bg-transparent text-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none min-h-[300px]"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => setView('dashboard')}
            className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (pastedText.trim()) {
                toast.success('Text received! Starting document generation...');
              } else {
                toast.error('Please paste some text first');
              }
            }}
            disabled={!pastedText.trim()}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            Generate Document
          </button>
        </div>
      </div>
    </div>
  );

  // Render Import File View
  const renderImportFile = () => (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white">
            Import a <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">File</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Upload a PDF, Word document, or text file to generate a structured document.
          </p>
        </div>

        <label className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 p-12 mb-8 border-dashed border-2 flex flex-col items-center justify-center hover:border-orange-500/50 transition-colors cursor-pointer group">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Click to upload or drag and drop</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
            Supported formats: PDF, DOCX, TXT, MD (Max 10MB)
          </p>
        </label>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setView('dashboard')}
            className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Back
          </button>
          <button
            disabled={contextFiles.length === 0}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            Generate Document
          </button>
        </div>
      </div>
    </div>
  );

  // Render Webpage View
  const renderWebpage = () => (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white">
            Transform a <span className="bg-gradient-to-r from-indigo-400 to-cyan-500 bg-clip-text text-transparent">Webpage</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Paste a URL to turn any article or blog post into a document.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 p-8 mb-8">
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
              <Globe className="w-6 h-6 text-indigo-500" />
            </div>
            <input
              type="text"
              value={webpageUrl}
              onChange={(e) => setWebpageUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setView('dashboard')}
            className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (webpageUrl.trim()) {
                toast.success('URL received! Starting document generation...');
              } else {
                toast.error('Please enter a URL first');
              }
            }}
            disabled={!webpageUrl.trim()}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            Generate Document
          </button>
        </div>
      </div>
    </div>
  );

  // Render Select Type View
  const renderSelectType = () => (
    <div className="max-w-4xl mx-auto px-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setView('dashboard')}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">Choose Document Type</h2>
          <p className="text-muted-foreground">Select the type of document you want to create</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blueprints.map((blueprint) => {
          const Icon = documentTypeIcons[blueprint.type];
          return (
            <Card
              key={blueprint.type}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleTypeSelect(blueprint.type)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{blueprint.name}</CardTitle>
                    <CardDescription>{blueprint.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {blueprint.sections.slice(0, 4).map((section) => (
                    <Badge key={section.id} variant="secondary" className="text-xs">
                      {section.title}
                    </Badge>
                  ))}
                  {blueprint.sections.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{blueprint.sections.length - 4} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Render Input Data View
  const renderInputData = () => {
    if (!selectedType) return null;
    const blueprint = getBlueprint(selectedType);

    return (
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView('select-type')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{blueprint.name}</h2>
            <p className="text-muted-foreground">Fill in the details for your document</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {blueprint.requiredInputs.map((input) => (
              <div key={input.id} className="space-y-2">
                <Label htmlFor={input.id}>
                  {input.label}
                  {input.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {input.type === 'textarea' ? (
                  <Textarea
                    id={input.id}
                    placeholder={input.placeholder}
                    value={formData[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : input.type === 'select' ? (
                  <Select
                    value={formData[input.id] || ''}
                    onValueChange={(value) => handleInputChange(input.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={input.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {input.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : input.type === 'number' ? (
                  <Input
                    id={input.id}
                    type="number"
                    placeholder={input.placeholder}
                    value={formData[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value))}
                  />
                ) : (
                  <Input
                    id={input.id}
                    placeholder={input.placeholder}
                    value={formData[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setView('select-type')}>
            Back
          </Button>
          <Button onClick={() => setView('upload-context')}>
            Continue
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // Render Upload Context View
  const renderUploadContext = () => (
    <div className="max-w-4xl mx-auto px-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setView('input-data')}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">Upload Context Files (Optional)</h2>
          <p className="text-muted-foreground">
            Add reference materials like meeting notes, data files, or previous documents
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supports: PDF, CSV, DOCX, TXT, JSON (max 10MB each)
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.csv,.docx,.txt,.json"
              className="hidden"
              id="context-file-upload"
              onChange={handleFileUpload}
            />
            <Label htmlFor="context-file-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Choose Files</span>
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {contextFiles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Uploaded Files ({contextFiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contextFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.type.toUpperCase()} • {(file.content.length / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeContextFile(file.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setView('input-data')}>
          Back
        </Button>
        <Button onClick={generateDocumentOutline} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Outline...
            </>
          ) : (
            <>
              Generate Outline
              <Sparkles className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Render Review Outline View
  const renderReviewOutline = () => {
    if (!outline) return null;

    return (
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('upload-context')}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review & Edit Outline</h2>
              <p className="text-muted-foreground">
                Customize the structure before generating the full document
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newSection = {
                id: `section-${Date.now()}`,
                title: 'New Section',
                description: 'Section description...',
                order: outline.sections.length + 1
              };
              setOutline({
                ...outline,
                sections: [...outline.sections, newSection]
              });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4">
            <Label htmlFor="outline-title" className="text-sm font-medium mb-2 block">Document Title</Label>
            <Input
              id="outline-title"
              value={outline.title}
              onChange={(e) => setOutline({ ...outline, title: e.target.value })}
              className="text-lg font-semibold bg-transparent"
            />
          </div>

          <div className="space-y-3">
            {outline.sections.map((section, index) => (
              <Card key={section.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group">
                <div className="flex">
                  <div className="w-12 bg-gray-50 dark:bg-slate-800/50 flex flex-col items-center py-4 border-r border-gray-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                  </div>
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <Input
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...outline.sections];
                          newSections[index].title = e.target.value;
                          setOutline({ ...outline, sections: newSections });
                        }}
                        className="font-semibold bg-transparent border-none focus-visible:ring-1 px-0 h-auto text-base"
                        placeholder="Section Title"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                        onClick={() => {
                          const newSections = outline.sections.filter((_, i) => i !== index);
                          setOutline({ ...outline, sections: newSections });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={section.description}
                      onChange={(e) => {
                        const newSections = [...outline.sections];
                        newSections[index].description = e.target.value;
                        setOutline({ ...outline, sections: newSections });
                      }}
                      className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none focus-visible:ring-1 px-0 min-h-[60px] resize-none"
                      placeholder="What should this section cover?"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center bg-white dark:bg-slate-950 sticky bottom-0 py-6 border-t border-gray-100 dark:border-slate-800 z-20">
          <Button variant="outline" onClick={() => setView('upload-context')}>
            Back
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                setIsLatexMode(true);
                toast.success('LaTeX mode activated! Full generation will include LaTeX source.');
                approveOutline();
              }}
            >
              <FileCode className="w-4 h-4 mr-2 text-blue-500" />
              Generate in LaTeX
            </Button>
            <Button onClick={approveOutline} disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Approve & Generate Content
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render Generating View
  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-fade-in-up">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {loadingSteps[Math.floor((progress / 100) * loadingSteps.length)] || 'Crafting Your Document'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Our AI is synthesizing your context and structure into a professional document...
        </p>
      </div>
      <div className="w-full max-w-md space-y-3">
        <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm font-medium text-blue-600 dark:text-blue-400">{progress}% complete</p>
      </div>
    </div>
  );

  // Render Preview View
  const renderPreview = () => {
    if (!generatedDocument) return null;

    return (
      <div className="max-w-5xl mx-auto px-6 animate-fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{generatedDocument.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-none capitalize">
                {generatedDocument.documentType.replace(/-/g, ' ')}
              </Badge>
              <span>•</span>
              <span>{generatedDocument.sections.length} sections</span>
              <span>•</span>
              <span>Generated just now</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileDown className="w-4 h-4 mr-2 text-red-500" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportLatex}>
              <FileCode className="w-4 h-4 mr-2 text-blue-500" />
              LaTeX
            </Button>
            <Button size="sm" onClick={resetGenerator} className="bg-gray-900 dark:bg-white dark:text-gray-900">
              <Plus className="w-4 h-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger value="preview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Eye className="w-4 h-4 mr-2" />
              Full Preview
            </TabsTrigger>
            <TabsTrigger value="sections" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <List className="w-4 h-4 mr-2" />
              Section View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0 pb-20">
            <div className="max-w-4xl mx-auto">
              {/* Paper-like container */}
              <div className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] min-h-[1123px] w-full rounded-sm overflow-hidden text-slate-900 flex flex-col">
                {/* Decorative top bar */}
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                
                <div className="p-12 md:p-20 flex-1">
                  {/* Document Header */}
                  <header className="mb-16 border-b border-slate-100 pb-12 text-center">
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-[0.2em] rounded mb-6">
                      {generatedDocument.documentType.replace(/-/g, ' ')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight tracking-tight mb-4">
                      {generatedDocument.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-400 font-medium">
                      <span>DraftDeckAI Premium</span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </header>

                  {/* Document Content */}
                  <div className="prose prose-slate max-w-none">
                    {generatedDocument.sections.map((section, idx) => (
                      <div key={section.id} className="mb-12 last:mb-0">
                        <div className="flex items-baseline gap-4 mb-6">
                          <span className="text-blue-600/30 font-serif italic text-2xl font-light">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <h2 className="text-2xl font-bold text-slate-800 m-0 tracking-tight">
                            {section.title}
                          </h2>
                        </div>
                        
                        <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap font-light pl-10 border-l border-slate-50">
                          {section.content}
                        </div>

                        {section.visualTags && section.visualTags.length > 0 && (
                          <div className="mt-8 ml-10 p-6 bg-slate-50/50 rounded-xl border border-slate-100/50 italic text-sm text-slate-500 flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Suggested Visual Integration</span>
                              {section.visualTags.map(v => `${v.type}: ${v.title}`).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <footer className="mt-20 pt-12 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                    <span>Generated by DraftDeckAI</span>
                    <span>Page 01 of 01</span>
                  </footer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="mt-0">
            <ScrollArea className="h-[700px] pr-4">
              <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                {generatedDocument.sections.map((section, index) => (
                  <Card key={section.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-none font-bold">
                          {index + 1}
                        </Badge>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">{section.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-6">
                        {section.content}
                      </p>
                      {section.visualTags && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-50 dark:border-slate-800">
                          {section.visualTags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-[10px] uppercase tracking-wider py-0.5">
                              {tag.type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-white selection:bg-blue-500/30">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header - Fixed like /presentation */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('dashboard')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">DraftDeckAI</h1>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-semibold">Generating...</span>
                </div>
                <div className="w-32 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-20">
        {view === 'dashboard' && renderDashboard()}
        {view === 'paste-text' && renderPasteText()}
        {view === 'import-file' && renderImportFile()}
        {view === 'webpage' && renderWebpage()}
        {view === 'select-type' && renderSelectType()}
        {view === 'input-data' && renderInputData()}
        {view === 'upload-context' && renderUploadContext()}
        {view === 'review-outline' && renderReviewOutline()}
        {view === 'generating' && renderGenerating()}
        {view === 'preview' && renderPreview()}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
