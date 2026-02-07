# 🪄 Contributing to DocMagic
Thank you for your interest in contributing to **DocMagic**!   
We’re thrilled to have you onboard. Your ideas, code, and feedback are all valuable to us.

This document will help you get started with contributing in a smooth and respectful way.

<div align="center">

**Welcome to DocMagic - Where AI Meets Document Creation Magic!** ✨

![DocMagic Contributors](https://img.shields.io/github/contributors/Muneerali199/DocMagic?style=for-the-badge&color=6366f1)
![GitHub Issues](https://img.shields.io/github/issues/Muneerali199/DocMagic?style=for-the-badge&color=10b981)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)

</div>

Whether you're a seasoned developer, a design enthusiast, a documentation wizard, or someone taking their first steps into open source - **we wholeheartedly welcome you!** This guide will help you make meaningful contributions to DocMagic with confidence and joy. 🚀

> 💡 **New to open source?** Perfect! DocMagic is designed to be contributor-friendly. We provide mentorship, detailed feedback, and celebrate every contribution-no matter how small!

---

## 🎯 Table of Contents

- [🌟 About DocMagic](#-about-docmagic)
- [🌟 GirlScript Summer of Code 2025 (GSSoC)](#-girlscript-summer-of-code-2025-gssoc)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [🔍 Finding Your First Issue](#-finding-your-first-issue)
- [🤝 Ways to Contribute](#-ways-to-contribute)
- [⚙️ Development Setup](#️-development-setup)
- [🌿 Git Workflow & Best Practices](#-git-workflow--best-practices)
- [📝 Coding Standards](#-coding-standards)
- [📋 Pull Request Process](#-pull-request-process)
- [🐛 Reporting Issues](#-reporting-issues)
- [📚 Resources & Support](#-resources--support)

---

## 🌟 About DocMagic

**DocMagic** is a cutting-edge, open-source AI-powered document creation platform that transforms how professionals create stunning documents. Built with modern technologies and community-first principles, we're revolutionizing document generation for the world.

### 🛠️ **Tech Stack**

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Google Gemini AI
- **Payments**: Stripe
- **Deployment**: Netlify/Vercel

**🌐 Live Demo**: [https://doc-magic-heob.vercel.app/](https://doc-magic-heob.vercel.app/)

---

## 🌟 GirlScript Summer of Code 2025 (GSSoC)

**DocMagic is proudly participating in GirlScript Summer of Code 2025** 🎉

If you're a GSSoC contributor:

- **Look for labels**: Search for issues labeled `GSSoC 2025`, `good first issue`, and `documentation` in [issues](https://github.com/Muneerali199/DocMagic/issues)
- **Ask to be assigned**: Always request assignment before starting work on any issue
- **Mention GSSoC**: Include "GSSoC" in your PR description to help us track contributions
- **We're excited to mentor and grow with you!** 🚀

> 💡 **GSSoC Contributors**: We provide dedicated mentorship, detailed code reviews, and celebrate every contribution. This is your opportunity to learn, grow, and make a real impact on an open-source project used by thousands!

---

## 🚀 Quick Start Guide

Ready to contribute? Here's the fastest way to get started:

### 1️⃣ **Fork & Clone**

# Fork the repository on GitHub first, then:
1.Fork the repository using the **Fork** button (top right of the GitHub page).
2.Clone your fork:
   ```bash
   git clone https://github.com/your-username/DocMagic.git 
```
📝 Note: Replace your-username with your actual GitHub username.

### 🌿 Create a New Branch

Before making any changes, create a new branch. This keeps your work separate from the `main` branch and helps maintain a clean commit history.

Run the following command:

```bash
  git checkout -b your-branch-name
```
📝 Replace your-branch-name with something meaningful, like improve-contributing-md or fix-typo-doc.

### 2️⃣ **Install Dependencies**

```bash
npm install
```

### 3️⃣ **Set Up Environment**

DocMagic requires several API keys for full functionality. Follow these steps:

#### **Create Environment File**

Create a new file named `.env.local` in your project root directory (same level as `package.json`)

#### **Add Required Environment Variables**

Copy the following into your `.env.local` file and replace the placeholder values:
MAKE SURE TO RENAME `.env.local.example` file to `.env.local` , else npm will keep showing problems. 

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME=DocMagic
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Database & Auth) - Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI - Required for AI features
GEMINI_API_KEY=your_gemini_api_key

# Stripe (Payments) - Optional for development
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_price_id
NEXT_PUBLIC_ENABLE_STRIPE=false

# Pexels API (Images) - Optional
PEXELS_API_KEY=your_pexels_api_key
```

#### **Getting API Keys**

**Supabase Setup** (Required):
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon public key
5. Make sure to not give spaces will copying into `.env.local` file

**Google Gemini AI** (Required):
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create an API key
3. Copy the key to your `.env.local`

**Stripe** (Optional - for payment testing):
1. Create account at [stripe.com](https://stripe.com)
2. Get test keys from Dashboard → Developers → API keys

**Need Help?** 🤝 Contact our mentors and Project Admins:
- Comment on your assigned issue or PR
- Reach out on Discord: [DocMagic Community Server]
- Connect on LinkedIn: [Project Admin Profiles]
- We're here to help you succeed!

### 4️⃣ **Start Development Server**

```bash
npm run dev
```

### 5️⃣ **Visit Your Local DocMagic**

Open [http://localhost:3000](http://localhost:3000) - you should see DocMagic running locally! 🎉

---

## 🔍 Finding Your First Issue

New to the project? We've got you covered! Here's how to find the perfect first contribution:

### 🎯 **Issue Labels Guide**

| Label              | Description                 | Perfect For              |
| ------------------ | --------------------------- | ------------------------ |
| `good first issue` | Beginner-friendly tasks     | First-time contributors  |
| `documentation`    | Documentation improvements  | Writers, beginners       |
| `bug`              | Bug fixes needed            | Developers of all levels |
| `enhancement`      | New feature requests        | Experienced developers   |
| `help wanted`      | Community assistance needed | Anyone eager to help     |
| `ui/ux`            | Design improvements         | Designers, frontend devs |
| `ai`               | AI-related improvements     | AI/ML enthusiasts        |

### 🔍 **How to Find Issues**

1. **Visit our Issues page**: [GitHub Issues](https://github.com/Muneerali199/DocMagic/issues)
2. **Filter by labels**: Click on `good first issue` for beginner-friendly tasks
3. **Read the issue description** carefully
4. **Ask questions** if anything is unclear
5. **Comment to claim**: "I'd like to work on this. Please assign it to me."

### 💡 **What Makes a Good First Issue?**

- Clear problem description with acceptance criteria
- Good learning opportunity
- Doesn't require deep codebase knowledge

### 🤝 **Getting Assigned**

- **One issue at a time** for new contributors
- **Wait for assignment** before starting work
- **Ask questions** - we're here to help!
- **Be patient** - maintainers will respond within 24-48 hours
- **Need guidance?** Contact mentors and Project Admins via Discord, LinkedIn, or comment on the issue

---

## 🤝 Ways to Contribute

We believe every contribution matters! Here's how you can help make DocMagic even more magical:

| 🎨 **Contribution Type**    | 📝 **Description**                                 | 🎯 **Perfect For**           |
| --------------------------- | -------------------------------------------------- | ---------------------------- |
| **💻 Code Features**        | Build new AI features, UI components, workflows    | Frontend/Backend developers  |
| **🐛 Bug Fixes**            | Fix issues, improve performance, enhance stability | Developers of all levels     |
| **📚 Documentation**        | Improve guides, API docs, tutorials, README        | Technical writers, beginners |
| **🎨 Design & UX**          | Enhance UI/UX, accessibility, responsive design    | Designers, UX enthusiasts    |
| **🧠 AI Improvements**      | Optimize prompts, enhance AI responses, training   | AI/ML enthusiasts            |
| **🧪 Testing**              | Write tests, manual QA, performance testing        | QA engineers, developers     |
| **🕒 Dependency Updates & Testing** | Maintain dependencies                      | Developers                   |
| **🌍 Internationalization** | Translate UI, localize content                     | Multilingual community       |
| **📖 Tutorials & Content**  | Create guides, video tutorials, blog posts         | Content creators, educators  |

> **🌟 First-time contributor?** Look for issues labeled `good first issue` - they're specifically designed to help you get started!

---

## 🕒 Automated Dependency Updates

DocMagic leverages automated tools to keep its dependencies up-to-date, ensuring security, performance, and compatibility. This process is managed through **Dependabot** and **GitHub Actions**, providing a seamless workflow for maintaining the project’s ecosystem.

### 🛠️ Setup and Configuration

#### ✅ Dependabot Configuration
A `.github/dependabot.yml` file is included to enable and configure automatic dependency updates for **npm** and other package managers. This file:
- Schedules **weekly checks**
- Manages updates for **minor and patch versions**
- Ignores **major updates** for critical packages (e.g., `next`, `react`) to prevent breaking changes

#### ✅ GitHub Actions Workflow
The `.github/workflows/dependency_check.yml` workflow:
- Runs **dependency audits**, **security checks**, and **build tests**
- Triggers on a **weekly schedule** and for `push`/`pull_request` events on the `main` branch
- Includes a `dependabot-auto-merge` job to **automatically approve and merge** Dependabot PRs after successful validation

### 🚀 How to Use

#### 1. Enable Dependabot
The configuration is pre-set in the repository. Ensure the `.github/dependabot.yml` file is present and committed to your fork or branch.

#### 2. Test the Workflow
Run the `test-dependabot-config` workflow manually via GitHub Actions with the `create_test_pr` input set to `true` on a test branch (e.g., `test-bot`) to verify the update process. This simulates dependency updates and triggers CI checks.

#### 3. Monitor PRs
Dependabot will automatically create pull requests for outdated dependencies. Review these PRs — the CI workflow will validate them. **Approved PRs are automatically merged** if all checks pass.

#### 4. Validate Updates
The workflow includes **tests and builds** to ensure updated dependencies do not break functionality. This helps maintain a **stable and secure** application. Check the **GitHub Actions logs** for detailed output.

---

## ⚙️ Development Setup

### 📋 **Prerequisites**

Before diving in, ensure you have:

- **Node.js**: Version 18+ ([Download here](https://nodejs.org/))
- **npm**: Usually comes with Node.js
- **Git**: For version control ([Download here](https://git-scm.com/))
- **Code Editor**: VS Code recommended with these extensions:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
  - Prettier - Code formatter

### 📝 **Development Commands**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linting
npm run lint

# Build for production (to test)
npm run build
```

**Having Issues?** 💬 Don't hesitate to reach out:
- Comment on your issue or PR for specific help
- Join the GSSoC Discord community for real-time support
- Connect with mentors on LinkedIn
- We believe in supporting every contributor!

---

## 🌿 Git Workflow & Best Practices

We use a simple but effective Git workflow that keeps our codebase clean and organized.

### 🌳 **Branch Naming Convention**

```bash
# Feature branches
feature/your-feature-name
feature/ai-prompt-optimization

# Bug fix branches
fix/issue-description
fix/resume-export-error

# Documentation branches
docs/update-contributing-guide

# Chore/maintenance branches
chore/dependency-updates
```

### 🔄 **Contribution Workflow**

#### **Step 1: Sync Your Fork**

```bash
# Add upstream remote (do this once)
git remote add upstream https://github.com/Muneerali199/DocMagic.git

# Sync your fork before starting work
git checkout main
git pull upstream main
git push origin main
```

#### **Step 2: Create Feature Branch**

```bash
# Create and switch to new branch
git checkout -b feature/your-amazing-feature
```

#### **Step 3: Commit Your Changes**

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add dark mode toggle to navigation"

# Push to your fork
git push origin feature/your-amazing-feature
```

#### **Step 4: Create Pull Request**

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template
4. Link related issues
5. Submit for review!

### 📝 **Commit Message Format**

We use conventional commits for clarity:

```bash
# Types: feat, fix, docs, style, refactor, test, chore
feat: add new AI prompt optimization
fix: resolve mobile navigation issue
docs: update installation instructions
style: improve button hover animations
refactor: optimize database queries
test: add unit tests for resume generator
chore: update dependencies
```

---

## 📝 Coding Standards

Our coding standards ensure consistency, readability, and maintainability across the entire codebase.

### 🎯 **TypeScript Guidelines**

- **Always use TypeScript** - No plain JavaScript files
- **Strict typing** - Avoid `any` type whenever possible
- **Interface over Type** - Prefer interfaces for object shapes

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// ❌ Avoid
const user: any = { ... }
```

### 🎨 **Styling Guidelines**

- **Tailwind CSS only** - No custom CSS unless absolutely necessary
- **Mobile-first approach** - Start with mobile styles, scale up
- **Consistent spacing** - Use Tailwind's spacing scale

```tsx
// ✅ Good
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors">
  Click me
</button>

// ❌ Avoid inline styles
<button style={{ backgroundColor: '#007bff', padding: '8px 16px' }}>
  Click me
</button>
```

### 🧩 **Component Guidelines**

- **Use Radix UI** for complex components
- **Implement accessibility** - ARIA labels, keyboard navigation
- **Props interfaces** for all components

```tsx
// ✅ Good component structure
interface ButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  onClick,
}) => {
  return (
    <button className={cn(buttonVariants({ variant }))} onClick={onClick}>
      {children}
    </button>
  );
};
```

### ✅ **Code Quality Checks**

Before submitting any PR, ensure:

```bash
# Linting passes
npm run lint

# TypeScript compilation succeeds
npm run build

# Tests pass (when implemented)
npm run test
```

---

## 📋 Pull Request Process

Creating a great pull request is an art! Here's how to make yours shine:

### 🎯 **Before You Start**

- Issue is assigned to you
- You understand the requirements
- Your branch is up to date with main

### 📝 **PR Creation Checklist**

#### **1. Code Quality**

- Code follows our style guidelines
- TypeScript compilation succeeds
- ESLint passes without errors
- No console.log statements in production code

#### **2. Testing**

- Manual testing completed
- All existing functionality still works
- New features work as expected
- Mobile responsiveness verified (if UI changes)

#### **3. Documentation**

- Code is self-documenting with clear variable names
- Complex logic includes comments
- README updated (if needed)

### 🚀 **Creating the Perfect PR**

#### **PR Title Format**

```
type(scope): brief description

Examples:
feat(ai): add prompt optimization for better resume generation
fix(ui): resolve mobile navigation menu overflow
docs(setup): update environment configuration guide
```

#### **PR Description Template**

```markdown
## 🎯 What does this PR do?

Brief description of the changes made.

## 🔗 Related Issue

Fixes #123
Closes #456

## 🧪 How to test

1. Go to [specific page/component]
2. Click on [specific element]
3. Verify that [expected behavior]

## 📷 Screenshots/GIFs

[Add screenshots for UI changes]

## ✅ Checklist

- Code follows style guidelines
- Self-review completed
- Manual testing done
- Documentation updated (if needed)

## 💭 Additional Notes

Any additional context or considerations.
```

### 🔄 **Review Process**

1. **Automated Checks**: Our CI will run linting, type checking, and tests
2. **Code Review**: Maintainers will review your code and provide feedback
3. **Iterate**: Make requested changes and push updates
4. **Approval**: Once approved, your PR will be merged!

**⏱️ Review Times**: We aim to review PRs within 24-48 hours. Complex changes may take longer.

**Need Help During Review?** 🤝
- Reply to review comments for clarification
- Reach out to mentors on Discord or LinkedIn
- Comment on your PR if you're stuck
- We're committed to helping you succeed!

---

## 🐛 Reporting Issues

Found a bug or have a feature request? We'd love to hear from you!

### 🐞 **Bug Reports**

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Screenshots/videos** if applicable
5. **Environment details**:
   - Browser/version
   - Operating system
   - Device type (mobile/desktop)

### 💡 **Feature Requests**

For new features, please describe:

1. **The problem** you're trying to solve
2. **Proposed solution** or feature description
3. **Use cases** and benefits
4. **Mockups or examples** if applicable

### 🔍 **Before Submitting**

- Search existing issues to avoid duplicates
- Be respectful and constructive
- Provide as much detail as possible
- **Need help writing a good issue?** Feel free to ask mentors and Project Admins for guidance via Discord, LinkedIn, or in the issue comments

---

### 🤝 **Community Guidelines**

We're committed to providing a welcoming and inclusive environment for everyone. Please:

- Be respectful and kind to all community members
- Use inclusive language and be mindful of cultural differences
- Provide constructive feedback and be open to receiving it
- Help newcomers feel welcome and supported
- Focus on collaboration over competition

---

## 📚 Resources & Support

### 🔗 **Useful Links**

- **Live Demo**: [https://doc-magic-heob.vercel.app/](https://doc-magic-heob.vercel.app/)
- **About Page**: [https://doc-magic-heob.vercel.app/about](https://doc-magic-heob.vercel.app/about)
- **GitHub Repository**: [https://github.com/Muneerali199/DocMagic](https://github.com/Muneerali199/DocMagic)

### 🛠️ **Development Resources**

- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **React Docs**: [react.dev](https://react.dev/)
- **TypeScript Docs**: [typescriptlang.org](https://www.typescriptlang.org/)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com/)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

## 🤝 Code of Conduct

Please be respectful, inclusive, and patient.  
We value every contributor and want everyone to feel welcome here.

Read our full [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

By contributing to DocMagic, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

### 🙌 Need Help?

If you get stuck, feel free to open an issue or ask for help in discussions.  
We’re here to support each other and grow together! 💬

**Let’s build something amazing together. Happy contributing! 💜**

---

<div align="center">

**Thank you for being part of the DocMagic community!** ✨

_Together, we're making document creation magical for everyone._

</div>
