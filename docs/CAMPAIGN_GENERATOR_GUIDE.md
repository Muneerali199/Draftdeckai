# 🚀 AI Marketing Campaign Generator

## Overview
The AI Marketing Campaign Generator is an advanced feature that automatically creates complete marketing campaigns based on your brand's website. It extracts brand DNA, generates campaign ideas, and creates platform-specific social media posts with AI.

## ✨ Features

### 1. **Automatic Brand DNA Extraction** 🧬
Analyzes any website URL to extract:
- ✅ Brand name and tagline
- ✅ Color palette (hex codes)
- ✅ Typography and fonts
- ✅ Content tone (formal, casual, friendly, urgent, professional)
- ✅ Top keywords and themes
- ✅ Logo and brand assets
- ✅ Meta descriptions

### 2. **AI Campaign Idea Generation** 💡
Creates 5 unique campaign concepts using Groq AI:
- Creative campaign titles
- Engaging summaries
- Unique hooks and angles
- Aligned with brand tone

### 3. **Platform-Specific Post Generation** 📱
Generates optimized content for:

| Platform | Features |
|----------|----------|
| **Instagram** | 2200 chars, emoji-rich, 8-10 hashtags, visual focus |
| **LinkedIn** | 3000 chars, professional tone, 3-5 hashtags, value-driven |
| **Twitter/X** | 280 chars, concise & punchy, 2-3 hashtags |
| **Facebook** | 1000 chars, conversational, 3-5 hashtags, engaging |

Each post includes:
- ✅ Optimized caption text
- ✅ Relevant hashtags
- ✅ Call-to-action (CTA)
- ✅ Platform-specific formatting

### 4. **AI Image Prompts** 🎨
Generates detailed image prompts for:
- On-brand visual assets
- Marketing posters
- Social media graphics
- Matching brand colors and tone

## 🛠️ Setup Instructions

### 1. Get a FREE Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

### 2. Add to Environment Variables

Add to your `.env` file:
```bash
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Install Dependencies

Already included in package.json:
```bash
npm install groq-sdk jsdom archiver sharp axios
```

## 📖 How to Use

### Step 1: Access the Campaign Generator
Navigate to: `http://localhost:3000/campaign`

### Step 2: Extract Brand DNA
1. Enter your website URL (e.g., `https://yourbrand.com`)
2. Click **"Extract DNA"**
3. Wait for AI analysis (~5-10 seconds)
4. Review extracted brand information

### Step 3: Define Campaign Goal
Enter your campaign objective, for example:
- "Launch new product line for summer 2025"
- "Increase brand awareness among millennials"
- "Black Friday sale promotion"
- "Company rebranding announcement"

### Step 4: Generate Campaigns
1. Click **"Generate 5 Campaign Ideas"**
2. AI creates 5 unique campaign concepts
3. Each campaign includes posts for all 4 platforms
4. Review and download content

### Step 5: Use Generated Content
- Copy posts to your social media scheduler
- Download campaign assets
- Customize captions if needed
- Generate images using AI prompts (coming soon)

## 🧪 Example Workflow

**Input:**
```
URL: https://draftdeckai.me
Goal: Launch AI-powered resume builder feature
```

**Output:**
```
✅ Brand DNA Extracted:
- Brand: DraftDeckAI
- Tone: Professional, Innovative
- Colors: #6366f1, #8b5cf6, #0ea5e9
- Keywords: AI, documents, productivity, templates

✅ 5 Campaign Ideas Generated:
1. "Smart Resumes, Smarter Careers"
2. "AI-Powered Your Next Opportunity"
3. "Resume Revolution Starts Here"
4. "Land Your Dream Job with AI"
5. "Your Career, Amplified by AI"

✅ 20 Social Posts Created:
- 5 campaigns × 4 platforms = 20 posts
- Each with captions, hashtags, CTAs
- Ready to schedule and post
```

## 🎯 Advanced Features

### Brand DNA Components

```typescript
{
  brandName: "DraftDeckAI",
  tagline: "Create amazing documents with AI",
  colors: ["#6366f1", "#8b5cf6", "#0ea5e9"],
  fonts: ["Inter", "Plus Jakarta Sans"],
  tone: "professional",
  keywords: ["AI", "documents", "templates"],
  description: "AI-powered document creation platform",
  logo: "https://draftdeckai.me/logo.png",
  timestamp: "2025-11-11T00:00:00.000Z"
}
```

### Campaign Structure

```typescript
{
  title: "Smart Resumes, Smarter Careers",
  summary: "Launch campaign for AI resume builder",
  hook: "AI technology meets career success",
  posts: {
    instagram: {
      caption: "Transform your resume with AI...",
      hashtags: ["#AI", "#Resume", "#CareerGrowth"],
      cta: "Start building your resume"
    },
    // ... linkedin, twitter, facebook
  },
  imagePrompt: "Create a modern marketing poster..."
}
```

## 🚀 API Endpoints

### POST `/api/campaign/extract-brand`
Extract brand DNA from website URL.

**Request:**
```json
{
  "url": "https://yourbrand.com"
}
```

**Response:**
```json
{
  "success": true,
  "brandDNA": {
    "brandName": "YourBrand",
    "tagline": "Your tagline",
    "colors": ["#hex1", "#hex2"],
    "fonts": ["Font 1", "Font 2"],
    "tone": "professional",
    "keywords": ["keyword1", "keyword2"],
    "description": "Brand description",
    "logo": "https://url-to-logo.png"
  }
}
```

### POST `/api/campaign/generate`
Generate AI marketing campaigns.

**Request:**
```json
{
  "brandDNA": { /* brand DNA object */ },
  "goal": "Launch new product line",
  "platforms": ["instagram", "linkedin", "twitter", "facebook"]
}
```

**Response:**
```json
{
  "success": true,
  "brandDNA": { /* same brand DNA */ },
  "campaigns": [
    {
      "title": "Campaign Title",
      "summary": "Campaign summary",
      "hook": "Unique angle",
      "posts": {
        "instagram": { /* post details */ },
        "linkedin": { /* post details */ },
        "twitter": { /* post details */ },
        "facebook": { /* post details */ }
      },
      "imagePrompt": "AI image generation prompt"
    }
    // ... 4 more campaigns
  ]
}
```

## 🎨 Platform-Specific Optimizations

### Instagram
- **Max Characters:** 2200
- **Style:** Visual, emoji-rich, casual
- **Hashtags:** 8-10 trending tags
- **Focus:** Eye-catching imagery, storytelling

### LinkedIn
- **Max Characters:** 3000
- **Style:** Professional, value-driven
- **Hashtags:** 3-5 professional tags
- **Focus:** Industry insights, thought leadership

### Twitter/X
- **Max Characters:** 280
- **Style:** Concise, punchy, timely
- **Hashtags:** 2-3 trending tags
- **Focus:** Quick hooks, engagement

### Facebook
- **Max Characters:** 1000
- **Style:** Engaging, conversational
- **Hashtags:** 3-5 community tags
- **Focus:** Community building, discussion

## 💡 Pro Tips

1. **Better Brand DNA = Better Campaigns**
   - Use well-designed website with clear branding
   - Ensure website has proper meta tags
   - Include brand style guide elements

2. **Specific Goals Work Best**
   - Be detailed in campaign goals
   - Include target audience
   - Mention key messages

3. **Review and Customize**
   - AI generates starting points
   - Customize for your voice
   - Add brand-specific details

4. **Test Different Goals**
   - Generate multiple campaign sets
   - Compare approaches
   - Mix and match best elements

## 🔮 Coming Soon

- ✅ **AI Image Generation** - Auto-generate marketing visuals
- ✅ **Trend Analysis** - Google Trends integration
- ✅ **Smart Scheduling** - Optimal posting time suggestions
- ✅ **Social Insights** - Engagement predictions
- ✅ **Campaign Export** - Download as ZIP with all assets
- ✅ **Direct Publishing** - Post to social platforms
- ✅ **A/B Testing** - Generate variations for testing
- ✅ **Performance Tracking** - Monitor campaign results

## 🐛 Troubleshooting

### Brand Extraction Fails
- **Check URL:** Ensure website is accessible and public
- **Try Different URL:** Use homepage or main landing page
- **Firewall/Blocking:** Some sites block automated requests

### Campaign Generation Fails
- **API Key:** Verify GROQ_API_KEY is set correctly
- **Rate Limits:** Free tier has usage limits
- **Network:** Check internet connection

### Posts Look Generic
- **Improve Goal:** Be more specific about campaign objective
- **Better Brand DNA:** Ensure website has rich brand content
- **Regenerate:** Try generating again for different variations

## 📊 Technical Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **AI Engine:** Groq SDK (Mixtral-8x7b-32768 model)
- **Web Scraping:** Axios, JSDOM, Cheerio
- **Image Processing:** Sharp
- **File Handling:** Archiver
- **API:** Next.js API Routes

## 🔐 Privacy & Security

- ✅ No data stored permanently
- ✅ Brand DNA extracted temporarily
- ✅ Groq API uses encrypted connections
- ✅ No third-party data sharing
- ✅ User owns all generated content

## 📞 Support

Need help? Have questions?
- 📧 Email: support@draftdeckai.me
- 📖 Documentation: `/docs/campaign-generator`
- 💬 GitHub Issues: Report bugs or request features

---

**Built with ❤️ by DraftDeckAI Team**
*Powered by Groq AI & Next.js*

Last Updated: November 11, 2025
