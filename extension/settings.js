// DraftDeckAI Settings Page Script

// Storage keys
const STORAGE_KEYS = {
    AI_PROVIDER: 'ai_provider',
    GEMINI_KEY: 'gemini_api_key',
    OPENAI_KEY: 'openai_api_key',
    MISTRAL_KEY: 'mistral_api_key',
    CLAUDE_KEY: 'claude_api_key',
    SETTINGS: 'settings'
};

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
});

// Load all settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get([
            STORAGE_KEYS.AI_PROVIDER,
            STORAGE_KEYS.GEMINI_KEY,
            STORAGE_KEYS.OPENAI_KEY,
            STORAGE_KEYS.MISTRAL_KEY,
            STORAGE_KEYS.CLAUDE_KEY,
            STORAGE_KEYS.SETTINGS
        ]);

        // Load AI provider
        const provider = result[STORAGE_KEYS.AI_PROVIDER] || 'gemini';
        document.querySelector(`input[name="ai-provider"][value="${provider}"]`).checked = true;

        // Load API keys and update status
        loadApiKey('gemini', result[STORAGE_KEYS.GEMINI_KEY]);
        loadApiKey('openai', result[STORAGE_KEYS.OPENAI_KEY]);
        loadApiKey('mistral', result[STORAGE_KEYS.MISTRAL_KEY]);
        loadApiKey('claude', result[STORAGE_KEYS.CLAUDE_KEY]);

        // Load preferences
        const settings = result[STORAGE_KEYS.SETTINGS] || {
            autoDetect: true,
            notifications: true,
            showHintsFirst: true,
            defaultLanguage: 'javascript'
        };

        document.getElementById('auto-detect').checked = settings.autoDetect;
        document.getElementById('notifications').checked = settings.notifications;
        document.getElementById('hints-first').checked = settings.showHintsFirst;
        document.getElementById('default-language').value = settings.defaultLanguage;

    } catch (error) {
        console.error('Failed to load settings:', error);
        showStatus('Failed to load settings', 'error');
    }
}

// Load individual API key
function loadApiKey(provider, key) {
    const input = document.getElementById(`${provider}-api-key`);
    const status = document.getElementById(`${provider}-status`);
    
    if (key) {
        input.value = key;
        status.textContent = '✅ Configured';
        status.classList.add('configured');
    } else {
        status.textContent = 'Not Configured';
        status.classList.remove('configured');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', saveSettings);

    // Test connection button
    document.getElementById('test-connection').addEventListener('click', testConnection);

    // Reset settings button
    document.getElementById('reset-settings').addEventListener('click', resetSettings);

    // Auto-save on provider change
    document.querySelectorAll('input[name="ai-provider"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const provider = radio.value;
            chrome.storage.local.set({ [STORAGE_KEYS.AI_PROVIDER]: provider });
            showStatus(`Switched to ${getProviderName(provider)}`, 'success');
        });
    });
}

// Save all settings
async function saveSettings() {
    try {
        const provider = document.querySelector('input[name="ai-provider"]:checked').value;
        
        // Get API keys
        const geminiKey = document.getElementById('gemini-api-key').value.trim();
        const openaiKey = document.getElementById('openai-api-key').value.trim();
        const mistralKey = document.getElementById('mistral-api-key').value.trim();
        const claudeKey = document.getElementById('claude-api-key').value.trim();

        // Get preferences
        const settings = {
            autoDetect: document.getElementById('auto-detect').checked,
            notifications: document.getElementById('notifications').checked,
            showHintsFirst: document.getElementById('hints-first').checked,
            defaultLanguage: document.getElementById('default-language').value
        };

        // Save to storage
        await chrome.storage.local.set({
            [STORAGE_KEYS.AI_PROVIDER]: provider,
            [STORAGE_KEYS.GEMINI_KEY]: geminiKey,
            [STORAGE_KEYS.OPENAI_KEY]: openaiKey,
            [STORAGE_KEYS.MISTRAL_KEY]: mistralKey,
            [STORAGE_KEYS.CLAUDE_KEY]: claudeKey,
            [STORAGE_KEYS.SETTINGS]: settings
        });

        // Update status badges
        updateStatusBadge('gemini', geminiKey);
        updateStatusBadge('openai', openaiKey);
        updateStatusBadge('mistral', mistralKey);
        updateStatusBadge('claude', claudeKey);

        showStatus('✅ Settings saved successfully!', 'success');

        // Notify background script
        chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });

    } catch (error) {
        console.error('Failed to save settings:', error);
        showStatus('❌ Failed to save settings', 'error');
    }
}

// Update status badge
function updateStatusBadge(provider, key) {
    const status = document.getElementById(`${provider}-status`);
    if (key) {
        status.textContent = '✅ Configured';
        status.classList.add('configured');
    } else {
        status.textContent = 'Not Configured';
        status.classList.remove('configured');
    }
}

// Test connection with current provider
async function testConnection() {
    const provider = document.querySelector('input[name="ai-provider"]:checked').value;
    const keyInput = document.getElementById(`${provider}-api-key`);
    const apiKey = keyInput.value.trim();

    if (!apiKey) {
        showStatus(`❌ Please enter ${getProviderName(provider)} API key first`, 'error');
        return;
    }

    showStatus('🔄 Testing connection...', 'success');

    try {
        // Send test request to background script
        chrome.runtime.sendMessage(
            {
                type: 'TEST_API_CONNECTION',
                provider: provider,
                apiKey: apiKey
            },
            (response) => {
                if (response && response.success) {
                    showStatus(`✅ Connection successful! ${getProviderName(provider)} is working.`, 'success');
                } else {
                    showStatus(`❌ Connection failed: ${response?.error || 'Unknown error'}`, 'error');
                }
            }
        );
    } catch (error) {
        showStatus(`❌ Test failed: ${error.message}`, 'error');
    }
}

// Reset settings to defaults
async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This will clear all API keys.')) {
        return;
    }

    try {
        // Clear all storage
        await chrome.storage.local.clear();

        // Reset form
        document.querySelector('input[name="ai-provider"][value="gemini"]').checked = true;
        document.getElementById('gemini-api-key').value = '';
        document.getElementById('openai-api-key').value = '';
        document.getElementById('mistral-api-key').value = '';
        document.getElementById('claude-api-key').value = '';

        document.getElementById('auto-detect').checked = true;
        document.getElementById('notifications').checked = true;
        document.getElementById('hints-first').checked = true;
        document.getElementById('default-language').value = 'javascript';

        // Update status badges
        updateStatusBadge('gemini', '');
        updateStatusBadge('openai', '');
        updateStatusBadge('mistral', '');
        updateStatusBadge('claude', '');

        showStatus('✅ Settings reset to defaults', 'success');

    } catch (error) {
        console.error('Failed to reset settings:', error);
        showStatus('❌ Failed to reset settings', 'error');
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// Show status message
function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 5000);
}

// Get provider display name
function getProviderName(provider) {
    const names = {
        gemini: 'Google Gemini',
        openai: 'OpenAI GPT',
        mistral: 'Mistral AI',
        claude: 'Claude (Anthropic)'
    };
    return names[provider] || provider;
}

// Make togglePasswordVisibility available globally
window.togglePasswordVisibility = togglePasswordVisibility;
