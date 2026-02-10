// DraftDeckAI Analytics Dashboard
// Tracks and visualizes learning progress

class AnalyticsDashboard {
    constructor() {
        this.data = {
            dailyActivity: [],
            problemsByDifficulty: { easy: 0, medium: 0, hard: 0 },
            problemsByTopic: {},
            studyTime: [],
            weakAreas: [],
            strongAreas: [],
            recommendations: []
        };
        this.loadData();
    }

    async loadData() {
        const result = await chrome.storage.local.get([
            'analytics_data',
            'problems-solved',
            'questions-practiced',
            'study_sessions',
            'code_snippets'
        ]);

        if (result.analytics_data) {
            this.data = result.analytics_data;
        }

        this.updateRecommendations();
    }

    async trackActivity(type, metadata = {}) {
        const today = new Date().toDateString();
        const activity = {
            type,
            timestamp: new Date().toISOString(),
            metadata
        };

        // Update daily activity
        let dailyEntry = this.data.dailyActivity.find(d => d.date === today);
        if (!dailyEntry) {
            dailyEntry = { date: today, count: 0, types: {} };
            this.data.dailyActivity.push(dailyEntry);
        }
        dailyEntry.count++;
        dailyEntry.types[type] = (dailyEntry.types[type] || 0) + 1;

        // Keep only last 30 days
        if (this.data.dailyActivity.length > 30) {
            this.data.dailyActivity = this.data.dailyActivity.slice(-30);
        }

        // Track by difficulty
        if (metadata.difficulty) {
            this.data.problemsByDifficulty[metadata.difficulty]++;
        }

        // Track by topic
        if (metadata.topic) {
            this.data.problemsByTopic[metadata.topic] = 
                (this.data.problemsByTopic[metadata.topic] || 0) + 1;
        }

        await this.saveData();
        this.updateRecommendations();
    }

    async trackStudySession(duration, topic) {
        this.data.studyTime.push({
            date: new Date().toISOString(),
            duration,
            topic
        });

        // Keep only last 30 days
        if (this.data.studyTime.length > 30) {
            this.data.studyTime = this.data.studyTime.slice(-30);
        }

        await this.saveData();
    }

    updateRecommendations() {
        this.data.recommendations = [];

        // Analyze weak areas
        const topics = Object.entries(this.data.problemsByTopic);
        if (topics.length > 0) {
            const avgCount = topics.reduce((sum, [_, count]) => sum + count, 0) / topics.length;
            
            this.data.weakAreas = topics
                .filter(([_, count]) => count < avgCount * 0.5)
                .map(([topic]) => topic);

            this.data.strongAreas = topics
                .filter(([_, count]) => count > avgCount * 1.5)
                .map(([topic]) => topic);
        }

        // Generate recommendations
        if (this.data.weakAreas.length > 0) {
            this.data.recommendations.push({
                type: 'practice',
                priority: 'high',
                message: `Focus on: ${this.data.weakAreas.slice(0, 3).join(', ')}`,
                action: 'practice_weak_areas'
            });
        }

        // Check study consistency
        const recentDays = this.data.dailyActivity.slice(-7);
        if (recentDays.length < 5) {
            this.data.recommendations.push({
                type: 'consistency',
                priority: 'medium',
                message: 'Try to practice at least 5 days a week',
                action: 'build_consistency'
            });
        }

        // Difficulty balance
        const { easy, medium, hard } = this.data.problemsByDifficulty;
        const total = easy + medium + hard;
        if (total > 10 && hard / total < 0.2) {
            this.data.recommendations.push({
                type: 'challenge',
                priority: 'medium',
                message: 'Challenge yourself with more hard problems',
                action: 'increase_difficulty'
            });
        }

        // Review reminder
        if (window.snippetLibrary) {
            const dueForReview = window.snippetLibrary.getDueForReview().length;
            if (dueForReview > 0) {
                this.data.recommendations.push({
                    type: 'review',
                    priority: 'high',
                    message: `${dueForReview} snippets need review`,
                    action: 'review_snippets'
                });
            }
        }
    }

    getWeeklyProgress() {
        const last7Days = this.data.dailyActivity.slice(-7);
        return {
            totalProblems: last7Days.reduce((sum, day) => sum + day.count, 0),
            activeDays: last7Days.length,
            avgPerDay: last7Days.length > 0 
                ? (last7Days.reduce((sum, day) => sum + day.count, 0) / last7Days.length).toFixed(1)
                : 0
        };
    }

    getMonthlyProgress() {
        const last30Days = this.data.dailyActivity.slice(-30);
        return {
            totalProblems: last30Days.reduce((sum, day) => sum + day.count, 0),
            activeDays: last30Days.length,
            avgPerDay: last30Days.length > 0 
                ? (last30Days.reduce((sum, day) => sum + day.count, 0) / last30Days.length).toFixed(1)
                : 0,
            totalStudyTime: this.data.studyTime
                .reduce((sum, session) => sum + session.duration, 0)
        };
    }

    getTopicDistribution() {
        return Object.entries(this.data.problemsByTopic)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }

    async saveData() {
        await chrome.storage.local.set({ analytics_data: this.data });
    }

    generateInsights() {
        const weekly = this.getWeeklyProgress();
        const monthly = this.getMonthlyProgress();
        const insights = [];

        // Activity insights
        if (weekly.activeDays >= 5) {
            insights.push({
                type: 'positive',
                icon: '🔥',
                message: 'Great consistency this week!'
            });
        }

        // Progress insights
        if (monthly.totalProblems > 20) {
            insights.push({
                type: 'positive',
                icon: '🚀',
                message: `You've solved ${monthly.totalProblems} problems this month!`
            });
        }

        // Improvement areas
        if (this.data.weakAreas.length > 0) {
            insights.push({
                type: 'improvement',
                icon: '💡',
                message: `Work on: ${this.data.weakAreas[0]}`
            });
        }

        return insights;
    }
}

// Create global instance
window.analyticsDashboard = new AnalyticsDashboard();

console.log('📊 Analytics Dashboard initialized');
