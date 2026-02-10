"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ResumePreview } from "@/components/resume/resume-preview";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PublicResumePage() {
  const params = useParams();
  const subdomain = params.subdomain as string;
  const [resumeData, setResumeData] = useState<any>(null);
  const [isCV, setIsCV] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resume/publish?subdomain=${subdomain}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load resume");
        }

        setResumeData(data.data.resume_data);
        setIsCV(data.data.is_cv);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      fetchResume();
    }
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading {isCV ? 'CV' : 'resume'}...</p>
        </div>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resume Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || "This resume doesn't exist or has been removed."}
          </p>
          <Link href="/resume">
            <Button className="bolt-gradient text-white">
              Create Your Own Resume
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {resumeData.name || "Professional Resume"}
            </h1>
            <p className="text-sm text-gray-600">
              {subdomain}.draftdeckai.app
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/resume">
              <Button variant="outline" size="sm">
                Create Your Own
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Resume Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <ResumePreview 
            resume={resumeData} 
            template="modern"
            showControls={false}
            isCV={isCV}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Powered by <Link href="/" className="font-semibold text-blue-600 hover:underline">DraftDeckAI</Link>
          </p>
          <Link href="/resume">
            <Button className="bolt-gradient text-white shadow-lg hover:scale-105 transition-transform">
              <Download className="mr-2 h-4 w-4" />
              Create Your Professional Resume
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
