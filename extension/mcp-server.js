// DraftDeckAI MCP Server
// Model Context Protocol server for intelligent page analysis

class MCPServer {
    constructor() {
        this.isRunning = false;
        this.scanInterval = null;
        this.lastScannedContent = null;
        this.analysisCache = new Map();
        
        this.config = {
            scanInterval: 2000,
            maxCacheSize: 100,
            enableAutoScan: true,
            enableContextAnalysis: true,
            enableMultipleApproaches: true
        };
    }
    
    async start() {
        if (this.isRunning) return;
        
        console.log('🚀 Starting MCP Server...');
        this.isRunning = true;
        
        // Load configuration
        await this.loadConfig();
        
        // Start auto-scanning if enabled
        if (this.config.enableAutoScan) {
            this.startAutoScan();
        }
        
        console.log('✅ MCP Server started successfully');
    }
    
    stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 Stopping MCP Server...');
        this.stopAutoScan();
        this.isRunning = false;
        
        console.log('✅ MCP Server stopped');
    }
    
    async loadConfig() {
        const stored = await chrome.storage.local.get(['mcp_config']);
        if (stored.mcp_config) {
            this.config = { ...this.config, ...stored.mcp_config };
        }
    }
    
    async saveConfig() {
        await chrome.storage.local.set({ mcp_config: this.config });
    }
    
    startAutoScan() {
        if (this.scanInterval) return;
        
        console.log('🔍 Starting auto-scan...');
        this.scanInterval = setInterval(() => {
            this.scanCurrentPage();
        }, this.config.scanInterval);
    }
    
    stopAutoScan() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }
    
    async scanCurrentPage() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]) return;
            
            const tab = tabs[0];
            const url = tab.url;
            
            // Check if it's a supported platform
            if (!this.isSupportedPlatform(url)) return;
            
            // Inject content scanner
            const result = await chrome.tabs.sendMessage(tab.id, {
                type: 'MCP_SCAN_PAGE'
            });
            
            if (result && result.content) {
                await this.analyzePage(result.content, tab);
            }
            
        } catch (error) {
            // Silent fail - page might not be ready
            console.debug('Scan failed:', error.message);
        }
    }
    
    isSupportedPlatform(url) {
        const supportedDomains = [
            'leetcode.com',
            'hackerrank.com',
            'codeforces.com',
            'geeksforgeeks.org'
        ];
        
        return supportedDomains.some(domain => url.includes(domain));
    }
    
    async analyzePage(content, tab) {
        // Check if content has changed
        const contentHash = this.hashContent(content);
        if (contentHash === this.lastScannedContent) return;
        
        this.lastScannedContent = contentHash;
        
        // Check cache
        if (this.analysisCache.has(contentHash)) {
            const cached = this.analysisCache.get(contentHash);
            this.notifyAnalysisComplete(cached, tab.id);
            return;
        }
        
        console.log('🔬 Analyzing page content...');
        
        // Perform comprehensive analysis
        const analysis = await this.performAnalysis(content);
        
        // Cache result
        this.cacheAnalysis(contentHash, analysis);
        
        // Notify listeners
        this.notifyAnalysisComplete(analysis, tab.id);
    }
    
    async performAnalysis(content) {
        const analysis = {
            timestamp: Date.now(),
            problem: this.extractProblem(content),
            patterns: this.identifyPatterns(content),
            dataStructures: this.suggestDataStructures(content),
            approaches: await this.generateMultipleApproaches(content),
            complexity: this.estimateComplexity(content),
            hints: this.generateProgressiveHints(content),
            relatedTopics: this.findRelatedTopics(content)
        };
        
        return analysis;
    }
    
    extractProblem(content) {
        return {
            title: content.title || 'Problem',
            description: content.description || '',
            constraints: this.parseConstraints(content.description),
            examples: this.parseExamples(content.description),
            difficulty: content.difficulty || 'medium',
            tags: content.tags || []
        };
    }
    
    parseConstraints(text) {
        if (!text) return [];
        
        const constraints = [];
        const lines = text.split('\n');
        
        let inConstraints = false;
        for (const line of lines) {
            if (line.toLowerCase().includes('constraint')) {
                inConstraints = true;
                continue;
            }
            
            if (inConstraints) {
                const match = line.match(/[-•*]\s*(.*)/);
                if (match) {
                    constraints.push(match[1].trim());
                } else if (line.trim() && !line.includes('Example')) {
                    constraints.push(line.trim());
                }
            }
        }
        
        return constraints;
    }
    
    parseExamples(text) {
        if (!text) return [];
        
        const examples = [];
        const exampleRegex = /Example\s*\d*:?\s*(Input:|input:)?\s*(.*?)(?=Example|Constraints|$)/gis;
        const matches = text.matchAll(exampleRegex);
        
        for (const match of matches) {
            examples.push(match[0].trim());
        }
        
        return examples;
    }
    
    identifyPatterns(content) {
        const patterns = [];
        const text = (content.description || '').toLowerCase();
        
        const patternKeywords = {
            'Two Pointers': ['two pointer', 'left and right', 'sliding window'],
            'Dynamic Programming': ['optimal substructure', 'overlapping subproblems', 'dp', 'memoization'],
            'Binary Search': ['sorted array', 'search', 'log n', 'binary search'],
            'Graph': ['graph', 'node', 'edge', 'vertex', 'connected', 'path'],
            'Tree': ['tree', 'root', 'leaf', 'binary tree', 'bst'],
            'Backtracking': ['combination', 'permutation', 'all possible', 'generate'],
            'Greedy': ['maximum', 'minimum', 'optimal', 'greedy'],
            'Divide and Conquer': ['divide', 'merge', 'conquer'],
            'Stack/Queue': ['stack', 'queue', 'lifo', 'fifo', 'bracket'],
            'HashMap': ['frequency', 'count', 'map', 'hash']
        };
        
        for (const [pattern, keywords] of Object.entries(patternKeywords)) {
            if (keywords.some(kw => text.includes(kw))) {
                patterns.push(pattern);
            }
        }
        
        return patterns;
    }
    
    suggestDataStructures(content) {
        const suggestions = [];
        const text = (content.description || '').toLowerCase();
        
        const dsKeywords = {
            'Array': ['array', 'list', 'sequence'],
            'HashMap/HashSet': ['unique', 'frequency', 'count', 'duplicate'],
            'Stack': ['nested', 'bracket', 'parentheses', 'lifo'],
            'Queue': ['fifo', 'order', 'sequential'],
            'Heap/Priority Queue': ['k largest', 'k smallest', 'top k', 'priority'],
            'Binary Tree': ['tree', 'binary tree', 'root', 'leaf'],
            'Graph': ['graph', 'connected', 'path', 'cycle'],
            'Trie': ['prefix', 'word', 'dictionary'],
            'Union Find': ['disjoint', 'connected components', 'union'],
            'Linked List': ['linked list', 'node', 'next pointer']
        };
        
        for (const [ds, keywords] of Object.entries(dsKeywords)) {
            if (keywords.some(kw => text.includes(kw))) {
                suggestions.push({
                    dataStructure: ds,
                    reason: `Problem mentions: ${keywords.filter(kw => text.includes(kw)).join(', ')}`
                });
            }
        }
        
        return suggestions;
    }
    
    async generateMultipleApproaches(content) {
        const approaches = [];
        
        // Brute Force
        approaches.push({
            name: 'Brute Force',
            description: 'Try all possible combinations/solutions',
            timeComplexity: 'O(2^n) or O(n!)',
            spaceComplexity: 'O(1) or O(n)',
            pros: ['Easy to implement', 'Guarantees solution'],
            cons: ['Very slow for large inputs', 'Not practical'],
            recommended: false
        });
        
        // Based on identified patterns
        const patterns = this.identifyPatterns(content);
        
        if (patterns.includes('Two Pointers')) {
            approaches.push({
                name: 'Two Pointers',
                description: 'Use two pointers to traverse the array/string',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(1)',
                pros: ['Fast', 'Space efficient'],
                cons: ['Only works for certain problems'],
                recommended: true
            });
        }
        
        if (patterns.includes('Dynamic Programming')) {
            approaches.push({
                name: 'Dynamic Programming',
                description: 'Break problem into subproblems and memoize results',
                timeComplexity: 'O(n^2) or O(n*m)',
                spaceComplexity: 'O(n) or O(n*m)',
                pros: ['Optimal solution', 'Avoids recomputation'],
                cons: ['Can be complex to implement'],
                recommended: true
            });
        }
        
        if (patterns.includes('Binary Search')) {
            approaches.push({
                name: 'Binary Search',
                description: 'Divide search space in half each iteration',
                timeComplexity: 'O(log n)',
                spaceComplexity: 'O(1)',
                pros: ['Very fast', 'Space efficient'],
                cons: ['Requires sorted data'],
                recommended: true
            });
        }
        
        if (patterns.includes('HashMap')) {
            approaches.push({
                name: 'HashMap',
                description: 'Use hash map for O(1) lookups',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(n)',
                pros: ['Fast lookups', 'Good for frequency counting'],
                cons: ['Uses extra space'],
                recommended: true
            });
        }
        
        return approaches;
    }
    
    estimateComplexity(content) {
        const description = (content.description || '').toLowerCase();
        const constraints = this.parseConstraints(description);
        
        // Extract input size from constraints
        let maxN = 0;
        for (const constraint of constraints) {
            const match = constraint.match(/n\s*[<=]+\s*(\d+)/i);
            if (match) {
                maxN = Math.max(maxN, parseInt(match[1]));
            }
        }
        
        // Suggest complexity based on input size
        let suggested = 'O(n)';
        if (maxN <= 20) {
            suggested = 'O(2^n) or O(n!)';
        } else if (maxN <= 100) {
            suggested = 'O(n^3)';
        } else if (maxN <= 1000) {
            suggested = 'O(n^2)';
        } else if (maxN <= 100000) {
            suggested = 'O(n log n)';
        } else {
            suggested = 'O(n) or O(log n)';
        }
        
        return {
            maxInputSize: maxN,
            suggestedTimeComplexity: suggested,
            reasoning: `Input size is ${maxN}, so ${suggested} should work`
        };
    }
    
    generateProgressiveHints(content) {
        const patterns = this.identifyPatterns(content);
        const hints = [];
        
        // Level 1: Problem understanding hint
        hints.push({
            level: 1,
            hint: 'Start by clearly understanding the problem. What is the input? What is the expected output?'
        });
        
        // Level 2: Pattern hint
        if (patterns.length > 0) {
            hints.push({
                level: 2,
                hint: `This problem might involve: ${patterns[0]}. Think about how that pattern could apply here.`
            });
        } else {
            hints.push({
                level: 2,
                hint: 'Think about what data structure would be most efficient for this problem.'
            });
        }
        
        // Level 3: Approach hint
        const ds = this.suggestDataStructures(content);
        if (ds.length > 0) {
            hints.push({
                level: 3,
                hint: `Consider using ${ds[0].dataStructure}. ${ds[0].reason}`
            });
        }
        
        // Level 4: Edge cases hint
        hints.push({
            level: 4,
            hint: 'Don\'t forget to consider edge cases: empty input, single element, duplicate values, etc.'
        });
        
        return hints;
    }
    
    findRelatedTopics(content) {
        const topics = [];
        const tags = content.tags || [];
        const patterns = this.identifyPatterns(content);
        
        // Add tags as topics
        topics.push(...tags);
        
        // Add patterns as topics
        topics.push(...patterns);
        
        return [...new Set(topics)];
    }
    
    hashContent(content) {
        const str = JSON.stringify(content);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    cacheAnalysis(hash, analysis) {
        // Limit cache size
        if (this.analysisCache.size >= this.config.maxCacheSize) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
        }
        
        this.analysisCache.set(hash, analysis);
    }
    
    notifyAnalysisComplete(analysis, tabId) {
        console.log('📊 Analysis complete:', analysis);
        
        // Send to background script
        chrome.runtime.sendMessage({
            type: 'MCP_ANALYSIS_COMPLETE',
            analysis: analysis
        });
        
        // Send to content script
        chrome.tabs.sendMessage(tabId, {
            type: 'MCP_ANALYSIS_COMPLETE',
            analysis: analysis
        }).catch(() => {
            // Tab might be closed or not ready
        });
    }
    
    async getAnalysis(url) {
        // Return cached analysis if available
        for (const [hash, analysis] of this.analysisCache.entries()) {
            if (analysis.url === url) {
                return analysis;
            }
        }
        return null;
    }
}

// Create global instance
const mcpServer = new MCPServer();

// Auto-start server
mcpServer.start();

// Export for external use
export { mcpServer, MCPServer };

console.log('🚀 MCP Server module loaded');
