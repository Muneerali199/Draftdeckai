<div align="center">

# 🎨 DraftDeckAI

### AI-Powered Document Creation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Create stunning resumes, presentations, letters, and diagrams with AI magic ✨**

[Live Demo](https://draftdeckai.com) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 📄 Resume Builder
- **AI-Powered Generation** - Describe your experience, get a professional resume
- **Multiple Templates** - Modern, Professional, Creative, and ATS-optimized styles
- **ATS Score Checker** - Ensure your resume passes Applicant Tracking Systems
- **PDF Export** - Download high-quality PDFs instantly
- **LinkedIn Import** - Import your LinkedIn profile to create resumes

### 🎯 Presentation Creator
- **Smart Slide Generation** - Enter a topic, get a complete presentation
- **16:9 Format** - Professional widescreen presentations
- **Multiple Themes** - Modern, Corporate, Creative, and more
- **Image Integration** - AI-generated images for each slide
- **Export Options** - Download as PDF or share via link

### ✉️ Letter Generator
- **Multiple Types** - Cover letters, formal letters, thank you notes
- **Job URL Import** - Paste a job listing URL for tailored cover letters
- **Professional Templates** - Business-ready formatting
- **AI Enhancement** - Improve tone and content with AI

### 📊 Diagram Builder
- **Flowcharts** - Create process diagrams easily
- **Mind Maps** - Visualize ideas and concepts
- **Org Charts** - Build organizational structures
- **Mermaid Syntax** - Powered by Mermaid.js

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/Muneerali199/Draftdeckai.git
cd Draftdeckai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file with these variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider (Required - choose one)
MISTRAL_API_KEY=your_mistral_api_key
# OR
GEMINI_API_KEY=your_gemini_api_key

# Optional
UNSPLASH_ACCESS_KEY=your_unsplash_key
STRIPE_SECRET_KEY=your_stripe_key
```

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **AI** | Mistral AI, Google Gemini |
| **Payments** | Stripe |
| **Deployment** | Vercel, Netlify |

---

## 📁 Project Structure

```
DraftDeckAI/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── resume/            # Resume builder
│   ├── presentation/      # Presentation creator
│   ├── letter/            # Letter generator
│   └── diagram/           # Diagram builder
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── resume/           # Resume-specific components
│   ├── presentation/     # Presentation components
│   └── letter/           # Letter components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
├── public/               # Static assets
└── supabase/             # Database migrations
```

---

## 🔐 Authentication

DraftDeckAI uses Supabase Auth with:
- Email/Password login
- Password reset via email
- Protected routes with middleware
- Session management

---

## 💳 Credits System

| Action | Credits |
|--------|---------|
| Generate Resume | 5 |
| Generate Presentation | 10 |
| Generate Letter | 3 |
| Generate Diagram | 5 |
| ATS Score Check | 2 |

Free tier: 50 credits/month

---

## 📜 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Supabase](https://supabase.com/) - Backend & Auth
- [Mistral AI](https://mistral.ai/) - AI generation
- [Mermaid.js](https://mermaid.js.org/) - Diagram rendering

---

<div align="center">

**Built with ❤️ by [Muneer Ali](https://github.com/Muneerali199) and [Mayank Sahu](https://github.com/msnotfound) .**

⭐ Star this repo if you find it helpful!

</div>
