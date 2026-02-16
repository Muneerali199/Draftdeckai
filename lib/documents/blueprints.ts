/**
 * DraftDeckAI Productivity Engine - Document Blueprints
 * Hardcoded document structures for consistent generation
 */

import { DocumentBlueprint, DocumentType, DocumentTone } from '@/types/documents';

export const documentBlueprints: Record<DocumentType, DocumentBlueprint> = {
  'business-proposal': {
    type: 'business-proposal',
    name: 'Business Proposal',
    description: 'Persuasive document to win clients and partnerships',
    icon: 'briefcase',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'High-level hook capturing attention',
        order: 1,
        promptTemplate: `Write a compelling executive summary for a business proposal.
Context: {{context}}
Client: {{clientName}}
Problem: {{problemStatement}}
Solution: {{proposedSolution}}

Create a 2-3 paragraph summary that:
- Opens with a strong hook
- Clearly states the problem
- Presents the solution
- Includes key benefits
- Has a clear call-to-action

Tone: {{tone}}`,
      },
      {
        id: 'problem-statement',
        title: 'Problem Statement',
        description: 'Demonstrate deep understanding of client pain points',
        order: 2,
        promptTemplate: `Write a detailed problem statement section.
Context: {{context}}
Client: {{clientName}}
Problem: {{problemStatement}}

Structure:
1. Current situation analysis
2. Pain points and challenges
3. Impact of not solving the problem
4. Why existing solutions fail

Use data from context files where available. Cite sources using [source: filename].

Tone: {{tone}}`,
      },
      {
        id: 'proposed-solution',
        title: 'Proposed Solution',
        description: 'Technical or strategic approach to solve the problem',
        order: 3,
        promptTemplate: `Write a comprehensive solution section.
Context: {{context}}
Solution: {{proposedSolution}}

Structure:
1. Overview of the proposed solution
2. Key features and capabilities
3. How it addresses each pain point
4. Unique value proposition
5. Success metrics

Include a [DIAGRAM: FLOWCHART_DATA] showing the solution workflow.

Tone: {{tone}}`,
      },
      {
        id: 'methodology',
        title: 'Methodology',
        description: 'How the work will be executed',
        order: 4,
        promptTemplate: `Write the methodology/approach section.
Context: {{context}}
Solution: {{proposedSolution}}

Structure:
1. Project phases
2. Deliverables for each phase
3. Collaboration approach
4. Quality assurance methods
5. Communication plan

Include a [DIAGRAM: TIMELINE_DATA] showing project phases.

Tone: {{tone}}`,
      },
      {
        id: 'pricing-timeline',
        title: 'Pricing & Timeline',
        description: 'Cost breakdown and project schedule',
        order: 5,
        promptTemplate: `Create a detailed pricing and timeline section.
Pricing Model: {{pricingModel}}
Timeline: {{timelineEstimation}}

Structure:
1. Investment summary
2. Detailed cost breakdown
3. Payment schedule
4. Project timeline with milestones
5. Terms and conditions

Include a [DIAGRAM: GANTT_CHART_DATA] for the timeline and a formatted table for pricing.

Tone: {{tone}}`,
      },
      {
        id: 'terms-conditions',
        title: 'Terms & Conditions',
        description: 'Legal framework and agreement details',
        order: 6,
        optional: true,
        promptTemplate: `Write standard terms and conditions for a business proposal.

Include sections on:
1. Acceptance criteria
2. Payment terms
3. Intellectual property
4. Confidentiality
5. Limitation of liability
6. Termination clauses

Tone: professional and legal`,
      },
    ],
    requiredInputs: [
      { id: 'clientName', label: 'Client Name', type: 'text', required: true, placeholder: 'e.g., Acme Corporation' },
      { id: 'problemStatement', label: 'Problem to Solve', type: 'textarea', required: true, placeholder: 'Describe the client\'s challenge...' },
      { id: 'proposedSolution', label: 'Proposed Solution', type: 'textarea', required: true, placeholder: 'Describe your solution...' },
      { id: 'pricingModel', label: 'Pricing Model', type: 'textarea', required: true, placeholder: 'e.g., $50,000 fixed price or hourly rate' },
      { id: 'timelineEstimation', label: 'Timeline Estimation', type: 'text', required: true, placeholder: 'e.g., 8-12 weeks' },
      { id: 'tone', label: 'Document Tone', type: 'select', required: false, options: ['startup', 'professional', 'academic'], placeholder: 'startup' },
    ],
  },

  'project-report': {
    type: 'project-report',
    name: 'Project Report',
    description: 'Comprehensive status update for stakeholders',
    icon: 'clipboard-list',
    sections: [
      {
        id: 'status-summary',
        title: 'Status Summary',
        description: 'RAG status and high-level overview',
        order: 1,
        promptTemplate: `Write a project status summary.
Project: {{projectName}}
Period: {{reportingPeriod}}
Status: {{status}}

Structure:
1. Overall project health (RAG status)
2. Period highlights
3. Key metrics summary
4. Executive summary

Include a [DIAGRAM: PIE_CHART_DATA] showing task completion percentage.

Tone: {{tone}}`,
      },
      {
        id: 'key-accomplishments',
        title: 'Key Accomplishments',
        description: 'What went right this period',
        order: 2,
        promptTemplate: `Document the key accomplishments.
Achievements: {{keyAchievements}}

Structure:
1. Major deliverables completed
2. Milestones achieved
3. Success stories
4. Team highlights
5. Client feedback

Use bullet points and include specific metrics where possible.

Tone: {{tone}}`,
      },
      {
        id: 'risks-issues',
        title: 'Risks & Issues',
        description: 'What is blocking progress',
        order: 3,
        promptTemplate: `Document risks and issues.
Roadblocks: {{roadblocks}}

Structure:
1. Critical issues requiring immediate attention
2. Risks with mitigation strategies
3. Blockers and dependencies
4. Lessons learned
5. Recovery plans

Include a [DIAGRAM: TABLE_DATA] for risk matrix.

Tone: honest and solution-focused`,
      },
      {
        id: 'financial-overview',
        title: 'Financial Overview',
        description: 'Budget utilization and forecasts',
        order: 4,
        promptTemplate: `Create a financial overview section.
Budget Used: {{budgetUsed}}
Budget Total: {{budgetTotal}}

Structure:
1. Budget summary
2. Cost breakdown by category
3. Variance analysis
4. Forecast and projections
5. Financial risks

Include a [DIAGRAM: BAR_CHART_DATA] showing budget utilization.

Tone: {{tone}}`,
      },
      {
        id: 'next-steps',
        title: 'Next Steps',
        description: 'Action items for the next period',
        order: 5,
        promptTemplate: `Document next steps and action items.
Next Steps: {{nextSteps}}

Structure:
1. Priorities for next period
2. Action items with owners
3. Key milestones
4. Resource needs
5. Success criteria

Include a [DIAGRAM: GANTT_CHART_DATA] for upcoming timeline.

Tone: {{tone}}`,
      },
    ],
    requiredInputs: [
      { id: 'projectName', label: 'Project Name', type: 'text', required: true, placeholder: 'e.g., Website Redesign' },
      { id: 'reportingPeriod', label: 'Reporting Period', type: 'text', required: true, placeholder: 'e.g., Q1 2025 or January 2025' },
      { id: 'keyAchievements', label: 'Key Achievements', type: 'textarea', required: true, placeholder: 'List major accomplishments...' },
      { id: 'roadblocks', label: 'Roadblocks & Risks', type: 'textarea', required: true, placeholder: 'Describe challenges and risks...' },
      { id: 'budgetUsed', label: 'Budget Used ($)', type: 'number', required: true, placeholder: 'e.g., 45000' },
      { id: 'budgetTotal', label: 'Total Budget ($)', type: 'number', required: true, placeholder: 'e.g., 100000' },
      { id: 'nextSteps', label: 'Next Steps', type: 'textarea', required: true, placeholder: 'Outline upcoming actions...' },
      { id: 'status', label: 'Project Status', type: 'select', required: true, options: ['red', 'amber', 'green'], placeholder: 'green' },
      { id: 'tone', label: 'Document Tone', type: 'select', required: false, options: ['startup', 'professional', 'academic'], placeholder: 'professional' },
    ],
  },

  'academic-research': {
    type: 'academic-research',
    name: 'Academic/Market Research',
    description: 'Data-driven analysis with proper citations',
    icon: 'graduation-cap',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        description: 'Background, thesis, and research questions',
        order: 1,
        promptTemplate: `Write an academic introduction.
Topic: {{researchTopic}}
Audience: {{targetAudience}}
Context: {{context}}

Structure (IMRaD style):
1. Research background and context
2. Problem statement
3. Research questions/hypothesis
4. Significance of the study
5. Scope and limitations
6. Thesis statement

Cite context files where appropriate using {{citationStyle}} format.

Tone: academic`,
      },
      {
        id: 'methodology',
        title: 'Methodology',
        description: 'Research methods and data collection',
        order: 2,
        promptTemplate: `Write the methodology section.
Methodology: {{methodology}}

Structure:
1. Research design
2. Data collection methods
3. Sample/population description
4. Data analysis techniques
5. Ethical considerations
6. Limitations of methodology

Include a [DIAGRAM: FLOWCHART_DATA] showing research process.

Tone: academic and precise`,
      },
      {
        id: 'results',
        title: 'Results',
        description: 'Data presentation and findings',
        order: 3,
        promptTemplate: `Present research results.
Findings: {{keyFindings}}
Context: {{context}}

Structure:
1. Overview of findings
2. Statistical analysis
3. Key data points
4. Patterns and trends
5. Unexpected findings

Include [DIAGRAM: BAR_CHART_DATA], [DIAGRAM: PIE_CHART_DATA], or [DIAGRAM: TABLE_DATA] for data visualization.

Tone: objective and data-driven`,
      },
      {
        id: 'discussion',
        title: 'Discussion',
        description: 'Interpretation and analysis of results',
        order: 4,
        promptTemplate: `Write the discussion section.
Findings: {{keyFindings}}
Context: {{context}}

Structure:
1. Interpretation of results
2. Comparison with existing literature
3. Implications of findings
4. Theoretical contributions
5. Practical applications
6. Limitations and future research

Reference context files using {{citationStyle}} format.

Tone: analytical and critical`,
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        description: 'Summary and final thoughts',
        order: 5,
        promptTemplate: `Write the conclusion section.
Topic: {{researchTopic}}
Findings: {{keyFindings}}

Structure:
1. Summary of key findings
2. Answer to research questions
3. Contribution to the field
4. Recommendations
5. Future research directions

Include a callout box for "Key Takeaways".

Tone: conclusive and forward-looking`,
      },
      {
        id: 'references',
        title: 'References',
        description: 'Citations and bibliography',
        order: 6,
        optional: true,
        promptTemplate: `Generate a references section.
Citation Style: {{citationStyle}}
Context Files: {{context}}

List all sources cited in the document using {{citationStyle}} format.
Include context files uploaded by the user.

Tone: academic formatting`,
      },
    ],
    requiredInputs: [
      { id: 'researchTopic', label: 'Research Topic', type: 'text', required: true, placeholder: 'e.g., Impact of AI on Healthcare' },
      { id: 'targetAudience', label: 'Target Audience/Demographic', type: 'text', required: true, placeholder: 'e.g., Healthcare professionals' },
      { id: 'keyFindings', label: 'Key Data Points or Findings', type: 'textarea', required: true, placeholder: 'Summarize your research findings...' },
      { id: 'citationStyle', label: 'Citation Style', type: 'select', required: true, options: ['APA', 'MLA', 'Chicago', 'IEEE'], placeholder: 'APA' },
      { id: 'methodology', label: 'Research Methodology', type: 'textarea', required: false, placeholder: 'Describe your research methods...' },
      { id: 'tone', label: 'Document Tone', type: 'select', required: false, options: ['academic', 'professional'], placeholder: 'academic' },
    ],
  },

  'requirements-spec': {
    type: 'requirements-spec',
    name: 'Requirements Specification',
    description: 'Technical product definition (IEEE 830)',
    icon: 'file-code',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        description: 'Scope and purpose of the document',
        order: 1,
        promptTemplate: `Write an introduction for requirements specification.
Product: {{productName}}
Platform: {{platform}}
Context: {{context}}

Structure (IEEE 830):
1. Purpose and scope
2. Document conventions
3. Intended audience
4. Project scope
5. References

Include a [DIAGRAM: MIND_MAP_DATA] showing product scope.

Tone: {{tone}}`,
      },
      {
        id: 'user-requirements',
        title: 'User Requirements',
        description: 'User stories and personas',
        order: 2,
        promptTemplate: `Document user requirements.
Persona: {{userPersona}}
Features: {{coreFeatures}}

Structure:
1. User personas
2. User stories (As a [role], I want [feature] so that [benefit])
3. User scenarios
4. Acceptance criteria
5. User journey maps

Include a [DIAGRAM: FLOWCHART_DATA] showing user journey.

Tone: {{tone}}`,
      },
      {
        id: 'functional-requirements',
        title: 'Functional Requirements',
        description: 'Specific system behaviors',
        order: 3,
        promptTemplate: `Document functional requirements.
Features: {{coreFeatures}}
Product: {{productName}}

Structure:
1. Feature list with priorities
2. Detailed functional specifications
3. Use cases
4. Business rules
5. Data requirements

Include a [DIAGRAM: TABLE_DATA] for requirement traceability matrix.

Tone: technical and precise`,
      },
      {
        id: 'non-functional-requirements',
        title: 'Non-Functional Requirements',
        description: 'Security, performance, reliability',
        order: 4,
        promptTemplate: `Document non-functional requirements.
Constraints: {{constraints}}
Tech Stack: {{techStackPreference}}

Structure:
1. Performance requirements
2. Security requirements
3. Scalability needs
4. Availability and reliability
5. Compliance and standards
6. Constraints and assumptions

Include [DIAGRAM: TABLE_DATA] for NFR categories.

Tone: technical and measurable`,
      },
      {
        id: 'interface-guidelines',
        title: 'Interface Guidelines',
        description: 'UI/UX constraints and standards',
        order: 5,
        promptTemplate: `Document interface guidelines.
Platform: {{platform}}
Constraints: {{constraints}}

Structure:
1. User interface requirements
2. Hardware interfaces
3. Software interfaces
4. Communication interfaces
5. Design system requirements
6. Accessibility standards

Include [DIAGRAM: FLOWCHART_DATA] for system architecture.

Tone: {{tone}}`,
      },
      {
        id: 'appendix',
        title: 'Appendix',
        description: 'Additional technical details',
        order: 6,
        optional: true,
        promptTemplate: `Create an appendix section.
Product: {{productName}}
Tech Stack: {{techStackPreference}}

Include:
1. Glossary of terms
2. Data dictionary
3. Technical architecture diagram
4. API specifications (if applicable)
5. Database schema overview

Include [DIAGRAM: FLOWCHART_DATA] for system architecture.

Tone: technical reference`,
      },
    ],
    requiredInputs: [
      { id: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g., TaskMaster Pro' },
      { id: 'userPersona', label: 'User Persona', type: 'textarea', required: true, placeholder: 'Describe your target user...' },
      { id: 'coreFeatures', label: 'Core Features', type: 'textarea', required: true, placeholder: 'List key features...' },
      { id: 'constraints', label: 'Constraints', type: 'textarea', required: true, placeholder: 'e.g., mobile-first, GDPR compliant, etc.' },
      { id: 'platform', label: 'Platform', type: 'select', required: true, options: ['mobile', 'web', 'desktop', 'hybrid'], placeholder: 'web' },
      { id: 'techStackPreference', label: 'Tech Stack Preference', type: 'textarea', required: false, placeholder: 'e.g., React, Node.js, PostgreSQL' },
      { id: 'tone', label: 'Document Tone', type: 'select', required: false, options: ['startup', 'professional', 'academic'], placeholder: 'professional' },
    ],
  },
};

export const getBlueprint = (type: DocumentType): DocumentBlueprint => {
  return documentBlueprints[type];
};

export const getAllBlueprints = (): DocumentBlueprint[] => {
  return Object.values(documentBlueprints);
};

export const getDefaultTone = (type: DocumentType): DocumentTone => {
  switch (type) {
    case 'academic-research':
      return 'academic';
    case 'business-proposal':
      return 'startup';
    case 'requirements-spec':
      return 'professional';
    case 'project-report':
      return 'professional';
    default:
      return 'professional';
  }
};
