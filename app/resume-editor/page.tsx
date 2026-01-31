'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, Sparkles, Code, Edit3, Download, Save, Lock, Unlink } from 'lucide-react';
import { ResumeFormEditor } from '@/components/resume-editor/form-editor';
import { ResumeLatexEditor, generateLatexFromData } from '@/components/resume-editor/latex-editor';
import { ResumeAIEditor } from '@/components/resume-editor/ai-editor';
import { ResumePreviewPanel } from '@/components/resume-editor/preview-panel';
import { CompileErrorPopup } from '@/components/resume-editor/compile-error-popup';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Default resume data for new resumes
const defaultResumeData = {
  name: 'JOHN ANDERSON',
  email: 'john.anderson@email.com',
  phone: '(555) 123-4567',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/johnanderson',
  github: 'github.com/johnanderson',
  summary: 'Results-driven Senior Software Engineer with 6+ years of experience building scalable web applications and microservices. Proven track record of leading cross-functional teams and delivering high-impact solutions that improve system performance by 40% and reduce costs by $500K annually. Expert in React, Node.js, and AWS with strong focus on code quality and best practices.',
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'San Francisco, CA',
      date: 'Jan 2021 - Present',
      description: [
        'Led development of microservices architecture serving 2M+ daily active users, improving system reliability from 95% to 99.9%',
        'Reduced API response time by 60% through implementation of Redis caching and database query optimization',
        'Mentored team of 5 junior developers, resulting in 40% faster onboarding and 25% increase in code quality metrics',
        'Implemented CI/CD pipeline using Jenkins and Docker, reducing deployment time from 2 hours to 15 minutes'
      ]
    },
    {
      title: 'Software Engineer',
      company: 'Digital Innovations LLC',
      location: 'San Francisco, CA',
      date: 'Jun 2018 - Dec 2020',
      description: [
        'Developed RESTful APIs using Node.js and Express, handling 500K+ requests per day with 99.5% uptime',
        'Built responsive web applications using React and Redux, improving user engagement by 35%',
        'Reduced bug count by 45% through implementation of comprehensive unit and integration testing with Jest'
      ]
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      date: 'Sep 2014 - May 2018',
      gpa: '3.8/4.0'
    }
  ],
  skills: {
    programming: ['JavaScript', 'TypeScript', 'Python', 'Java', 'SQL'],
    technical: ['React', 'Node.js', 'Express', 'Next.js', 'Redux', 'GraphQL'],
    tools: ['AWS', 'Docker', 'Kubernetes', 'Git', 'Jenkins', 'MongoDB', 'PostgreSQL']
  },
  projects: [
    {
      name: 'E-Commerce Platform',
      description: 'Built full-stack e-commerce platform with payment processing, inventory management, and real-time analytics serving 100K+ users',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS']
    },
    {
      name: 'Real-Time Chat Application',
      description: 'Developed scalable chat application with WebSocket support, message encryption, and file sharing supporting 50K+ concurrent users',
      technologies: ['React', 'Socket.io', 'Redis', 'PostgreSQL']
    }
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2023' },
    { name: 'Professional Scrum Master I', issuer: 'Scrum.org', date: '2022' }
  ]
};

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useUser();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState<'form' | 'latex' | 'ai'>('form');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Sync mode: false = form is source of truth (LaTeX locked), true = manual LaTeX mode (form locked)
  const [isLatexManualMode, setIsLatexManualMode] = useState(false);
  const [showLatexConfirmDialog, setShowLatexConfirmDialog] = useState(false);

  // Resume state
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState(defaultResumeData);

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Export PDF state
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Load resume from database if ID is provided in URL
  useEffect(() => {
    const idParam = searchParams?.get('id');
    if (idParam && user) {
      loadResumeById(idParam);
    }
  }, [searchParams, user]);

  // Load resume by ID from database
  const loadResumeById = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('type', 'resume')
        .single();

      if (error) {
        console.error('Error loading resume:', error);
        toast.error('Failed to load resume');
        return;
      }

      if (data) {
        const document = data as any;
        setResumeId(document.id);

        // Extract resume data from document content
        // Handle both direct content and nested resumeData structure
        const content = document.content || {};
        const loadedResumeData = content.resumeData || content;

        if (content.template) {
          setSelectedTemplate(content.template);
        }

        // Transform loaded data to resumeData format
        const personalInfo = loadedResumeData.personal_info || loadedResumeData.personalInfo || {};
        setResumeData({
          name: personalInfo.name || personalInfo.fullName || '',
          email: personalInfo.email || '',
          phone: personalInfo.phone || '',
          location: personalInfo.location || '',
          linkedin: personalInfo.linkedin || '',
          github: personalInfo.github || '',
          summary: personalInfo.summary || '',
          experience: loadedResumeData.experience || [],
          education: loadedResumeData.education || [],
          skills: loadedResumeData.skills || {},
          projects: loadedResumeData.projects || [],
          certifications: loadedResumeData.certifications || []
        });
        toast.success('Resume loaded successfully');
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      toast.error('Failed to load resume');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize template from URL parameter
  useEffect(() => {
    const templateParam = searchParams?.get('template');
    if (templateParam && !searchParams?.get('id')) {
      setSelectedTemplate(templateParam);
    }
  }, [searchParams]);

  // Save resume to database
  const handleSave = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to save');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare content object for documents table
      const content = {
        resumeData: {
          personal_info: {
            name: resumeData.name,
            email: resumeData.email,
            phone: resumeData.phone,
            location: resumeData.location,
            linkedin: resumeData.linkedin,
            github: resumeData.github,
            summary: resumeData.summary
          },
          experience: resumeData.experience,
          education: resumeData.education,
          skills: resumeData.skills,
          projects: resumeData.projects,
          certifications: resumeData.certifications
        },
        template: selectedTemplate,
        lastModified: new Date().toISOString()
      };

      const documentData = {
        user_id: user.id,
        title: resumeData.name ? `${resumeData.name}'s Resume` : 'Untitled Resume',
        type: 'resume',
        content,
        updated_at: new Date().toISOString()
      };

      let result;
      if (resumeId) {
        // Update existing document
        result = await (supabase.from('documents') as any)
          .update(documentData)
          .eq('id', resumeId)
          .select()
          .single();
      } else {
        // Insert new document
        result = await (supabase.from('documents') as any)
          .insert(documentData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving resume:', result.error);
        toast.error('Failed to save resume');
        return;
      }

      if (result.data) {
        const savedDoc = result.data as any;
        setResumeId(savedDoc.id);
        toast.success(resumeId ? 'Resume updated successfully' : 'Resume saved successfully');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  }, [user, resumeData, resumeId, supabase, selectedTemplate]);

  // Export PDF
  const handleExportPdf = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      // Generate LaTeX from current resume data
      const latexCode = generateLatexFromData(resumeData, selectedTemplate);

      const response = await fetch('/api/latex/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latexCode }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/pdf')) {
          // PDF returned directly - trigger download
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          // Create download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `${resumeData.name?.replace(/\s+/g, '_') || 'resume'}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success('PDF downloaded successfully!');
        } else {
          // JSON response (likely an error)
          const result = await response.json();
          if (result.success === false) {
            throw new Error(result.message || 'Compilation failed');
          }
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compilation failed');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      setExportError(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [resumeData]);

  // Show loading state while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-600">{isLoading ? 'Loading resume...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="p-8 text-center max-w-md">
          <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold mb-3">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to create your resume</p>
          <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Error Popup */}
      <CompileErrorPopup error={exportError} onClose={() => setExportError(null)} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 border-b shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Resume Editor</h1>
            <p className="text-sm text-blue-100">Create professional resumes in minutes</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-100 text-gray-900 border-0"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white shadow-lg"
            onClick={handleExportPdf}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT - Editor Panel */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          <Tabs value={editMode} onValueChange={(v) => setEditMode(v as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start rounded-none border-b px-6">
              <TabsTrigger value="form" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Form Editor
                {isLatexManualMode && <Unlink className="w-3 h-3 text-orange-500" />}
              </TabsTrigger>
              <TabsTrigger value="latex" className="gap-2">
                <Code className="w-4 h-4" />
                LaTeX Code
                {!isLatexManualMode && <Lock className="w-3 h-3 text-gray-400" />}
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="form"
              forceMount={true}
              className={`flex flex-col overflow-hidden min-h-0 p-0 mt-0 relative ${editMode === 'form' ? 'flex-1' : 'h-0 flex-none'}`}
            >
              {/* Unsynced Overlay for Form Editor when in manual LaTeX mode */}
              {isLatexManualMode && (
                <div className="absolute inset-0 bg-orange-900/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                  <div className="p-4 rounded-full bg-orange-500/30">
                    <Unlink className="w-12 h-12 text-grey" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Unsynced</h3>
                  <p className="text-center text-orange-100 max-w-xs">
                    Manual LaTeX editing mode is active.<br />
                    Changes in LaTeX code won't sync to here.
                  </p>
                  <Button
                    className="mt-4 bg-white text-orange-700 hover:bg-orange-50"
                    onClick={() => {
                      setIsLatexManualMode(false);
                      toast.success('Switched back to synced mode');
                    }}
                  >
                    Switch Back to Synced Mode
                  </Button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-6">
                <ResumeFormEditor data={resumeData} onChange={setResumeData} />
              </div>
            </TabsContent>

            <TabsContent
              value="latex"
              forceMount={true}
              className={`flex flex-col overflow-hidden min-h-0 p-0 mt-0 ${editMode === 'latex' ? 'flex-1' : 'h-0 flex-none'}`}
            >
              <div className="flex-1 overflow-y-auto p-6 relative">
                {/* Locked Overlay for LaTeX Editor when in synced mode */}
                {!isLatexManualMode && (
                  <div
                    className="absolute inset-0 bg-slate-800/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-800/75 transition-colors"
                    onClick={() => setShowLatexConfirmDialog(true)}
                  >
                    <div className="p-4 rounded-full bg-white/20">
                      <Lock className="w-12 h-12 text-grey" />
                    </div>
                    <h3 className="text-2xl font-bold text-grey">Locked</h3>
                    <p className="text-center text-slate-200 max-w-xs">
                      Form Editor is the source of truth.<br />
                      LaTeX is auto-generated from form data.
                    </p>
                    <Button
                      className="mt-4 bg-white text-slate-700 hover:bg-slate-100 shadow-xl"
                    >
                      Click to Enable Manual Editing
                    </Button>
                  </div>
                )}
                <ResumeLatexEditor
                  data={resumeData}
                  templateId={selectedTemplate}
                  onChange={setResumeData}
                  isLocked={!isLatexManualMode}
                  onPdfGenerated={(url) => {
                    setPdfUrl(url);
                    setIsCompiling(false);
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="ai"
              forceMount={true}
              className={`flex flex-col overflow-hidden min-h-0 p-0 mt-0 ${editMode === 'ai' ? 'flex-1' : 'h-0 flex-none'}`}
            >
              <div className="flex-1 overflow-y-auto p-6">
                <ResumeAIEditor data={resumeData} onChange={setResumeData} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT - Live Preview */}
        <div className="w-1/2 bg-gradient-to-br from-gray-100 to-gray-200 overflow-auto">
          <ResumePreviewPanel
            data={resumeData}
            template={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
            pdfUrl={pdfUrl}
            isPdfMode={isLatexManualMode}
            isCompiling={isCompiling}
          />
        </div>
      </div>

      {/* Confirmation Dialog for switching to manual LaTeX mode */}
      <AlertDialog open={showLatexConfirmDialog} onOpenChange={setShowLatexConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Switch to Manual LaTeX Mode?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will <strong>unsync</strong> the Form Editor and real-time HTML preview from your LaTeX changes.
              </p>
              <p className="text-orange-600">
                • The Form Editor will be locked<br />
                • You will be shown compiled PDF instead of live preview<br />
                • You'll have full control over the LaTeX code
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                setIsLatexManualMode(true);
                setShowLatexConfirmDialog(false);
                toast.success('Manual LaTeX mode enabled');
              }}
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
