// DraftDeckAI Voice Interview - Real-time AI Interview with Voice
// 10-minute realistic interview simulation with voice interaction

class VoiceInterview {
    constructor() {
        this.isActive = false;
        this.currentQuestion = 0;
        this.questions = [];
        this.answers = [];
        this.startTime = null;
        this.duration = 10 * 60 * 1000; // 10 minutes
        this.interviewType = null;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        
        this.interviewerPersona = {
            name: 'Alex',
            voice: null,
            style: 'professional',
            pace: 'moderate'
        };
        
        this.initializeVoice();
    }

    initializeVoice() {
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
        }

        // Select best voice for interviewer
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => {
                const voices = this.synthesis.getVoices();
                // Prefer professional-sounding voice
                this.interviewerPersona.voice = voices.find(v => 
                    v.lang.startsWith('en') && (
                        v.name.includes('Professional') ||
                        v.name.includes('Daniel') ||
                        v.name.includes('Samantha') ||
                        v.name.includes('Google')
                    )
                ) || voices.find(v => v.lang.startsWith('en-US')) || voices[0];
            };
        }
    }

    async startInterview(config) {
        this.interviewType = config.type || 'technical';
        this.isActive = true;
        this.startTime = Date.now();
        this.currentQuestion = 0;
        this.answers = [];

        // Generate interview questions
        this.questions = await this.generateInterviewQuestions(config);

        // Start with introduction
        await this.speak(
            `Hello! I'm ${this.interviewerPersona.name}, and I'll be conducting your ${this.interviewType} interview today. ` +
            `This will be a ${this.duration / 60000}-minute session. ` +
            `I'll ask you ${this.questions.length} questions, and you can take your time to answer. ` +
            `Are you ready to begin?`,
            true
        );

        // Wait for confirmation
        await this.waitForResponse('confirmation');

        // Start asking questions
        await this.askNextQuestion();
    }

    async generateInterviewQuestions(config) {
        const prompt = `Generate ${Math.floor(this.duration / 60000 / 2)} realistic interview questions for a ${config.type} interview.

Role: ${config.role || 'Software Engineer'}
Level: ${config.level || 'Mid-level'}
Company: ${config.company || 'Tech Company'}

For each question, provide:
1. The question text
2. Expected answer points (for evaluation)
3. Follow-up questions (2-3)
4. Time allocation (in seconds)

Format as JSON array with: question, expectedPoints, followUps, timeAllocation

Make questions progressively challenging and realistic.`;

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { type: 'SOLVE_PROBLEM', prompt },
                (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        const questions = Array.isArray(response.data) ? response.data : 
                                        response.data.questions || [];
                        resolve(questions);
                    }
                }
            );
        });
    }

    async askNextQuestion() {
        if (!this.isActive || this.currentQuestion >= this.questions.length) {
            await this.endInterview();
            return;
        }

        // Check time limit
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            await this.speak("We're out of time. Let me provide your feedback now.");
            await this.endInterview();
            return;
        }

        const question = this.questions[this.currentQuestion];
        
        // Ask the question with natural pauses
        await this.speak(
            `Question ${this.currentQuestion + 1}. ${question.question}`,
            true
        );

        // Listen for answer
        const answer = await this.listenForAnswer(question.timeAllocation || 120);

        // Store answer
        this.answers.push({
            question: question.question,
            answer: answer,
            timestamp: Date.now() - this.startTime
        });

        // Provide brief acknowledgment
        const acknowledgments = [
            "Thank you for that answer.",
            "I see, that's interesting.",
            "Okay, I understand.",
            "Good point.",
            "Alright, thank you."
        ];
        await this.speak(acknowledgments[Math.floor(Math.random() * acknowledgments.length)]);

        // Ask follow-up if time permits
        const remainingTime = this.duration - (Date.now() - this.startTime);
        if (remainingTime > 60000 && question.followUps && question.followUps.length > 0) {
            const followUp = question.followUps[0];
            await this.speak(followUp);
            const followUpAnswer = await this.listenForAnswer(60);
            this.answers[this.answers.length - 1].followUpAnswer = followUpAnswer;
        }

        this.currentQuestion++;
        
        // Small pause before next question
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.askNextQuestion();
    }

    async listenForAnswer(maxDuration) {
        return new Promise((resolve) => {
            if (!this.recognition) {
                resolve('');
                return;
            }

            let finalTranscript = '';
            let silenceTimer = null;
            const maxSilence = 3000; // 3 seconds of silence ends answer

            const timeout = setTimeout(() => {
                this.recognition.stop();
                resolve(finalTranscript);
            }, maxDuration * 1000);

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Reset silence timer on speech
                if (silenceTimer) clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => {
                    this.recognition.stop();
                    clearTimeout(timeout);
                    resolve(finalTranscript.trim());
                }, maxSilence);

                // Update UI with transcript
                this.updateTranscript(finalTranscript + interimTranscript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                clearTimeout(timeout);
                resolve(finalTranscript);
            };

            this.recognition.start();
        });
    }

    async waitForResponse(type) {
        return new Promise((resolve) => {
            if (!this.recognition) {
                setTimeout(resolve, 2000);
                return;
            }

            this.recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        const transcript = event.results[i][0].transcript.toLowerCase();
                        if (transcript.includes('yes') || transcript.includes('ready') || 
                            transcript.includes('sure') || transcript.includes('okay')) {
                            this.recognition.stop();
                            resolve(true);
                        }
                    }
                }
            };

            this.recognition.start();

            // Auto-continue after 5 seconds
            setTimeout(() => {
                this.recognition.stop();
                resolve(true);
            }, 5000);
        });
    }

    async speak(text, interrupt = false) {
        return new Promise((resolve) => {
            if (!this.synthesis) {
                console.log('Interviewer:', text);
                setTimeout(resolve, 1000);
                return;
            }

            if (interrupt && this.currentUtterance) {
                this.synthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.interviewerPersona.voice;
            utterance.rate = 0.95; // Slightly slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => {
                this.currentUtterance = null;
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.currentUtterance = null;
                resolve();
            };

            this.currentUtterance = utterance;
            this.synthesis.speak(utterance);

            // Update UI
            this.updateInterviewerSpeech(text);
        });
    }

    async endInterview() {
        this.isActive = false;

        await this.speak(
            "Thank you for completing the interview. Let me evaluate your responses and provide feedback.",
            true
        );

        // Evaluate all answers
        const evaluation = await this.evaluateInterview();

        // Provide feedback
        await this.provideFeedback(evaluation);

        // Save interview session
        await this.saveInterviewSession(evaluation);
    }

    async evaluateInterview() {
        const prompt = `Evaluate this interview performance:

Questions and Answers:
${JSON.stringify(this.answers, null, 2)}

Expected Points:
${JSON.stringify(this.questions.map(q => ({ question: q.question, expectedPoints: q.expectedPoints })), null, 2)}

Provide:
1. Overall score (0-100)
2. Strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. Specific feedback for each answer
5. Communication quality rating
6. Technical accuracy rating
7. Final recommendation (Strong Hire, Hire, Maybe, No Hire)

Format as JSON.`;

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

    async provideFeedback(evaluation) {
        const feedbackText = `
            Based on your interview, here's my evaluation.
            
            Overall score: ${evaluation.overallScore} out of 100.
            
            Your strengths include: ${evaluation.strengths?.slice(0, 3).join('. ')}.
            
            Areas to improve: ${evaluation.improvements?.slice(0, 3).join('. ')}.
            
            My recommendation is: ${evaluation.recommendation}.
            
            ${evaluation.overallScore >= 70 ? 
                "Great job! You demonstrated strong skills and communication." :
                "Keep practicing, and you'll improve significantly."}
        `;

        await this.speak(feedbackText, true);

        // Display detailed feedback in UI
        this.displayDetailedFeedback(evaluation);
    }

    async saveInterviewSession(evaluation) {
        const session = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: this.interviewType,
            duration: Date.now() - this.startTime,
            questions: this.questions,
            answers: this.answers,
            evaluation: evaluation,
            score: evaluation.overallScore
        };

        const result = await chrome.storage.local.get(['interview_sessions']);
        const sessions = result.interview_sessions || [];
        sessions.push(session);

        await chrome.storage.local.set({ interview_sessions: sessions });

        return session;
    }

    updateTranscript(text) {
        // Send to UI
        chrome.runtime.sendMessage({
            type: 'UPDATE_INTERVIEW_TRANSCRIPT',
            transcript: text
        });
    }

    updateInterviewerSpeech(text) {
        // Send to UI
        chrome.runtime.sendMessage({
            type: 'UPDATE_INTERVIEWER_SPEECH',
            text: text
        });
    }

    displayDetailedFeedback(evaluation) {
        // Send to UI
        chrome.runtime.sendMessage({
            type: 'DISPLAY_INTERVIEW_FEEDBACK',
            evaluation: evaluation
        });
    }

    stopInterview() {
        this.isActive = false;
        if (this.recognition) {
            this.recognition.stop();
        }
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
}

// Create global instance
window.voiceInterview = new VoiceInterview();

console.log('🎤 Voice Interview initialized');
