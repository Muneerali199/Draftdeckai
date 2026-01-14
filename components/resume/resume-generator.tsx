"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ResumePreview } from "@/components/resume/resume-preview";
import { ResumeTemplates } from "@/components/resume/resume-templates";
import { GuidedResumeGenerator } from "@/components/resume/guided-resume-generator";
import { LinkedInImport } from "@/components/resume/linkedin-import";
import { useToast } from "@/hooks/use-toast";
import {
  File as FileIcon,
  Loader2,
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  User,
  Mail,
  Wand2,
  Palette,
  Brain,
  Target,
  Zap,
  Share2,
  Copy,
  Globe,
  ExternalLink,
  MessageCircle,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  FileDown,
} from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { TooltipWithShortcut } from "../ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";

export function ResumeGenerator({ initialSession }: { initialSession?: any }) {
  const supabaseClient = createClient();
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [isFullView, setIsFullView] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { isPro } = useSubscription();

  const generateResume = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe the resume you want to generate",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim() || !email.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your name and email",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to generate a resume",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const { data: { session } } = await supabaseClient.auth.getSession();

      const response = await fetch("/api/generate/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({
          prompt,
          name,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate resume");
      }

      const data = await response.json();
      setResumeData(data);

      // Auto-save resume to history
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          await fetch('/api/resumes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              title: `${data.name || name}'s Resume`,
              content: data,
              template: selectedTemplate,
              prompt: prompt || `Resume for ${data.name || name}`,
              isPublic: false
            }),
          });
          console.log('✅ Resume saved to history');
        }
      } catch (saveError) {
        console.error('Failed to auto-save resume:', saveError);
        // Don't show error to user - resume was still generated successfully
      }

      toast({
        title: "Resume generated! ✨",
        description: "Your tailored resume is ready to preview and download",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGuidedResumeGenerated = (resume: any) => {
    setResumeData(resume);
  };

  const handleLinkedInImport = (profile: any) => {
    console.log('LinkedIn profile received:', profile);

    // Convert LinkedIn profile to resume format
    // Handle both 'name' and 'fullName' field
    const fullName = profile.fullName || profile.name || "";

    const resume = {
      name: fullName,
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      website: profile.website || profile.profileUrl || "",
      headline: profile.headline || "",
      summary: profile.summary || "",
      experience: profile.experience || [],
      education: profile.education || [],
      skills: profile.skills || [],
      certifications: profile.certifications || [],
      languages: profile.languages || [],
    };

    console.log('Converted resume data:', resume);

    setResumeData(resume);
    setName(fullName);
    setEmail(profile.email || "");

    // Log to verify state was updated
    setTimeout(() => {
      console.log('Resume data state after update:', resume);
    }, 100);

    toast({
      title: "LinkedIn data imported! ✨",
      description: "Your profile has been converted to resume format. Review and customize as needed.",
    });
  };

  // Download functions
  const downloadPDF = async () => {
    if (!resumeData) return;

    setIsExporting(true);
    try {
      const resumeElement = document.getElementById('resume-content');
      if (!resumeElement) {
        throw new Error('Resume content not found');
      }

      // Capture with better quality and proper sizing
      const canvas = await html2canvas(resumeElement, {
        scale: 3, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123, // A4 height in pixels at 96 DPI
        width: resumeElement.scrollWidth,
        height: resumeElement.scrollHeight,
        x: 0,
        y: 0
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Create PDF with proper A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm

      // Calculate proper dimensions to fit content
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth / 3.78), pdfHeight / (imgHeight / 3.78)); // Convert pixels to mm

      const finalWidth = (imgWidth / 3.78) * ratio;
      const finalHeight = (imgHeight / 3.78) * ratio;

      // Center the content
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = 0;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, '', 'FAST');
      pdf.save(`${resumeData.name?.replace(/\s+/g, '-').toLowerCase() || 'resume'}.pdf`);

      toast({
        title: "Resume downloaded!",
        description: "Your resume has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Export failed",
        description: "Failed to export resume to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadDOCX = () => {
    toast({
      title: "Coming Soon",
      description: "Word export will be available in the next update.",
    });
  };

  // Share functions
  const saveAndShareResume = async () => {
    if (!resumeData) return;

    setIsSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        toast({
          title: "Authentication Required",
          description: "Please sign in to save and share resumes.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: `${resumeData.name}'s Resume` || 'Untitled Resume',
          content: resumeData,
          template: selectedTemplate,
          prompt: prompt || `Resume for ${resumeData.name || 'Professional'}`,
          isPublic: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save resume');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setResumeId(data.id);
      setIsShareDialogOpen(true);

      await navigator.clipboard.writeText(data.shareUrl);
      toast({
        title: "🎉 Resume Shared!",
        description: "Share link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Check out my resume!');
    const body = encodeURIComponent(`I wanted to share my professional resume with you:\\n\\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Check out my resume: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent('Check out my professional resume!');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent('Check out my resume!');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Resume',
          text: 'Check out my professional resume!',
          url: shareUrl
        });
        toast({
          title: "Shared successfully!",
          description: "Resume shared via Web Share API",
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      toast({
        title: "Not supported",
        description: "Web Share API is not supported on this device",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className={`space-y-6 transition-all duration-300 ${isFullView ? "p-0" : "px-2 sm:px-0"}`}>
        <Tabs defaultValue="guided" className="w-full">
          <div className={`flex justify-center mb-6 ${isFullView ? "hidden" : ""}`}>
            <TabsList className="glass-effect border border-yellow-400/20 p-1 h-auto flex overflow-x-auto scrollbar-hide gap-1 sm:gap-2 md:gap-4 w-full max-w-full">
              <TabsTrigger
                value="guided"
                className="data-[state=active]:bolt-gradient data-[state=active]:text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 text-sm sm:text-base min-w-[140px] justify-center"
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Smart Builder</span>
                <span className="sm:hidden">Smart</span>
              </TabsTrigger>
              <TabsTrigger
                value="quick"
                className="data-[state=active]:bolt-gradient data-[state=active]:text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 text-sm sm:text-base min-w-[140px] justify-center"
              >
                <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Quick Generate</span>
                <span className="sm:hidden">Quick</span>
              </TabsTrigger>
              <TabsTrigger
                value="linkedin"
                className="data-[state=active]:bolt-gradient data-[state=active]:text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 text-sm sm:text-base min-w-[140px] justify-center"
              >
                <Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">LinkedIn Import</span>
                <span className="sm:hidden">LinkedIn</span>
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="data-[state=active]:bolt-gradient data-[state=active]:text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 text-sm sm:text-base min-w-[140px] justify-center"
              >
                <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">Templates</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="linkedin" className="space-y-6 pt-4">
            <LinkedInImport onImport={handleLinkedInImport} />
          </TabsContent>

          <TabsContent value="guided" className="space-y-6 pt-4">
            {/* Guided Resume Builder Content */}
            {!isFullView && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-4 shimmer">
                    <Target className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">100% ATS-Optimized</span>
                    <Zap className="h-4 w-4 text-blue-500" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 bolt-gradient-text">
                    Build Your ATS-Friendly Resume
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Our AI-powered guided builder creates resumes that pass
                    Applicant Tracking Systems with perfect keyword optimization
                  </p>
                </div>
                <div className="glass-effect p-6 sm:p-8 rounded-2xl border border-yellow-400/20 relative overflow-hidden">
                  <div className="absolute inset-0 shimmer opacity-20"></div>
                  <div className="relative z-10">
                    <GuidedResumeGenerator onResumeGenerated={handleGuidedResumeGenerated} />
                  </div>
                </div>
              </>
            )}

            {resumeData && (
              <div className={`${isFullView ? "w-full" : ""}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect mb-3">
                      <FileIcon className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium">ATS-Optimized Resume</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold bolt-gradient-text">Preview</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullView(!isFullView)}
                    className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                  >
                    {isFullView ? (
                      <>
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Exit Full View
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Full View
                      </>
                    )}
                  </Button>
                </div>

                <div className={`glass-effect border border-yellow-400/20 rounded-xl overflow-hidden bg-white transition-all duration-300 ${isFullView ? "fixed inset-4 z-50 shadow-2xl" : ""
                  }`}>
                  <div className="absolute inset-0 shimmer opacity-10"></div>
                  <div className="relative z-10">
                    <ResumePreview resume={resumeData} template={selectedTemplate} />
                  </div>
                </div>

                <div className="glass-effect p-4 rounded-xl border border-yellow-400/20 mt-6">
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Download className="h-4 w-4 text-yellow-500" />
                    Download Options
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={downloadPDF}
                      disabled={isExporting}
                      variant="outline"
                      className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                    >
                      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Download PDF
                    </Button>
                    <Button
                      onClick={downloadDOCX}
                      variant="outline"
                      className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download DOCX
                    </Button>
                    <Button
                      onClick={saveAndShareResume}
                      disabled={isSaving}
                      variant="outline"
                      className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                    >
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                      Share Resume
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quick" className="space-y-6 pt-4">
            <div className={`grid grid-cols-1 ${isFullView ? "" : "lg:grid-cols-2"} gap-6 sm:gap-8`}>
              <div className={isFullView ? "hidden" : "space-y-6"}>
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect mb-3">
                    <Wand2 className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium">Quick AI Resume Generator</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 bolt-gradient-text">
                    Generate Your Resume
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fill in your details and let AI craft the perfect resume
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20 w-full text-base px-3 py-2"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                      {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`glass-effect focus:ring-yellow-400/20 w-full text-base px-3 py-2 ${email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length > 0
                          ? "border-red-400/60 focus:border-red-400/80"
                          : "border-yellow-400/30 focus:border-yellow-400/60"
                        }`}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Describe your ideal resume
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="E.g., Senior React Developer resume for Google, highlighting frontend performance optimization and component architecture"
                      className="min-h-[120px] text-base glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20 resize-none w-full px-3 py-2"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>

                  <TooltipWithShortcut content="Generate a professional resume using AI based on your description">
                    <Button
                      onClick={generateResume}
                      disabled={
                        isGenerating ||
                        !prompt.trim() ||
                        !name.trim() ||
                        !email.trim()
                      }
                      className="w-full h-12 bolt-gradient text-white font-semibold text-base hover:scale-105 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center gap-2 relative z-10">
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating Resume...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Generate Resume</span>
                            <Wand2 className="h-4 w-4" />
                          </>
                        )}
                      </div>
                      {!isGenerating && (
                        <div className="absolute inset-0 shimmer opacity-30"></div>
                      )}
                    </Button>
                  </TooltipWithShortcut>
                </div>

                {resumeData && (
                  <div className="glass-effect p-4 rounded-xl border border-yellow-400/20">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Download className="h-4 w-4 text-yellow-500" />
                      Download Options
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <TooltipWithShortcut content="Download resume as PDF file for sharing">
                        <Button
                          onClick={downloadPDF}
                          disabled={isExporting}
                          variant="outline"
                          className="glass-effect border-yellow-400/30 hover:border-yellow-400/60 w-full sm:w-auto"
                        >
                          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          Download PDF
                        </Button>
                      </TooltipWithShortcut>
                      <TooltipWithShortcut content="Download as Word document for editing">
                        <Button
                          onClick={downloadDOCX}
                          variant="outline"
                          className="glass-effect border-yellow-400/30 hover:border-yellow-400/60 w-full sm:w-auto"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download DOCX
                        </Button>
                      </TooltipWithShortcut>
                      <TooltipWithShortcut content="Create a shareable link for your resume">
                        <Button
                          onClick={saveAndShareResume}
                          disabled={isSaving}
                          variant="outline"
                          className="glass-effect border-yellow-400/30 hover:border-yellow-400/60 w-full sm:w-auto"
                        >
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                          Share Resume
                        </Button>
                      </TooltipWithShortcut>
                    </div>
                  </div>
                )}
              </div>

              <div className={`space-y-4 ${isFullView ? "w-full" : ""}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect mb-3">
                      <FileIcon className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium">Live Preview</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold bolt-gradient-text">
                      Preview
                    </h2>
                  </div>
                  {resumeData && (
                    <TooltipWithShortcut
                      content={
                        isFullView
                          ? "Return to normal view"
                          : "View resume in full screen"
                      }
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullView(!isFullView)}
                        className="glass-effect border-yellow-400/30 hover:border-yellow-400/60 mt-2 sm:mt-0"
                      >
                        {isFullView ? (
                          <>
                            <Minimize2 className="h-4 w-4 mr-2" />
                            Exit Full View
                          </>
                        ) : (
                          <>
                            <Maximize2 className="h-4 w-4 mr-2" />
                            Full View
                          </>
                        )}
                      </Button>
                    </TooltipWithShortcut>
                  )}
                </div>

                {resumeData ? (
                  <div
                    className={`glass-effect border border-yellow-400/20 rounded-xl overflow-y-auto bg-white transition-all duration-300 ${isFullView ? "fixed inset-4 z-50 shadow-2xl" : "overflow-hidden"
                      }`}
                  >
                    <div className="absolute inset-0 shimmer opacity-10"></div>
                    <div className="relative z-10">
                      <ResumePreview
                        resume={resumeData}
                        template={selectedTemplate}
                      />
                    </div>
                  </div>
                ) : (
                  <Card className="glass-effect border border-yellow-400/20 flex items-center justify-center min-h-[500px] relative overflow-hidden">
                    <div className="absolute inset-0 shimmer opacity-10"></div>
                    <CardContent className="py-10 relative z-10">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <FileIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
                          <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">
                            {isGenerating
                              ? "Creating your resume with AI magic..."
                              : "Your resume preview will appear here"}
                          </p>
                          {isGenerating && (
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="templates"
            className={`pt-4 ${isFullView ? "hidden" : ""}`}
          >
            <div className="glass-effect p-6 rounded-xl border border-yellow-400/20 relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-20"></div>
              <div className="relative z-10">
                <ResumeTemplates
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                  onEditTemplate={() => { }}
                  onDownloadTemplate={() => { }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bolt-gradient-text">Share Your Resume</DialogTitle>
            <DialogDescription>
              Share your professional resume across multiple platforms
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Link Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg"
                />
                <Button onClick={copyShareLink} size="sm" variant="outline" title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => window.open(shareUrl, '_blank')}
                  size="sm"
                  variant="outline"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Social Media Grid */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share Via</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareViaEmail}
                  variant="outline"
                  className="justify-start h-auto py-3 hover:border-blue-400/50 hover:bg-blue-50/10"
                >
                  <Mail className="mr-2 h-5 w-5 text-blue-600" />
                  <span>Email</span>
                </Button>

                <Button
                  onClick={shareViaWhatsApp}
                  variant="outline"
                  className="justify-start h-auto py-3 hover:border-green-400/50 hover:bg-green-50/10"
                >
                  <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
                  <span>WhatsApp</span>
                </Button>

                <Button
                  onClick={shareViaTwitter}
                  variant="outline"
                  className="justify-start h-auto py-3 hover:border-sky-400/50 hover:bg-sky-50/10"
                >
                  <Twitter className="mr-2 h-5 w-5 text-sky-500" />
                  <span>Twitter</span>
                </Button>

                <Button
                  onClick={shareViaLinkedIn}
                  variant="outline"
                  className="justify-start h-auto py-3 hover:border-blue-400/50 hover:bg-blue-50/10"
                >
                  <Linkedin className="mr-2 h-5 w-5 text-blue-700" />
                  <span>LinkedIn</span>
                </Button>

                <Button
                  onClick={shareViaFacebook}
                  variant="outline"
                  className="justify-start h-auto py-3 hover:border-blue-400/50 hover:bg-blue-50/10"
                >
                  <Facebook className="mr-2 h-5 w-5 text-blue-600" />
                  <span>Facebook</span>
                </Button>

                <Button
                  onClick={shareViaTelegram}
                  variant="outline"
                  className="justify-start h-auto py-3 hover:border-sky-400/50 hover:bg-sky-50/10"
                >
                  <Send className="mr-2 h-5 w-5 text-sky-500" />
                  <span>Telegram</span>
                </Button>
              </div>
            </div>

            {/* Web Share API (Mobile) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                onClick={shareViaWebShare}
                variant="outline"
                className="w-full justify-center h-auto py-3 border-purple-400/30 hover:border-purple-400/50 hover:bg-purple-50/10"
              >
                <Share2 className="mr-2 h-5 w-5 text-purple-600" />
                <span>Share via System</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}