// DraftDeckAI Company-Specific Preparation
// Tailored interview prep for top tech companies

const COMPANY_PROFILES = {
    google: {
        name: 'Google',
        icon: '🔍',
        focus: ['Algorithms', 'System Design', 'Data Structures'],
        commonTopics: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'Recursion'],
        interviewStyle: 'Algorithmic problem-solving with emphasis on optimal solutions',
        rounds: 4-5,
        tips: [
            'Focus on time and space complexity optimization',
            'Practice explaining your thought process clearly',
            'Be ready for follow-up questions about edge cases',
            'Study Googleyness and Leadership principles'
        ],
        resources: [
            'Google Interview Warmup',
            'LeetCode Google Tagged Problems',
            'System Design Primer'
        ]
    },
    amazon: {
        name: 'Amazon',
        icon: '📦',
        focus: ['Leadership Principles', 'System Design', 'Behavioral'],
        commonTopics: ['Arrays', 'Strings', 'Trees', 'Graphs', 'OOP Design'],
        interviewStyle: 'Heavy emphasis on behavioral questions and leadership principles',
        rounds: 5-7,
        tips: [
            'Prepare STAR format stories for all 16 leadership principles',
            'Practice system design for scalable e-commerce systems',
            'Focus on customer obsession in your answers',
            'Be ready to discuss trade-offs and decisions'
        ],
        resources: [
            'Amazon Leadership Principles Guide',
            'LeetCode Amazon Tagged Problems',
            'Grokking System Design'
        ]
    },
    microsoft: {
        name: 'Microsoft',
        icon: '🪟',
        focus: ['Problem Solving', 'System Design', 'Collaboration'],
        commonTopics: ['Arrays', 'Linked Lists', 'Trees', 'Sorting', 'Searching'],
        interviewStyle: 'Collaborative problem-solving with focus on communication',
        rounds: 4-5,
        tips: [
            'Emphasize teamwork and collaboration',
            'Be prepared to discuss past projects in detail',
            'Practice whiteboard coding',
            'Show enthusiasm for Microsoft products'
        ],
        resources: [
            'LeetCode Microsoft Tagged Problems',
            'Cracking the Coding Interview',
            'Microsoft Learn Platform'
        ]
    },
    meta: {
        name: 'Meta (Facebook)',
        icon: '👥',
        focus: ['Algorithms', 'System Design', 'Product Sense'],
        commonTopics: ['Arrays', 'Hash Tables', 'Trees', 'Graphs', 'BFS/DFS'],
        interviewStyle: 'Fast-paced with emphasis on product thinking',
        rounds: 5-6,
        tips: [
            'Practice coding quickly and accurately',
            'Understand Meta\'s products and their scale',
            'Be ready for product design questions',
            'Focus on impact and user experience'
        ],
        resources: [
            'LeetCode Meta Tagged Problems',
            'Meta Engineering Blog',
            'Product Design Interview Prep'
        ]
    },
    apple: {
        name: 'Apple',
        icon: '🍎',
        focus: ['Low-level Programming', 'System Design', 'Product Quality'],
        commonTopics: ['Arrays', 'Strings', 'Trees', 'Memory Management', 'Concurrency'],
        interviewStyle: 'Deep technical discussions with focus on quality',
        rounds: 4-6,
        tips: [
            'Understand memory management and optimization',
            'Be prepared for questions about iOS/macOS if relevant',
            'Emphasize attention to detail and quality',
            'Show passion for Apple products'
        ],
        resources: [
            'LeetCode Apple Tagged Problems',
            'iOS Development Resources',
            'System Programming Concepts'
        ]
    },
    netflix: {
        name: 'Netflix',
        icon: '🎬',
        focus: ['System Design', 'Microservices', 'Culture Fit'],
        commonTopics: ['Distributed Systems', 'Caching', 'Streaming', 'APIs'],
        interviewStyle: 'Senior-level expectations with culture emphasis',
        rounds: 4-5,
        tips: [
            'Understand Netflix culture deck',
            'Focus on scalability and reliability',
            'Be ready to discuss real-world system design',
            'Demonstrate ownership and initiative'
        ],
        resources: [
            'Netflix Tech Blog',
            'Microservices Architecture',
            'Distributed Systems Design'
        ]
    }
};

class CompanyPrep {
    constructor() {
        this.selectedCompany = null;
        this.progress = {};
        this.loadProgress();
    }

    async loadProgress() {
        const result = await chrome.storage.local.get(['company_prep_progress']);
        this.progress = result.company_prep_progress || {};
    }

    async saveProgress() {
        await chrome.storage.local.set({ company_prep_progress: this.progress });
    }

    getCompanyProfile(companyKey) {
        return COMPANY_PROFILES[companyKey];
    }

    getAllCompanies() {
        return Object.entries(COMPANY_PROFILES).map(([key, profile]) => ({
            key,
            ...profile
        }));
    }

    async selectCompany(companyKey) {
        this.selectedCompany = companyKey;
        
        if (!this.progress[companyKey]) {
            this.progress[companyKey] = {
                topicsCompleted: [],
                problemsSolved: 0,
                lastPracticed: null,
                readiness: 0
            };
        }

        await this.saveProgress();
        return this.getCompanyProfile(companyKey);
    }

    async trackProblem(companyKey, topic) {
        if (!this.progress[companyKey]) {
            await this.selectCompany(companyKey);
        }

        this.progress[companyKey].problemsSolved++;
        this.progress[companyKey].lastPracticed = new Date().toISOString();

        if (!this.progress[companyKey].topicsCompleted.includes(topic)) {
            this.progress[companyKey].topicsCompleted.push(topic);
        }

        // Calculate readiness (0-100)
        const profile = COMPANY_PROFILES[companyKey];
        const topicsCovered = this.progress[companyKey].topicsCompleted.length;
        const totalTopics = profile.commonTopics.length;
        const problemCount = this.progress[companyKey].problemsSolved;

        this.progress[companyKey].readiness = Math.min(100, 
            (topicsCovered / totalTopics * 50) + 
            (Math.min(problemCount, 50) * 1)
        );

        await this.saveProgress();
    }

    getReadiness(companyKey) {
        return this.progress[companyKey]?.readiness || 0;
    }

    getRecommendedProblems(companyKey) {
        const profile = COMPANY_PROFILES[companyKey];
        const completed = this.progress[companyKey]?.topicsCompleted || [];
        
        // Find topics not yet covered
        const uncoveredTopics = profile.commonTopics.filter(
            topic => !completed.includes(topic)
        );

        return {
            nextTopic: uncoveredTopics[0] || profile.commonTopics[0],
            uncoveredTopics,
            focusAreas: profile.focus
        };
    }

    generateStudyPlan(companyKey, weeksAvailable) {
        const profile = COMPANY_PROFILES[companyKey];
        const plan = {
            company: profile.name,
            duration: weeksAvailable,
            weeks: []
        };

        const topicsPerWeek = Math.ceil(profile.commonTopics.length / weeksAvailable);

        for (let week = 1; week <= weeksAvailable; week++) {
            const startIdx = (week - 1) * topicsPerWeek;
            const endIdx = Math.min(startIdx + topicsPerWeek, profile.commonTopics.length);
            const weekTopics = profile.commonTopics.slice(startIdx, endIdx);

            plan.weeks.push({
                week,
                focus: weekTopics,
                goals: [
                    `Master ${weekTopics.join(', ')}`,
                    `Solve 10-15 ${profile.name} tagged problems`,
                    week === weeksAvailable ? 'Complete mock interview' : 'Review and practice'
                ],
                resources: profile.resources
            });
        }

        return plan;
    }
}

// Create global instance
window.companyPrep = new CompanyPrep();

console.log('🏢 Company Prep initialized');
