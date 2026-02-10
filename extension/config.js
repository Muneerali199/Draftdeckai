// Configuration for DraftDeckAI Extension
// Store your API keys here (will be moved to chrome.storage for security)

const CONFIG = {
  GEMINI_API_KEY: '', // Add your Gemini API key here
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  
  // Default settings
  DEFAULT_LANGUAGE: 'javascript',
  AUTO_DETECT: true,
  SHOW_HINTS_FIRST: true,
  
  // Platform selectors (for auto-detection)
  PLATFORMS: {
    leetcode: {
      name: 'LeetCode',
      titleSelectors: [
        '[data-cy="question-title"]',
        '.css-v3d350',
        'div[class*="question-title"]'
      ],
      descriptionSelectors: [
        '[data-track-load="description_content"]',
        '.content__u3I1',
        'div[class*="elfjS"]'
      ]
    },
    hackerrank: {
      name: 'HackerRank',
      titleSelectors: ['.challenge-title', '.challenge-name'],
      descriptionSelectors: ['.challenge-body', '.problem-statement']
    },
    codeforces: {
      name: 'Codeforces',
      titleSelectors: ['.title', '.problem-statement .title'],
      descriptionSelectors: ['.problem-statement', '.problem-statement-text']
    },
    geeksforgeeks: {
      name: 'GeeksforGeeks',
      titleSelectors: [
        '.problems_problem_content__Xm_eO h3',
        '.problem-title'
      ],
      descriptionSelectors: [
        '.problems_problem_content__Xm_eO',
        '.problem-description'
      ]
    },
    linkedin: {
      name: 'LinkedIn',
      titleSelectors: ['.text-heading-xlarge', '.pv-text-details__left-panel h1'],
      descriptionSelectors: ['.pv-about__summary-text', '.display-flex .ph5']
    }
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
