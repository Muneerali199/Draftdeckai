# Changelog

## [2.0.0] - 2025-07-28
### Changed
- Updated version to 2.0.0 in package.json

All notable changes to DraftDeckAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-27

### 🎉 **Major Release - DraftDeckAI 1.0.0** 🎉
We're thrilled to announce the official 1.0.0 release of DraftDeckAI! This marks a significant milestone in our open-source AI-powered document creation platform.

### Summary
This major release completes our transition from beta to a fully-featured, production-ready document creation platform. DraftDeckAI 1.0.0 represents months of development, community feedback, and continuous improvement.

### Key Achievements
- **Feature Complete**: All planned document types and features are now implemented
- **Production Ready**: Comprehensive testing, security, and performance optimizations
- **Community Driven**: Built by and for the open-source community
- **Enterprise Ready**: Scalable architecture with enterprise-grade reliability

### Complete Feature Set
- **Resume Builder** - AI-powered resume creation with ATS optimization
- **CV Generator** - Professional curriculum vitae creation
- **Letter Writer** - Business and personal letter generation
- **Presentation Maker** - PowerPoint presentation creation with templates
- **Diagram Creator** - Visual diagram and flowchart generation
- **Template System** - Rich template library across all document types
- **Sharing Capabilities** - Public URL sharing for presentations and documents
- **Mobile Responsive** - Full mobile support across all features

### Technical Excellence
- **Modern Architecture** - Next.js 14+ with TypeScript and modern tooling
- **Security First** - OWASP compliance, authentication, and data protection
- **Performance Optimized** - Fast loading, responsive design, and smooth animations
- **Developer Friendly** - Clean code, comprehensive documentation, and extensible architecture

### Migration from 0.9.0 to 1.0.0
- No breaking changes
- Seamless upgrade path
- All existing documents and templates remain compatible
- Enhanced stability and performance

## [0.9.0] - 2025-07-27

### Added
- **Visual Diagram Creator** - Create professional flowcharts, system architectures, and process diagrams
- **Mermaid Syntax Support** - Full support for Mermaid diagram syntax with live preview
- **Diagram Export Capabilities** - Export diagrams as high-quality SVG and PNG files
- **Professional Diagram Templates** - Pre-built templates for common diagram types
- **Live Diagram Preview** - Real-time rendering of Mermaid code with error handling
- **Diagram Sharing** - Share diagrams with copy-to-clipboard and social sharing
- **Multi-Category Templates** - Organized templates by Process, Architecture, Development, Database, UX, and Planning
- **AI Diagram Generation** - Generate diagrams from natural language descriptions

### Enhanced
- **Navigation System** - Added diagram creation to main navigation and document types
- **Document Type Support** - Extended database schema to support diagram documents
- **Feature Showcase** - Updated landing page and about page to highlight diagram capabilities
- **Export System** - Unified export system supporting multiple formats across all document types
- **Template System** - Enhanced template categorization and filtering

### Technical Improvements
- **Mermaid Integration** - Added Mermaid.js library with optimized configuration
- **Image Export** - Integrated html-to-image for high-quality diagram exports
- **Database Schema** - Extended documents table to support diagram type
- **API Endpoints** - New diagram generation endpoint with AI integration
- **Type Safety** - Updated TypeScript definitions for diagram support
- **Performance** - Optimized diagram rendering with debounced updates

### Developer Experience
- **Component Architecture** - Modular diagram components with clear separation of concerns
- **Error Handling** - Comprehensive error handling for diagram syntax validation
- **Loading States** - Professional loading and skeleton states for better UX
- **Code Organization** - Well-structured diagram-related components and utilities

### User Experience
- **Intuitive Interface** - Tab-based interface for code editing, templates, and preview
- **Template Gallery** - Comprehensive collection of professional diagram templates
- **Live Feedback** - Real-time diagram rendering with syntax error reporting
- **Export Options** - Multiple export formats with one-click download
- **Responsive Design** - Mobile-optimized diagram creation and viewing

### Files Added
- `app/diagram/page.tsx` - Main diagram creation page
- `components/diagram/diagram-generator.tsx` - Core diagram creation component
- `components/diagram/diagram-preview.tsx` - Live Mermaid diagram renderer
- `components/diagram/diagram-templates.tsx` - Professional template gallery
- `app/api/generate/diagram/route.ts` - AI diagram generation endpoint
- `supabase/migrations/20250115000000_add_diagram_support.sql` - Database schema update

### Files Modified
- `components/site-header.tsx` - Added diagram navigation link
- `app/page.tsx` - Added diagram card to document types section
- `components/features-section.tsx` - Added visual diagrams feature
- `app/about/page.tsx` - Updated feature showcase with diagram creator
- `lib/gemini.ts` - Added AI diagram generation function
- `types/supabase.ts` - Extended document types to include diagrams
- `README.md` - Updated documentation with diagram features
- `components/ui/skeleton.tsx` - Added diagram generator skeleton component

## [0.8.0] - 2025-01-15

### Added
- **Shareable Public URLs for Presentations** - Enable sharing of created PowerPoint presentations via public URLs
- **Share Button Integration** - Added prominent "Share Presentation" button on completion page with loading states
- **Public Presentation Viewer** - Dedicated viewer page at `/presentation/view/[id]` for shared presentations
- **Privacy Controls** - Toggle between public and private presentation visibility with visual indicators
- **Automatic URL Generation** - Generate unique shareable URLs with automatic clipboard integration
- **Anonymous Viewing Support** - Allow public presentations to be viewed without authentication
- **Share Success UI** - Green success section with copy link and external view buttons

### Enhanced
- **Presentation Generator UI** - Complete share workflow integration with success feedback and URL display
- **Database Schema** - Extended documents table content structure to support public presentation sharing
- **Security Implementation** - Row Level Security (RLS) policies for public/private presentation access
- **User Experience** - Seamless sharing workflow with automatic clipboard copying and visual feedback
- **Component Architecture** - Modular presentation viewer component with privacy controls

### Technical Improvements
- **API Endpoints** - New presentation save/share (`/api/presentations`) and privacy toggle (`/api/presentations/[id]`) endpoints
- **Database Migration** - Added public access policy for shared presentations (`20250628163825_add_public_presentation_access.sql`)
- **Type Safety** - Updated TypeScript definitions for presentation content structure with slides, template, and isPublic fields
- **Supabase Integration** - Fixed server-side Supabase client imports using correct `createRoute()` and `createServer()` functions
- **Dependency Management** - Updated `@radix-ui/react-slot` to v1.1.2 to resolve build conflicts

### Developer Experience
- **Comprehensive Documentation** - Complete implementation guide (`Enable_shareable_public_URL_for_created_PowerPoint_presentations_73.md`)
- **Migration Scripts** - Database migration with multiple execution options (CLI, manual, reset)
- **Testing Guidelines** - Complete testing instructions for share functionality and privacy controls
- **Build Fixes** - Resolved Radix UI dependency conflicts and Supabase import errors

### Bug Fixes
- **Build Issues** - Fixed `createSlot` import error from `@radix-ui/react-collection`
- **Import Errors** - Corrected Supabase server client imports in API routes and server components
- **Type Definitions** - Updated Supabase types to include presentation-specific content structure

### Files Added
- `app/api/presentations/route.ts` - Presentation save and share API endpoint
- `app/api/presentations/[id]/route.ts` - Presentation retrieval and privacy update API
- `app/presentation/view/[id]/page.tsx` - Public presentation viewing page with metadata
- `components/presentation/presentation-viewer.tsx` - Dedicated presentation viewer component
- `supabase/migrations/20250628163825_add_public_presentation_access.sql` - Public access RLS policy

### Files Modified
- `components/presentation/presentation-generator.tsx` - Added complete share functionality and UI
- `types/supabase.ts` - Extended document content type for presentation data
- `package.json` - Updated version to 0.8.0, author to Xenonesis, and fixed Radix UI dependency

## [0.7.0] - 2025-07-28

### Added
- **Advanced Resume Navigation System** - Complete navigation overhaul with step-by-step progress tracking
- **Professional Resume Templates** - New collection of ATS-optimized professional templates
- **Enhanced Glass Morphism UI** - Advanced glass effects with shimmer animations and floating orbs
- **Resume Progress Tracking** - Visual progress bar and completion indicators for resume building
- **Mobile-First Navigation** - Responsive navigation that adapts perfectly to all screen sizes
- **Resume Export Enhancements** - Improved PDF and DOCX export with better formatting

### Enhanced
- **ATS Scoring Algorithm** - More accurate ATS compatibility scoring with detailed feedback
- **Resume Builder Workflow** - Streamlined 9-step resume creation process with intuitive navigation
- **UI/UX Design System** - Consistent design language across all resume-related components
- **Performance Optimization** - Faster loading times and smoother animations
- **Accessibility Improvements** - Enhanced keyboard navigation and screen reader support
- **Error Handling** - Better user feedback and error recovery mechanisms

### Improved
- **Component Architecture** - Modular, reusable components for better maintainability
- **TypeScript Coverage** - Enhanced type safety across all resume components
- **API Response Handling** - More robust error handling and loading states
- **Mobile Experience** - Optimized touch interactions and responsive layouts
- **Dark Mode Support** - Consistent theming across all new components

### Technical Enhancements
- **Code Splitting** - Optimized bundle sizes for faster page loads
- **State Management** - Improved state handling for complex resume workflows
- **Animation Performance** - Hardware-accelerated animations with will-change optimizations
- **SEO Optimization** - Better meta tags and structured data for resume pages

### Credits
- **Developed by**: [Xenonesis](https://github.com/Xenonesis)

## [0.6.0] - 2025-07-28

### Added
- **Enhanced Resume Navigation Component** - New React component for improved resume builder navigation
- **ATS Analyzer Integration** - Comprehensive ATS (Applicant Tracking System) compatibility analysis
- **Guided Resume Generator** - Step-by-step resume creation with AI optimization
- **Resume Navigation Fix Component** - Dedicated component to enhance navigation bar visibility
- **Multi-Tab Resume Interface** - Tabbed interface for Resume Generator and ATS Analyzer

### Enhanced
- **Resume Builder UI/UX** - Significantly improved user interface with glass morphism effects
- **ATS Optimization Features** - Real-time ATS scoring and optimization suggestions
- **Navigation Accessibility** - Better contrast, text shadows, and mobile responsiveness
- **Resume Templates** - Enhanced templates with ATS-friendly formatting
- **API Endpoints** - New `/api/generate/guided-resume` and `/api/analyze/resume` endpoints

### Fixed
- **Resume Navigation Bar Visibility** - Enhanced contrast and visibility of the "Info" section in the resume builder navigation bar
- Added CSS-only solution for improved compatibility and to avoid JavaScript runtime errors
- Improved text readability with proper text shadows and contrast
- Enhanced mobile responsiveness of the navigation elements
- JavaScript runtime errors in navigation components

### Technical Improvements
- **Component Architecture** - Modular resume components with better separation of concerns
- **TypeScript Integration** - Enhanced type safety for resume and ATS analysis features
- **Performance Optimization** - Improved loading times for resume generation and analysis
- **Error Handling** - Better error handling for file uploads and API responses

### Credits
- **Enhanced by**: [Xenonesis](https://github.com/Xenonesis)

## [0.5.0] - 2025-07-22

### Added
- **Comprehensive About Page Enhancement** - Significantly expanded `/about` page with detailed information
- **Design Philosophy Section** - Added "Magical Professionalism" design principles showcase
- **Security & Quality Section** - Detailed security measures and quality assurance practices
- **Enhanced Technology Stack Display** - Comprehensive frontend, backend, and infrastructure tech overview
- **Design Principles Cards** - Interactive cards showcasing 6 core design principles
- **Security Features Highlight** - OWASP compliance, authentication, rate limiting, and privacy measures
- **Quality Assurance Details** - Testing frameworks, CI/CD, performance monitoring, and accessibility standards

### Enhanced
- **About Page Navigation** - Already linked in main navigation, now with comprehensive content
- **README.md Documentation** - Added about page references and designer credit
- **Feature Documentation** - Updated all MD files to reflect enhanced about page capabilities

### Technical Improvements
- **Data Arrays** - Added `designPrinciples`, `frontendTech`, `backendTech`, and `infrastructureTech` arrays
- **Component Structure** - Enhanced about page component with new sections and improved layout
- **Content Organization** - Better structured information architecture for improved user experience

### Credits
- **Designed by**: [Xenonesis](https://github.com/Xenonesis)

## [0.4.0] - 2025-01-27

### Changed
- **Theme Toggle Improvement**: Simplified dark mode toggle to a single-click switch by @xenonesis
  - Removed dropdown menu from theme toggle component
  - Now toggles directly between light and dark modes with one click
  - Eliminated "System" theme option for streamlined user experience
  - Maintained smooth icon animations and transitions
  - Added proper hydration handling to prevent client-server mismatches

### Enhanced
- **Open Source Documentation**: Comprehensive updates to emphasize open source nature by @xenonesis
  - Enhanced README.md with prominent open source badges and community focus
  - Completely redesigned CONTRIBUTING.md with detailed contributor guidelines
  - Added CONTRIBUTORS.md for community recognition
  - Updated package.json with open source metadata and repository information
  - Enhanced ROADMAP.md to highlight community-driven development
  - Improved LICENSE section to clearly explain open source benefits

### Added
- New contributor recognition system with multiple contribution types
- Comprehensive coding standards and development guidelines
- Community channels and support information
- Detailed project structure documentation

### Updated
- Upgraded dependencies to their latest compatible versions:
  - @google/generative-ai from 0.3.0 to 0.3.1
  - @stripe/stripe-js from 3.0.0 to 3.5.0
  - @supabase/auth-helpers-nextjs from 0.9.0 to 0.10.0
  - @supabase/supabase-js from 2.39.7 to 2.52.0
  - eslint from 8.57.0 to 8.57.1
  - framer-motion from 12.19.1 to 12.23.6
  - jspdf from 2.5.1 to 2.5.2
  - next-themes from 0.3.0 to 0.4.6
  - officeparser from 5.1.1 to 5.2.0
  - postcss from 8.4.38 to 8.5.6
  - react and react-dom from 18.3.0 to 18.3.1
  - react-hook-form from 7.53.0 to 7.60.0
  - react-resizable-panels from 2.1.3 to 2.1.9
  - recharts from 2.12.7 to 2.15.4
  - sonner from 1.5.0 to 1.7.4
  - stripe from 14.20.0 to 14.25.0
  - tailwind-merge from 2.5.2 to 2.6.0
  - tailwindcss from 3.3.3 to 3.4.17
  - zod from 3.23.8 to 3.25.76
  - zustand from 4.5.2 to 4.5.7
  - @types/react from 19.1.6 to 19.1.8

## [0.3.0] - 2025-07-22

### Added
- Enhanced README.md with comprehensive documentation
- Community-focused documentation (CODE_OF_CONDUCT.md, ROADMAP.md)
- Detailed API documentation with TypeScript examples
- Complete project structure documentation
- Advanced deployment guides for Netlify, Vercel, and Docker
- Comprehensive environment configuration guide

### Enhanced
- Visual design improvements with modern badges and hero section
- Technical architecture documentation with exact dependency versions
- Step-by-step setup instructions for all services
- Contributing guidelines and community support information
- License and acknowledgments section

### Improved
- Documentation consistency across all .md files
- Project metadata and version synchronization
- Development workflow documentation

## [0.2.0] - 2025-07-22

### Added
- Support for Next.js 15.4.0
- Updated React to version 18.3.0
- Updated React DOM to version 18.3.0

### Changed
- Upgraded from Next.js 14.1.3 to Next.js 15.4.0
- Updated eslint-config-next to version 15.4.0
- Improved project documentation

### Fixed
- Resolved dependency conflicts during upgrade

## [0.1.0] - Initial Release

### Added
- Initial project setup with Next.js 14.1.3
- Document processing capabilities
- Integration with various document formats (PDF, DOCX)
- UI components using Radix UI
- Authentication with Supabase
- Stripe payment integration
- Responsive design with Tailwind CSS
- Theme support with next-themes
- Form handling with react-hook-form and zod validation

## Contributors

### Xenonesis
- Upgraded the project to Next.js 15.4.0
- Created comprehensive open source documentation and community guidelines
- Simplified theme toggle for better user experience
- Maintained dependencies and resolved conflicts
- Ensured compatibility with latest React versions
- Implemented best practices for Next.js applications
- Enhanced project's open source identity and contributor onboarding
