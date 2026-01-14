'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, Upload, Sparkles, Code, Edit3, Download, Save } from 'lucide-react';
import { ResumeFormEditor } from '@/components/resume-editor/form-editor';
import { ResumeLatexEditor } from '@/components/resume-editor/latex-editor';
import { ResumeAIEditor } from '@/components/resume-editor/ai-editor';
import { ResumePreviewPanel } from '@/components/resume-editor/preview-panel';
import { toast } from 'sonner';

export default function ResumeEditorPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState<'form' | 'latex' | 'ai'>('form');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');

  const [resumeData, setResumeData] = useState({
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
  });

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
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-100 text-gray-900 border-0">
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Button>
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-100 text-gray-900 border-0">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
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
              </TabsTrigger>
              <TabsTrigger value="latex" className="gap-2">
                <Code className="w-4 h-4" />
                LaTeX Code
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="form"
              forceMount={true}
              className={`flex flex-col overflow-hidden min-h-0 p-0 mt-0 ${editMode === 'form' ? 'flex-1' : 'h-[10px] flex-none'}`}
            >
              <div className="flex-1 overflow-y-auto p-6">
                <ResumeFormEditor data={resumeData} onChange={setResumeData} />
              </div>
            </TabsContent>

            <TabsContent
              value="latex"
              forceMount={true}
              className={`flex flex-col overflow-hidden min-h-0 p-0 mt-0 ${editMode === 'latex' ? 'flex-1' : 'h-[10px] flex-none'}`}
            >
              <div className="flex-1 overflow-y-auto p-6">
                <ResumeLatexEditor data={resumeData} onChange={setResumeData} />
              </div>
            </TabsContent>

            <TabsContent
              value="ai"
              forceMount={true}
              className={`flex flex-col overflow-hidden min-h-0 p-0 mt-0 ${editMode === 'ai' ? 'flex-1' : 'h-[10px] flex-none'}`}
            >
              <div className="flex-1 overflow-y-auto p-6">
                <ResumeAIEditor data={resumeData} onChange={setResumeData} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT - Live Preview */}
        <div className="w-1/2 bg-gradient-to-br from-gray-100 to-gray-200 overflow-auto">
          <ResumePreviewPanel data={resumeData} template={selectedTemplate} onTemplateChange={setSelectedTemplate} />
        </div>
      </div>
    </div>
  );
}
