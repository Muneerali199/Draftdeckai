// DraftDeckAI Code Snippet Library
// Manages saved code snippets and solutions

class SnippetLibrary {
    constructor() {
        this.snippets = [];
        this.loadSnippets();
    }

    async loadSnippets() {
        const result = await chrome.storage.local.get(['code_snippets']);
        this.snippets = result.code_snippets || [];
    }

    async saveSnippet(snippet) {
        const newSnippet = {
            id: Date.now().toString(),
            title: snippet.title,
            code: snippet.code,
            language: snippet.language,
            tags: snippet.tags || [],
            difficulty: snippet.difficulty,
            platform: snippet.platform,
            notes: snippet.notes || '',
            createdAt: new Date().toISOString(),
            lastReviewed: null,
            reviewCount: 0,
            mastered: false
        };

        this.snippets.push(newSnippet);
        await chrome.storage.local.set({ code_snippets: this.snippets });
        return newSnippet;
    }

    async updateSnippet(id, updates) {
        const index = this.snippets.findIndex(s => s.id === id);
        if (index !== -1) {
            this.snippets[index] = { ...this.snippets[index], ...updates };
            await chrome.storage.local.set({ code_snippets: this.snippets });
        }
    }

    async deleteSnippet(id) {
        this.snippets = this.snippets.filter(s => s.id !== id);
        await chrome.storage.local.set({ code_snippets: this.snippets });
    }

    async markAsReviewed(id) {
        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            snippet.lastReviewed = new Date().toISOString();
            snippet.reviewCount++;
            
            // Auto-mark as mastered after 3 reviews
            if (snippet.reviewCount >= 3) {
                snippet.mastered = true;
            }
            
            await this.updateSnippet(id, snippet);
        }
    }

    getSnippets(filter = {}) {
        let filtered = [...this.snippets];

        if (filter.language) {
            filtered = filtered.filter(s => s.language === filter.language);
        }
        if (filter.difficulty) {
            filtered = filtered.filter(s => s.difficulty === filter.difficulty);
        }
        if (filter.platform) {
            filtered = filtered.filter(s => s.platform === filter.platform);
        }
        if (filter.tags && filter.tags.length > 0) {
            filtered = filtered.filter(s => 
                filter.tags.some(tag => s.tags.includes(tag))
            );
        }
        if (filter.mastered !== undefined) {
            filtered = filtered.filter(s => s.mastered === filter.mastered);
        }

        return filtered;
    }

    getDueForReview() {
        const now = new Date();
        const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

        return this.snippets.filter(s => {
            if (!s.lastReviewed) return true;
            const lastReview = new Date(s.lastReviewed);
            return lastReview < threeDaysAgo && !s.mastered;
        });
    }

    getStatistics() {
        return {
            total: this.snippets.length,
            mastered: this.snippets.filter(s => s.mastered).length,
            dueForReview: this.getDueForReview().length,
            byDifficulty: {
                easy: this.snippets.filter(s => s.difficulty === 'easy').length,
                medium: this.snippets.filter(s => s.difficulty === 'medium').length,
                hard: this.snippets.filter(s => s.difficulty === 'hard').length
            },
            byLanguage: this.snippets.reduce((acc, s) => {
                acc[s.language] = (acc[s.language] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Create global instance
window.snippetLibrary = new SnippetLibrary();

console.log('📚 Snippet Library initialized');
