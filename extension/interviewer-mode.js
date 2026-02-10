// DraftDeckAI Interviewer Mode
// Interactive interviewer that asks questions, evaluates answers, and provides feedback

class InterviewerMode {
    constructor() {
        this.isActive = false;
        this.currentSession = null;
        this.questionHistory = [];
        this.evaluationScores = [];
        
        this.interviewTypes = {
            technical: 'Technical Interview',
            behavioral: 'Behavioral Interview',
            system_design: 'System Design Interview',
            dsa: 'DSA Problem Solving',
            mixed: 'Mixed Interview'
        };
        
        this.evaluationCriteria = {
            correctness: { weight: 0.30, max: 100 },
            approach: { weight: 0.25, max: 100 },
            codeQuality: { weight: 0.20, max: 100 },
            complexity: { weight: 0.15, max: 100 },
            communication: { weight: 0.10, max: 100 }
        };
    }
    
    startInterview(config = {}) {
        const {
            type = 'technical',
            role = 'Software Engineer',
            level = 'mid',
            company = '',
            duration = 30, // minutes
            questionCount = 5
        } = config;
        
        this.currentSession = {
            id: this.generateSessionId(),
            type,
            role,
            level,
            company,
            duration,
            questionCount,
            startTime: Date.now(),
            questions: [],
            currentQuestionIndex: 0,
            scores: {},
            totalScore: 0,
            status: 'active'
        };
        
        this.isActive = true;
        
        // Generate and ask first question
        this.generateNextQuestion();
        
        // Start voice if available
        if (window.voiceHandler) {
            this.speak('Hello! I\'m your AI interviewer today. Let\'s begin the interview. Take your time with each question, and feel free to think out loud. I\'m here to help you improve. Ready?');
        }
        
        return this.currentSession;
    }
    
    async generateNextQuestion() {
        if (!this.currentSession) return;
        
        const { type, role, level, company, currentQuestionIndex, questionCount } = this.currentSession;
        
        if (currentQuestionIndex >= questionCount) {
            this.endInterview();
            return;
        }
        
        // Request AI to generate next question
        const prompt = this.buildQuestionPrompt(type, role, level, company, currentQuestionIndex);
        
        try {
            const response = await this.callAI(prompt);
            const question = this.parseQuestionResponse(response);
            
            this.currentSession.questions.push(question);
            this.askQuestion(question);
            
        } catch (error) {
            console.error('Failed to generate question:', error);
            this.speak('I apologize, but I encountered an issue generating the next question. Let me try again.');
            setTimeout(() => this.generateNextQuestion(), 2000);
        }
    }
    
    buildQuestionPrompt(type, role, level, company, index) {
        const companyText = company ? ` at ${company}` : '';
        const questionNumber = index + 1;
        
        let prompt = `You are conducting a ${type} interview for a ${level} level ${role} position${companyText}.\n\n`;
        prompt += `Generate question ${questionNumber} that:\n`;
        prompt += `1. Is appropriate for ${level} level\n`;
        prompt += `2. Tests relevant skills for ${role}\n`;
        
        if (type === 'dsa') {
            prompt += `3. Is a coding problem with clear constraints\n`;
            prompt += `4. Has multiple solution approaches\n`;
            prompt += `5. Tests problem-solving ability\n\n`;
            prompt += `Include: problem statement, examples, constraints, expected approach hints.\n`;
        } else if (type === 'system_design') {
            prompt += `3. Tests system design thinking\n`;
            prompt += `4. Requires discussing trade-offs\n`;
            prompt += `5. Has no single correct answer\n\n`;
        } else if (type === 'behavioral') {
            prompt += `3. Uses STAR method (Situation, Task, Action, Result)\n`;
            prompt += `4. Tests soft skills and experience\n`;
            prompt += `5. Requires specific examples\n\n`;
        }
        
        prompt += `Format as JSON with:\n`;
        prompt += `{\n`;
        prompt += `  "question": "The main question",\n`;
        prompt += `  "category": "${type}",\n`;
        prompt += `  "difficulty": "easy/medium/hard",\n`;
        prompt += `  "expectedKeyPoints": ["point1", "point2", ...],\n`;
        prompt += `  "followUpQuestions": ["q1", "q2", ...],\n`;
        prompt += `  "evaluationCriteria": ["criteria1", "criteria2", ...]\n`;
        prompt += `}`;
        
        return prompt;
    }
    
    parseQuestionResponse(response) {
        try {
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            return {
                id: this.generateQuestionId(),
                question: data.question,
                category: data.category,
                difficulty: data.difficulty,
                expectedKeyPoints: data.expectedKeyPoints || [],
                followUpQuestions: data.followUpQuestions || [],
                evaluationCriteria: data.evaluationCriteria || [],
                answer: null,
                score: null,
                startTime: Date.now(),
                endTime: null
            };
        } catch (error) {
            console.error('Failed to parse question:', error);
            return {
                id: this.generateQuestionId(),
                question: response.content || response,
                category: 'general',
                difficulty: 'medium',
                expectedKeyPoints: [],
                followUpQuestions: [],
                evaluationCriteria: [],
                answer: null,
                score: null,
                startTime: Date.now(),
                endTime: null
            };
        }
    }
    
    askQuestion(question) {
        console.log('❓ Asking question:', question.question);
        
        // Display question in UI
        this.displayQuestion(question);
        
        // Speak question if voice enabled
        if (window.voiceHandler) {
            const intro = `Question ${this.currentSession.currentQuestionIndex + 1}: `;
            this.speak(intro + question.question);
        }
        
        // Set up answer timeout
        this.setupAnswerTimeout(question);
    }
    
    setupAnswerTimeout(question) {
        const timeoutMinutes = question.category === 'dsa' ? 15 : 5;
        const timeout = setTimeout(() => {
            if (question.answer === null) {
                this.speak('Time is up for this question. Let\'s move on to the next one.');
                this.submitAnswer('No answer provided - timeout');
            }
        }, timeoutMinutes * 60 * 1000);
        
        question.timeoutId = timeout;
    }
    
    async submitAnswer(answer) {
        if (!this.currentSession) return;
        
        const currentQuestion = this.currentSession.questions[this.currentSession.currentQuestionIndex];
        if (!currentQuestion) return;
        
        // Clear timeout
        if (currentQuestion.timeoutId) {
            clearTimeout(currentQuestion.timeoutId);
        }
        
        currentQuestion.answer = answer;
        currentQuestion.endTime = Date.now();
        
        // Evaluate answer
        this.speak('Thank you for your answer. Let me evaluate that...');
        
        const evaluation = await this.evaluateAnswer(currentQuestion);
        currentQuestion.evaluation = evaluation;
        
        // Provide immediate feedback
        this.provideFeedback(currentQuestion, evaluation);
        
        // Ask follow-up question if needed
        if (evaluation.needsFollowUp && currentQuestion.followUpQuestions.length > 0) {
            await this.askFollowUp(currentQuestion);
        } else {
            // Move to next question
            this.currentSession.currentQuestionIndex++;
            setTimeout(() => this.generateNextQuestion(), 3000);
        }
    }
    
    async evaluateAnswer(question) {
        const prompt = `Evaluate this interview answer:\n\n`;
        const promptData = `Question: ${question.question}\n`;
        const promptCategory = `Category: ${question.category}\n`;
        const promptDifficulty = `Difficulty: ${question.difficulty}\n`;
        const promptExpected = `Expected Key Points: ${question.expectedKeyPoints.join(', ')}\n`;
        const promptAnswer = `Candidate's Answer: ${question.answer}\n\n`;
        
        const fullPrompt = prompt + promptData + promptCategory + promptDifficulty + promptExpected + promptAnswer +
        `Evaluate based on:\n` +
        `1. Correctness (0-100): Is the answer correct?\n` +
        `2. Approach (0-100): Is the approach logical and efficient?\n` +
        `3. Code Quality (0-100): Is code clean and well-structured? (if applicable)\n` +
        `4. Complexity (0-100): Did they consider time/space complexity?\n` +
        `5. Communication (0-100): How well did they explain?\n\n` +
        `Also provide:\n` +
        `- Overall score (0-100)\n` +
        `- Strengths (array of strings)\n` +
        `- Weaknesses (array of strings)\n` +
        `- Improvements (array of strings)\n` +
        `- NeedsFollowUp (boolean): Should I ask follow-up questions?\n\n` +
        `Format as JSON.`;
        
        try {
            const response = await this.callAI(fullPrompt);
            return typeof response === 'string' ? JSON.parse(response) : response;
        } catch (error) {
            console.error('Evaluation failed:', error);
            return this.generateDefaultEvaluation();
        }
    }
    
    generateDefaultEvaluation() {
        return {
            correctness: 70,
            approach: 70,
            codeQuality: 70,
            complexity: 70,
            communication: 70,
            overallScore: 70,
            strengths: ['Good attempt at the problem'],
            weaknesses: ['Could improve clarity'],
            improvements: ['Try explaining your thought process more'],
            needsFollowUp: false
        };
    }
    
    provideFeedback(question, evaluation) {
        const score = evaluation.overallScore || 70;
        
        let feedback = `I've evaluated your answer. Your score is ${score} out of 100. `;
        
        if (score >= 90) {
            feedback += 'Excellent work! ';
        } else if (score >= 75) {
            feedback += 'Great job! ';
        } else if (score >= 60) {
            feedback += 'Good effort. ';
        } else {
            feedback += 'You can do better. ';
        }
        
        if (evaluation.strengths && evaluation.strengths.length > 0) {
            feedback += `Your strengths: ${evaluation.strengths[0]}. `;
        }
        
        if (evaluation.improvements && evaluation.improvements.length > 0) {
            feedback += `To improve: ${evaluation.improvements[0]}. `;
        }
        
        this.speak(feedback);
        this.displayEvaluation(question, evaluation);
    }
    
    async askFollowUp(question) {
        const followUp = question.followUpQuestions[0];
        this.speak(`Let me ask you a follow-up question: ${followUp}`);
        
        // Wait for answer to follow-up
        // This would integrate with the answer input mechanism
    }
    
    endInterview() {
        if (!this.currentSession) return;
        
        this.currentSession.endTime = Date.now();
        this.currentSession.status = 'completed';
        
        // Calculate final scores
        const finalEvaluation = this.calculateFinalScore();
        this.currentSession.finalEvaluation = finalEvaluation;
        
        // Provide comprehensive feedback
        this.provideFinalFeedback(finalEvaluation);
        
        this.isActive = false;
        
        // Save session
        this.saveSession(this.currentSession);
    }
    
    calculateFinalScore() {
        if (!this.currentSession || !this.currentSession.questions.length) {
            return this.generateDefaultEvaluation();
        }
        
        const questions = this.currentSession.questions;
        const evaluations = questions.map(q => q.evaluation).filter(e => e);
        
        if (evaluations.length === 0) {
            return this.generateDefaultEvaluation();
        }
        
        // Average all scores
        const avgScores = {
            correctness: this.average(evaluations.map(e => e.correctness)),
            approach: this.average(evaluations.map(e => e.approach)),
            codeQuality: this.average(evaluations.map(e => e.codeQuality)),
            complexity: this.average(evaluations.map(e => e.complexity)),
            communication: this.average(evaluations.map(e => e.communication)),
            overallScore: this.average(evaluations.map(e => e.overallScore))
        };
        
        // Collect all strengths, weaknesses, improvements
        const allStrengths = evaluations.flatMap(e => e.strengths || []);
        const allWeaknesses = evaluations.flatMap(e => e.weaknesses || []);
        const allImprovements = evaluations.flatMap(e => e.improvements || []);
        
        return {
            ...avgScores,
            strengths: [...new Set(allStrengths)].slice(0, 5),
            weaknesses: [...new Set(allWeaknesses)].slice(0, 5),
            improvements: [...new Set(allImprovements)].slice(0, 5),
            questionsAnswered: questions.length,
            duration: (this.currentSession.endTime - this.currentSession.startTime) / 1000 / 60 // minutes
        };
    }
    
    average(arr) {
        if (!arr.length) return 0;
        return arr.reduce((a, b) => a + (b || 0), 0) / arr.length;
    }
    
    provideFinalFeedback(evaluation) {
        const score = Math.round(evaluation.overallScore);
        
        let feedback = `Interview completed! Your overall score is ${score} out of 100. `;
        
        if (score >= 90) {
            feedback += 'Outstanding performance! You\'re well-prepared. ';
        } else if (score >= 75) {
            feedback += 'Great work! You showed strong skills. ';
        } else if (score >= 60) {
            feedback += 'Good effort. With more practice, you\'ll improve significantly. ';
        } else {
            feedback += 'Keep practicing. Focus on the areas I\'ll highlight. ';
        }
        
        feedback += `You answered ${evaluation.questionsAnswered} questions in ${Math.round(evaluation.duration)} minutes. `;
        
        if (evaluation.strengths.length > 0) {
            feedback += `Your key strengths are: ${evaluation.strengths.slice(0, 2).join(', ')}. `;
        }
        
        if (evaluation.improvements.length > 0) {
            feedback += `Focus on improving: ${evaluation.improvements.slice(0, 2).join(', ')}. `;
        }
        
        this.speak(feedback);
        this.displayFinalEvaluation(evaluation);
    }
    
    // UI Display methods
    displayQuestion(question) {
        chrome.runtime.sendMessage({
            type: 'DISPLAY_QUESTION',
            question: question
        });
    }
    
    displayEvaluation(question, evaluation) {
        chrome.runtime.sendMessage({
            type: 'DISPLAY_EVALUATION',
            question: question,
            evaluation: evaluation
        });
    }
    
    displayFinalEvaluation(evaluation) {
        chrome.runtime.sendMessage({
            type: 'DISPLAY_FINAL_EVALUATION',
            evaluation: evaluation,
            session: this.currentSession
        });
    }
    
    // Helper methods
    speak(text) {
        if (window.voiceHandler) {
            window.voiceHandler.speak(text);
        }
    }
    
    async callAI(prompt) {
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
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateQuestionId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    saveSession(session) {
        chrome.storage.local.get(['interview_sessions'], (result) => {
            const sessions = result.interview_sessions || [];
            sessions.push(session);
            chrome.storage.local.set({ interview_sessions: sessions });
        });
    }
    
    getSessionHistory() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['interview_sessions'], (result) => {
                resolve(result.interview_sessions || []);
            });
        });
    }
}

// Create global instance
window.interviewerMode = new InterviewerMode();

console.log('🎤 Interviewer Mode initialized');
