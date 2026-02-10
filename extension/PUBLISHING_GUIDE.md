# 🚀 GitHub Publishing Guide

This guide will help you publish your DraftDeckAI extension to GitHub and create releases for users to download.

## 📋 Prerequisites

- GitHub account
- Git installed on your computer
- Extension files ready in the `extension` folder

## 🎯 Step-by-Step Publishing Process

### Step 1: Create GitHub Repository

1. **Go to GitHub** and sign in: https://github.com
2. **Click the "+" icon** in the top right → "New repository"
3. **Repository details**:
   - Repository name: `draftdeckai-extension`
   - Description: `AI-powered browser extension for interview preparation and DSA problem solving`
   - Visibility: **Public** (so anyone can use it)
   - ✅ Add README file: **Skip** (we already have one)
   - ✅ Add .gitignore: **Skip** (we already have one)
   - ✅ Choose a license: **Skip** (we already have MIT)
4. **Click "Create repository"**

### Step 2: Push Your Extension to GitHub

Open PowerShell in your extension folder and run:

```powershell
# Navigate to extension folder
cd "C:\Users\miet\Desktop\DraftDeckAI\extension"

# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial release v1.0.0"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/draftdeckai-extension.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Update Repository Settings

1. **Go to your repository** on GitHub
2. **Click "Settings"** tab
3. **Update repository details**:
   - Website: Add your website URL (if any)
   - Topics: Add tags like `chrome-extension`, `interview-prep`, `dsa`, `ai`, `leetcode`
4. **Enable Discussions** (optional):
   - Scroll to "Features"
   - ✅ Check "Discussions"

### Step 4: Update README with Correct URLs

**Important**: Update all placeholder URLs in README.md:

1. Open `README.md`
2. Replace `YOUR_USERNAME` with your actual GitHub username
3. Save the file
4. Commit and push:

```powershell
git add README.md
git commit -m "Update README with correct GitHub URLs"
git push
```

### Step 5: Create Your First Release

#### Option A: Using GitHub Web Interface (Recommended for First Time)

1. **Go to your repository** on GitHub
2. **Click "Releases"** in the right sidebar
3. **Click "Create a new release"**
4. **Fill in the release details**:
   - **Tag**: `v1.0.0` (create new tag)
   - **Release title**: `DraftDeckAI Extension v1.0.0`
   - **Description**: Copy from below:

```markdown
## 🚀 DraftDeckAI Interview & DSA Prep Extension v1.0.0

### ✨ First Release!

AI-powered browser extension to help you ace coding interviews, solve DSA problems, and land your dream job!

### 📥 Installation

1. Download the ZIP file below
2. Extract it to a folder
3. Open Chrome/Edge → Go to `chrome://extensions/`
4. Enable **Developer Mode** (toggle in top-right)
5. Click **Load unpacked**
6. Select the extracted `extension` folder
7. Done! 🎉

### ✨ Features

- 🧩 AI-powered DSA problem solver
- 💼 Interview question generator
- 📄 Resume review and career tools
- 🎮 Gamification with XP and achievements
- 🎤 Voice commands and mock interviews
- 🌐 Works on LeetCode, HackerRank, and more
- 🔌 Multiple AI providers (Gemini, OpenAI, Claude, Mistral)

### 🔧 Setup

1. Get your API key (Gemini is free: https://makersuite.google.com/app/apikey)
2. Open extension settings
3. Select AI provider and paste your key
4. Start solving problems!

### 📚 Documentation

- [README](https://github.com/YOUR_USERNAME/draftdeckai-extension/blob/main/README.md)
- [Setup Guide](https://github.com/YOUR_USERNAME/draftdeckai-extension/blob/main/README.md#setup--configuration)
- [Contributing](https://github.com/YOUR_USERNAME/draftdeckai-extension/blob/main/CONTRIBUTING.md)

### ⭐ Support

If this extension helps you, please:
- ⭐ Star the repository
- 🐛 Report issues
- 💡 Suggest features
- 📢 Share with friends

Happy coding! May you ace all your interviews! 🚀
```

5. **Upload release files**:
   - Run packaging script first:
     ```powershell
     npm run package:all
     ```
   - Upload `dist/draftdeckai-extension-v1.0.0.zip` from your dist folder
   - Upload `dist/draftdeckai-extension-v1.0.0.tar.gz` (if created)

6. **Click "Publish release"**

#### Option B: Using GitHub Actions (Automated)

If you want automated releases:

1. **Push a tag** to trigger the workflow:
   ```powershell
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically**:
   - Build the extension
   - Create ZIP and TAR.GZ files
   - Create a release
   - Upload the files

3. **Go to "Actions" tab** to see the workflow running

### Step 6: Verify Your Release

1. **Go to your releases page**: `https://github.com/YOUR_USERNAME/draftdeckai-extension/releases`
2. **Check that files are present**:
   - ✅ draftdeckai-extension-v1.0.0.zip
   - ✅ draftdeckai-extension-v1.0.0.tar.gz (optional)
3. **Test download**: Download and install to verify

### Step 7: Add Badges and Polish

1. **Update README badges**:
   ```markdown
   [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
   [![Version](https://img.shields.io/github/v/release/YOUR_USERNAME/draftdeckai-extension)](https://github.com/YOUR_USERNAME/draftdeckai-extension/releases)
   [![Downloads](https://img.shields.io/github/downloads/YOUR_USERNAME/draftdeckai-extension/total)](https://github.com/YOUR_USERNAME/draftdeckai-extension/releases)
   ```

2. **Add screenshots** (optional but recommended):
   - Create `screenshots/` folder
   - Add screenshots of your extension
   - Reference in README

### Step 8: Promote Your Extension

1. **Create a compelling repository description**
2. **Add relevant topics/tags**
3. **Share on social media**:
   - Twitter/X
   - LinkedIn
   - Reddit (r/learnprogramming, r/cscareerquestions)
   - Discord servers
4. **Write a blog post** about your extension
5. **Submit to directories**:
   - awesome-browser-extensions lists
   - Product Hunt (optional)

## 🔄 Making Future Releases

When you want to release a new version:

1. **Update version** in `manifest.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. **Update CHANGELOG.md** with new changes

3. **Commit changes**:
   ```powershell
   git add .
   git commit -m "Release v1.1.0: Add new features"
   git push
   ```

4. **Create new release**:
   ```powershell
   # Tag the release
   git tag v1.1.0
   git push origin v1.1.0
   
   # Or use GitHub Actions to automate
   # Or create manually on GitHub
   ```

5. **Package and upload**:
   ```powershell
   npm run package:all
   # Then upload to GitHub release
   ```

## 📊 Track Your Extension

1. **Monitor Issues**: Respond to user bug reports
2. **Check Discussions**: Answer user questions
3. **Review Pull Requests**: Accept community contributions
4. **Update Documentation**: Keep README current
5. **Release Notes**: Document all changes

## 🎯 Best Practices

### Version Numbering (Semantic Versioning)

- `1.0.0` → `1.0.1`: Bug fixes (patch)
- `1.0.0` → `1.1.0`: New features (minor)
- `1.0.0` → `2.0.0`: Breaking changes (major)

### Commit Messages

```
✅ Good:
- "Add support for CodeChef platform"
- "Fix API key validation bug"
- "Update README with new installation steps"

❌ Bad:
- "Update"
- "Fix bug"
- "Changes"
```

### Release Frequency

- **Bug fixes**: As soon as possible
- **New features**: Every 2-4 weeks
- **Major updates**: Every 2-3 months

## 🛠️ Maintenance Checklist

### Weekly
- [ ] Check for new issues
- [ ] Respond to questions
- [ ] Review pull requests

### Monthly
- [ ] Update dependencies
- [ ] Test on latest browser versions
- [ ] Review analytics (if any)

### Quarterly
- [ ] Major feature updates
- [ ] Documentation review
- [ ] Community feedback integration

## 📞 Getting Help

If you encounter issues:

1. **Check GitHub Actions logs** (if using automation)
2. **Verify Git configuration**: `git config --list`
3. **Check permissions**: Ensure you have access to the repository
4. **Read error messages** carefully

## 🎉 Success!

Congratulations! Your extension is now:
- ✅ Published on GitHub
- ✅ Available for download
- ✅ Ready for users
- ✅ Open for contributions

**Next Steps:**
1. Share with friends and colleagues
2. Post on social media
3. Consider submitting to Chrome Web Store
4. Keep updating and improving

---

**Need help?** Open an issue on your repository or reach out to the community!

**Made with ❤️ by the DraftDeckAI Team**
