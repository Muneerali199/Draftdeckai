'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface ResumeFormEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export function ResumeFormEditor({ data, onChange }: ResumeFormEditorProps) {

  /* ------------------ COMMON HELPERS ------------------ */
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  /* ------------------ EXPERIENCE ------------------ */
  const addExperience = () => {
    onChange({
      ...data,
      experience: [
        ...(data.experience || []),
        {
          title: '',
          company: '',
          location: '',
          date: '',
          description: ['']
        }
      ]
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const newExp = [...data.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...data, experience: newExp });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...data,
      experience: data.experience.filter((_: any, i: number) => i !== index)
    });
  };

  /* ------------------ SKILLS ------------------ */
  const addSkill = (skill: string) => {
    if (!skill.trim()) return;

    onChange({
      ...data,
      skills: {
        ...data.skills,
        programming: [...(data.skills?.programming || []), skill.trim()]
      }
    });
  };

  const removeSkill = (index: number) => {
    onChange({
      ...data,
      skills: {
        ...data.skills,
        programming: data.skills.programming.filter(
          (_: any, i: number) => i !== index
        )
      }
    });
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="space-y-8">

      {/* ================= PERSONAL INFO ================= */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Personal Information
        </h2>

        <div>
          <Label>Full Name</Label>
          <Input
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={data.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Location</Label>
            <Input
              value={data.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input
              value={data.linkedin}
              onChange={(e) => updateField('linkedin', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>GitHub</Label>
          <Input
            value={data.github}
            onChange={(e) => updateField('github', e.target.value)}
          />
        </div>

        <div>
          <Label>Professional Summary</Label>
          <Textarea
            value={data.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {/* ================= SKILLS ================= */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Skills</h2>

        <Input
          placeholder="Add a skill and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addSkill(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />

        <div className="flex flex-wrap gap-2">
          {data.skills?.programming?.map((skill: string, index: number) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-full"
            >
              <span>{skill}</span>
              <button onClick={() => removeSkill(index)}>
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= EXPERIENCE ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Work Experience
          </h2>
          <Button onClick={addExperience} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>

        {data.experience?.map((exp: any, index: number) => (
          <div
            key={index}
            className="p-4 border rounded-lg space-y-3 bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">
                Experience {index + 1}
              </h3>
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
                  value={exp.title}
                  onChange={(e) =>
                    updateExperience(index, 'title', e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={exp.company}
                  onChange={(e) =>
                    updateExperience(index, 'company', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Input
                  value={exp.location}
                  onChange={(e) =>
                    updateExperience(index, 'location', e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Date Range</Label>
                <Input
                  value={exp.date}
                  onChange={(e) =>
                    updateExperience(index, 'date', e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={exp.description?.[0] || ''}
                onChange={(e) =>
                  updateExperience(index, 'description', [e.target.value])
                }
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
