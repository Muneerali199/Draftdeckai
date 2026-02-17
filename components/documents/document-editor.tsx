'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Loader2,
  FileDown,
  Download,
  Edit3,
  Wand2,
  Clock,
  CheckCircle,
  AlertCircle,
  List,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  History,
  FileCode,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { DocumentVersionHistory } from './document-version-history';
import Editor from '@monaco-editor/react';
import { generateDocumentLatex } from '@/lib/documents/latex-generator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  visualTags?: any[];
}

interface DocData {
  id: string;
  title: string;
  type: string;
  document_type?: string;
  content: any;
  metadata?: {
    sections?: DocumentSection[];
    outline?: any;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

interface DocumentEditorProps {
  documentId: string;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const router = useRouter();
  const { user } = useUser();
  const [docData, setDocData] = useState<DocData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isExportingLatex, setIsExportingLatex] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [improveInstruction, setImproveInstruction] = useState('');
  const [showImproveDialog, setShowImproveDialog] = useState(false);
  const [editedSections, setEditedSections] = useState<Record<string, string>>({});
  const [editedTitle, setEditedTitle] = useState('');
  const [outlineSections, setOutlineSections] = useState<DocumentSection[]>([]);
  const [activeTab, setActiveTab] = useState('edit');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [latexCode, setLatexCode] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  // Initialize outline sections when docData loads
  useEffect(() => {
    if (docData?.metadata?.sections) {
      setOutlineSections([...docData.metadata.sections]);
    }
  }, [docData]);

  // Update LaTeX code when sections or title change
  useEffect(() => {
    if (docData && outlineSections.length > 0) {
      const finalSections = outlineSections.map(section => ({
        ...section,
        content: editedSections[section.id] || section.content
      }));
      
      const latex = generateDocumentLatex({
        title: editedTitle,
        documentType: docData.document_type || 'document',
        sections: finalSections,
        author: user?.user_metadata?.full_name || user?.email || 'DraftDeckAI User',
        date: new Date().toLocaleDateString(),
      });
      setLatexCode(latex);
    }
  }, [outlineSections, editedSections, editedTitle, docData, user]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/documents/${documentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Document not found');
          router.push('/documents');
          return;
        }
        throw new Error('Failed to fetch document');
      }
      
      const data = await response.json();
      setDocData(data);
      setEditedTitle(data.title);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!docData) return;
    
    try {
      setIsSaving(true);
      
      // Merge edited sections with outline sections
      const finalSections = outlineSections.map(section => ({
        ...section,
        content: editedSections[section.id] || section.content
      }));
      
      const updatedMetadata = { 
        ...docData.metadata,
        sections: finalSections
      };
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          content: docData.content,
          metadata: updatedMetadata
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save document');
      }
      
      const updatedDoc = await response.json();
      setDocData(updatedDoc);
      setEditedSections({}); // Clear edits after save
      toast.success('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImproveWithAI = async () => {
    if (!docData || !improveInstruction.trim()) return;
    
    try {
      setIsImproving(true);
      
      const sectionId = activeSection;
      const section = outlineSections.find(s => s.id === sectionId);
      const content = sectionId 
        ? editedSections[sectionId] || section?.content
        : JSON.stringify(outlineSections.map(s => ({
            title: s.title,
            content: editedSections[s.id] || s.content
          })));
      
      const response = await fetch(`/api/documents/${documentId}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: improveInstruction,
          sectionId,
          content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to improve document');
      }
      
      const result = await response.json();
      
      if (sectionId) {
        // Update the specific section
        setEditedSections(prev => ({
          ...prev,
          [sectionId]: result.improvedContent
        }));
      } else {
        // Update entire document - parse improved content
        try {
          const improvedSections = JSON.parse(result.improvedContent);
          if (Array.isArray(improvedSections)) {
            setOutlineSections(prev => prev.map((section, idx) => ({
              ...section,
              content: improvedSections[idx]?.content || section.content
            })));
          }
        } catch (e) {
          // If not valid JSON, update first section or show error
          toast.error('Could not parse AI response');
        }
      }
      
      toast.success('Document improved with AI');
      setShowImproveDialog(false);
      setImproveInstruction('');
    } catch (error) {
      console.error('Error improving document:', error);
      toast.error('Failed to improve document');
    } finally {
      setIsImproving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!docData) return;
    
    try {
      toast.info(`Exporting as ${format.toUpperCase()}...`);
      
      // Prepare content for export
      const content = {
        title: editedTitle,
        sections: outlineSections.map(section => ({
          ...section,
          content: editedSections[section.id] || section.content
        }))
      };
      
      const response = await fetch('/api/documents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          format,
          content
        })
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editedTitle}.${format === 'pdf' ? 'html' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const handleExportLatex = async () => {
    if (!docData) return;
    
    try {
      setIsExportingLatex(true);
      toast.info('Generating LaTeX code...');
      
      const sections = outlineSections.map(section => ({
        ...section,
        content: editedSections[section.id] || section.content
      }));
      
      const response = await fetch('/api/documents/latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          title: editedTitle,
          documentType: docData.document_type,
          sections
        })
      });
      
      if (!response.ok) {
        throw new Error('LaTeX export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editedTitle.replace(/[^a-zA-Z0-9]/g, '_')}.tex`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('LaTeX code downloaded! You can compile it with any LaTeX editor for a professional PDF.');
    } catch (error) {
      console.error('LaTeX export error:', error);
      toast.error('LaTeX export failed');
    } finally {
      setIsExportingLatex(false);
    }
  };

  const handleRestoreVersion = (sections: any[], title: string) => {
    setOutlineSections(sections);
    setEditedTitle(title);
    setEditedSections({});
    toast.success('Version restored! Click Save to apply changes.');
  };

  const handleSectionEdit = (sectionId: string, newContent: string) => {
    setEditedSections(prev => ({
      ...prev,
      [sectionId]: newContent
    }));
  };

  // Outline editing functions
  const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
    setOutlineSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, title: newTitle } : section
    ));
  };

  const handleAddSection = (afterSectionId?: string) => {
    const newSection: DocumentSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      content: '',
      order: outlineSections.length + 1,
      visualTags: []
    };

    if (afterSectionId) {
      const index = outlineSections.findIndex(s => s.id === afterSectionId);
      const newSections = [...outlineSections];
      newSections.splice(index + 1, 0, newSection);
      // Recalculate orders
      setOutlineSections(newSections.map((s, i) => ({ ...s, order: i + 1 })));
    } else {
      setOutlineSections(prev => [...prev, { ...newSection, order: prev.length + 1 }]);
    }
    
    toast.success('New section added');
  };

  const handleRemoveSection = (sectionId: string) => {
    if (outlineSections.length <= 1) {
      toast.error('Document must have at least one section');
      return;
    }
    
    if (!confirm('Are you sure you want to remove this section?')) return;
    
    setOutlineSections(prev => {
      const filtered = prev.filter(s => s.id !== sectionId);
      // Recalculate orders
      return filtered.map((s, i) => ({ ...s, order: i + 1 }));
    });
    
    // Also remove from edited sections if present
    setEditedSections(prev => {
      const { [sectionId]: _, ...rest } = prev;
      return rest;
    });
    
    toast.success('Section removed');
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = outlineSections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === outlineSections.length - 1) return;
    
    const newSections = [...outlineSections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap sections
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    
    // Recalculate orders
    setOutlineSections(newSections.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const hasChanges = Object.keys(editedSections).length > 0 || 
                     editedTitle !== docData?.title ||
                     JSON.stringify(outlineSections) !== JSON.stringify(docData?.metadata?.sections);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-muted-foreground">Loading document...</span>
      </div>
    );
  }

  if (!docData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
          <p className="text-muted-foreground mb-4">The document you're looking for doesn't exist.</p>
          <Link href="/documents">
            <Button>Back to Documents</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20"></div>
        <div className="absolute inset-0 mesh-gradient-alt opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-border z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/documents">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-lg font-semibold border-none bg-transparent focus-visible:ring-0 px-0 w-auto min-w-[300px]"
                    placeholder="Document Title"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last edited {docData ? new Date(docData.updated_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="secondary" className="mr-2">
                    Unsaved changes
                  </Badge>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className={showVersionHistory ? 'bg-muted' : ''}
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('docx')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as Word
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportLatex} disabled={isExportingLatex}>
                      <FileCode className="w-4 h-4 mr-2" />
                      {isExportingLatex ? 'Generating...' : 'Export as LaTeX'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-24 pb-8 max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            {/* Main Editor Area */}
            <div className={`flex-1 ${showVersionHistory ? 'max-w-4xl' : 'w-full'}`}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="outline">
                    <List className="w-4 h-4 mr-2" />
                    Outline
                  </TabsTrigger>
                  <TabsTrigger value="edit">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Content
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="latex">
                    <FileCode className="w-4 h-4 mr-2" />
                    LaTeX Source
                  </TabsTrigger>
                </TabsList>

                {/* Outline Tab */}
            <TabsContent value="outline" className="space-y-4">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <List className="w-5 h-5 text-blue-500" />
                      Document Outline
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => handleAddSection()}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outlineSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/30 hover:border-blue-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <Badge variant="outline" className="min-w-[2.5rem] justify-center">
                            {index + 1}
                          </Badge>
                        </div>
                        
                        <Input
                          value={section.title}
                          onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                          className="flex-1 bg-transparent border-none focus-visible:ring-1"
                          placeholder="Section title"
                        />
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveSection(section.id, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveSection(section.id, 'down')}
                            disabled={index === outlineSections.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddSection(section.id)}
                            className="h-8 w-8 p-0"
                            title="Add section after"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSection(section.id)}
                            disabled={outlineSections.length <= 1}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="text-sm text-muted-foreground">
                      {outlineSections.length} sections total
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="space-y-4">
              {outlineSections.map((section, index) => (
                <Card key={section.id} className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveSection(section.id);
                            setShowImproveDialog(true);
                          }}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Improve
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={editedSections[section.id] || section.content}
                      onChange={(e) => handleSectionEdit(section.id, e.target.value)}
                      className="min-h-[200px] resize-y"
                      placeholder="Section content..."
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="pb-20">
              <div className="max-w-4xl mx-auto">
                {/* Paper-like container */}
                <div className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] min-h-[1123px] w-full rounded-sm overflow-hidden text-slate-900 flex flex-col">
                  {/* Decorative top bar */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                  
                  <div className="p-12 md:p-20 flex-1">
                    {/* Document Header */}
                    <header className="mb-16 border-b border-slate-100 pb-12 text-center">
                      <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-[0.2em] rounded mb-6">
                        {docData.document_type?.replace(/-/g, ' ') || 'Generated Document'}
                      </div>
                      <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight tracking-tight mb-4 m-0 border-none bg-transparent h-auto">
                        {editedTitle}
                      </h1>
                      <div className="flex items-center justify-center gap-4 text-sm text-slate-400 font-medium mt-6">
                        <span>DraftDeckAI Premium</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </header>

                    {/* Document Content */}
                    <div className="prose prose-slate max-w-none">
                      {outlineSections.map((section, idx) => (
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
                            {editedSections[section.id] || section.content}
                          </div>

                          {section.visualTags && section.visualTags.length > 0 && (
                            <div className="mt-8 ml-10 p-6 bg-slate-50/50 rounded-xl border border-slate-100/50 italic text-sm text-slate-500 flex items-start gap-3">
                              <Sparkles className="w-4 h-4 text-blue-400 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Suggested Visual Integration</span>
                                {section.visualTags.map((v: any) => `${v.type}: ${v.title}`).join(', ')}
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

            <TabsContent value="latex" className="h-[700px] pb-20">
              <Card className="h-full bg-white dark:bg-slate-900 border border-border overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <CardTitle className="text-sm">LaTeX Source Code</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                      navigator.clipboard.writeText(latexCode);
                      toast.success('LaTeX code copied!');
                    }}>
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportLatex}>
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <div className="flex-1 h-full min-h-[600px]">
                  <Editor
                    height="100%"
                    defaultLanguage="latex"
                    value={latexCode}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      readOnly: true,
                    }}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Version History Sidebar */}
        {showVersionHistory && (
          <div className="w-80 flex-shrink-0">
            <DocumentVersionHistory
              documentId={documentId}
              currentContent={{ title: editedTitle, sections: outlineSections }}
              currentSections={outlineSections}
              onRestoreVersion={handleRestoreVersion}
            />
          </div>
        )}
      </div>

      {/* AI Improvement Dialog */}
      {showImproveDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Improve with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {activeSection 
                  ? `Improving section: "${outlineSections.find(s => s.id === activeSection)?.title}"`
                  : 'Describe how you want to improve the entire document'
                }
              </p>
              <Textarea
                value={improveInstruction}
                onChange={(e) => setImproveInstruction(e.target.value)}
                placeholder="e.g., Make it more professional, add more details about..., simplify the language..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImproveDialog(false);
                    setActiveSection(null);
                    setImproveInstruction('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImproveWithAI}
                  disabled={isImproving || !improveInstruction.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Improve
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  </div>
</div>
);
}
