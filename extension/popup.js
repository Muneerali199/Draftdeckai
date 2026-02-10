// DraftDeckAI Smart AI Extension - Popup Script
// Uses Gemini AI directly - No backend needed!

let currentApiKey = '';

// Gamification System
const GAMIFICATION = {
    levels: [
        { level: 1, xp: 0, title: 'Beginner' },
        { level: 2, xp: 100, title: 'Learner' },
        { level: 3, xp: 250, title: 'Practitioner' },
        { level: 4, xp: 500, title: 'Expert' },
        { level: 5, xp: 1000, title: 'Master' },
        { level: 6, xp: 2000, title: 'Legend' }
    ],
    achievements: [
        { id: 'first_solve', name: 'First Steps', desc: 'Solve your first problem', xp: 10 },
        { id: 'streak_3', name: 'Consistent', desc: '3 day streak', xp: 25 },
        { id: 'streak_7', name: 'Dedicated', desc: '7 day streak', xp: 50 },
        { id: 'solve_10', name: 'Problem Solver', desc: 'Solve 10 problems', xp: 50 },
        { id: 'solve_50', name: 'Code Warrior', desc: 'Solve 50 problems', xp: 100 },
        { id: 'interview_1', name: 'Interview Ready', desc: 'Complete first interview', xp: 30 }
    ]
};

function calculateLevel(xp) {
    let currentLevel = GAMIFICATION.levels[0];
    for (const level of GAMIFICATION.levels) {
        if (xp >= level.xp) currentLevel = level;
        else break;
    }
    return currentLevel;
}

function addXP(amount) {
    chrome.storage.local.get(['user_xp', 'user_achievements'], (result) => {
        const newXP = (result.user_xp || 0) + amount;
        const level = calculateLevel(newXP);
        
        chrome.storage.local.set({ user_xp: newXP }, () => {
            updateLevelDisplay(level);
            checkAchievements(newXP, result.user_achievements || []);
        });
    });
}

function checkAchievements(xp, unlockedAchievements) {
    chrome.storage.local.get(['problems-solved', 'streak_count', 'interview_sessions'], (result) => {
        const problemsSolved = result['problems-solved'] || 0;
        const streak = result.streak_count || 0;
        const interviews = result.interview_sessions?.length || 0;
        
        GAMIFICATION.achievements.forEach(achievement => {
            if (unlockedAchievements.includes(achievement.id)) return;
            
            let unlock = false;
            if (achievement.id === 'first_solve' && problemsSolved >= 1) unlock = true;
            if (achievement.id === 'solve_10' && problemsSolved >= 10) unlock = true;
            if (achievement.id === 'solve_50' && problemsSolved >= 50) unlock = true;
            if (achievement.id === 'streak_3' && streak >= 3) unlock = true;
            if (achievement.id === 'streak_7' && streak >= 7) unlock = true;
            if (achievement.id === 'interview_1' && interviews >= 1) unlock = true;
            
            if (unlock) {
                unlockedAchievements.push(achievement.id);
                chrome.storage.local.set({ user_achievements: unlockedAchievements });
                showAchievementNotification(achievement);
                addXP(achievement.xp);
            }
        });
    });
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #F59E0B, #EF4444);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 250px;
    `;
    notification.innerHTML = `
        <div style="font-weight: 700; font-size: 1.1em; margin-bottom: 4px;">🏆 Achievement Unlocked!</div>
        <div style="font-weight: 600;">${achievement.name}</div>
        <div style="font-size: 0.85em; opacity: 0.9;">${achievement.desc}</div>
        <div style="font-size: 0.85em; margin-top: 4px;">+${achievement.xp} XP</div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

function updateLevelDisplay(level) {
    const levelBadge = document.getElementById('level-badge');
    const userLevel = document.getElementById('user-level');
    if (levelBadge && userLevel) {
        levelBadge.style.display = 'inline-block';
        userLevel.textContent = level.level;
        levelBadge.title = level.title;
    }
}

function updateStreakDisplay() {
    chrome.storage.local.get(['streak_count', 'last_activity_date'], (result) => {
        const today = new Date().toDateString();
        const lastActivity = result.last_activity_date || '';
        let streak = result.streak_count || 0;
        
        if (lastActivity !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastActivity === yesterday.toDateString()) {
                streak++;
            } else if (lastActivity !== today) {
                streak = 1;
            }
            
            chrome.storage.local.set({ 
                streak_count: streak, 
                last_activity_date: today 
            });
        }
        
        const streakBadge = document.getElementById('streak-badge');
        const streakCount = document.getElementById('streak-count');
        if (streakBadge && streakCount && streak > 0) {
            streakBadge.style.display = 'inline-block';
            streakCount.textContent = streak;
        }
    });
}

// Load API key and provider on startup
chrome.storage.local.get(['ai_provider', 'gemini_api_key', 'openai_api_key', 'mistral_api_key', 'claude_api_key', 'user_xp'], (result) => {
    const provider = result.ai_provider || 'gemini';
    const keyMap = {
        gemini: result.gemini_api_key,
        openai: result.openai_api_key,
        mistral: result.mistral_api_key,
        claude: result.claude_api_key
    };
    
    currentApiKey = keyMap[provider] || '';
    
    // Update provider display
    const providerNames = {
        gemini: 'Gemini',
        openai: 'OpenAI',
        mistral: 'Mistral',
        claude: 'Claude'
    };
    document.getElementById('current-provider').textContent = `Using: ${providerNames[provider]}`;
    
    // Update status
    if (currentApiKey) {
        document.getElementById('api-key-status').textContent = '✅ API Key Configured';
        document.getElementById('api-key-status').style.color = '#10B981';
    } else {
        document.getElementById('api-key-status').textContent = '⚠️ API Key Not Set';
        document.getElementById('api-key-status').style.color = '#EF4444';
    }

    // Gamification startup
    const userXP = result.user_xp || 0;
    const level = calculateLevel(userXP);
    updateLevelDisplay(level);
    updateStreakDisplay();
});

// Theme Management
const themeToggle = document.getElementById('toggle-theme');
const themeIcon = document.getElementById('theme-icon');

// Load theme
chrome.storage.local.get(['theme'], (result) => {
    if (result.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
    }
});

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        chrome.storage.local.set({ theme: 'light' });
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        chrome.storage.local.set({ theme: 'dark' });
    }
});

// Tab Management
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Open Settings Page
const settingsBtn = document.getElementById('open-settings');
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        console.log('Opening settings page...');
        // Try to open settings page
        try {
            chrome.runtime.openOptionsPage(() => {
                if (chrome.runtime.lastError) {
                    // Fallback: open in new tab
                    console.log('Using fallback method...');
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('settings.html')
                    });
                }
            });
        } catch (error) {
            console.error('Error opening settings:', error);
            // Direct fallback
            chrome.tabs.create({
                url: chrome.runtime.getURL('settings.html')
            });
        }
    });
    console.log('Settings button listener attached');
} else {
    console.error('Settings button not found in DOM');
}

// DSA Problem Solver
document.getElementById('solve-dsa').addEventListener('click', async () => {
    const problem = document.getElementById('dsa-problem').value.trim();
    const language = document.getElementById('dsa-language').value;
    
    if (!problem) {
        showNotification('Please enter a problem statement', 'error');
        return;
    }
    
    if (!currentApiKey) {
        showNotification('Please configure your API key first', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const solution = await solveDSAProblem(problem, language);
        displayDSASolution(solution);
        incrementStat('problems-solved');
    } catch (error) {
        showNotification('Failed to solve problem. Please try again.', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
});

// Interview Question Generator
document.getElementById('generate-questions').addEventListener('click', async () => {
    const role = document.getElementById('interview-role').value;
    const level = document.getElementById('interview-level').value;
    const company = document.getElementById('interview-company').value.trim();
    
    showLoading(true);
    
    try {
        const questions = await generateInterviewQuestions(role, level, company);
        displayInterviewQuestions(questions);
        incrementStat('questions-practiced', questions.length);
    } catch (error) {
        showNotification('Failed to generate questions. Please try again.', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
});

// Resume Actions
document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', async () => {
        const action = card.dataset.action;
        showLoading(true);
        
        try {
            const result = await handleResumeAction(action);
            displayResumeResult(action, result);
        } catch (error) {
            showNotification('Failed to process request. Please try again.', 'error');
            console.error(error);
        } finally {
            showLoading(false);
        }
    });
});


// Study Plan Generator
document.getElementById('generate-plan').addEventListener('click', async () => {
    const goal = document.getElementById('study-goal').value.trim();
    const duration = document.getElementById('study-duration').value;
    const hours = document.getElementById('study-hours').value;
    
    if (!goal) {
        showNotification('Please enter your study goal', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const plan = await generateStudyPlan(goal, duration, hours);
        displayStudyPlan(plan);
    } catch (error) {
        showNotification('Failed to generate plan. Please try again.', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
});

document.getElementById('copy-plan').addEventListener('click', () => {
    const content = document.getElementById('study-content').textContent;
    navigator.clipboard.writeText(content);
    showNotification('Study plan copied!', 'success');
});

// Study Plan Generator
document.getElementById('generate-plan').addEventListener('click', async () => {
    const goal = document.getElementById('study-goal').value.trim();
    const duration = document.getElementById('study-duration').value;
    const hours = document.getElementById('study-hours').value;
    
    if (!goal) {
        showNotification('Please enter your study goal', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const plan = await generateStudyPlan(goal, duration, hours);
        displayStudyPlan(plan);
    } catch (error) {
        showNotification('Failed to generate plan. Please try again.', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
});

document.getElementById('copy-plan').addEventListener('click', () => {
    const content = document.getElementById('study-content').textContent;
    navigator.clipboard.writeText(content);
    showNotification('Study plan copied!', 'success');
});

// Copy Solution
document.getElementById('copy-solution').addEventListener('click', () => {
    const content = document.getElementById('solution-content').textContent;
    navigator.clipboard.writeText(content);
    showNotification('Solution copied to clipboard!', 'success');
});

// Solution Tab Switching
document.querySelectorAll('.solution-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const solutionType = tab.dataset.solution;
        document.querySelectorAll('.solution-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Update solution content based on type
        updateSolutionContent(solutionType);
    });
});

// API Functions - Use Gemini AI directly
async function solveDSAProblem(problem, language) {
    const prompt = `You are an expert DSA problem solver. Solve this problem:

${problem}

Provide:
1. Approach (step-by-step thinking)
2. Complete code solution in ${language}
3. Time complexity
4. Space complexity
5. Explanation of the solution

Format your response as JSON with keys: approach, code, timeComplexity, spaceComplexity, explanation`;
    
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: 'SOLVE_PROBLEM', prompt },
            (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.data);
                }
            }
        );
    });
}

async function generateInterviewQuestions(role, level, company) {
    const companyText = company ? ` at ${company}` : '';
    const prompt = `Generate 5 interview questions for a ${level} level ${role} position${companyText}.

For each question provide:
1. The question
2. Category (technical, behavioral, system design, etc.)
3. Difficulty level
4. A detailed answer

Format as JSON array with objects having keys: question, category, difficulty, answer`;
    
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: 'SOLVE_PROBLEM', prompt },
            (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    // Handle both array and object responses
                    const data = response.data;
                    resolve(Array.isArray(data) ? data : (data.questions || []));
                }
            }
        );
    });
}

async function handleResumeAction(action) {
    let context = '';
    
    // If LinkedIn action, try to get profile data from current tab
    if (action === 'linkedin') {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0] && tabs[0].url.includes('linkedin.com')) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'MCP_SCAN_PAGE' });
                if (response && response.content) {
                    context = `\n\nAnalyze this specific profile:\nName: ${response.content.title}\n${response.content.description}`;
                }
            }
        } catch (e) {
            console.log('Could not fetch LinkedIn data:', e);
        }
    }

    const prompts = {
        'resume-review': 'Provide a comprehensive resume review checklist with best practices for 2024.',
        'cover-letter': 'Generate a professional cover letter template with tips for customization.',
        'linkedin': `Provide LinkedIn profile optimization tips including headline, summary, and experience sections.${context}`,
        'salary': 'Provide salary negotiation tips and current market trends for tech professionals.'
    };
    
    const prompt = prompts[action] || 'Provide career advice.';
    
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: 'SOLVE_PROBLEM', prompt },
            (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve({ content: response.data.content || JSON.stringify(response.data) });
                }
            }
        );
    });
}

async function generateStudyPlan(goal, duration, hours) {
    const prompt = `Create a detailed ${duration}-week study plan for: "${goal}".
    Available time: ${hours} hours per week.
    
    Provide a week-by-week breakdown with:
    1. Weekly focus/topic
    2. Daily tasks or milestones
    3. Recommended resources (free/paid)
    4. Practice exercises
    
    Format as HTML with 4th level headings for weeks and unordered lists for tasks. Do not use markdown code blocks.`;
    
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: 'SOLVE_PROBLEM', prompt },
            (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.data.content || response.data);
                }
            }
        );
    });
}

// Display Functions
function displayDSASolution(solution) {
    const resultDiv = document.getElementById('dsa-result');
    const contentDiv = document.getElementById('solution-content');
    
    // Store solution data
    window.currentSolution = solution;
    
    // Display approach by default
    contentDiv.innerHTML = `
        <h4>Approach:</h4>
        <p>${solution.approach || 'Analyzing problem...'}</p>
    `;
    
    resultDiv.classList.remove('hidden');
}

function updateSolutionContent(type) {
    const contentDiv = document.getElementById('solution-content');
    const solution = window.currentSolution;
    
    if (!solution) return;
    
    switch(type) {
        case 'approach':
            contentDiv.innerHTML = `
                <h4>Approach:</h4>
                <p>${solution.approach}</p>
            `;
            break;
        case 'code':
            contentDiv.innerHTML = `
                <h4>Code Solution:</h4>
                <pre><code>${solution.code}</code></pre>
            `;
            break;
        case 'complexity':
            contentDiv.innerHTML = `
                <h4>Time & Space Complexity:</h4>
                <p><strong>Time Complexity:</strong> ${solution.timeComplexity}</p>
                <p><strong>Space Complexity:</strong> ${solution.spaceComplexity}</p>
                <p><strong>Explanation:</strong> ${solution.complexityExplanation}</p>
            `;
            break;
    }
}

function displayInterviewQuestions(questions) {
    const resultDiv = document.getElementById('interview-result');
    const listDiv = document.getElementById('questions-list');
    
    listDiv.innerHTML = questions.map((q, index) => `
        <div class="question-item">
            <h4>Question ${index + 1}: ${q.question}</h4>
            <p><strong>Category:</strong> ${q.category} | <strong>Difficulty:</strong> ${q.difficulty}</p>
            <button class="show-answer-btn" onclick="toggleAnswer(${index})">Show Answer</button>
            <div id="answer-${index}" class="answer" style="display: none;">
                ${q.answer}
            </div>
        </div>
    `).join('');
    
    resultDiv.classList.remove('hidden');
}

function displayResumeResult(action, result) {
    const resultDiv = document.getElementById('resume-result');
    const titleDiv = document.getElementById('resume-result-title');
    const contentDiv = document.getElementById('resume-content');
    
    const titles = {
        'resume-review': 'Resume Review Results',
        'cover-letter': 'Generated Cover Letter',
        'linkedin': 'LinkedIn Optimization Tips',
        'salary': 'Salary Guide'
    };
    
    titleDiv.textContent = titles[action];
    contentDiv.innerHTML = result.content;
    resultDiv.classList.remove('hidden');
}



function displayStudyPlan(plan) {
    const resultDiv = document.getElementById('study-result');
    const contentDiv = document.getElementById('study-content');
    
    // If plan is an object (JSON), try to extract content, otherwise use it as string
    let content = typeof plan === 'string' ? plan : (plan.content || JSON.stringify(plan, null, 2));
    
    // Clean up markdown if present
    content = content.replace(/```html/g, '').replace(/```/g, '');
    
    contentDiv.innerHTML = content;
    resultDiv.classList.remove('hidden');
}

// Utility Functions
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'error' ? '#EF4444' : '#10B981'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function incrementStat(stat, count = 1) {
    const result = await chrome.storage.local.get(stat);
    const currentValue = result[stat] || 0;
    const newValue = currentValue + count;
    await chrome.storage.local.set({ [stat]: newValue });
    
    // Update display
    const element = document.getElementById(stat);
    if (element) {
        element.textContent = newValue;
    }
    
    // Award XP based on activity
    if (stat === 'problems-solved') {
        addXP(10);
        updateStreakDisplay();
    } else if (stat === 'questions-practiced') {
        addXP(5);
    }
    
    // Send to background
    chrome.runtime.sendMessage({
        type: 'INCREMENT_STAT',
        stat: stat,
        count: count
    });
}

function toggleAnswer(index) {
    const answerDiv = document.getElementById(`answer-${index}`);
    const button = event.target;
    
    if (answerDiv.style.display === 'none') {
        answerDiv.style.display = 'block';
        button.textContent = 'Hide Answer';
    } else {
        answerDiv.style.display = 'none';
        button.textContent = 'Show Answer';
    }
}

// Load stats on startup
chrome.storage.local.get(['problems-solved', 'questions-practiced'], (result) => {
    if (result['problems-solved']) {
        document.getElementById('problems-solved').textContent = result['problems-solved'];
    }
    if (result['questions-practiced']) {
        document.getElementById('questions-practiced').textContent = result['questions-practiced'];
    }
});

// Get More Questions
document.getElementById('get-more-questions').addEventListener('click', () => {
    document.getElementById('generate-questions').click();
});

// Voice Mode Toggle
const toggleVoiceBtn = document.getElementById('toggle-voice');
if (toggleVoiceBtn && window.voiceHandler) {
    toggleVoiceBtn.addEventListener('click', () => {
        window.voiceHandler.toggleListening();
    });
}

// Listen for voice state changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'VOICE_LISTENING_STATE') {
        const voiceBtn = document.getElementById('toggle-voice');
        const voiceStatus = document.getElementById('voice-status');
        const voiceIcon = document.getElementById('voice-icon');
        
        if (request.isListening) {
            voiceStatus.textContent = 'Voice On';
            voiceIcon.textContent = '🎙️';
            voiceBtn.style.background = '#10B981';
            voiceBtn.style.color = 'white';
        } else {
            voiceStatus.textContent = 'Voice Off';
            voiceIcon.textContent = '🎤';
            voiceBtn.style.background = '';
            voiceBtn.style.color = '';
        }
    } else if (request.type === 'DISPLAY_QUESTION') {
        displayInterviewQuestion(request.question);
    } else if (request.type === 'DISPLAY_EVALUATION') {
        displayInterviewEvaluation(request.question, request.evaluation);
    } else if (request.type === 'DISPLAY_FINAL_EVALUATION') {
        displayFinalEvaluation(request.evaluation, request.session);
    }
});

// Start Interview Mode - Open Config
document.getElementById('start-interview-mode').addEventListener('click', () => {
    if (!window.interviewerMode) {
        showNotification('Interviewer mode is loading...', 'info');
        return;
    }
    
    // Show config modal
    document.getElementById('interview-config-modal').classList.remove('hidden');
});

// Cancel Interview Config
document.getElementById('cancel-interview-config').addEventListener('click', () => {
    document.getElementById('interview-config-modal').classList.add('hidden');
});

// Start Interview from Config
document.getElementById('start-interview-config').addEventListener('click', () => {
    const type = document.getElementById('config-type').value;
    const role = document.getElementById('config-role').value;
    const level = document.getElementById('config-level').value;
    const company = document.getElementById('config-company').value;
    
    const config = {
        type,
        role,
        level,
        company,
        duration: 30,
        questionCount: 5
    };
    
    // Hide modal
    document.getElementById('interview-config-modal').classList.add('hidden');
    
    // Start interview
    window.interviewerMode.startInterview(config);
    showNotification('Interview started! Good luck!', 'success');
});

// Display interview question
function displayInterviewQuestion(question) {
    // Switch to interview tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="interview"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('interview-tab').classList.add('active');
    
    // Display question
    const resultDiv = document.getElementById('interview-result');
    const listDiv = document.getElementById('questions-list');
    
    listDiv.innerHTML = `
        <div class="interview-question-active">
            <h4>Question: ${question.question}</h4>
            <p class="difficulty">Difficulty: ${question.difficulty}</p>
            <div class="answer-input">
                <textarea id="interview-answer" placeholder="Type your answer here..." rows="6"></textarea>
                <button id="submit-interview-answer" class="btn btn-primary">Submit Answer</button>
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    
    // Add submit handler
    document.getElementById('submit-interview-answer').addEventListener('click', () => {
        const answer = document.getElementById('interview-answer').value;
        if (answer.trim() && window.interviewerMode) {
            window.interviewerMode.submitAnswer(answer);
        }
    });
}

// Display interview evaluation
function displayInterviewEvaluation(question, evaluation) {
    const listDiv = document.getElementById('questions-list');
    
    listDiv.innerHTML += `
        <div class="evaluation-result">
            <h4>Score: ${Math.round(evaluation.overallScore)}/100</h4>
            <div class="score-breakdown">
                <div class="score-item">
                    <span>Correctness:</span>
                    <span>${Math.round(evaluation.correctness)}/100</span>
                </div>
                <div class="score-item">
                    <span>Approach:</span>
                    <span>${Math.round(evaluation.approach)}/100</span>
                </div>
                <div class="score-item">
                    <span>Communication:</span>
                    <span>${Math.round(evaluation.communication)}/100</span>
                </div>
            </div>
            ${evaluation.strengths && evaluation.strengths.length > 0 ? `
                <div class="feedback-section">
                    <strong>Strengths:</strong>
                    <p>${evaluation.strengths[0]}</p>
                </div>
            ` : ''}
            ${evaluation.improvements && evaluation.improvements.length > 0 ? `
                <div class="feedback-section">
                    <strong>To Improve:</strong>
                    <p>${evaluation.improvements[0]}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Display final evaluation
function displayFinalEvaluation(evaluation, session) {
    const listDiv = document.getElementById('questions-list');
    
    listDiv.innerHTML = `
        <div class="final-evaluation">
            <h2>Interview Complete! 🎉</h2>
            <div class="final-score">
                <h3>Overall Score: ${Math.round(evaluation.overallScore)}/100</h3>
            </div>
            <div class="detailed-scores">
                <h4>Score Breakdown:</h4>
                <div class="score-item">
                    <span>Correctness:</span>
                    <span>${Math.round(evaluation.correctness)}/100</span>
                </div>
                <div class="score-item">
                    <span>Approach:</span>
                    <span>${Math.round(evaluation.approach)}/100</span>
                </div>
                <div class="score-item">
                    <span>Code Quality:</span>
                    <span>${Math.round(evaluation.codeQuality)}/100</span>
                </div>
                <div class="score-item">
                    <span>Complexity:</span>
                    <span>${Math.round(evaluation.complexity)}/100</span>
                </div>
                <div class="score-item">
                    <span>Communication:</span>
                    <span>${Math.round(evaluation.communication)}/100</span>
                </div>
            </div>
            <div class="strengths-weaknesses">
                <div class="strengths">
                    <h4>Your Strengths:</h4>
                    <ul>
                        ${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                <div class="improvements">
                    <h4>Areas to Improve:</h4>
                    <ul>
                        ${evaluation.improvements.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <p class="session-info">Answered ${evaluation.questionsAnswered} questions in ${Math.round(evaluation.duration)} minutes</p>
            <button id="start-new-interview" class="btn btn-primary">Start New Interview</button>
        </div>
    `;
    
    // Add handler for new interview
    document.getElementById('start-new-interview').addEventListener('click', () => {
        document.getElementById('start-interview-mode').click();
    });
}
