// DraftDeckAI Job Hunter - Auto Job Application System
// Fetches jobs, analyzes descriptions, and auto-applies with tailored resumes

class JobHunter {
    constructor() {
        this.jobBoards = {
            linkedin: {
                name: 'LinkedIn',
                url: 'https://www.linkedin.com/jobs',
                selectors: {
                    jobCard: '.job-card-container',
                    title: '.job-card-list__title',
                    company: '.job-card-container__company-name',
                    location: '.job-card-container__metadata-item',
                    description: '.jobs-description__content',
                    applyButton: '.jobs-apply-button'
                }
            },
            indeed: {
                name: 'Indeed',
                url: 'https://www.indeed.com',
                selectors: {
                    jobCard: '.job_seen_beacon',
                    title: '.jobTitle',
                    company: '[data-testid="company-name"]',
                    location: '[data-testid="text-location"]',
                    description: '#jobDescriptionText',
                    applyButton: '.indeedApplyButton'
                }
            },
            wellfound: {
                name: 'Wellfound (AngelList)',
                url: 'https://wellfound.com/jobs',
                selectors: {
                    jobCard: '[data-test="StartupResult"]',
                    title: '[data-test="job-title"]',
                    company: '[data-test="startup-name"]',
                    description: '[data-test="job-description"]',
                    applyButton: '[data-test="apply-button"]'
                }
            }
        };
        
        this.userProfile = null;
        this.appliedJobs = [];
        this.savedJobs = [];
        this.loadData();
    }

    async loadData() {
        const result = await chrome.storage.local.get(['user_profile', 'applied_jobs', 'saved_jobs']);
        this.userProfile = result.user_profile || this.getDefaultProfile();
        this.appliedJobs = result.applied_jobs || [];
        this.savedJobs = result.saved_jobs || [];
    }

    async saveData() {
        await chrome.storage.local.set({
            user_profile: this.userProfile,
            applied_jobs: this.appliedJobs,
            saved_jobs: this.savedJobs
        });
    }

    getDefaultProfile() {
        return {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedinUrl: '',
            githubUrl: '',
            portfolioUrl: '',
            resume: {
                summary: '',
                experience: [],
                education: [],
                skills: [],
                projects: []
            },
            preferences: {
                jobTitles: ['Software Engineer', 'Full Stack Developer'],
                locations: ['Remote', 'Hybrid'],
                minSalary: 0,
                employmentType: ['Full-time'],
                autoApply: false
            }
        };
    }

    async updateProfile(profileData) {
        this.userProfile = { ...this.userProfile, ...profileData };
        await this.saveData();
    }

    async fetchJobs(searchParams) {
        const { keywords, location, remote, experienceLevel } = searchParams;
        const jobs = [];

        // Simulate job fetching (in real implementation, would use APIs or web scraping)
        // For LinkedIn, Indeed, Wellfound, etc.
        
        try {
            // Send message to content script to scrape current page
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'FETCH_JOBS',
                    params: searchParams
                });
                
                if (response && response.jobs) {
                    jobs.push(...response.jobs);
                }
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }

        return jobs;
    }

    async analyzeJobDescription(jobDescription) {
        // Use AI to extract key requirements and skills
        const prompt = `Analyze this job description and extract:
1. Required skills (technical and soft skills)
2. Required experience level
3. Key responsibilities
4. Company culture indicators
5. Keywords to include in resume/cover letter

Job Description:
${jobDescription}

Return as JSON with keys: requiredSkills, experienceLevel, responsibilities, culture, keywords`;

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

    async generateTailoredResume(jobAnalysis, userProfile) {
        const prompt = `Create a tailored resume optimized for this job.

Job Requirements:
${JSON.stringify(jobAnalysis, null, 2)}

User Profile:
${JSON.stringify(userProfile.resume, null, 2)}

Generate an ATS-optimized resume that:
1. Highlights relevant skills from the job description
2. Emphasizes matching experience
3. Uses keywords from the job posting
4. Maintains truthfulness (don't add fake experience)
5. Reorders sections to prioritize relevant information

Return as JSON with sections: summary, experience, skills, projects, education`;

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

    async generateCoverLetter(jobAnalysis, userProfile, companyName, jobTitle) {
        const prompt = `Write a compelling cover letter for this position.

Company: ${companyName}
Position: ${jobTitle}

Job Analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Candidate Profile:
Name: ${userProfile.fullName}
Experience: ${userProfile.resume.experience.length} positions
Skills: ${userProfile.resume.skills.join(', ')}

Write a personalized, enthusiastic cover letter (250-300 words) that:
1. Shows genuine interest in the company
2. Highlights relevant achievements
3. Demonstrates cultural fit
4. Includes a strong call to action`;

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { type: 'SOLVE_PROBLEM', prompt },
                (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.data.content || response.data);
                    }
                }
            );
        });
    }

    async autoFillApplication(jobData, tailoredResume, coverLetter) {
        // Send message to content script to fill form
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) return false;

        try {
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'AUTO_FILL_APPLICATION',
                data: {
                    profile: this.userProfile,
                    resume: tailoredResume,
                    coverLetter: coverLetter,
                    jobData: jobData
                }
            });

            return response && response.success;
        } catch (error) {
            console.error('Error auto-filling application:', error);
            return false;
        }
    }

    async applyToJob(job) {
        try {
            // 1. Analyze job description
            const jobAnalysis = await this.analyzeJobDescription(job.description);
            
            // 2. Generate tailored resume
            const tailoredResume = await this.generateTailoredResume(jobAnalysis, this.userProfile);
            
            // 3. Generate cover letter
            const coverLetter = await this.generateCoverLetter(
                jobAnalysis,
                this.userProfile,
                job.company,
                job.title
            );
            
            // 4. Auto-fill application
            const success = await this.autoFillApplication(job, tailoredResume, coverLetter);
            
            if (success) {
                // Track application
                this.appliedJobs.push({
                    ...job,
                    appliedDate: new Date().toISOString(),
                    tailoredResume,
                    coverLetter,
                    status: 'applied'
                });
                
                await this.saveData();
                return { success: true, message: 'Application submitted successfully!' };
            }
            
            return { success: false, message: 'Failed to submit application' };
            
        } catch (error) {
            console.error('Error applying to job:', error);
            return { success: false, message: error.message };
        }
    }

    async saveJob(job) {
        this.savedJobs.push({
            ...job,
            savedDate: new Date().toISOString()
        });
        await this.saveData();
    }

    async bulkApply(jobs, maxApplications = 10) {
        const results = [];
        let successCount = 0;

        for (let i = 0; i < Math.min(jobs.length, maxApplications); i++) {
            const job = jobs[i];
            
            // Check if already applied
            if (this.appliedJobs.some(j => j.url === job.url)) {
                results.push({ job, status: 'skipped', reason: 'Already applied' });
                continue;
            }

            const result = await this.applyToJob(job);
            results.push({ job, status: result.success ? 'success' : 'failed', message: result.message });
            
            if (result.success) successCount++;
            
            // Wait between applications to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        return {
            total: jobs.length,
            applied: successCount,
            results
        };
    }

    getApplicationStats() {
        const now = new Date();
        const thisWeek = this.appliedJobs.filter(job => {
            const appliedDate = new Date(job.appliedDate);
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return appliedDate > weekAgo;
        });

        const thisMonth = this.appliedJobs.filter(job => {
            const appliedDate = new Date(job.appliedDate);
            return appliedDate.getMonth() === now.getMonth() && 
                   appliedDate.getFullYear() === now.getFullYear();
        });

        return {
            total: this.appliedJobs.length,
            thisWeek: thisWeek.length,
            thisMonth: thisMonth.length,
            saved: this.savedJobs.length,
            byStatus: {
                applied: this.appliedJobs.filter(j => j.status === 'applied').length,
                interviewing: this.appliedJobs.filter(j => j.status === 'interviewing').length,
                offered: this.appliedJobs.filter(j => j.status === 'offered').length,
                rejected: this.appliedJobs.filter(j => j.status === 'rejected').length
            }
        };
    }
}

// Create global instance
window.jobHunter = new JobHunter();

console.log('💼 Job Hunter initialized');
