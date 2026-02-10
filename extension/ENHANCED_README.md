# 🚀 DraftDeckAI Enhanced AI Interview Assistant

> **Revolutionary AI-Powered Extension with Voice, MCP Intelligence, and Interactive Interviewer Mode**

## 🌟 What's New - Major Enhancements

### 🎤 **Voice Interaction**
- **Full conversational AI** - Talk to your AI mate naturally
- **Speech-to-text** - Give commands using your voice
- **Text-to-speech** - AI responds with voice
- **Voice commands**: "solve", "hint", "approach", "start interview"
- **Continuous listening** mode for hands-free practice

### 🤖 **Intelligent MCP Server**
- **Automatic page scanning** - Analyzes problems as you browse
- **Pattern recognition** - Identifies DSA patterns automatically
- **Data structure suggestions** - Recommends optimal DS for each problem
- **Multiple solution approaches** - Generates 3-5 different approaches
- **Progressive hints** - Smart hint system that doesn't give away the answer
- **Complexity estimation** - Suggests best time/space complexity

### 🎯 **Interactive Interviewer Mode**
- **AI acts as your interviewer** - Conducts real mock interviews
- **Adaptive questioning** - Asks follow-up questions based on your answers
- **Real-time evaluation** - Scores each answer immediately
- **Comprehensive feedback** - Detailed breakdown of strengths/weaknesses
- **Multiple interview types**:
  - Technical interviews
  - DSA problem solving
  - System design
  - Behavioral questions
  - Mixed interviews

### 📊 **Advanced Scoring System**
Evaluates you on 5 criteria:
1. **Correctness (30%)** - Is your answer correct?
2. **Approach (25%)** - Is your logic sound?
3. **Code Quality (20%)** - Is your code clean and readable?
4. **Complexity Analysis (15%)** - Did you consider time/space complexity?
5. **Communication (10%)** - How well did you explain?

### 💡 **Smart Features**

#### Context-Aware AI
- Understands full problem context
- Remembers previous questions in interview
- Adapts difficulty based on your performance

#### Progressive Learning
- Starts with hints, not solutions
- Gradually reveals more information
- Teaches problem-solving patterns

#### Interview Session History
- Saves all interview sessions
- Track progress over time
- Review past evaluations
- Identify improvement areas

## 📥 Installation

1. **Download or clone** this repository
2. Open Chrome/Edge: `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **"Load unpacked"**
5. Select the `extension` folder
6. ✅ **Done!** Extension is ready

## 🎯 Quick Start Guide

### 1️⃣ First Time Setup

1. **Click extension icon** in your browser toolbar
2. **Click "Open Full Settings"**
3. **Select AI Provider** (Gemini, OpenAI, Mistral, or Claude)
4. **Add API Key**:
   - **Gemini (Free)**: [Get key here](https://makersuite.google.com/app/apikey)
   - **OpenAI**: [Get key here](https://platform.openai.com/api-keys)
   - **Mistral**: [Get key here](https://console.mistral.ai/)
   - **Claude**: [Get key here](https://console.anthropic.com/)
5. **Test Connection** to verify
6. **Enable features**:
   - ✅ Voice Mode
   - ✅ MCP Auto-Scan
   - ✅ Interviewer Mode

### 2️⃣ Using Voice Mode

1. **Click "🎤 Voice Off"** button to enable
2. **Start speaking** - it will automatically listen
3. **Say commands**:
   - "Solve this problem"
   - "Give me a hint"
   - "Explain the approach"
   - "Start interview"
   - Or just have a conversation!
4. **AI responds with voice** - listen to explanations
5. **Click again to disable** when done

### 3️⃣ Starting Interviewer Mode

1. **Click "🎯 Start Interview"** button
2. **AI greets you** and explains the process
3. **Answer questions out loud** (if voice enabled) or type
4. **Get immediate feedback** after each answer
5. **Receive final evaluation** at the end:
   - Overall score (0-100)
   - Breakdown by category
   - Strengths highlighted
   - Areas for improvement
   - Specific recommendations

### 4️⃣ Using MCP Auto-Analysis

1. **Visit any coding platform** (LeetCode, HackerRank, etc.)
2. **MCP automatically scans** the problem (every 2 seconds)
3. **See AI analysis pop up**:
   - Identified patterns
   - Suggested data structures
   - Best approach
   - Quick hints
4. **Analysis updates** when problem changes

### 5️⃣ On Coding Platforms

1. **Visit LeetCode/HackerRank/Codeforces/GeeksforGeeks**
2. **Look for "📚 Get AI Help" button** (bottom-right corner)
3. **Click for instant AI assistance**:
   - 💡 Get Hint
   - 🧩 Show Approach
   - ✅ Full Solution
   - ⏱️ Complexity Analysis
4. **Or right-click any text** → "Solve with DraftDeckAI AI"

## 🎤 Voice Commands Reference

### Basic Commands
- **"Solve"** or **"Help me solve"** → Get full solution
- **"Hint"** → Get a hint without spoilers
- **"Approach"** → Explain the approach
- **"Explain"** → Explain code or concept
- **"Complexity"** → Analyze time/space complexity

### Interview Commands
- **"Start interview"** → Begin interview mode
- **"My answer is..."** → Submit your answer
- **"Repeat"** → Repeat the last question
- **"Stop"** → Pause voice/interview

### Conversational
Just talk naturally! The AI understands:
- "How would you solve this?"
- "What data structure should I use?"
- "Is this approach optimal?"
- "What's the time complexity?"

## 🧠 MCP Intelligence Features

### Automatic Pattern Recognition
Detects these patterns automatically:
- Two Pointers
- Dynamic Programming
- Binary Search
- Graph algorithms
- Tree traversal
- Backtracking
- Greedy algorithms
- Divide and Conquer
- Stack/Queue
- HashMap/HashSet

### Data Structure Suggestions
Recommends based on problem keywords:
- Arrays & Lists
- HashMap/HashSet
- Stack & Queue
- Heap/Priority Queue
- Binary Trees
- Graphs
- Tries
- Union-Find
- Linked Lists

### Multiple Solution Approaches
For each problem, generates:
1. **Brute Force** - Simple but slow
2. **Optimal** - Best time/space
3. **Alternative** - Different techniques
4. **Trade-offs** - Pros and cons of each

## 🎯 Interview Mode Details

### Interview Types
1. **Technical** - Coding and algorithm questions
2. **DSA** - Data structures and algorithms deep dive
3. **System Design** - Architecture and scalability
4. **Behavioral** - STAR method questions
5. **Mixed** - Combination of all types

### Configuration Options
```javascript
{
  type: 'technical',        // Interview type
  role: 'Software Engineer', // Your target role
  level: 'mid',             // entry, mid, senior
  company: 'Google',        // Optional: target company
  duration: 30,             // Minutes
  questionCount: 5          // Number of questions
}
```

### Evaluation Breakdown

After each question, you get:
- **Immediate score** (0-100)
- **What you did well**
- **What needs improvement**
- **Specific tips**

Final evaluation includes:
- **Overall score** across all questions
- **Category breakdown**:
  - Correctness: 70/100
  - Approach: 85/100
  - Code Quality: 75/100
  - Complexity: 80/100
  - Communication: 90/100
- **Top 5 strengths**
- **Top 5 areas to improve**
- **Actionable recommendations**
- **Time taken per question**

### Session History
All interviews are saved:
- Date and time
- Interview type and config
- All questions asked
- Your answers
- Scores and feedback
- Overall evaluation

View history anytime to track progress!

## 🔧 Advanced Configuration

### MCP Server Settings
```json
{
  "autoScan": true,
  "scanInterval": 2000,
  "maxCacheSize": 100,
  "features": {
    "patternRecognition": true,
    "multipleApproaches": true,
    "progressiveHints": true
  }
}
```

### Voice Settings
- **Language**: en-US, en-GB, es-ES, fr-FR, etc.
- **Speech Rate**: 0.5 - 2.0 (default: 1.0)
- **Pitch**: 0.0 - 2.0 (default: 1.0)
- **Volume**: 0.0 - 1.0 (default: 1.0)
- **Auto-restart**: Keep listening after each command

### Interviewer Settings
- **Default duration**: 30 minutes
- **Question count**: 5
- **Difficulty progression**: Auto-adjust
- **Hint levels**: 4 (progressive)
- **Follow-up questions**: Enabled
- **Real-time feedback**: Enabled

## 📊 Statistics & Analytics

Track your progress:
- **Problems Solved**: Total DSA problems
- **Questions Practiced**: Interview questions
- **Interview Sessions**: Total interviews
- **Average Score**: Across all interviews
- **Improvement Trend**: Score over time
- **Strongest Areas**: Your best categories
- **Areas to Improve**: Focus points
- **Time Management**: Average time per question

## 🎓 Best Practices

### For DSA Practice
1. **Read problem carefully** first
2. **Ask for hint** before solution
3. **Try to solve** on your own first
4. **Use MCP analysis** as guide
5. **Review complexity** always

### For Interview Prep
1. **Start with voice off** to focus
2. **Enable voice** when comfortable
3. **Take your time** - no rush
4. **Explain your thinking** out loud
5. **Review evaluations** after each session
6. **Track weak areas** and practice
7. **Do mock interviews** regularly (2-3x per week)

### For Voice Interaction
1. **Speak clearly** and naturally
2. **Use commands** for specific actions
3. **Have conversations** for understanding
4. **Listen to AI** explanations fully
5. **Adjust settings** if voice is too fast/slow

## 🚨 Troubleshooting

### Voice Not Working?
- Check microphone permissions
- Ensure HTTPS (voice requires secure context)
- Try a different browser (Chrome/Edge work best)
- Check browser voice settings

### MCP Not Scanning?
- Refresh the page
- Check if platform is supported
- Enable in settings
- Look for console errors (F12)

### Interviewer Mode Issues?
- Configure API key first
- Check internet connection
- Try with a simpler interview type
- Review session history for clues

### API Errors?
- Verify API key is correct
- Check API quota/limits
- Try different provider
- Test connection in settings

## 🔒 Privacy & Security

- **No data collection** - Everything stays local
- **API keys encrypted** - Stored securely in browser
- **No tracking** - We don't track your activity
- **Offline capable** - Works without internet (limited features)
- **Your answers private** - Never sent to our servers
- **Interview history local** - Stored only on your device

## 🎯 Supported Platforms

| Platform | Auto-Scan | AI Help Button | Voice | Interviewer |
|----------|-----------|----------------|-------|-------------|
| LeetCode | ✅ | ✅ | ✅ | ✅ |
| HackerRank | ✅ | ✅ | ✅ | ✅ |
| Codeforces | ✅ | ✅ | ✅ | ✅ |
| GeeksforGeeks | ✅ | ✅ | ✅ | ✅ |

## 💻 Programming Languages

Supports solutions in:
- JavaScript / TypeScript
- Python
- Java
- C++
- C#
- Go (coming soon)
- Rust (coming soon)

## 🚀 Keyboard Shortcuts

- `Alt+Shift+D` - Open extension popup
- `Alt+Shift+S` - Solve selected problem
- `Alt+Shift+E` - Explain selected code
- `Alt+Shift+V` - Toggle voice mode
- `Alt+Shift+I` - Start interview mode

## 🌐 Browser Support

- ✅ Google Chrome (Recommended)
- ✅ Microsoft Edge
- ✅ Brave
- ⚠️ Firefox (Limited voice support)
- ❌ Safari (Not supported)

## 📈 Roadmap

Coming soon:
- [ ] Collaborative interview mode (interview with friends)
- [ ] Video interview practice
- [ ] Resume analysis integration
- [ ] Job matching AI
- [ ] Company-specific prep (FAANG focus)
- [ ] Mobile app version
- [ ] VS Code integration
- [ ] Study plan generator
- [ ] Peer comparison (anonymized)
- [ ] Certification prep modules

## 🙏 Support & Feedback

- **Website**: https://draftdeckai.com
- **Email**: support@draftdeckai.com
- **Discord**: Join our community
- **GitHub**: Report issues

## 📄 License

MIT License - Free to use and modify

---

## 🎉 Start Your Journey Today!

Install the extension and transform your interview preparation with:
- 🎤 **Voice AI Mate** - Your conversational coding buddy
- 🤖 **MCP Intelligence** - Automatic problem analysis
- 🎯 **Interactive Interviewer** - Practice like the real thing
- 📊 **Smart Feedback** - Know exactly what to improve

**Success starts with preparation. Start preparing smarter today!** 🚀
