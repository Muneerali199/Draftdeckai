# Contributing to DraftDeckAI Extension

Thank you for your interest in contributing to DraftDeckAI! This document provides guidelines and instructions for contributing.

## 🎯 Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit bug fixes
- ✨ Add new features
- 🌐 Add platform support
- 🎨 Improve UI/UX
- 🧪 Write tests

## 📋 Getting Started

### Prerequisites

- Node.js 14+ (for build scripts)
- Chrome or Edge browser
- Git
- Text editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/draftdeckai-extension.git
   cd draftdeckai-extension/extension
   ```

2. **Install dependencies** (optional, for build scripts)
   ```bash
   npm install
   ```

3. **Load extension in browser**
   - Open `chrome://extensions/`
   - Enable "Developer Mode"
   - Click "Load unpacked"
   - Select the `extension` folder

4. **Make your changes**
   - Create a new branch: `git checkout -b feature/your-feature-name`
   - Make your changes
   - Test thoroughly

5. **Test your changes**
   - Test all affected features
   - Ensure no console errors
   - Verify on multiple platforms (LeetCode, HackerRank, etc.)

## 🔨 Development Guidelines

### Code Style

- Use **2 spaces** for indentation (JavaScript)
- Use **meaningful variable names**
- Add **comments** for complex logic
- Follow **existing code style**
- Use **modern JavaScript** (ES6+)

### File Structure

```
extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (AI calls, notifications)
├── content.js         # Platform integration scripts
├── popup.js           # Main popup logic
├── settings.js        # Settings page logic
├── *.html             # HTML pages
├── *.css              # Stylesheets
└── icons/             # Extension icons
```

### Naming Conventions

- **Functions**: `camelCase` (e.g., `solveProblem`, `generateQuestions`)
- **Variables**: `camelCase` (e.g., `apiKey`, `problemText`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_URL`, `MAX_RETRIES`)
- **Files**: `kebab-case` (e.g., `voice-handler.js`, `interview-mode.js`)

### Adding New Features

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Implement your feature**
   - Add necessary files
   - Update manifest.json if needed
   - Add UI elements if needed

3. **Test thoroughly**
   - Test on all supported platforms
   - Test with different AI providers
   - Test error handling

4. **Update documentation**
   - Update README.md
   - Add comments in code
   - Update CHANGELOG.md

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

### Adding Platform Support

To add support for a new coding platform:

1. **Update `content.js`**
   ```javascript
   function detectPlatform() {
       const hostname = window.location.hostname;
       
       // Add your platform
       if (hostname.includes('newplatform.com')) return 'newplatform';
       
       return null;
   }
   ```

2. **Add platform-specific selectors**
   ```javascript
   const selectors = {
       newplatform: {
           title: ['.problem-title', 'h1'],
           description: ['.problem-description'],
           difficulty: ['.difficulty-badge']
       }
   };
   ```

3. **Update manifest.json**
   ```json
   {
     "content_scripts": [{
       "matches": [
         "https://newplatform.com/*"
       ]
     }],
     "host_permissions": [
       "https://newplatform.com/*"
     ]
   }
   ```

4. **Test on the platform**
   - Visit the platform
   - Verify auto-detection works
   - Test problem extraction
   - Test AI integration

## 🐛 Bug Reports

### Before Reporting

- Search existing issues
- Check if it's already fixed
- Verify it's reproducible

### Creating a Bug Report

Include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**:
   ```
   1. Go to LeetCode
   2. Click on a problem
   3. Click "Get AI Help"
   4. See error
   ```
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - Browser & version
   - Extension version
   - Operating System
   - AI provider used
6. **Screenshots**: If applicable
7. **Console Errors**: Press F12, check Console tab

## 💡 Feature Requests

### Creating a Feature Request

1. **Check existing requests** first
2. **Describe the feature** clearly
3. **Explain the use case**: Why is it needed?
4. **Provide examples**: How would it work?
5. **Consider alternatives**: Other solutions?

## 🔄 Pull Request Process

### Before Submitting

1. ✅ Test your changes thoroughly
2. ✅ Update documentation
3. ✅ Follow code style guidelines
4. ✅ Run validation: `npm run validate`
5. ✅ No console errors
6. ✅ Works on all supported platforms

### Submitting a Pull Request

1. **Create a descriptive title**
   - ✅ Good: "Add support for CodeChef platform"
   - ❌ Bad: "Update content.js"

2. **Fill out the PR template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tested on LeetCode
   - [ ] Tested on HackerRank
   - [ ] No console errors
   
   ## Screenshots
   (if applicable)
   ```

3. **Link related issues**
   ```markdown
   Fixes #123
   Related to #456
   ```

4. **Wait for review**
   - Maintainers will review your PR
   - Address feedback if requested
   - Be patient and respectful

### PR Review Process

- **Automated checks** run first
- **Code review** by maintainers
- **Testing** on different environments
- **Approval** and merge

## 🧪 Testing Guidelines

### Manual Testing

1. **Load extension** in developer mode
2. **Test each feature**:
   - DSA Problem Solver
   - Interview Question Generator
   - Resume Tools
   - Platform Integration
   - Settings

3. **Test on platforms**:
   - LeetCode
   - HackerRank
   - Codeforces
   - GeeksforGeeks

4. **Test error scenarios**:
   - Invalid API key
   - Network errors
   - Empty inputs
   - Large inputs

### Testing Checklist

- [ ] Extension loads without errors
- [ ] All popup tabs work
- [ ] Settings save correctly
- [ ] API integration works
- [ ] Platform detection works
- [ ] Context menu works
- [ ] No console errors
- [ ] No permission warnings

## 📚 Documentation

### Updating README

- Keep it concise and clear
- Update version numbers
- Add new features to feature list
- Update screenshots if UI changed

### Code Comments

```javascript
/**
 * Solves a DSA problem using AI
 * @param {string} problem - The problem statement
 * @param {string} language - Programming language
 * @returns {Promise<Object>} Solution object
 */
async function solveProblem(problem, language) {
    // Implementation
}
```

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email: security@draftdeckai.com
2. Include detailed description
3. Steps to reproduce
4. Potential impact

### Security Guidelines

- Never commit API keys
- Sanitize user inputs
- Use Content Security Policy
- Validate all external data
- Use HTTPS for API calls

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Accept constructive criticism
- ✅ Focus on what's best for the community
- ✅ Show empathy towards others

- ❌ No trolling or insulting comments
- ❌ No harassment or discrimination
- ❌ No spam or self-promotion
- ❌ No inappropriate content

## 📞 Questions?

- Open a [Discussion](https://github.com/YOUR_USERNAME/draftdeckai-extension/discussions)
- Join our Discord (coming soon)
- Email: support@draftdeckai.com

---

**Thank you for contributing to DraftDeckAI! Together, we help people land their dream jobs! 🚀**
