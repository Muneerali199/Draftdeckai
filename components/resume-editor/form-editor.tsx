'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GraduationCap, Briefcase, Code, Award, FolderOpen } from 'lucide-react';

interface ResumeFormEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export function ResumeFormEditor({ data, onChange }: ResumeFormEditorProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Experience handlers
  const addExperience = () => {
    onChange({
      ...data,
      experience: [...(data.experience || []), {
        title: '',
        company: '',
        location: '',
        date: '',
        description: ['']
      }]
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const newExp = [...data.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...data, experience: newExp });
  };

  const removeExperience = (index: number) => {
    onChange({ ...data, experience: data.experience.filter((_: any, i: number) => i !== index) });
  };

  // Education handlers
  const addEducation = () => {
    onChange({
      ...data,
      education: [...(data.education || []), {
        degree: '',
        institution: '',
        location: '',
        date: '',
        gpa: ''
      }]
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const newEdu = [...(data.education || [])];
    newEdu[index] = { ...newEdu[index], [field]: value };
    onChange({ ...data, education: newEdu });
  };

  const removeEducation = (index: number) => {
    onChange({ ...data, education: data.education.filter((_: any, i: number) => i !== index) });
  };

  // Skills handlers
  const updateSkills = (category: string, value: string) => {
    const skills = value.split(',').map(s => s.trim()).filter(s => s);
    onChange({
      ...data,
      skills: { ...(data.skills || {}), [category]: skills }
    });
  };

  // Projects handlers
  const addProject = () => {
    onChange({
      ...data,
      projects: [...(data.projects || []), {
        name: '',
        description: '',
        technologies: []
      }]
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    const newProjects = [...(data.projects || [])];
    newProjects[index] = { ...newProjects[index], [field]: value };
    onChange({ ...data, projects: newProjects });
  };

  const removeProject = (index: number) => {
    onChange({ ...data, projects: data.projects.filter((_: any, i: number) => i !== index) });
  };

  // Certifications handlers
  const addCertification = () => {
    onChange({
      ...data,
      certifications: [...(data.certifications || []), {
        name: '',
        issuer: '',
        date: ''
      }]
    });
  };

  const updateCertification = (index: number, field: string, value: any) => {
    const newCerts = [...(data.certifications || [])];
    newCerts[index] = { ...newCerts[index], [field]: value };
    onChange({ ...data, certifications: newCerts });
  };

  const removeCertification = (index: number) => {
    onChange({ ...data, certifications: data.certifications.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Personal Information
        </h2>

        <div>
          <Label>Full Name</Label>
          <Input value={data.name || ''} onChange={(e) => updateField('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input value={data.email || ''} onChange={(e) => updateField('email', e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={data.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Location</Label>
            <Input value={data.location || ''} onChange={(e) => updateField('location', e.target.value)} />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input value={data.linkedin || ''} onChange={(e) => updateField('linkedin', e.target.value)} placeholder="linkedin.com/in/yourname" />
          </div>
        </div>

        <div>
          <Label>GitHub</Label>
          <Input value={data.github || ''} onChange={(e) => updateField('github', e.target.value)} placeholder="github.com/yourname" />
        </div>

        <div>
          <Label>Professional Summary</Label>
          <Textarea
            value={data.summary || ''}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={4}
            placeholder="A brief summary highlighting your key skills and experience..."
          />
        </div>
      </div>

      {/* Work Experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Work Experience
          </h2>
          <Button onClick={addExperience} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>

        {data.experience?.map((exp: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-blue-700">Experience {index + 1}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeExperience(index)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Job Title</Label>
                <Input
                  value={exp.title || ''}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={exp.company || ''}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Input
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(index, 'location', e.target.value)}
                />
              </div>
              <div>
                <Label>Date Range</Label>
                <Input
                  value={exp.date || ''}
                  onChange={(e) => updateExperience(index, 'date', e.target.value)}
                  placeholder="Jan 2020 - Present"
                />
              </div>
            </div>

            <div>
              <Label>Description (bullet points, one per line)</Label>
              <Textarea
                value={Array.isArray(exp.description) ? exp.description.join('\n') : exp.description || ''}
                onChange={(e) => updateExperience(index, 'description', e.target.value.split('\n').filter(s => s.trim()))}
                rows={4}
                placeholder="• Led development of microservices serving 2M+ users...&#10;• Reduced API response time by 60%..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education
          </h2>
          <Button onClick={addEducation} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </div>

        {data.education?.map((edu: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-green-50">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-green-700">Education {index + 1}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(index)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Degree</Label>
                <Input
                  value={edu.degree || ''}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="B.S. in Computer Science"
                />
              </div>
              <div>
                <Label>Institution</Label>
                <Input
                  value={edu.institution || ''}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="University Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Location</Label>
                <Input
                  value={edu.location || ''}
                  onChange={(e) => updateEducation(index, 'location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  value={edu.date || ''}
                  onChange={(e) => updateEducation(index, 'date', e.target.value)}
                  placeholder="2014 - 2018"
                />
              </div>
              <div>
                <Label>GPA (optional)</Label>
                <Input
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                  placeholder="3.8/4.0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Skills
        </h2>

        <div className="space-y-3">
          <div>
            <Label>Programming Languages (comma-separated)</Label>
            <Input
              value={Array.isArray(data.skills?.programming) ? data.skills.programming.join(', ') : ''}
              onChange={(e) => updateSkills('programming', e.target.value)}
              placeholder="JavaScript, TypeScript, Python, Java"
            />
          </div>
          <div>
            <Label>Technical Skills / Frameworks (comma-separated)</Label>
            <Input
              value={Array.isArray(data.skills?.technical) ? data.skills.technical.join(', ') : ''}
              onChange={(e) => updateSkills('technical', e.target.value)}
              placeholder="React, Node.js, Express, Next.js, Redux"
            />
          </div>
          <div>
            <Label>Tools & Technologies (comma-separated)</Label>
            <Input
              value={Array.isArray(data.skills?.tools) ? data.skills.tools.join(', ') : ''}
              onChange={(e) => updateSkills('tools', e.target.value)}
              placeholder="AWS, Docker, Kubernetes, Git, Jenkins"
            />
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Projects
          </h2>
          <Button onClick={addProject} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {data.projects?.map((project: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-purple-50">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-purple-700">Project {index + 1}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProject(index)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>

            <div>
              <Label>Project Name</Label>
              <Input
                value={project.name || ''}
                onChange={(e) => updateProject(index, 'name', e.target.value)}
                placeholder="E-Commerce Platform"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={project.description || ''}
                onChange={(e) => updateProject(index, 'description', e.target.value)}
                rows={2}
                placeholder="Built a full-stack application with..."
              />
            </div>

            <div>
              <Label>Technologies (comma-separated)</Label>
              <Input
                value={Array.isArray(project.technologies) ? project.technologies.join(', ') : ''}
                onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s))}
                placeholder="React, Node.js, MongoDB"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certifications
          </h2>
          <Button onClick={addCertification} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>

        {data.certifications?.map((cert: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-amber-50">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-amber-700">Certification {index + 1}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCertification(index)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Certification Name</Label>
                <Input
                  value={cert.name || ''}
                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                  placeholder="AWS Certified Solutions Architect"
                />
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  value={cert.date || ''}
                  onChange={(e) => updateCertification(index, 'date', e.target.value)}
                  placeholder="2023"
                />
              </div>
            </div>

            <div>
              <Label>Issuing Organization</Label>
              <Input
                value={cert.issuer || ''}
                onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                placeholder="Amazon Web Services"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
