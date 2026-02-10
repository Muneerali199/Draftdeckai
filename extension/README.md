# 🚀 DraftDeckAI Interview & DSA Prep Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/YOUR_USERNAME/draftdeckai-extension/releases)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://www.google.com/chrome/)

> **AI-powered browser extension for interview preparation, DSA problem solving, and job placement assistance**

Never struggle with coding interviews again! DraftDeckAI uses powerful AI (Gemini, OpenAI, Claude, Mistral) to help you master DSA problems, prepare for interviews, and land your dream job.

## ✨ Features

### 🧩 DSA Problem Solver
- **Instant AI Solutions** for any coding problem
- **Multiple Languages**: JavaScript, Python, Java, C++, C#
- **Step-by-Step Approach** explanations
- **Complexity Analysis**: Time & Space complexity breakdown
- **Platform Integration**: Works on LeetCode, HackerRank, Codeforces, GeeksforGeeks

### 💼 Interview Preparation
- **Role-Specific Questions**: Frontend, Backend, Full-Stack, Data Science, etc.
- **Experience Level Tailoring**: Entry, Mid, Senior level questions
- **Company-Specific Prep**: Practice questions from top companies
- **Practice Mode**: Show/hide answers for self-assessment
- **Multiple Categories**: Technical, Behavioral, System Design

### 📄 Career Tools
- **Resume Review**: AI-powered feedback and optimization
- **Cover Letter Generator**: Create tailored cover letters instantly
- **LinkedIn Optimization**: Profile improvement suggestions
- **Salary Guide**: Market value analysis and negotiation tips

### 🎮 Gamification
- **XP & Levels**: Progress from Beginner to Legend
- **Achievements**: Unlock badges for milestones
- **Streak Tracking**: Maintain daily practice streaks
- **Progress Dashboard**: Visual analytics of your journey

### 🎤 Voice & Interview Mode
- **Voice Commands**: Hands-free problem solving
- **Mock Interviews**: AI-powered interview simulator
- **Real-time Feedback**: Evaluate your responses instantly

## 📥 Installation

### Option 1: Install from GitHub Release (Recommended)

1. **Download the latest release**:
   - Go to [Releases](https://github.com/YOUR_USERNAME/draftdeckai-extension/releases)
   - Download `draftdeckai-extension-v1.0.0.zip` or `draftdeckai-extension-v1.0.0.tar.gz`

2. **Extract the archive**:
   - **ZIP**: Right-click → Extract All
   - **TAR.GZ**: Use 7-Zip, WinRAR, or command line: `tar -xzf draftdeckai-extension-v1.0.0.tar.gz`

3. **Load in Chrome/Edge**:
   - Open browser and navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the extracted `extension` folder
   - Done! 🎉

### Option 2: Clone from Source

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/draftdeckai-extension.git
cd draftdeckai-extension/extension

# Load in browser
# 1. Open chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

## 🔧 Setup & Configuration

### 1. Get Your AI API Key

Choose your preferred AI provider (at least one required):

#### **Gemini AI (Recommended - Free)**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

#### **OpenAI (GPT-4)**
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy your API key

#### **Claude (Anthropic)**
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Generate API key
3. Copy your API key

#### **Mistral AI**
1. Visit [Mistral Platform](https://console.mistral.ai/)
2. Create API key
3. Copy your API key

### 2. Configure the Extension

1. Click the **DraftDeckAI extension icon** in your browser toolbar
2. Click **Open Settings** (gear icon)
3. Select your **AI Provider**
4. Paste your **API Key**
5. **Test Connection** to verify
6. Click **Save**
7. You're ready! ✅

### 3. Start Using

- Visit any supported coding platform (LeetCode, HackerRank, etc.)
- Click the **"Get AI Help"** button on problem pages
- Or use the extension popup for standalone features
- Right-click any code → **Solve with DraftDeckAI AI**

## 🎯 How to Use

### DSA Problem Solver

1. Open the extension popup
2. Navigate to **"DSA Problems"** tab
3. Paste your problem statement
4. Select programming language
5. Click **"Solve with AI"**
6. View: Approach → Code → Complexity

### Interview Preparation

1. Open the extension popup
2. Go to **"Interview Prep"** tab
3. Select your **role** and **experience level**
4. Optionally add target **company**
5. Click **"Generate Questions"**
6. Practice with **show/hide answers**

### On Coding Platforms

1. Visit LeetCode, HackerRank, etc.
2. Look for the **floating "Get AI Help" button**
3. Click for instant hints, approach, or solution
4. Or **right-click selected text** → "Solve with DraftDeckAI AI"

### Resume & Career Tools

1. Open extension → **"Resume Tips"** tab
2. Choose an action (Review, Cover Letter, LinkedIn, Salary)
3. Get instant AI-powered insights
4. Copy and apply recommendations

## 🌐 Supported Platforms

| Platform | Auto-Detection | Helper Button | Context Menu |
|----------|----------------|---------------|--------------|
| LeetCode | ✅ | ✅ | ✅ |
| HackerRank | ✅ | ✅ | ✅ |
| Codeforces | ✅ | ✅ | ✅ |
| GeeksforGeeks | ✅ | ✅ | ✅ |
| LinkedIn | ✅ | ✅ | ❌ |
| Indeed | ✅ | ✅ | ❌ |
| Wellfound (AngelList) | ✅ | ✅ | ❌ |
| Glassdoor | ✅ | ✅ | ❌ |

## 💻 Supported Languages

- JavaScript / TypeScript
- Python
- Java
- C++
- C# / .NET

## 💻 Supported Languages

- JavaScript / TypeScript
- Python
- Java
- C++
- C# / .NET

## 🛠️ Development

### Prerequisites

- Node.js 14+ (for build scripts)
- Chrome or Edge browser

### Build from Source

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/draftdeckai-extension.git
cd draftdeckai-extension/extension

# Install dependencies (optional, for build scripts)
npm install

# Build extension (validates manifest and files)
npm run build

# Package for release
npm run package:zip    # Create ZIP file
npm run package:tar    # Create TAR.GZ file
npm run package:all    # Create both formats

# Validate extension
npm run validate
```

### Project Structure

```
extension/
├── manifest.json           # Extension manifest (v3)
├── background.js          # Service worker (handles AI calls)
├── content.js            # Content script (platform integration)
├── popup.html/js         # Extension popup UI
├── settings.html/js      # Settings page
├── config.js             # Configuration
├── voice-handler.js      # Voice commands
├── voice-interview.js    # Interview mode
├── interviewer-mode.js   # Mock interviews
├── mcp-server.js         # MCP integration
├── icons/                # Extension icons
└── styles.css            # Styling
```

## 🔒 Privacy & Security

- **No Data Collection**: Your API keys and data stay local
- **Local Storage Only**: Everything stored in your browser
- **Secure Communications**: All API calls use HTTPS
- **Open Source**: Full transparency - review the code yourself
- **No Tracking**: We don't track your usage or problems solved
- **API Keys**: Stored securely in browser storage, never shared

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 Changelog

### v1.0.0 (2026-01-07)
- ✨ Initial release
- 🧩 DSA problem solver with multi-language support
- 💼 Interview question generator
- 📄 Resume and career tools
- 🎮 Gamification system with XP and achievements
- 🎤 Voice commands and interview mode
- 🔌 Multi-AI provider support (Gemini, OpenAI, Claude, Mistral)
- 🌐 Platform integration for LeetCode, HackerRank, etc.

## 🐛 Troubleshooting

### Extension Not Working?
1. Ensure extension is enabled in `chrome://extensions/`
2. Refresh the page after installing
3. Check that you've configured your API key
4. Look for errors in the browser console (F12)

### No AI Response?
1. Verify your API key is correct
2. Test connection in Settings
3. Check your internet connection
4. Ensure you have API credits/quota remaining

### Platform Not Detected?
1. Refresh the page after installing extension
2. Verify the platform is in supported list
3. Manually use the extension popup instead

### Permission Issues?
- Extension needs permissions to inject content scripts
- Click "Allow" when browser prompts for permissions
- Required for platform integration features

## 📊 Roadmap

- [ ] Chrome Web Store publication
- [ ] Firefox Add-ons support
- [ ] Offline mode with cached solutions
- [ ] Study plan generator
- [ ] Progress analytics dashboard
- [ ] Team/group features
- [ ] Mobile app companion
- [ ] VS Code integration
- [ ] Collaborative problem solving

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini**: Powerful AI capabilities
- **OpenAI**: GPT models
- **Anthropic**: Claude AI
- **Mistral AI**: Open-source AI models
- **LeetCode, HackerRank, etc.**: Problem platforms
- **Community**: Beta testers and contributors

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/YOUR_USERNAME/draftdeckai-extension/issues)
- **Email**: support@draftdeckai.com
- **Discussions**: [Join community discussions](https://github.com/YOUR_USERNAME/draftdeckai-extension/discussions)

## ⭐ Show Your Support

If this extension helped you land a job or ace an interview, please:
- ⭐ Star the repository
- 🐛 Report bugs
- 💡 Suggest features
- 📢 Share with friends
- ✍️ Write a review

---

**Happy Coding! May you ace all your interviews! 🚀**

Made with ❤️ by the DraftDeckAI Team
