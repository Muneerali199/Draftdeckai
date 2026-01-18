"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  FileText, Upload, Sparkles, Download, Globe, Linkedin,
  FileDown, Loader2, CheckCircle2, AlertCircle, Edit, MessageSquare,
  ExternalLink, Copy, Check, Crown, FileCheck, Share2, Link, Target, ArrowLeft,
  Briefcase, BarChart3
} from "lucide-react";
import { ResumePreview, ResumePreviewRef } from "./resume-preview";
import { ATSScoreDisplay } from "./ats-score-display";
import { AIResumeChat } from "./ai-resume-chat";
import { RESUME_TEMPLATES } from "@/lib/resume-template-data";
import { userProfileService } from "@/lib/user-profile-service";
import { TemplateCustomizationPanel } from "@/components/templates/template-customization-panel";
import { VersionHistoryPanel } from "@/components/templates/version-history-panel";
import { CollaborationPanel } from "@/components/templates/collaboration-panel";
import { versionHistoryService } from "@/lib/version-history-service";

interface MobileResumeBuilderProps {
  templateId?: string | null;
  resumeId?: string | null;
}

export function MobileResumeBuilder({ templateId, resumeId }: MobileResumeBuilderProps) {
  const { toast } = useToast();
  const resumePreviewRef = useRef<ResumePreviewRef>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [atsScore, setAtsScore] = useState<any>(null);
  const [manualText, setManualText] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentStep, setCurrentStep] = useState<'dashboard' | 'selection' | 'input' | 'preview' | 'job-url' | 'ats-checker'>('input');
  const [showAIChat, setShowAIChat] = useState(false);
  const [isCV, setIsCV] = useState(false); // Toggle between Resume (1 page) and CV (2+ pages)
  const [jobUrl, setJobUrl] = useState(""); // Job listing URL for tailored resume
  const [jobData, setJobData] = useState<any>(null); // Extracted job data
  const [atsCheckerText, setAtsCheckerText] = useState(""); // Text for ATS checker
  const [atsCheckerResult, setAtsCheckerResult] = useState<any>(null); // ATS checker results
  const [isAnalyzingAts, setIsAnalyzingAts] = useState(false); // Loading state for ATS analysis
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [showSubdomainDialog, setShowSubdomainDialog] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [scale, setScale] = useState(1);
  const isMobile = useIsMobile(); // Automatically detect mobile
  const [viewMode, setViewMode] = useState<'fit' | 'actual' | 'mobile'>('mobile');
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null); // Track uploaded PDF file
  const containerRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Load template data if templateId is provided
  useEffect(() => {
    console.log('Template ID received:', templateId);
    if (templateId) {
      const template = RESUME_TEMPLATES.find(t => t.id === templateId);
      console.log('Template found:', template);
      if (template) {
        // Initialize with template data - create a basic resume structure
        const templateResume = {
          personalInfo: {
            fullName: "Your Name",
            email: "your.email@example.com",
            phone: "+1 (555) 000-0000",
            location: "City, State",
            linkedin: "",
            portfolio: "",
            summary: "Professional summary goes here. Click to edit and add your information."
          },
          experience: [
            {
              company: "Example Company",
              position: "Your Position",
              location: "City, State",
              startDate: "Jan 2020",
              endDate: "Present",
              isCurrent: true,
              description: [
                "Click to edit your experience. Add your achievements and responsibilities here.",
                "Describe your key accomplishments and impact",
                "Use action verbs and quantify results when possible"
              ]
            }
          ],
          education: [
            {
              institution: "Your University",
              degree: "Your Degree",
              fieldOfStudy: "Your Major",
              location: "City, State",
              startDate: "2016",
              endDate: "2020",
              gpa: "3.5"
            }
          ],
          skills: ["JavaScript", "React", "Node.js", "Python", "SQL"],
          projects: [],
          certifications: []
        };

        console.log('Setting resume data:', templateResume);
        setResumeData(templateResume);
        setSelectedTemplate(template.id);
        setCurrentStep('preview');

        toast({
          title: "✨ Template Loaded!",
          description: `Using ${template.title}. Click on any section to edit with your information.`,
        });
      } else {
        console.error('Template not found for ID:', templateId);
        toast({
          title: "Template Not Found",
          description: "The selected template could not be loaded. Please try another template.",
          variant: "destructive",
        });
      }
    }
  }, [templateId, toast]);

  // Load saved resume if resumeId is provided (from history)
  useEffect(() => {
    const loadSavedResume = async () => {
      if (!resumeId) return;

      console.log('📄 Loading saved resume:', resumeId);

      try {
        // First try documents table using raw query to avoid type issues
        const { data: docResult, error: docError } = await (supabase
          .from('documents' as any)
          .select('*')
          .eq('id', resumeId)
          .single()) as { data: any; error: any };

        if (docResult && !docError) {
          console.log('📄 Loaded from documents table:', docResult);
          const content = docResult.content;

          // Extract resume data from content
          const savedResumeData = content?.resumeData || content;

          // Convert saved format to component format
          const formattedResume = {
            personalInfo: {
              fullName: savedResumeData.name || savedResumeData.personalInfo?.fullName || "Your Name",
              email: savedResumeData.email || savedResumeData.personalInfo?.email || "",
              phone: savedResumeData.phone || savedResumeData.personalInfo?.phone || "",
              location: savedResumeData.location || savedResumeData.personalInfo?.location || "",
              linkedin: savedResumeData.linkedin || savedResumeData.personalInfo?.linkedin || "",
              portfolio: savedResumeData.portfolio || savedResumeData.personalInfo?.portfolio || "",
              summary: savedResumeData.summary || savedResumeData.personalInfo?.summary || ""
            },
            experience: savedResumeData.experience || savedResumeData.work_experience || [],
            education: savedResumeData.education || [],
            skills: savedResumeData.skills?.technical || savedResumeData.skills || [],
            projects: savedResumeData.projects || [],
            certifications: savedResumeData.certifications || []
          };

          setResumeData(formattedResume);
          setCurrentStep('preview');

          toast({
            title: "✅ Resume Loaded",
            description: "Your saved resume has been loaded. Click any section to edit.",
          });
          return;
        }

        // Fallback: try resumes table
        const { data: resumeResult, error: resumeError } = await (supabase
          .from('resumes' as any)
          .select('*')
          .eq('id', resumeId)
          .single()) as { data: any; error: any };

        if (resumeResult && !resumeError) {
          console.log('📄 Loaded from resumes table:', resumeResult);

          const savedContent = resumeResult.content || {};

          const formattedResume = {
            personalInfo: {
              fullName: resumeResult.personal_info?.name || savedContent.name || "Your Name",
              email: resumeResult.personal_info?.email || savedContent.email || "",
              phone: resumeResult.personal_info?.phone || savedContent.phone || "",
              location: resumeResult.personal_info?.location || savedContent.location || "",
              linkedin: savedContent.linkedin || "",
              portfolio: savedContent.portfolio || "",
              summary: savedContent.summary || ""
            },
            experience: savedContent.experience || [],
            education: savedContent.education || [],
            skills: savedContent.skills?.technical || savedContent.skills || [],
            projects: savedContent.projects || [],
            certifications: savedContent.certifications || []
          };

          setResumeData(formattedResume);
          setSelectedTemplate(resumeResult.template || 'modern');
          setCurrentStep('preview');

          toast({
            title: "✅ Resume Loaded",
            description: "Your saved resume has been loaded. Click any section to edit.",
          });
          return;
        }

        console.error('Resume not found in any table');
        toast({
          title: "Resume Not Found",
          description: "Could not load the saved resume.",
          variant: "destructive",
        });

      } catch (error) {
        console.error('Error loading saved resume:', error);
        toast({
          title: "Error",
          description: "Failed to load saved resume.",
          variant: "destructive",
        });
      }
    };

    loadSavedResume();
  }, [resumeId, supabase, toast]);

  // Calculate scale for fit-to-screen
  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // A4 width in pixels (approx 794px) plus padding (32px on each side)
        const resumeWidth = 794;
        const padding = 64; // Total horizontal padding
        const availableWidth = containerWidth - padding;
        const newScale = Math.min(availableWidth / resumeWidth, 1);
        setScale(Math.max(newScale, 0.5)); // Minimum scale of 0.5 for readability
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [currentStep]);

  // Automatically switch to mobile view mode on mobile devices
  useEffect(() => {
    if (isMobile && viewMode !== 'mobile') {
      setViewMode('mobile');
    }
  }, [isMobile, viewMode]);

  // Get auth token
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Store PDF file for preview (without processing)
  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadedPdfFile(file);
    toast({
      title: "✅ File Selected",
      description: `${file.name} is ready. Click "Generate Resume with AI" to continue.`,
    });
  };

  // Clear uploaded PDF file
  const clearUploadedPdf = () => {
    setUploadedPdfFile(null);
  };

  // Generate Resume from uploaded PDF file
  const handlePdfGenerateResume = async () => {
    if (!uploadedPdfFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in first");

      // Step 1: Extract text from PDF
      const formData = new FormData();
      formData.append("file", uploadedPdfFile);

      const extractResponse = await fetch("/api/extract-resume-text", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok) {
        // If extraction failed, offer fallback
        if (extractData.text && extractData.text.length > 20) {
          // Partial extraction - use what we got
          console.log("Partial PDF extraction, using available text");
        } else {
          throw new Error(extractData.error || "Could not extract text from PDF. Please use the Text tab to paste your resume content manually.");
        }
      }

      const pdfText = extractData.text;

      if (!pdfText || pdfText.trim().length < 20) {
        throw new Error("Could not extract enough text from the PDF. Please use the Text tab to paste your resume content manually.");
      }

      // Step 2: Try to extract name and email from the PDF text
      let extractedName = "Professional";
      let extractedEmail = "";

      // Email extraction regex
      const emailMatch = pdfText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        extractedEmail = emailMatch[0];
      }

      // Name extraction - usually the first line or first prominent text
      // Try common patterns for name at the beginning of a resume
      const lines = pdfText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

      // The name is usually in the first few lines, typically 2-4 words, all capitalized or title case
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        // Check if it looks like a name (2-4 words, no special characters except spaces)
        const nameCandidate = line.replace(/[^a-zA-Z\s]/g, '').trim();
        const words = nameCandidate.split(/\s+/);

        if (words.length >= 2 && words.length <= 4 &&
          words.every((w: string) => w.length > 1 && /^[A-Z]/.test(w)) &&
          !nameCandidate.toLowerCase().includes('resume') &&
          !nameCandidate.toLowerCase().includes('curriculum') &&
          !nameCandidate.toLowerCase().includes('vitae')) {
          extractedName = nameCandidate;
          break;
        }
      }

      // If no email found, use a placeholder
      if (!extractedEmail) {
        extractedEmail = "user@example.com";
        toast({
          title: "📧 No email found",
          description: "We couldn't find an email in the PDF. A placeholder will be used.",
        });
      }

      console.log(`Extracted from PDF - Name: ${extractedName}, Email: ${extractedEmail}`);

      // Step 3: Call the resume generation API with extracted text as prompt
      const response = await fetch("/api/generate/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `Based on the following resume/profile content, create a professional, ATS-optimized resume:\n\n${pdfText}`,
          name: extractedName,
          email: extractedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || "Failed to generate resume";
        console.error("Resume generation error:", { status: response.status, data });
        throw new Error(errorMsg);
      }

      // Calculate ATS score
      const generatedAtsScore = calculateATSScore(data);

      // Convert to resume format
      const resume = {
        name: data.name || extractedName,
        email: data.email || extractedEmail,
        phone: data.phone || "",
        location: data.location || "",
        website: "",
        headline: data.name || extractedName,
        summary: data.summary || "",
        experience: data.experience || [],
        education: data.education || [],
        skills: data.skills || {},
        certifications: data.certifications || [],
        languages: [],
        projects: data.projects || [],
      };

      setResumeData(resume);
      setAtsScore(generatedAtsScore);
      setCurrentStep('preview');

      // Clear the uploaded file after successful generation
      setUploadedPdfFile(null);

      toast({
        title: "✨ Resume Generated from PDF!",
        description: `ATS Score: ${generatedAtsScore?.score}% (${generatedAtsScore?.grade} Grade)`,
      });

    } catch (error: any) {
      console.error("PDF Resume generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Please try using the Text tab to paste your resume content manually",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // PDF Import
  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in first");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/linkedin/import-pdf", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      const resume = convertToResume(data.profile);
      setResumeData(resume);
      setCurrentStep('preview');

      toast({
        title: "✅ PDF Imported!",
        description: "Your profile has been extracted",
      });
    } catch (error: any) {
      toast({
        title: "PDF Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Manual Text Import - Using existing working resume generation
  const handleManualImport = async () => {
    if (!userName.trim()) {
      toast({
        title: "Please enter your name",
        description: "Your name is required to generate the resume",
        variant: "destructive",
      });
      return;
    }

    if (!userEmail.trim()) {
      toast({
        title: "Please enter your email",
        description: "Your email is required to generate the resume",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!manualText.trim()) {
      toast({
        title: "Please enter job description",
        description: "Tell us about the role you're targeting",
        variant: "destructive",
      });
      return;
    }

    if (manualText.trim().length < 10) {
      toast({
        title: "Please provide more information",
        description: "Tell us more about the role (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in first");

      // Use existing working resume generation API
      const response = await fetch("/api/generate/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: manualText.trim(),
          name: userName.trim(),
          email: userEmail.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Provide detailed error message
        const errorMsg = data.details || data.error || "Failed to generate resume";
        console.error("Resume generation error:", { status: response.status, data });
        throw new Error(errorMsg);
      }

      // Calculate ATS score
      const atsScore = calculateATSScore(data);

      // Convert to resume format with proper skills structure
      const resume = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        website: "",
        headline: data.name || "",
        summary: data.summary || "",
        experience: data.experience || [],
        education: data.education || [],
        skills: data.skills || {}, // Keep as object for resume-preview compatibility
        certifications: data.certifications || [],
        languages: [],
        projects: data.projects || [],
      };

      setResumeData(resume);
      setAtsScore(atsScore);
      setCurrentStep('preview');

      // Clear form fields after successful generation
      setUserName("");
      setUserEmail("");
      setManualText("");

      toast({
        title: "✨ Resume Generated!",
        description: `ATS Score: ${atsScore?.score}% (${atsScore?.grade} Grade)`,
      });
    } catch (error: any) {
      console.error("Resume generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again with more details",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ATS Resume Analysis Handler
  const handleAtsAnalysis = async (textContent?: string) => {
    const contentToAnalyze = textContent || atsCheckerText;

    if (!contentToAnalyze || !contentToAnalyze.trim() || contentToAnalyze.trim().length < 20) {
      toast({
        title: "Not enough content",
        description: "Please enter at least 20 characters of resume text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingAts(true);

    try {
      const token = await getAuthToken();

      const response = await fetch("/api/analyze-ats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resumeText: contentToAnalyze }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setAtsCheckerResult(data);

      toast({
        title: `ATS Score: ${data.score}%`,
        description: `Grade: ${data.grade} - ${data.summary || "Analysis complete!"}`,
      });
    } catch (error: any) {
      console.error("ATS analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  // Handle ATS File Upload - Extract text and show in textarea (don't auto-analyze)
  const handleAtsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingAts(true);

    try {
      // For text files, read directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        if (text && text.trim().length >= 10) {
          setAtsCheckerText(text.trim());
          toast({
            title: "✅ Resume Loaded",
            description: "Your resume content is ready. Click 'Analyze ATS Score' to check your score.",
          });
          setIsAnalyzingAts(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append('file', file);

      const token = await getAuthToken();

      // Extract text from the file
      const extractResponse = await fetch("/api/extract-resume-text", {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok) {
        // If extraction failed but we got some text, still use it
        if (extractData.text && extractData.text.trim().length > 20) {
          setAtsCheckerText(extractData.text.trim());
          toast({
            title: "⚠️ Partial Extraction",
            description: "Some text was extracted. You may need to clean it up before analyzing.",
          });
          setIsAnalyzingAts(false);
          return;
        }
        throw new Error(extractData.error || "Failed to extract text from resume");
      }

      const { text } = extractData;

      if (!text || text.trim().length < 20) {
        throw new Error("Could not extract enough text from the file. Please try pasting your resume text instead.");
      }

      // Set the extracted text in the textarea (don't auto-analyze)
      setAtsCheckerText(text.trim());

      toast({
        title: "✅ Resume Loaded Successfully",
        description: `Extracted ${text.length} characters. Click 'Analyze ATS Score' to check your score.`,
      });

    } catch (error: any) {
      console.error("File upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Please try pasting your resume text manually",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingAts(false);
      // Reset the file input so the same file can be uploaded again
      e.target.value = '';
    }
  };

  // Generate Tailored Resume from Job Data
  const handleGenerateTailoredResume = async () => {
    if (!jobData) {
      toast({
        title: "No job data",
        description: "Please extract job requirements first",
        variant: "destructive",
      });
      return;
    }

    // Check if user has entered name and email
    if (!userName.trim() || !userEmail.trim()) {
      // Prompt user to go to input step first to enter their details
      toast({
        title: "Please enter your details",
        description: "We need your name and email to generate a tailored resume.",
      });
      setCurrentStep('input');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setCurrentStep('input');
      return;
    }

    setIsImporting(true);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in first");

      // Create a detailed prompt from job data
      const jobDescription = `
Job Title: ${jobData.title || 'Not specified'}
Company: ${jobData.company || 'Not specified'}
Location: ${jobData.location || 'Not specified'}
Job Type: ${jobData.type || 'Full-time'}

Required Skills: ${jobData.skills?.join(', ') || 'Various technical skills'}

Key Requirements:
${jobData.requirements?.map((r: string) => `- ${r}`).join('\n') || '- Professional experience required'}

Responsibilities:
${jobData.responsibilities?.map((r: string) => `- ${r}`).join('\n') || '- Various responsibilities'}

Keywords for ATS: ${jobData.keywords?.join(', ') || jobData.skills?.join(', ') || 'industry relevant keywords'}
      `.trim();

      // Use existing working resume generation API
      const response = await fetch("/api/generate/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `Create a tailored resume for this job:\n\n${jobDescription}`,
          name: userName.trim(),
          email: userEmail.trim(),
          jobTitle: jobData.title,
          targetCompany: jobData.company,
          targetSkills: jobData.skills,
          targetKeywords: jobData.keywords
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || "Failed to generate resume";
        console.error("Resume generation error:", { status: response.status, data });
        throw new Error(errorMsg);
      }

      // Calculate ATS score
      const atsScore = calculateATSScore(data);

      // Convert to resume format with proper skills structure
      const resume = {
        name: data.name || userName || "Your Name",
        email: data.email || userEmail || "your@email.com",
        phone: data.phone || "",
        location: data.location || jobData.location || "",
        website: "",
        headline: jobData.title || data.name || "",
        summary: data.summary || "",
        experience: data.experience || [],
        education: data.education || [],
        skills: data.skills || {},
        certifications: data.certifications || [],
        languages: [],
        projects: data.projects || [],
      };

      setResumeData(resume);
      setAtsScore(atsScore);
      setCurrentStep('preview');

      toast({
        title: "✨ Tailored Resume Created!",
        description: `Optimized for ${jobData.title || 'the position'} at ${jobData.company || 'target company'}. ATS Score: ${atsScore?.score}%`,
      });
    } catch (error: any) {
      console.error("Tailored resume generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Helper function to convert skills object to array
  const convertSkillsToArray = (skills: any): string[] => {
    if (Array.isArray(skills)) return skills;
    if (!skills) return [];

    const skillsArray: string[] = [];
    if (skills.technical) skillsArray.push(...skills.technical);
    if (skills.programming) skillsArray.push(...skills.programming);
    if (skills.tools) skillsArray.push(...skills.tools);
    if (skills.soft) skillsArray.push(...skills.soft);

    return skillsArray;
  };

  // Calculate ATS Score
  const calculateATSScore = (resume: any): any => {
    let score = 0;
    const feedback: string[] = [];
    const improvements: string[] = [];

    // Check contact info (20 points)
    if (resume.name && resume.name !== 'Your Name') {
      score += 5;
    } else {
      improvements.push("Add your full name");
    }

    if (resume.email && resume.email.includes('@')) {
      score += 5;
    } else {
      improvements.push("Add a professional email");
    }

    if (resume.phone) {
      score += 5;
    } else {
      improvements.push("Add phone number");
    }

    if (resume.location) {
      score += 5;
    } else {
      improvements.push("Add your location");
    }

    // Check professional summary (15 points)
    if (resume.summary && resume.summary.length > 100) {
      score += 15;
      feedback.push("✅ Strong professional summary");
    } else {
      score += 5;
      improvements.push("Expand professional summary to 3-4 sentences");
    }

    // Check experience (30 points)
    const exp = resume.experience || [];
    if (exp.length >= 2) {
      score += 10;
      feedback.push("✅ Multiple work experiences listed");
    } else if (exp.length === 1) {
      score += 5;
      improvements.push("Add more work experience");
    } else {
      improvements.push("Add work experience section");
    }

    // Check for quantifiable achievements
    const hasMetrics = exp.some((e: any) => {
      const desc = Array.isArray(e.description) ? e.description.join(' ') : (e.description || '');
      return /\d+%|\$\d+|\d+\+/.test(desc);
    });

    if (hasMetrics) {
      score += 10;
      feedback.push("✅ Includes quantifiable achievements");
    } else {
      improvements.push("Add numbers/metrics to achievements (e.g., 'increased sales by 25%')");
    }

    // Check achievement count
    const totalAchievements = exp.reduce((sum: number, e: any) => {
      const desc = e.description || [];
      return sum + (Array.isArray(desc) ? desc.length : 0);
    }, 0);

    if (totalAchievements >= 6) {
      score += 10;
      feedback.push("✅ Detailed work achievements");
    } else {
      improvements.push("Add 3-5 achievements per role");
    }

    // Check education (15 points)
    const edu = resume.education || [];
    if (edu.length > 0) {
      score += 10;
      feedback.push("✅ Education included");
      if (edu[0].gpa) {
        score += 5;
        feedback.push("✅ GPA mentioned");
      }
    } else {
      improvements.push("Add education section");
    }

    // Check skills (15 points)
    const skills = convertSkillsToArray(resume.skills);
    const totalSkills = skills.length;

    if (totalSkills >= 10) {
      score += 15;
      feedback.push("✅ Comprehensive skills list");
    } else if (totalSkills >= 5) {
      score += 10;
      improvements.push("Add more relevant skills (aim for 10-15)");
    } else {
      score += 5;
      improvements.push("Add technical and soft skills");
    }

    // Check certifications (5 points)
    if (resume.certifications && resume.certifications.length > 0) {
      score += 5;
      feedback.push("✅ Certifications included");
    } else {
      improvements.push("Add relevant certifications if available");
    }

    // Determine grade
    let grade = 'F';
    let color = 'red';
    if (score >= 90) {
      grade = 'A';
      color = 'green';
      feedback.push("🎉 Excellent! Your resume is ATS-optimized");
    } else if (score >= 80) {
      grade = 'B';
      color = 'blue';
      feedback.push("👍 Good! A few tweaks will make it perfect");
    } else if (score >= 70) {
      grade = 'C';
      color = 'yellow';
      feedback.push("⚠️ Decent, but needs improvement");
    } else if (score >= 60) {
      grade = 'D';
      color = 'orange';
      feedback.push("⚠️ Needs significant improvement");
    } else {
      color = 'red';
      feedback.push("❌ Needs major improvements for ATS compatibility");
    }

    return {
      score,
      grade,
      color,
      feedback,
      improvements,
      breakdown: {
        contactInfo: Math.min(20, score >= 20 ? 20 : (score > 0 ? 10 : 0)),
        summary: resume.summary ? 15 : 5,
        experience: Math.min(30, totalAchievements >= 6 ? 30 : 15),
        education: edu.length > 0 ? 15 : 0,
        skills: Math.min(15, totalSkills >= 10 ? 15 : 8),
        certifications: resume.certifications?.length > 0 ? 5 : 0
      }
    };
  };

  // Convert LinkedIn profile to resume format
  const convertToResume = (profile: any) => {
    return {
      name: profile.fullName || "",
      email: "",
      phone: "",
      location: profile.location || "",
      website: "",
      headline: profile.headline || "",
      summary: profile.summary || "",
      experience: profile.experience || [],
      education: profile.education || [],
      skills: profile.skills || [],
      certifications: profile.certifications || [],
      languages: profile.languages || [],
    };
  };

  // Download PDF
  const downloadPDF = () => {
    toast({
      title: "Downloading PDF...",
      description: "Your resume will download shortly",
    });
  };

  // Publish resume to subdomain
  const handlePublishToSubdomain = async () => {
    if (!subdomain.trim()) {
      toast({
        title: "Subdomain required",
        description: "Please enter a subdomain name",
        variant: "destructive",
      });
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      toast({
        title: "Invalid subdomain",
        description: "Use only lowercase letters, numbers, and hyphens",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in first");

      const response = await fetch("/api/resume/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          subdomain,
          resumeData,
          isCV,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish");
      }

      setIsPublished(true);
      setPublishedUrl(data.data.url);
      setShowSubdomainDialog(false);

      toast({
        title: "🎉 Resume Published!",
        description: `Your ${isCV ? 'CV' : 'resume'} is live! Visit: ${data.data.url}`,
      });
    } catch (error: any) {
      toast({
        title: "Publishing failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Copy subdomain URL
  const copySubdomainUrl = () => {
    if (!publishedUrl) return;
    navigator.clipboard.writeText(publishedUrl);
    toast({
      title: "Copied!",
      description: "Resume URL copied to clipboard",
    });
  };

  // Share resume using native share API (works on mobile and some desktop browsers)
  const handleNativeShare = async () => {
    if (!publishedUrl) {
      toast({
        title: "No URL to share",
        description: "Please publish your resume first",
        variant: "destructive",
      });
      return;
    }

    const shareData = {
      title: `${resumeData?.name || 'My'} Professional ${isCV ? 'CV' : 'Resume'}`,
      text: `Check out my professional ${isCV ? 'CV' : 'resume'} created with DocMagic!`,
      url: publishedUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully!",
          description: "Resume shared via native share",
        });
      } else {
        // Fallback: open share dialog with platform options
        setShowShareDialog(true);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // User didn't cancel, show platform options
        setShowShareDialog(true);
      }
    }
  };

  // Share on WhatsApp
  const shareOnWhatsApp = () => {
    if (!publishedUrl) return;
    const text = encodeURIComponent(`Check out my professional ${isCV ? 'CV' : 'resume'}: ${publishedUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Share on LinkedIn
  const shareOnLinkedIn = () => {
    if (!publishedUrl) return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publishedUrl)}`, '_blank');
  };

  // Share via Email
  const shareViaEmail = () => {
    if (!publishedUrl) return;
    const subject = encodeURIComponent(`My Professional ${isCV ? 'CV' : 'Resume'}`);
    const body = encodeURIComponent(`Hi,\n\nI'd like to share my professional ${isCV ? 'CV' : 'resume'} with you:\n\n${publishedUrl}\n\nCreated with DocMagic - Professional Document Builder`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Share on Twitter/X
  const shareOnTwitter = () => {
    if (!publishedUrl) return;
    const text = encodeURIComponent(`Check out my professional ${isCV ? 'CV' : 'resume'}!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(publishedUrl)}`, '_blank');
  };

  // Share on Facebook
  const shareOnFacebook = () => {
    if (!publishedUrl) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publishedUrl)}`, '_blank');
  };

  // Share on Telegram
  const shareOnTelegram = () => {
    if (!publishedUrl) return;
    const text = encodeURIComponent(`Check out my professional ${isCV ? 'CV' : 'resume'}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publishedUrl)}&text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background - Matching Landing Page */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="mesh-gradient opacity-40"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-r from-amber-400/8 to-orange-400/8 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header - Matching Landing Page Style */}
          <div className="text-center mb-6 sm:mb-12 lg:mb-16 px-4">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-effect border border-blue-200/30 mb-4 sm:mb-6 hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold bolt-gradient-text">AI-Powered Resume Builder</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="block mb-1 sm:mb-2">Create Your Perfect Resume</span>
              <span className="bolt-gradient-text">In Seconds, Not Hours</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Import from LinkedIn, upload PDF, or paste your info. Our advanced AI does the rest! ✨
            </p>
          </div>

          {/* VIEW 0: DASHBOARD - Similar to Presentation Page */}
          {currentStep === 'dashboard' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Create Resume */}
                <button
                  onClick={() => {
                    setIsCV(false);
                    setCurrentStep('input');
                  }}
                  className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10 transition-all min-h-[200px]">
                    <div className="w-12 h-12 bolt-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                      <FileCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Create Resume</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Build a professional 1-page resume optimized for job applications.</p>
                  </div>
                </button>

                {/* Create CV */}
                <button
                  onClick={() => {
                    setIsCV(true);
                    setCurrentStep('input');
                  }}
                  className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/10 transition-all min-h-[200px]">
                    <div className="w-12 h-12 cosmic-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Create CV</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Build a detailed multi-page CV for academic or comprehensive profiles.</p>
                  </div>
                </button>

                {/* Import from Job URL */}
                <button
                  onClick={() => setCurrentStep('job-url')}
                  className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all min-h-[200px]">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Job URL Import</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Paste a job listing URL to create a tailored resume.</p>
                  </div>
                </button>

                {/* ATS Score Checker */}
                <button
                  onClick={() => setCurrentStep('ats-checker')}
                  className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-orange-500/50 shadow-lg hover:shadow-orange-500/10 transition-all min-h-[200px]">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">ATS Score Checker</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Check your resume's ATS compatibility and get improvement tips.</p>
                  </div>
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-8 sm:mt-12 max-w-4xl mx-auto">
                <div className="p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bolt-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Pro Tips for Best Results</h4>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Resume:</strong> Best for US/Canada job applications, fits on 1 page</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>CV:</strong> Ideal for academic, research, or detailed profiles</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Job URL:</strong> Tailors your resume to match job requirements</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>ATS Check:</strong> Ensures your resume passes automated screening</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'selection' ? (
            /* Initial Selection: Resume or CV */
            <div className="max-w-4xl mx-auto px-4">
              <Card className="glass-effect border-2 border-blue-200/50 shadow-2xl">
                <CardHeader className="text-center p-8">
                  <CardTitle className="text-3xl font-bold mb-4">
                    <span className="bolt-gradient-text">What would you like to create?</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Choose the format that best suits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Resume Option */}
                    <button
                      onClick={() => {
                        setIsCV(false);
                        setCurrentStep('input');
                      }}
                      className="group relative p-8 rounded-xl border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="absolute top-4 right-4">
                        <FileCheck className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Resume</h3>
                        <p className="text-gray-600 mb-4">Perfect for job applications</p>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Fits on <strong>1 page</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Concise and focused</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>ATS-optimized format</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Quick to review</span>
                          </li>
                        </ul>
                        <div className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold group-hover:bg-blue-700 transition-colors">
                          Create Resume
                        </div>
                      </div>
                    </button>

                    {/* CV Option */}
                    <button
                      onClick={() => {
                        setIsCV(true);
                        setCurrentStep('input');
                      }}
                      className="group relative p-8 rounded-xl border-2 border-purple-200 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="absolute top-4 right-4">
                        <FileText className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">CV (Curriculum Vitae)</h3>
                        <p className="text-gray-600 mb-4">For academic & detailed profiles</p>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span><strong>2+ pages</strong> allowed</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Comprehensive details</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Research & publications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Full career history</span>
                          </li>
                        </ul>
                        <div className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg text-center font-semibold group-hover:bg-purple-700 transition-colors">
                          Create CV
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-200 dark:border-amber-700">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Not sure which to choose?</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <strong>Choose Resume</strong> if you're applying for jobs in the US, Canada, or most industries.
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Choose CV</strong> if you're in academia, research, or need to showcase extensive experience.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentStep === 'input' ? (
            /* Input Section - Combined with Dashboard Options */
            <>
              {/* Div A: Dashboard Options */}
              <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Create Resume */}
                  <button
                    onClick={() => {
                      setIsCV(false);
                    }}
                    className={`group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105 ${!isCV ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10 transition-all min-h-[200px]">
                      <div className="w-12 h-12 bolt-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                        <FileCheck className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Create Resume</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Build a professional 1-page resume optimized for job applications.</p>
                    </div>
                  </button>

                  {/* Create CV */}
                  <button
                    onClick={() => {
                      setIsCV(true);
                    }}
                    className={`group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105 ${isCV ? 'ring-2 ring-purple-500' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/10 transition-all min-h-[200px]">
                      <div className="w-12 h-12 cosmic-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Create CV</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Build a detailed multi-page CV for academic or comprehensive profiles.</p>
                    </div>
                  </button>

                  {/* Import from Job URL */}
                  <button
                    onClick={() => setCurrentStep('job-url')}
                    className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all min-h-[200px]">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Job URL Import</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Paste a job listing URL to create a tailored resume.</p>
                    </div>
                  </button>

                  {/* ATS Score Checker */}
                  <button
                    onClick={() => setCurrentStep('ats-checker')}
                    className="group relative flex flex-col p-1 rounded-3xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="bg-card/60 backdrop-blur-xl w-full h-full rounded-[20px] p-6 flex flex-col relative overflow-hidden border border-border hover:border-orange-500/50 shadow-lg hover:shadow-orange-500/10 transition-all min-h-[200px]">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold professional-heading mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">ATS Score Checker</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Check your resume's ATS compatibility and get improvement tips.</p>
                    </div>
                  </button>
                </div>

                {/* Pro Tips Info Box */}
                <div className="mt-8 sm:mt-12 max-w-4xl mx-auto">
                  <div className="p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bolt-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Pro Tips for Best Results</h4>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Resume:</strong> Best for US/Canada job applications, fits on 1 page</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>CV:</strong> Ideal for academic, research, or detailed profiles</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Job URL:</strong> Tailors your resume to match job requirements</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>ATS Check:</strong> Ensures your resume passes automated screening</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Div B: Import Your Profile Form */}
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0">
                {/* Left: Import Methods */}
                <Card className="card-sky hover-sky border-2 border-blue-200/50 hover:border-blue-300/70 shadow-xl backdrop-blur-xl">
                  <CardHeader className="p-4 sm:p-6 relative">
                    <div className="pt-0">
                      <CardTitle className="text-xl sm:text-2xl font-bold professional-heading">
                        <span className="bolt-gradient-text">Import Your Profile</span>
                        {isCV && <span className="ml-2 text-sm font-normal text-purple-600">(CV Mode)</span>}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-sm sm:text-base">
                        Choose your preferred method to get started
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <Tabs defaultValue="pdf" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 glass-effect h-auto">
                        <TabsTrigger value="pdf" className="text-xs sm:text-sm data-[state=active]:sunset-gradient data-[state=active]:text-white py-2 sm:py-2.5">
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                          PDF/File
                        </TabsTrigger>
                        <TabsTrigger value="text" className="text-xs sm:text-sm data-[state=active]:forest-gradient data-[state=active]:text-white py-2 sm:py-2.5">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                          Text
                        </TabsTrigger>
                      </TabsList>

                      {/* PDF Tab */}
                      <TabsContent value="pdf" className="space-y-3 sm:space-y-4">
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="pdf-upload" className="text-sm font-medium">
                            Upload Resume PDF or LinkedIn Export
                          </Label>

                          {/* Conditional: Show file preview or upload area */}
                          {uploadedPdfFile ? (
                            // File Preview
                            <div className="border-2 border-solid border-orange-300 rounded-lg p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                                      {uploadedPdfFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {(uploadedPdfFile.size / 1024).toFixed(1)} KB • PDF File
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={clearUploadedPdf}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 transition-colors"
                                  title="Remove file"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Upload Area
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 md:p-8 text-center hover:border-orange-400 transition-colors cursor-pointer bg-white/30">
                              <input
                                type="file"
                                id="pdf-upload"
                                accept="application/pdf"
                                onChange={handlePdfFileSelect}
                                className="hidden"
                              />
                              <label htmlFor="pdf-upload" className="cursor-pointer">
                                <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                                <p className="text-xs sm:text-sm font-medium text-gray-700">
                                  Click to upload PDF
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                  LinkedIn profile export only
                                </p>
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Generate Resume with AI Button - Only visible after file upload */}
                        {uploadedPdfFile && (
                          <Button
                            onClick={handlePdfGenerateResume}
                            disabled={isImporting}
                            className="w-full sunset-gradient hover:scale-105 transition-all duration-300 text-white shadow-lg text-sm sm:text-base"
                            size="lg"
                          >
                            {isImporting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                <span className="font-semibold">Generating Professional Resume...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                <span className="font-semibold">Generate Resume with AI</span>
                              </>
                            )}
                          </Button>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                          <p className="text-[10px] sm:text-xs text-blue-800 font-medium mb-1.5 sm:mb-2">
                            💡 How to export from LinkedIn:
                          </p>
                          <ol className="text-[10px] sm:text-xs text-blue-700 space-y-0.5 sm:space-y-1 list-decimal list-inside">
                            <li>Go to your LinkedIn profile</li>
                            <li>Click &quot;More&quot; → &quot;Save to PDF&quot;</li>
                            <li>Upload the downloaded PDF here</li>
                          </ol>
                        </div>
                      </TabsContent>

                      {/* Manual Text Tab - Using Working Resume Generation */}
                      <TabsContent value="text" className="space-y-3 sm:space-y-4">
                        <div className="space-y-2 sm:space-y-3">
                          <div>
                            <Label htmlFor="user-name" className="text-sm font-medium">
                              Your Name *
                            </Label>
                            <Input
                              id="user-name"
                              placeholder="e.g., John Doe"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="bg-white/50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="user-email" className="text-sm font-medium">
                              Your Email *
                            </Label>
                            <Input
                              id="user-email"
                              type="email"
                              placeholder="e.g., john.doe@example.com"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              className="bg-white/50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="manual-text" className="text-sm font-medium flex items-center gap-2">
                              Job Description / Target Role *
                              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs rounded-full font-bold">
                                AI-Powered ✨
                              </span>
                            </Label>
                            <Textarea
                              id="manual-text"
                              placeholder="Describe the job role you're targeting:

Example:
Full Stack Developer with 5 years of experience
Expert in React, Node.js, Python, AWS
Led team of 10 developers
Increased performance by 40%
Bachelor's in Computer Science
Certified AWS Solutions Architect
..."
                              value={manualText}
                              onChange={(e) => setManualText(e.target.value)}
                              className="min-h-[180px] bg-white/50 resize-none"
                            />
                          </div>
                          <div className="flex items-start gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse" />
                            <p className="text-[10px] sm:text-xs text-gray-700">
                              <strong className="text-blue-700">AI will create:</strong> Complete professional resume with
                              proper formatting, quantified achievements, and ATS optimization + instant compatibility score!
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleManualImport}
                          disabled={isImporting}
                          className="w-full forest-gradient hover:scale-105 transition-all duration-300 text-white shadow-lg text-sm sm:text-base"
                          size="lg"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              <span className="font-semibold">Generating Professional Resume...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-5 w-5" />
                              <span className="font-semibold">Generate Resume with AI</span>
                            </>
                          )}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Right: Benefits/Features - Enhanced Matching Landing Page */}
                <Card className="card-coral hover-coral border-2 border-amber-200/50 hover:border-amber-300/70 shadow-xl backdrop-blur-xl hidden lg:block">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold professional-heading">
                      <span className="sunset-gradient-text">Why Use Our Builder? ✨</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4 group">
                      <div className="w-12 h-12 forest-gradient rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold professional-heading mb-1">ATS-Optimized</h3>
                        <p className="text-sm text-muted-foreground">
                          Resumes formatted to pass Applicant Tracking Systems
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="w-12 h-12 bolt-gradient rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20 group-hover:scale-110 transition-transform">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold professional-heading mb-1">AI-Powered</h3>
                        <p className="text-sm text-muted-foreground">
                          Intelligent parsing extracts data from any format
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="w-12 h-12 cosmic-gradient rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20 group-hover:scale-110 transition-transform">
                        <Download className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold professional-heading mb-1">Export Anywhere</h3>
                        <p className="text-sm text-muted-foreground">
                          Download as PDF or DOCX, ready to send
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                      <div className="w-12 h-12 sunset-gradient rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20 group-hover:scale-110 transition-transform">
                        <Linkedin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold professional-heading mb-1">LinkedIn Integration</h3>
                        <p className="text-sm text-muted-foreground">
                          Import directly from LinkedIn or PDF export
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 p-4 glass-effect rounded-lg border border-blue-200/30 hover:scale-105 transition-transform">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-blue-500 animate-pulse mt-0.5" />
                        <p className="text-sm professional-text">
                          <strong className="bolt-gradient-text">Pro Tip:</strong> For best results, use PDF export from LinkedIn.
                          It&apos;s 100% reliable and includes all your data!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : currentStep === 'job-url' ? (
            /* Job URL Import View */
            <div className="max-w-4xl mx-auto px-4">
              <Card className="glass-effect border-2 border-emerald-200/50 shadow-2xl">
                <CardHeader className="text-center p-6 sm:p-8">
                  <button
                    onClick={() => setCurrentStep('dashboard')}
                    className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Import from Job Listing</span>
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg">
                    Paste a job listing URL and we&apos;ll extract requirements to create a tailored resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="job-url" className="text-base font-medium flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Job Listing URL
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          id="job-url"
                          placeholder="https://linkedin.com/jobs/view/... or https://indeed.com/..."
                          value={jobUrl}
                          onChange={(e) => setJobUrl(e.target.value)}
                          className="flex-1 h-12 text-base border-2 border-emerald-200 focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Supports LinkedIn, Indeed, Glassdoor, and most job boards
                      </p>
                    </div>

                    {/* Extracted Job Data Preview */}
                    {jobData && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          Job Requirements Extracted
                        </h4>
                        <div className="space-y-2 text-sm">
                          {jobData.title && (
                            <p><strong>Position:</strong> {jobData.title}</p>
                          )}
                          {jobData.company && (
                            <p><strong>Company:</strong> {jobData.company}</p>
                          )}
                          {jobData.skills && jobData.skills.length > 0 && (
                            <div>
                              <strong>Key Skills:</strong>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {jobData.skills.slice(0, 8).map((skill: string, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-800 rounded-full text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Name and Email inputs - shown after job data is extracted */}
                    {jobData && (
                      <div className="grid sm:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                        <div className="space-y-2">
                          <Label htmlFor="tailor-name" className="text-sm font-medium">Your Full Name *</Label>
                          <Input
                            id="tailor-name"
                            placeholder="John Doe"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="h-11 border-2 border-blue-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tailor-email" className="text-sm font-medium">Your Email *</Label>
                          <Input
                            id="tailor-email"
                            type="email"
                            placeholder="john@gmail.com"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className="h-11 border-2 border-blue-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={async () => {
                          if (!jobUrl.trim()) {
                            toast({
                              title: "Please enter a job URL",
                              variant: "destructive",
                            });
                            return;
                          }
                          setIsExtractingJob(true);
                          try {
                            const response = await fetch('/api/extract-job', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ url: jobUrl }),
                            });
                            if (response.ok) {
                              const data = await response.json();
                              setJobData(data);
                              toast({
                                title: "✅ Job data extracted!",
                                description: "Enter your details and create your tailored resume.",
                              });
                            } else {
                              throw new Error('Failed to extract job data');
                            }
                          } catch (error) {
                            toast({
                              title: "Failed to extract job data",
                              description: "Please check the URL and try again.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsExtractingJob(false);
                          }
                        }}
                        disabled={isExtractingJob || !jobUrl.trim()}
                        className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                      >
                        {isExtractingJob ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Target className="mr-2 h-5 w-5" />
                            Extract Job Requirements
                          </>
                        )}
                      </Button>

                      {jobData && (
                        <Button
                          onClick={handleGenerateTailoredResume}
                          disabled={isImporting || !userName.trim() || !userEmail.trim()}
                          className="flex-1 h-12 bolt-gradient text-white font-semibold"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Generating Resume...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-5 w-5" />
                              Create Tailored Resume
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Features */}
                    <div className="grid sm:grid-cols-2 gap-4 mt-6">
                      <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Keyword Matching</p>
                          <p className="text-xs text-muted-foreground">Automatically includes relevant keywords</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Skills Alignment</p>
                          <p className="text-xs text-muted-foreground">Highlights matching skills from job listing</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">ATS Optimization</p>
                          <p className="text-xs text-muted-foreground">Format optimized for tracking systems</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Smart Suggestions</p>
                          <p className="text-xs text-muted-foreground">AI suggests improvements based on job</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentStep === 'ats-checker' ? (
            /* ATS Score Checker View */
            <div className="max-w-4xl mx-auto px-4">
              <Card className="glass-effect border-2 border-orange-200/50 shadow-2xl">
                <CardHeader className="text-center p-6 sm:p-8 relative">
                  <button
                    onClick={() => {
                      setCurrentStep('dashboard');
                      setAtsCheckerResult(null);
                      setAtsCheckerText("");
                    }}
                    className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">ATS Resume Checker</span>
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg">
                    Check how well your resume performs against Applicant Tracking Systems
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-6">
                    {/* Show Results if available */}
                    {atsCheckerResult ? (
                      <div className="space-y-6">
                        {/* Score Display */}
                        <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border-2 border-orange-200 dark:border-orange-700">
                          <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                              <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                                <div className="text-center">
                                  <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                                    {atsCheckerResult.score}%
                                  </span>
                                  <p className="text-sm font-medium text-muted-foreground mt-1">
                                    {atsCheckerResult.grade} Grade
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
                            {atsCheckerResult.summary || "Your resume has been analyzed!"}
                          </p>
                        </div>

                        {/* Category Scores */}
                        {atsCheckerResult.categories && (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {Object.entries(atsCheckerResult.categories).map(([category, score]: [string, any]) => (
                              <div key={category} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium capitalize">{category.replace(/_/g, ' ')}</span>
                                  <span className="text-sm font-bold text-orange-600">{score}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-orange-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {atsCheckerResult.suggestions && atsCheckerResult.suggestions.length > 0 && (
                          <div className="p-6 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-blue-600" />
                              Suggestions to Improve
                            </h4>
                            <ul className="space-y-3">
                              {atsCheckerResult.suggestions.map((suggestion: string, index: number) => (
                                <li key={index} className="flex items-start gap-3 text-sm">
                                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                                    {index + 1}
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Keywords Found/Missing */}
                        {(atsCheckerResult.keywords_found || atsCheckerResult.keywords_missing) && (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {atsCheckerResult.keywords_found && atsCheckerResult.keywords_found.length > 0 && (
                              <div className="p-4 bg-green-50/80 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                                <h5 className="font-medium text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Keywords Found
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {atsCheckerResult.keywords_found.slice(0, 10).map((kw: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs rounded-full">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {atsCheckerResult.keywords_missing && atsCheckerResult.keywords_missing.length > 0 && (
                              <div className="p-4 bg-red-50/80 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700">
                                <h5 className="font-medium text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Consider Adding
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {atsCheckerResult.keywords_missing.slice(0, 10).map((kw: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs rounded-full">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Analyze Another Button */}
                        <Button
                          onClick={() => {
                            setAtsCheckerResult(null);
                            setAtsCheckerText("");
                          }}
                          variant="outline"
                          className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                          Analyze Another Resume
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* File Upload Area */}
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isAnalyzingAts ? 'border-orange-500 bg-orange-100/50' : 'border-orange-300 dark:border-orange-700 hover:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'}`}>
                          <input
                            type="file"
                            id="ats-upload"
                            accept="application/pdf,.pdf,.doc,.docx,text/plain,.txt"
                            className="hidden"
                            disabled={isAnalyzingAts}
                            onChange={handleAtsFileUpload}
                          />
                          <label htmlFor="ats-upload" className={`cursor-pointer ${isAnalyzingAts ? 'pointer-events-none' : ''}`}>
                            {isAnalyzingAts ? (
                              <>
                                <Loader2 className="h-12 w-12 text-orange-500 mx-auto mb-4 animate-spin" />
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                  Analyzing your resume...
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                  This may take a few seconds
                                </p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                  {atsCheckerText ? 'Upload a Different Resume' : 'Drop your resume here'}
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                  or click to browse (PDF, DOC, DOCX, TXT)
                                </p>
                                <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-100">
                                  <Upload className="mr-2 h-4 w-4" />
                                  {atsCheckerText ? 'Replace Resume' : 'Upload Resume'}
                                </Button>
                              </>
                            )}
                          </label>
                        </div>

                        {/* Show extracted text label when content exists */}
                        {atsCheckerText && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="font-medium">Resume content loaded ({atsCheckerText.length} characters)</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAtsCheckerText("")}
                              className="text-gray-500 hover:text-red-500"
                            >
                              Clear
                            </Button>
                          </div>
                        )}

                        {/* Or Use Text Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                              {atsCheckerText ? 'Review & edit your resume text' : 'Or paste your resume text'}
                            </span>
                          </div>
                        </div>

                        <Textarea
                          placeholder="Paste your resume content here for ATS analysis... (or upload a file above)"
                          className="min-h-[250px] border-2 border-orange-200 focus:border-orange-500 font-mono text-sm"
                          value={atsCheckerText}
                          onChange={(e) => setAtsCheckerText(e.target.value)}
                          disabled={isAnalyzingAts}
                        />

                        <Button
                          className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                          onClick={() => handleAtsAnalysis()}
                          disabled={isAnalyzingAts || !atsCheckerText.trim()}
                        >
                          {isAnalyzingAts ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="mr-2 h-5 w-5" />
                              Analyze ATS Score
                            </>
                          )}
                        </Button>

                        {/* What We Check */}
                        <div className="p-6 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-amber-600" />
                            What We Analyze
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Keyword optimization</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Format compatibility</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Section structure</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Contact information</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Experience descriptions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Skills matching</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Preview Section with ATS Score and AI Chat */
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column: Resume Preview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Back Button */}
                <button
                  onClick={() => setCurrentStep('input')}
                  className="mb-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Import</span>
                </button>

                <Card className="card-lavender hover-lavender border-2 border-purple-200/50 hover:border-purple-300/70 shadow-xl backdrop-blur-xl">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold professional-heading mb-2">
                        <span className="cosmic-gradient-text">Your Resume Preview</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-base">
                        Review, edit, and download your professional resume
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAIChat(!showAIChat)}
                        className="border-purple-300/50 hover:border-purple-400 hover:scale-105 transition-all"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {showAIChat ? 'Hide' : 'Show'} AI Coach
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('input')}
                        className="border-purple-300/50 hover:border-purple-400 hover:scale-105 transition-all"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Edit Data
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Resume/CV Toggle */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex flex-col">
                        <Label htmlFor="cv-mode" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {isCV ? 'CV Mode (2+ pages)' : 'Resume Mode (1 page)'}
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {isCV ? 'Allows multiple pages for detailed experience' : 'Fits content to a single page'}
                        </p>
                      </div>
                      <Switch
                        id="cv-mode"
                        checked={isCV}
                        onCheckedChange={setIsCV}
                      />
                    </div>


                    {/* Resume Preview */}
                    {/* View Mode Toggle - Only show on desktop/tablet */}
                    {!isMobile && (
                      <div className="flex justify-end px-1 mb-2">
                        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto max-w-full">
                          <Button
                            variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => {
                              setViewMode('mobile');
                              setScale(1);
                            }}
                            className="h-7 text-xs whitespace-nowrap"
                          >
                            📱 Mobile View
                          </Button>
                          <Button
                            variant={viewMode === 'fit' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('fit')}
                            className="h-7 text-xs whitespace-nowrap"
                          >
                            📄 Fit to Screen
                          </Button>
                          <Button
                            variant={viewMode === 'actual' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('actual')}
                            className="h-7 text-xs whitespace-nowrap"
                          >
                            🔍 Actual Size
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Resume Preview Container */}
                    {viewMode === 'mobile' ? (
                      // Mobile Read Mode - Simple, fully responsive, no constraints
                      <div
                        className="w-full bg-white rounded-lg shadow-2xl border border-gray-200"
                        style={{
                          maxWidth: '100%',
                          overflow: 'visible',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <ResumePreview
                          ref={resumePreviewRef}
                          resume={resumeData}
                          template={selectedTemplate}
                          showControls={false}
                          isCV={isCV}
                          layoutMode='responsive'
                          viewType='mobile'
                        />
                      </div>
                    ) : (
                      // PDF Preview or Full Size - with scaling/scrolling
                      <div
                        ref={containerRef}
                        className={`bg-white rounded-lg border border-gray-200 shadow-lg transition-all duration-300 ${viewMode === 'fit' ? 'overflow-hidden' : 'overflow-auto'
                          }`}
                        style={{
                          height: viewMode === 'fit'
                            ? 'auto'
                            : '600px',
                          maxHeight: viewMode === 'fit' ? '80vh' : 'none'
                        }}
                      >
                        <div
                          style={{
                            transform: viewMode === 'fit' ? `scale(${scale})` : 'none',
                            transformOrigin: 'top left',
                            width: viewMode === 'fit' ? '210mm' : 'auto',
                          }}
                        >
                          <ResumePreview
                            ref={resumePreviewRef}
                            resume={resumeData}
                            template={selectedTemplate}
                            showControls={false}
                            isCV={isCV}
                            layoutMode={viewMode === 'fit' ? 'fixed' : 'responsive'}
                            viewType='print'
                          />
                        </div>
                      </div>
                    )}

                    {/* Download & Edit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => resumePreviewRef.current?.exportToPDF()}
                        className="flex-1 bolt-gradient hover:scale-105 transition-all duration-300 bolt-glow text-white shadow-lg"
                        size="lg"
                      >
                        <FileDown className="mr-2 h-5 w-5" />
                        <span className="font-semibold">Download {isCV ? 'CV' : 'Resume'} PDF</span>
                      </Button>
                      <Button
                        onClick={() => resumePreviewRef.current?.exportToWord()}
                        className="flex-1 sunset-gradient hover:scale-105 transition-all duration-300 text-white shadow-lg"
                        size="lg"
                      >
                        <FileDown className="mr-2 h-5 w-5" />
                        <span className="font-semibold">Download DOCX</span>
                      </Button>
                      <Button
                        onClick={() => resumePreviewRef.current?.toggleEdit()}
                        variant="outline"
                        className="flex-1 hover:scale-105 transition-all duration-300"
                        size="lg"
                      >
                        <Edit className="mr-2 h-5 w-5" />
                        <span className="font-semibold">Edit {isCV ? 'CV' : 'Resume'}</span>
                      </Button>
                    </div>

                    {/* Publish Online Section */}
                    <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Globe className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                            Publish Your {isCV ? 'CV' : 'Resume'} Online
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Get a free subdomain or use your custom domain (premium)
                          </p>
                        </div>
                      </div>

                      {isPublished && subdomain ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-600">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                                  {publishedUrl || `${subdomain}.docmagic.app`}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={copySubdomainUrl}
                                  className="flex-shrink-0"
                                  title="Copy URL"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleNativeShare}
                                  className="flex-shrink-0"
                                  title="Share"
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(publishedUrl, '_blank')}
                                  className="flex-shrink-0"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => setShowSubdomainDialog(true)}
                            variant="outline"
                            className="w-full"
                          >
                            Change Subdomain
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setShowSubdomainDialog(true)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:scale-105 transition-all"
                          size="lg"
                        >
                          <Globe className="mr-2 h-5 w-5" />
                          Publish Online (Free)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: ATS Score & AI Chat */}
              <div className="space-y-6">
                {/* ATS Score */}
                {atsScore && <ATSScoreDisplay atsScore={atsScore} />}

                {/* AI Chat */}
                {showAIChat && (
                  <AIResumeChat
                    resumeData={resumeData}
                    onResumeUpdate={(updated: any) => setResumeData(updated)}
                  />
                )}

                {/* Quick Tips */}
                {!showAIChat && (
                  <Card className="glass-effect border-2 border-blue-200/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <span>Pro Tips</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Use the AI Coach to improve your resume in real-time</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Target 85%+ ATS score for best results</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Add metrics and numbers to achievements</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Use keywords from your target job description</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subdomain Publishing Dialog */}
      <Dialog open={showSubdomainDialog} onOpenChange={setShowSubdomainDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              <span className="bolt-gradient-text">Publish Your {isCV ? 'CV' : 'Resume'} Online</span>
            </DialogTitle>
            <DialogDescription>
              Choose how you want to host your {isCV ? 'CV' : 'resume'} online
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Free Subdomain Option */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Free Subdomain</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">yourname.docmagic.app</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="subdomain">Choose your subdomain</Label>
                <div className="flex gap-2">
                  <Input
                    id="subdomain"
                    placeholder="yourname"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1"
                  />
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    .docmagic.app
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <Button
                onClick={handlePublishToSubdomain}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Globe className="mr-2 h-5 w-5" />
                Publish to Subdomain (Free)
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Custom Domain Option (Premium) */}
            <div className="space-y-4 opacity-75">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Custom Domain
                    <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">
                      PREMIUM
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">yourdomain.com</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="custom-domain">Your custom domain</Label>
                <Input
                  id="custom-domain"
                  placeholder="www.yourdomain.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>

              <Button
                disabled
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                size="lg"
              >
                <Crown className="mr-2 h-5 w-5" />
                Upgrade to Premium
              </Button>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Premium features:</strong> Custom domain, remove branding, advanced analytics, priority support
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6 text-blue-600" />
              <span className="bolt-gradient-text">Share Your {isCV ? 'CV' : 'Resume'}</span>
            </DialogTitle>
            <DialogDescription>
              Share your professional {isCV ? 'CV' : 'resume'} with recruiters, colleagues, or on social media
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* URL Display */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your resume URL:</p>
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                {publishedUrl}
              </p>
            </div>

            {/* Social Media Platforms */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Share on Social Media
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareOnWhatsApp}
                  variant="outline"
                  className="w-full justify-start hover:bg-green-50 hover:border-green-500 dark:hover:bg-green-900/20"
                >
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </Button>

                <Button
                  onClick={shareOnLinkedIn}
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-900/20"
                >
                  <Linkedin className="mr-2 h-5 w-5" />
                  LinkedIn
                </Button>

                <Button
                  onClick={shareOnTwitter}
                  variant="outline"
                  className="w-full justify-start hover:bg-sky-50 hover:border-sky-500 dark:hover:bg-sky-900/20"
                >
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter/X
                </Button>

                <Button
                  onClick={shareOnFacebook}
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-600 dark:hover:bg-blue-900/20"
                >
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>

                <Button
                  onClick={shareOnTelegram}
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-blue-900/20"
                >
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
                </Button>

                <Button
                  onClick={shareViaEmail}
                  variant="outline"
                  className="w-full justify-start hover:bg-gray-50 hover:border-gray-500 dark:hover:bg-gray-800"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Button>
              </div>
            </div>

            {/* Copy Link Button */}
            <div className="pt-2">
              <Button
                onClick={() => {
                  copySubdomainUrl();
                  setShowShareDialog(false);
                }}
                variant="outline"
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
