---
description: How to add a new resume template to the application
---

# Add Resume Template Workflow

This workflow describes the steps to add a new premium, editable resume template to the application.

## 1. Add Template Metadata
Open `lib/resume-template-data.ts` and add a new object to the `RESUME_TEMPLATES` array.
Ensure you provide a unique `id`, `title`, `description`, `category`, `type: 'resume'`, and other required fields.

```typescript
{
  id: 'new-template-id',
  title: 'New Template Title',
  description: 'Description of the template.',
  category: 'Modern', // or Academic, Creative, Professional
  type: 'resume',
  previewImage: '/templates/previews/new-template.png',
  pdfUrl: '/New_Template.pdf',
  colorScheme: ['#HEX1', '#HEX2'],
  tags: ['Tag1', 'Tag2'],
  difficulty: 'intermediate',
  isPro: true,
  isFeatured: false,
  rating: 4.5,
  downloads: 0,
  author: { name: 'DraftDeckAI Team', verified: true },
},
```

## 2. Implement Render Function
Open `components/resume/resume-preview.tsx`.
Create a new render function for your template (e.g., `renderNewTemplate`).
This function should return the JSX for the resume layout.
Use `EditableText` for text fields to allow user editing.
Use `resume` prop for display mode and `editableResume` for edit mode.

```tsx
const renderNewTemplate = () => (
  <div className="w-full bg-white..." id="resume-content">
    {/* Template Layout */}
    <h1>
      {isEditing ? (
        <EditableText value={editableResume.name} onChange={v => updateField(["name"], v)} />
      ) : (
        resume.name
      )}
    </h1>
    {/* ... rest of the template ... */}
  </div>
);
```

## 3. Update Switch Logic
In `components/resume/resume-preview.tsx`, locate the main return statement (switch block) at the end of the component.
Add a case for your new template ID (or a keyword it contains) to call your new render function.

```tsx
switch (true) {
  // ... existing cases ...
  case template.includes('new-template-id'):
    return renderNewTemplate();
  default:
    return renderProfessionalTemplate();
}
```

## 4. Verify
- Check that the template appears in the `ResumeTemplateGallery`.
- Select the template and verify it loads the correct layout in the editor.
- Test editing fields to ensure `EditableText` works correctly.
