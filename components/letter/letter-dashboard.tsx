"use client";

import { useState, useRef } from "react";
import { sanitizeFilename } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LetterPreview } from "@/components/letter/letter-preview";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  Mail as MailIcon,
  Download,
  User,
  MapPin,
  FileText,
  Wand2,
  Copy,
  Check,
  Send,
  ArrowLeft,
  Briefcase,
  Link,
  CheckCircle2,
  PenTool,
  Heart,
  FileCheck,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  Clock,
  Users
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

type StepType = 'dashboard' | 'create' | 'job-url' | 'templates' | 'preview';

const LETTER_TYPES = [
  { id: 'cover', name: 'Cover Letter', icon: Briefcase, description: 'For job applications', color: 'from-blue-500 to-cyan-500' },
  { id: 'business', name: 'Business Letter', icon: FileText, description: 'Formal business correspondence', color: 'from-purple-500 to-pink-500' },
  { id: 'thank', name: 'Thank You Letter', icon: Heart, description: 'Express gratitude', color: 'from-pink-500 to-rose-500' },
  { id: 'recommendation', name: 'Recommendation', icon: ThumbsUp, description: 'Recommend someone', color: 'from-green-500 to-emerald-500' },
  { id: 'complaint', name: 'Complaint Letter', icon: AlertCircle, description: 'Professional complaints', color: 'from-orange-500 to-amber-500' },
  { id: 'resignation', name: 'Resignation Letter', icon: Clock, description: 'Leave professionally', color: 'from-red-500 to-orange-500' },
  { id: 'invitation', name: 'Invitation Letter', icon: Users, description: 'Invite formally', color: 'from-indigo-500 to-violet-500' },
  { id: 'apology', name: 'Apology Letter', icon: MessageSquare, description: 'Sincere apologies', color: 'from-teal-500 to-cyan-500' },
];

export function LetterDashboard() {
  const [currentStep, setCurrentStep] = useState<StepType>('dashboard');
  const [prompt, setPrompt] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [toName, setToName] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [letterType, setLetterType] = useState("cover");
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterData, setLetterData] = useState<any>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");

  // Job URL specific state
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");

  const { toast } = useToast();
  const supabase = createClient();

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const generateLetter = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe the letter you want to generate",
        variant: "destructive",
      });
      return;
    }

    if (!fromName || !toName) {
      toast({
        title: "Missing information",
        description: "Please enter your name and recipient name",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Validate session before making API call
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to generate letters.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/generate/letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          fromName,
          fromAddress,
          toName,
          toAddress,
          letterType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate letter');
      }

      const data = await response.json();
      setLetterData(data);
      setCurrentStep('preview');

      toast({
        title: "Letter generated! ✨",
        description: "Your professional letter is ready",
      });
    } catch (error: any) {
      console.error("Error generating letter:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCoverLetterFromJob = async () => {
    if (!jobDescription.trim() || !fromName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide job description and your name",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Validate session before making API call
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to generate letters.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/generate/letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobDescription,
          jobUrl,
          fromName,
          fromEmail,
          fromAddress,
          skills: skills ? skills.split(',').map(s => s.trim()) : [],
          experience,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setLetterData(data);
      setCurrentStep('preview');

      toast({
        title: "Cover letter generated! ✨",
        description: "Tailored to match the job requirements",
      });
    } catch (error: any) {
      console.error("Error generating cover letter:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!letterData) return;

    setIsCopying(true);

    try {
      const letterText = `
${letterData.from?.name || ''}
${letterData.from?.address || ''}

${letterData.date || ''}

${letterData.to?.name || ''}
${letterData.to?.address || ''}

Subject: ${letterData.subject || ''}

${letterData.content || ''}
      `.trim();

      await navigator.clipboard.writeText(letterText);

      toast({
        title: "Copied to clipboard!",
        description: "Letter content has been copied",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy letter to clipboard",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const exportToPDF = async () => {
    if (!letterData) return;

    setIsExporting(true);

    try {
      // Import dynamically to avoid SSR issues if any
      const { pdf } = await import('@react-pdf/renderer');
      const { LetterPdf } = await import('@/components/letter/pdf-template');

      const blob = await pdf(<LetterPdf letter={letterData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedSubject = sanitizeFilename(letterData.subject, `${letterType}-letter-${Date.now()}`);

      link.download = `${sanitizedSubject}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 600);

      toast({
        title: "Letter exported!",
        description: "Your letter has been downloaded as a PDF",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Export failed",
        description: "Failed to export letter to PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const sendEmail = async () => {
    if (!letterData || !emailTo || !isValidEmail(emailTo)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid recipient email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          content: emailContent,
          fromName,
          fromEmail,
          letterContent: letterData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      toast({
        title: "Email sent successfully! ✨",
        description: "Your letter has been emailed to the recipient",
      });

      setShowEmailDialog(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Dashboard View
  if (currentStep === 'dashboard') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4 shimmer">
            <MailIcon className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">AI Letter Studio</span>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            <span className="bolt-gradient-text">Create Professional Letters</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose how you want to create your letter - from scratch, tailored to a job, or from templates
          </p>
        </div>

        {/* Main Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Create Letter */}
          <button
            onClick={() => setCurrentStep('create')}
            className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10 transition-all min-h-[200px]">
              <div className="w-12 h-12 bolt-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Create Letter</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Write any type of professional letter with AI assistance.</p>
            </div>
          </button>

          {/* Cover Letter from Job */}
          <button
            onClick={() => setCurrentStep('job-url')}
            className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all min-h-[200px]">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Cover Letter</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Generate a tailored cover letter from job description.</p>
            </div>
          </button>

          {/* Browse Templates */}
          <button
            onClick={() => setCurrentStep('templates')}
            className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/10 transition-all min-h-[200px]">
              <div className="w-12 h-12 cosmic-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Letter Types</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Browse 8+ professional letter templates and types.</p>
            </div>
          </button>

          {/* Quick Thank You */}
          <button
            onClick={() => {
              setLetterType('thank');
              setCurrentStep('create');
            }}
            className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-pink-500/50 shadow-lg hover:shadow-pink-500/10 transition-all min-h-[200px]">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Thank You Letter</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Express gratitude professionally after interviews or meetings.</p>
            </div>
          </button>
        </div>

        {/* Info Box */}
        <div className="max-w-4xl mx-auto">
          <div className="p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bolt-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Pro Tips for Professional Letters</h4>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Cover Letters:</strong> Tailor to each job application</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Business Letters:</strong> Keep professional and concise</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Thank You:</strong> Send within 24 hours of meeting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>All Letters:</strong> Proofread before sending!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Letter Types / Templates View
  if (currentStep === 'templates') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep('dashboard')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold bolt-gradient-text">Choose Letter Type</h2>
            <p className="text-sm text-muted-foreground">Select the type of letter you want to create</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LETTER_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setLetterType(type.id);
                  setCurrentStep('create');
                }}
                className="group relative p-6 rounded-2xl border border-border hover:border-blue-500/50 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-left"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Job URL / Cover Letter View
  if (currentStep === 'job-url') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep('dashboard')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold bolt-gradient-text">Tailored Cover Letter</h2>
            <p className="text-sm text-muted-foreground">Generate a cover letter matched to a specific job</p>
          </div>
        </div>

        <Card className="glass-effect border-2 border-emerald-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              Job Description
            </CardTitle>
            <CardDescription>
              Paste the job description to create a tailored cover letter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobUrl" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Job URL (Optional)
                </Label>
                <Input
                  id="jobUrl"
                  placeholder="https://linkedin.com/jobs/view/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Job Description *
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[150px] border-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromNameJob" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Name *
                  </Label>
                  <Input
                    id="fromNameJob"
                    placeholder="John Doe"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmailJob" className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    Your Email
                  </Label>
                  <Input
                    id="fromEmailJob"
                    type="email"
                    placeholder="john@example.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Your Key Skills (comma-separated)
                </Label>
                <Input
                  id="skills"
                  placeholder="React, Node.js, Python, Leadership, Communication"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Brief Experience Summary
                </Label>
                <Textarea
                  id="experience"
                  placeholder="5+ years of software development experience, led teams of 10+, increased revenue by 30%..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="min-h-[80px] border-emerald-200 focus:border-emerald-500"
                />
              </div>
            </div>

            <Button
              onClick={generateCoverLetterFromJob}
              disabled={isGenerating || !jobDescription.trim() || !fromName.trim()}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Tailored Cover Letter...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create Letter View
  if (currentStep === 'create') {
    const selectedType = LETTER_TYPES.find(t => t.id === letterType) || LETTER_TYPES[0];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep('dashboard')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold bolt-gradient-text">Create {selectedType.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedType.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="glass-effect border-2 border-yellow-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-yellow-500" />
                Letter Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Letter Type</Label>
                <Select value={letterType} onValueChange={setLetterType}>
                  <SelectTrigger className="glass-effect border-yellow-400/30">
                    <SelectValue placeholder="Select letter type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LETTER_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    From (Name) *
                  </Label>
                  <Input
                    id="fromName"
                    placeholder="Your Name"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    To (Name) *
                  </Label>
                  <Input
                    id="toName"
                    placeholder="Recipient Name"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    From (Address)
                  </Label>
                  <Input
                    id="fromAddress"
                    placeholder="Your Address (Optional)"
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    To (Address)
                  </Label>
                  <Input
                    id="toAddress"
                    placeholder="Recipient Address (Optional)"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Describe your letter *
                </Label>
                <Textarea
                  id="prompt"
                  placeholder={`E.g., A ${selectedType.name.toLowerCase()} for...`}
                  className="min-h-[120px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <Button
                onClick={generateLetter}
                disabled={isGenerating || !prompt.trim() || !fromName.trim() || !toName.trim()}
                className="w-full h-12 bolt-gradient text-white font-semibold hover:scale-105 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Letter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Placeholder */}
          <Card className="glass-effect border border-yellow-400/20 flex items-center justify-center min-h-[500px]">
            <CardContent className="py-10 text-center">
              <MailIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {isGenerating
                  ? "Creating your letter with AI magic..."
                  : "Your letter preview will appear here"}
              </p>
              {isGenerating && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Preview View
  if (currentStep === 'preview' && letterData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('dashboard')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold bolt-gradient-text">Your Letter</h2>
              <p className="text-sm text-muted-foreground">Review and download your professional letter</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={isCopying}
              className="glass-effect"
            >
              {isCopying ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={exportToPDF}
              disabled={isExporting}
              className="glass-effect"
            >
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
            <Button
              onClick={() => {
                setEmailTo('');
                setEmailSubject(letterData.subject || '');
                setEmailContent('');
                setShowEmailDialog(true);
              }}
              className="bolt-gradient text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Letter Preview */}
          <div className="lg:col-span-2">
            <Card className="glass-effect border border-yellow-400/20 overflow-hidden">
              <div id="letter-preview" className="bg-white">
                <LetterPreview letter={letterData} />
              </div>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            <Card className="glass-effect border border-yellow-400/20 p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Letter Generated!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your professional letter is ready. You can download it as PDF, copy the text, or send it via email.
              </p>

              <div className="space-y-2">
                <Button
                  onClick={() => setCurrentStep('create')}
                  variant="outline"
                  className="w-full"
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  Create Another
                </Button>
                <Button
                  onClick={() => setCurrentStep('dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </Card>

            {letterData.tips && letterData.tips.length > 0 && (
              <Card className="glass-effect border border-blue-200/50 p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {letterData.tips.map((tip: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send Letter via Email</DialogTitle>
              <DialogDescription>
                Fill in the details to send your letter directly to the recipient.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emailTo">
                  To Email Address
                  {emailTo && isValidEmail(emailTo) && (
                    <span className="text-green-500 text-xs ml-2">✓</span>
                  )}
                </Label>
                <Input
                  id="emailTo"
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className={emailTo && !isValidEmail(emailTo) ? "border-red-400" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSubject">Subject</Label>
                <Input
                  id="emailSubject"
                  placeholder="Letter Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailContent">Additional Message (Optional)</Label>
                <Textarea
                  id="emailContent"
                  placeholder="Add a personal note..."
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={sendEmail}
                disabled={isSending || !emailTo || !isValidEmail(emailTo)}
                className="bolt-gradient text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
