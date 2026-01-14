"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LetterPreview } from "@/components/letter/letter-preview";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Mail as MailIcon, Download, User, MapPin, FileText, Wand2, Copy, Check, Send } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export function LetterGenerator() {
  const [prompt, setPrompt] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
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
  const [fromEmail, setFromEmail] = useState("");
  const { toast } = useToast();
  const supabase = createClient();

  // Email validation function
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
      if (process.env.NODE_ENV !== "production") {
        console.log('DEBUG: Generating letter, Session User:', session?.user?.email);
        console.log('DEBUG: Access Token Present:', !!session?.access_token);
      }

      const response = await fetch('/api/generate/letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
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
        throw new Error('Failed to generate letter');
      }

      const data = await response.json();

      // Ensure the letter object has the expected structure
      const formattedLetter = {
        from: {
          name: data.from?.name || fromName,
          address: data.from?.address || fromAddress || ""
        },
        to: {
          name: data.to?.name || toName,
          address: data.to?.address || toAddress || ""
        },
        date: data.date || new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        subject: data.subject || "Re: " + prompt.substring(0, 30) + "...",
        content: data.content || "Letter content not available."
      };

      setLetterData(formattedLetter);

      toast({
        title: "Letter generated! ✨",
        description: "Your professional letter is ready to preview and download",
      });
    } catch (error) {
      console.error("Error generating letter:", error);
      toast({
        title: "Error",
        description: "Failed to generate letter. Please try again.",
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
${letterData.from.name || ''}
${letterData.from.address || ''}

${letterData.date || ''}

${letterData.to.name || ''}
${letterData.to.address || ''}

Subject: ${letterData.subject || ''}

${letterData.content || ''}
      `.trim();

      await navigator.clipboard.writeText(letterText);

      toast({
        title: "Copied to clipboard!",
        description: "Letter content has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy letter to clipboard. Please try again.",
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
      const element = document.getElementById('letter-preview');
      if (!element) throw new Error('Letter preview element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      // A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate ratio to fit the image within the PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${letterType}-letter.pdf`);

      toast({
        title: "Letter exported!",
        description: "Your letter has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Export failed",
        description: "Failed to export letter to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openSendEmailDialog = () => {
    if (!letterData) return;

    // Pre-fill the email form
    setEmailTo(letterData.to.name ? `${letterData.to.name} <${letterData.to.email || ''}>` : '');
    setEmailSubject(letterData.subject || `${letterType.charAt(0).toUpperCase() + letterType.slice(1)} Letter`);
    setEmailContent('');

    setShowEmailDialog(true);
  };

  const sendEmail = async () => {
    if (!letterData || !emailTo) return;

    // Validate email before sending
    if (!isValidEmail(emailTo)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid recipient email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          content: emailContent,
          fromName: fromName,
          fromEmail: fromEmail,
          letterContent: letterData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const data = await response.json();

      toast({
        title: "Email sent successfully! ✨",
        description: "Your letter has been emailed to the recipient",
      });

      // Close the dialog
      setShowEmailDialog(false);

      // If there's a preview URL (for test emails), show it
      if (data.previewUrl) {
        window.open(data.previewUrl, '_blank');
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Side - Form */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect mb-3">
              <Wand2 className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">AI Letter Generator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 bolt-gradient-text">
              Generate Your Letter
            </h2>
            <p className="text-sm text-muted-foreground">
              Fill in the details and let AI craft the perfect letter for you
            </p>
          </div>

          <div className="space-y-4">
            {/* Letter Type */}
            <div className="space-y-2">
              <Label htmlFor="letterType" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Letter Type
              </Label>
              <Select value={letterType} onValueChange={setLetterType}>
                <SelectTrigger
                  id="letterType"
                  className="glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20"
                >
                  <SelectValue placeholder="Select letter type" />
                </SelectTrigger>
                <SelectContent className="glass-effect border-yellow-400/20">
                  <SelectItem value="cover">Cover Letter</SelectItem>
                  <SelectItem value="business">Business Letter</SelectItem>
                  <SelectItem value="thank">Thank You Letter</SelectItem>
                  <SelectItem value="recommendation">Recommendation Letter</SelectItem>
                  <SelectItem value="complaint">Complaint Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From/To Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromName" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  From (Name)
                </Label>
                <Input
                  id="fromName"
                  placeholder="Your Name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toName" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  To (Name)
                </Label>
                <Input
                  id="toName"
                  placeholder="Recipient Name"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  className="glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromAddress" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  From (Address)
                </Label>
                <Input
                  id="fromAddress"
                  placeholder="Your Address (Optional)"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  className="glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toAddress" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  To (Address)
                </Label>
                <Input
                  id="toAddress"
                  placeholder="Recipient Address (Optional)"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail" className="text-sm font-medium flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                Your Email (For Sending)
              </Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="your.email@example.com (Optional)"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Only needed if you plan to send the letter via email
              </p>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Describe your letter
              </Label>
              <Textarea
                id="prompt"
                placeholder="E.g., A cover letter for a software developer position at Google, highlighting my experience with React and cloud technologies"
                className="min-h-[120px] text-base glass-effect border-yellow-400/30 focus:border-yellow-400/60 focus:ring-yellow-400/20 resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateLetter}
              disabled={isGenerating || !prompt.trim() || !fromName.trim() || !toName.trim()}
              className="w-full bolt-gradient text-white font-semibold py-3 rounded-xl hover:scale-105 transition-all duration-300 bolt-glow relative overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Letter</span>
                    <Wand2 className="h-4 w-4" />
                  </>
                )}
              </div>

              {!isGenerating && (
                <div className="absolute inset-0 shimmer opacity-30"></div>
              )}
            </Button>
          </div>

          {/* Download Options */}
          {letterData && (
            <div className="glass-effect p-4 rounded-xl border border-yellow-400/20">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Download className="h-4 w-4 text-yellow-500" />
                Letter Options
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                  onClick={exportToPDF}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                  onClick={copyToClipboard}
                  disabled={isCopying}
                >
                  {isCopying ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline"
                  className="glass-effect border-yellow-400/30 hover:border-yellow-400/60"
                  onClick={openSendEmailDialog}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send via Email
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-4">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-effect mb-3">
              <MailIcon className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">Live Preview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold bolt-gradient-text">Preview</h2>
          </div>

          {letterData ? (
            <div id="letter-preview" className="glass-effect border border-yellow-400/20 rounded-xl overflow-hidden bg-white relative">
              <div className="absolute inset-0 shimmer opacity-10"></div>
              <div className="relative z-10">
                <LetterPreview letter={letterData} />
              </div>
            </div>
          ) : (
            <Card className="glass-effect border border-yellow-400/20 flex items-center justify-center min-h-[500px] relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-10"></div>
              <CardContent className="py-10 relative z-10">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <MailIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">
                      {isGenerating
                        ? "Creating your letter with AI magic..."
                        : "Your letter preview will appear here"}
                    </p>
                    {isGenerating && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Email Sending Dialog */}
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
              <Label htmlFor="emailTo" className="text-sm font-medium flex items-center gap-2">
                To Email Address
                {emailTo && isValidEmail(emailTo) && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </Label>
              <Input
                id="emailTo"
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className={`${emailTo && !isValidEmail(emailTo) && emailTo.length > 0
                  ? "border-red-400 focus:border-red-500"
                  : ""
                  }`}
                required
              />
              {emailTo && emailTo.length > 0 && !isValidEmail(emailTo) && (
                <p className="text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailSubject" className="text-sm font-medium">
                Subject
              </Label>
              <Input
                id="emailSubject"
                placeholder="Letter Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailContent" className="text-sm font-medium">
                Additional Message (Optional)
              </Label>
              <Textarea
                id="emailContent"
                placeholder="Add a personal note to accompany your letter..."
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
              disabled={isSending || !emailTo}
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
