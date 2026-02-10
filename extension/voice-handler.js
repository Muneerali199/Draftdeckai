// DraftDeckAI Voice Interaction Handler
// Full voice communication with speech recognition and synthesis

class VoiceHandler {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isEnabled = false;
        this.voiceSettings = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            language: 'en-US',
            voice: null
        };
        
        this.initializeVoice();
    }
    
    initializeVoice() {
        // Check for Web Speech API support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.voiceSettings.language;
            
            this.setupRecognitionHandlers();
            console.log('✅ Voice recognition initialized');
        } else {
            console.warn('⚠️ Speech recognition not supported in this browser');
        }
        
        // Load available voices
        if (this.synthesis) {
            this.loadVoices();
            // Voices load asynchronously
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }
    
    loadVoices() {
        const voices = this.synthesis.getVoices();
        // Prefer a natural-sounding English voice
        this.voiceSettings.voice = voices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Enhanced'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        console.log('📢 Available voices loaded:', voices.length);
    }
    
    setupRecognitionHandlers() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.notifyListeningState(true);
            console.log('🎤 Voice recognition started');
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.notifyListeningState(false);
            
            // Auto-restart if enabled
            if (this.isEnabled) {
                setTimeout(() => this.startListening(), 100);
            }
            console.log('🎤 Voice recognition ended');
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                this.handleVoiceCommand(finalTranscript.trim());
            }
            
            // Update UI with interim results
            this.notifyTranscript(interimTranscript, false);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Ignore no-speech errors
                return;
            }
            this.speak('Sorry, I had trouble hearing you. Could you repeat that?');
        };
    }
    
    startListening() {
        if (!this.recognition) {
            this.speak('Voice recognition is not supported in your browser.');
            return;
        }
        
        if (this.isListening) return;
        
        try {
            this.isEnabled = true;
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
        }
    }
    
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        this.isEnabled = false;
        this.recognition.stop();
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    speak(text, interrupt = false) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return;
        }
        
        // Cancel current speech if interrupting
        if (interrupt) {
            this.synthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voiceSettings.voice;
        utterance.rate = this.voiceSettings.rate;
        utterance.pitch = this.voiceSettings.pitch;
        utterance.volume = this.voiceSettings.volume;
        utterance.lang = this.voiceSettings.language;
        
        utterance.onstart = () => {
            console.log('🔊 Speaking:', text.substring(0, 50) + '...');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
        };
        
        this.synthesis.speak(utterance);
    }
    
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
    
    handleVoiceCommand(command) {
        console.log('🎤 Voice command:', command);
        
        const lowerCommand = command.toLowerCase();
        
        // Command patterns
        const commands = {
            solve: /^(solve|help me solve|give solution|show solution)/,
            hint: /^(give hint|hint|help|clue)/,
            approach: /^(approach|how to solve|explain approach|strategy)/,
            explain: /^(explain|what does|clarify)/,
            complexity: /^(complexity|time complexity|space complexity|big o)/,
            start: /^(start interview|begin interview|let's practice)/,
            answer: /^(my answer is|i think|the answer is)/,
            repeat: /^(repeat|say again|what did you say)/,
            stop: /^(stop|pause|quiet|silence)/
        };
        
        // Check which command matches
        for (const [action, pattern] of Object.entries(commands)) {
            if (pattern.test(lowerCommand)) {
                this.executeCommand(action, command);
                return;
            }
        }
        
        // If no specific command, treat as conversational input
        this.handleConversation(command);
    }
    
    executeCommand(action, fullCommand) {
        // Send command to extension
        chrome.runtime.sendMessage({
            type: 'VOICE_COMMAND',
            action: action,
            text: fullCommand
        }, (response) => {
            if (response && response.reply) {
                this.speak(response.reply);
            }
        });
        
        // Also send to current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'VOICE_COMMAND',
                    action: action,
                    text: fullCommand
                });
            }
        });
    }
    
    handleConversation(text) {
        // Send to AI for conversational response
        chrome.runtime.sendMessage({
            type: 'VOICE_CONVERSATION',
            text: text
        }, (response) => {
            if (response && response.reply) {
                this.speak(response.reply);
            }
        });
    }
    
    notifyListeningState(isListening) {
        // Notify UI about listening state
        chrome.runtime.sendMessage({
            type: 'VOICE_LISTENING_STATE',
            isListening: isListening
        });
        
        // Also notify content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'VOICE_LISTENING_STATE',
                    isListening: isListening
                });
            }
        });
    }
    
    notifyTranscript(transcript, isFinal) {
        chrome.runtime.sendMessage({
            type: 'VOICE_TRANSCRIPT',
            transcript: transcript,
            isFinal: isFinal
        });
    }
    
    updateSettings(settings) {
        this.voiceSettings = { ...this.voiceSettings, ...settings };
        if (this.recognition) {
            this.recognition.lang = this.voiceSettings.language;
        }
    }
}

// Create global instance
window.voiceHandler = new VoiceHandler();

console.log('🎤 Voice Handler initialized');
