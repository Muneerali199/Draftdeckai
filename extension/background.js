// DraftDeckAI Smart AI Extension - Background Service Worker
// Supports multiple AI providers, MCP server, voice, and interviewer mode

// Import MCP Server
import { mcpServer } from './mcp-server.js';

// Storage keys
const STORAGE_KEYS = {
    AI_PROVIDER: 'ai_provider',
    GEMINI_KEY: 'gemini_api_key',
    OPENAI_KEY: 'openai_api_key',
    MISTRAL_KEY: 'mistral_api_key',
    CLAUDE_KEY: 'claude_api_key'
};

// API URLs
const API_URLS = {
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    openai: 'https://api.openai.com/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    claude: 'https://api.anthropic.com/v1/messages'
};

// Installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('DraftDeckAI Smart Extension installed!');

        // Initialize storage
        chrome.storage.local.set({
            'gemini_api_key': '', // User must set their own API key in extension settings
            'problems-solved': 0,
            'questions-practiced': 0,
            'interview_sessions': [],
            'voice_enabled': false,
            'mcp_enabled': true,
            'settings': {
                'autoDetect': true,
                'notifications': true,
                'showHintsFirst': true,
                'defaultLanguage': 'javascript',
                'voiceEnabled': false,
                'interviewerMode': false,
                'mcpAnalysis': true
            }
        });

        // Open settings page
        chrome.tabs.create({
            url: chrome.runtime.getURL('settings.html')
        });

        // Show setup notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'DraftDeckAI Extension Installed!',
            message: 'Configure your AI provider to get started.'
        });
    }
});

// Context menu for selected text
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'draftdeckai-solve',
        title: '🚀 Solve with DraftDeckAI AI',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'draftdeckai-explain',
        title: '💡 Explain with DraftDeckAI AI',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'draftdeckai-hint',
        title: '🎯 Get Hint',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'draftdeckai-solve') {
        handleSolveRequest(info.selectionText, tab);
    } else if (info.menuItemId === 'draftdeckai-explain') {
        handleExplainRequest(info.selectionText, tab);
    } else if (info.menuItemId === 'draftdeckai-hint') {
        handleHintRequest(info.selectionText, tab);
    }
});

// AI Request Handler - Uses configured AI provider
async function handleSolveRequest(text, tab) {
    try {
        const { provider, apiKey } = await getProviderAndKey();
        if (!apiKey) {
            showNotification('API Key Required', 'Please configure your AI provider in settings.');
            return;
        }

        const prompt = `You are an expert DSA problem solver. Solve this problem:

${text}

Provide:
1. Approach (step-by-step thinking)
2. Complete code solution in JavaScript
3. Time and Space complexity
4. Explanation of the solution

Format your response as JSON with keys: approach, code, timeComplexity, spaceComplexity, explanation`;

        const result = await callAI(provider, apiKey, prompt);

        // Send result to content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_SOLUTION',
            data: result
        });

        // Increment stats
        await incrementStat('problems-solved');
        showNotification('Solution Ready! ✅', 'Check the page for your solution.');

    } catch (error) {
        console.error('Failed to solve problem:', error);
        showNotification('Error', error.message || 'Failed to solve problem. Please try again.');
    }
}

async function handleExplainRequest(text, tab) {
    try {
        const { provider, apiKey } = await getProviderAndKey();
        if (!apiKey) {
            showNotification('API Key Required', 'Please configure your AI provider in settings.');
            return;
        }

        const prompt = `Explain this code in detail:

${text}

Provide:
1. What the code does
2. How it works (line by line if complex)
3. Time and space complexity
4. Potential improvements

Format as JSON with keys: explanation, complexity, improvements`;

        const result = await callAI(provider, apiKey, prompt);

        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_EXPLANATION',
            data: result
        });

        showNotification('Explanation Ready! 💡', 'Check the page for code explanation.');

    } catch (error) {
        console.error('Failed to explain code:', error);
        showNotification('Error', error.message || 'Failed to explain code.');
    }
}

async function handleHintRequest(text, tab) {
    try {
        const { provider, apiKey } = await getProviderAndKey();
        if (!apiKey) {
            showNotification('API Key Required', 'Please configure your AI provider in settings.');
            return;
        }

        const prompt = `Give a helpful hint for this problem (don't give away the solution):

${text}

Provide a hint that guides thinking without revealing the answer.`;

        const result = await callAI(provider, apiKey, prompt);

        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_HINT',
            data: { hint: result }
        });

        showNotification('Hint Ready! 🎯', 'Check the page for your hint.');

    } catch (error) {
        console.error('Failed to get hint:', error);
        showNotification('Error', error.message || 'Failed to get hint.');
    }
}

// Notifications
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: title,
        message: message
    });
}

// Badge updates
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes['problems-solved']) {
            updateBadge(changes['problems-solved'].newValue);
        }
    }
});

function updateBadge(count) {
    if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    }
}

// Universal AI API Call - Supports multiple providers
async function callAI(provider, apiKey, prompt) {
    switch (provider) {
        case 'gemini':
            return await callGeminiAPI(apiKey, prompt);
        case 'openai':
            return await callOpenAIAPI(apiKey, prompt);
        case 'mistral':
            return await callMistralAPI(apiKey, prompt);
        case 'claude':
            return await callClaudeAPI(apiKey, prompt);
        default:
            throw new Error('Unsupported AI provider');
    }
}

// Gemini AI API Call
async function callGeminiAPI(apiKey, prompt) {
    const url = `${API_URLS.gemini}?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ? .message || 'Gemini API request failed');
    }

    const data = await response.json();
    const text = data.candidates[0] ? .content ? .parts[0] ? .text || '';

    return parseAIResponse(text);
}

// OpenAI API Call
async function callOpenAIAPI(apiKey, prompt) {
    const response = await fetch(API_URLS.openai, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ? .message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const text = data.choices[0] ? .message ? .content || '';

    return parseAIResponse(text);
}

// Mistral AI API Call
async function callMistralAPI(apiKey, prompt) {
    const response = await fetch(API_URLS.mistral, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Mistral API request failed');
    }

    const data = await response.json();
    const text = data.choices[0] ? .message ? .content || '';

    return parseAIResponse(text);
}

// Claude API Call
async function callClaudeAPI(apiKey, prompt) {
    const response = await fetch(API_URLS.claude, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ? .message || 'Claude API request failed');
    }

    const data = await response.json();
    const text = data.content[0] ? .text || '';

    return parseAIResponse(text);
}

// Parse AI response (try JSON first, fallback to text)
function parseAIResponse(text) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch {}
    }

    // Try to parse as JSON directly
    try {
        return JSON.parse(text);
    } catch {
        return { content: text };
    }
}

// Get current provider and API key
async function getProviderAndKey() {
    const result = await chrome.storage.local.get([
        STORAGE_KEYS.AI_PROVIDER,
        STORAGE_KEYS.GEMINI_KEY,
        STORAGE_KEYS.OPENAI_KEY,
        STORAGE_KEYS.MISTRAL_KEY,
        STORAGE_KEYS.CLAUDE_KEY
    ]);

    const provider = result[STORAGE_KEYS.AI_PROVIDER] || 'gemini';
    const keyMap = {
        gemini: STORAGE_KEYS.GEMINI_KEY,
        openai: STORAGE_KEYS.OPENAI_KEY,
        mistral: STORAGE_KEYS.MISTRAL_KEY,
        claude: STORAGE_KEYS.CLAUDE_KEY
    };

    const apiKey = result[keyMap[provider]] || '';

    return { provider, apiKey };
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'INCREMENT_STAT') {
        incrementStat(request.stat, request.count);
        sendResponse({ success: true });
    }

    if (request.type === 'GET_SETTINGS') {
        chrome.storage.local.get('settings', (result) => {
            sendResponse(result.settings);
        });
        return true;
    }

    if (request.type === 'UPDATE_SETTINGS') {
        chrome.storage.local.set({ settings: request.settings }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.type === 'SAVE_API_KEY') {
        chrome.storage.local.set({
            [STORAGE_KEYS.GEMINI_KEY]: request.apiKey }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.type === 'GET_API_KEY') {
        getProviderAndKey().then(({ apiKey }) => {
            sendResponse({ apiKey });
        });
        return true;
    }

    if (request.type === 'OPEN_SETTINGS') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('settings.html')
        });
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'TEST_API_CONNECTION') {
        (async() => {
            try {
                const testPrompt = 'Say "Hello! API is working." in one sentence.';
                const result = await callAI(request.provider, request.apiKey, testPrompt);
                sendResponse({ success: true, result });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    if (request.type === 'SETTINGS_UPDATED') {
        console.log('Settings updated, reloading configuration...');
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'SOLVE_PROBLEM') {
        (async() => {
            try {
                const { provider, apiKey } = await getProviderAndKey();
                if (!apiKey) {
                    sendResponse({ error: 'API key not configured. Please open settings.' });
                    return;
                }

                const result = await callAI(provider, apiKey, request.prompt);
                sendResponse({ success: true, data: result });
            } catch (error) {
                sendResponse({ error: error.message });
            }
        })();
        return true;
    }

    // Voice command handling
    if (request.type === 'VOICE_COMMAND') {
        (async() => {
            try {
                const { provider, apiKey } = await getProviderAndKey();
                if (!apiKey) {
                    sendResponse({ reply: 'Please configure your API key first.' });
                    return;
                }

                let prompt = '';
                switch (request.action) {
                    case 'solve':
                        prompt = `Solve this problem: ${request.text}`;
                        break;
                    case 'hint':
                        prompt = `Give a hint for: ${request.text}`;
                        break;
                    case 'approach':
                        prompt = `Explain the approach for: ${request.text}`;
                        break;
                    case 'start':
                        sendResponse({ reply: 'Starting interview mode. Get ready!' });
                        return;
                    default:
                        prompt = request.text;
                }

                const result = await callAI(provider, apiKey, prompt);
                const reply = typeof result === 'string' ? result : result.content || JSON.stringify(result);
                sendResponse({ success: true, reply: reply });
            } catch (error) {
                sendResponse({ reply: 'Sorry, I encountered an error. Please try again.' });
            }
        })();
        return true;
    }

    // Voice conversation handling
    if (request.type === 'VOICE_CONVERSATION') {
        (async() => {
            try {
                const { provider, apiKey } = await getProviderAndKey();
                if (!apiKey) {
                    sendResponse({ reply: 'Please configure your API key first.' });
                    return;
                }

                const prompt = `You are a friendly AI coding assistant. Respond naturally to: ${request.text}`;
                const result = await callAI(provider, apiKey, prompt);
                const reply = typeof result === 'string' ? result : result.content || JSON.stringify(result);
                sendResponse({ success: true, reply: reply });
            } catch (error) {
                sendResponse({ reply: 'Sorry, I didn\'t catch that. Could you repeat?' });
            }
        })();
        return true;
    }

    // MCP analysis complete
    if (request.type === 'MCP_ANALYSIS_COMPLETE') {
        console.log('📊 MCP Analysis received:', request.analysis);
        // Store analysis for use by other components
        chrome.storage.local.set({ last_mcp_analysis: request.analysis });
        sendResponse({ success: true });
        return true;
    }

    // Interview mode messages
    if (request.type === 'START_INTERVIEW') {
        console.log('🎤 Starting interview mode...');
        sendResponse({ success: true, message: 'Interview mode started' });
        return true;
    }

    if (request.type === 'DISPLAY_QUESTION' ||
        request.type === 'DISPLAY_EVALUATION' ||
        request.type === 'DISPLAY_FINAL_EVALUATION') {
        // Forward to popup if open
        chrome.runtime.sendMessage(request);
        sendResponse({ success: true });
        return true;
    }
});

async function incrementStat(stat, count = 1) {
    const result = await chrome.storage.local.get(stat);
    const currentValue = result[stat] || 0;
    const newValue = currentValue + count;
    await chrome.storage.local.set({
        [stat]: newValue });
}

// Keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-popup') {
        chrome.action.openPopup();
    }
});

console.log('DraftDeckAI Smart AI Extension loaded - Ready to help! 🚀');