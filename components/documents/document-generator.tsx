/**
 * DraftDeckAI Productivity Engine - Document Generator Component
 * Main component for generating structured documents
 */

'use client';

import React, { useState, useCallback } from 'react';
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
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';

const documentTypeIcons = {
  'business-proposal': Briefcase,
  'project-report': ClipboardList,
  'academic-research': GraduationCap,
  'requirements-spec': FileCode,
};

type GenerationStep = 'select-type' | 'input-data' | 'upload-context' | 'review-outline' | 'generating' | 'preview';

export function DocumentGenerator() {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('select-type');
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [outline, setOutline] = useState<DocumentOutline | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const blueprints = getAllBlueprints();

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    setFormData({});
    setCurrentStep('input-data');
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

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
      setCurrentStep('review-outline');
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
    setCurrentStep('generating');

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
      setGeneratedDocument(document);
      setProgress(100);
      setCurrentStep('preview');
      toast.success('Document generated successfully!');
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

  const resetGenerator = () => {
    setCurrentStep('select-type');
    setSelectedType(null);
    setFormData({});
    setContextFiles([]);
    setOutline(null);
    setGeneratedDocument(null);
    setProgress(0);
  };

  // Render different steps
  const renderSelectType = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Document Type</h2>
        <p className="text-muted-foreground">Select the type of document you want to create</p>
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

  const renderInputData = () => {
    if (!selectedType) return null;
    const blueprint = getBlueprint(selectedType);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{blueprint.name}</h2>
            <p className="text-muted-foreground">Fill in the details for your document</p>
          </div>
          <Button variant="outline" onClick={() => setCurrentStep('select-type')}>
            Change Type
          </Button>
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

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('select-type')}>
            Back
          </Button>
          <Button onClick={() => setCurrentStep('upload-context')}>
            Continue
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderUploadContext = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Upload Context Files (Optional)</h2>
        <p className="text-muted-foreground">
          Add reference materials like meeting notes, data files, or previous documents
        </p>
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
        <Card>
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('input-data')}>
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

  const renderReviewOutline = () => {
    if (!outline) return null;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Review Document Outline</h2>
          <p className="text-muted-foreground">
            Preview the structure before generating the full document
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{outline.title}</CardTitle>
            <CardDescription>
              {outline.sections.length} sections • Estimated reading time:{' '}
              {outline.sections.length * 2} minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outline.sections.map((section, index) => (
                <div key={section.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{section.title}</h4>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('upload-context')}>
            Back
          </Button>
          <Button onClick={approveOutline} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Approve & Generate
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Sparkles className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Generating Your Document</h3>
        <p className="text-muted-foreground">This may take a minute...</p>
      </div>
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-center text-sm text-muted-foreground">{progress}% complete</p>
      </div>
    </div>
  );

  const renderPreview = () => {
    if (!generatedDocument) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{generatedDocument.title}</h2>
            <p className="text-muted-foreground">
              {generatedDocument.sections.length} sections • Generated{' '}
              {generatedDocument.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('docx')}>
              <Download className="w-4 h-4 mr-2" />
              Word
            </Button>
            <Button onClick={resetGenerator}>
              <Sparkles className="w-4 h-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="sections">
              <FileText className="w-4 h-4 mr-2" />
              Sections ({generatedDocument.sections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="prose prose-slate dark:prose-invert max-w-none bg-transparent">
                  {generatedDocument.sections.map((section) => (
                    <div key={section.id} className="mb-8">
                      <h3 className="text-xl font-semibold mb-4 text-foreground">{section.title}</h3>
                      <div className="whitespace-pre-wrap text-foreground/80 bg-transparent">
                        {section.content}
                      </div>
                      {section.visualTags && section.visualTags.length > 0 && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/30">
                          <p className="text-sm font-medium mb-2 text-foreground">Visuals:</p>
                          <div className="flex flex-wrap gap-2">
                            {section.visualTags.map((visual) => (
                              <Badge key={visual.id} variant="secondary" className="bg-secondary/50">
                                {visual.title} ({visual.type})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="mt-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {generatedDocument.sections.map((section, index) => (
                  <Card key={section.id} className="bg-card/80 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-background/50">{index + 1}</Badge>
                        <CardTitle className="text-lg text-foreground">{section.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/70 line-clamp-3">
                        {section.content.substring(0, 200)}...
                      </p>
                      {section.visualTags && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {section.visualTags.map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs bg-secondary/50">
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

  // Helper function to build document input
  function buildDocumentInput(type: DocumentType, data: Record<string, any>): DocumentInput {
    return data as DocumentInput;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements - Matching Landing Page Style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20"></div>
        <div className="absolute inset-0 mesh-gradient-alt opacity-20"></div>
        <div className="floating-orb w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bolt-gradient opacity-20 top-1/4 -left-20 sm:-left-32 animate-float" />
        <div className="floating-orb w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 sunset-gradient opacity-15 top-3/4 -right-20 sm:-right-28 animate-float-delayed" />
        <div className="floating-orb w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 ocean-gradient opacity-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto p-6">
        {currentStep === 'select-type' && renderSelectType()}
        {currentStep === 'input-data' && renderInputData()}
        {currentStep === 'upload-context' && renderUploadContext()}
        {currentStep === 'review-outline' && renderReviewOutline()}
        {currentStep === 'generating' && renderGenerating()}
        {currentStep === 'preview' && renderPreview()}
      </div>
    </div>
  );
}
