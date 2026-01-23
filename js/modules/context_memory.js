/**
 * 🧠 Context Memory Engine - محرك الذاكرة السياقية
 * 
 * المسؤوليات:
 * 1. حفظ تاريخ المستخدم وتفضيلاته
 * 2. تذكر السياق عبر الجلسات
 * 3. اقتراحات ذكية بناءً على التاريخ
 * 4. تخصيص تلقائي للتجربة
 * 
 * الاستقلالية:
 * - لا يؤثر على صفحات أخرى
 * - يعمل كخدمة مستقلة
 * - قابل للتعطيل
 */

class ContextMemoryEngine {
    constructor() {
        this.storageKey = 'athar_context_memory';
        this.security = typeof securityLayer !== 'undefined' ? securityLayer : null;

        // تحميل البيانات المحفوظة
        this.context = this.loadContext();
    }

    /**
     * تحميل السياق المحفوظ
     */
    loadContext() {
        try {
            let data;

            if (this.security) {
                data = this.security.secureRetrieve(this.storageKey);
            } else {
                const stored = localStorage.getItem(this.storageKey);
                data = stored ? JSON.parse(stored) : null;
            }

            return data || this.getDefaultContext();
        } catch (error) {
            console.error('Failed to load context:', error);
            return this.getDefaultContext();
        }
    }

    /**
     * السياق الافتراضي
     */
    getDefaultContext() {
        return {
            userProfile: {
                sector: null,
                experienceLevel: null,
                targetJobs: [],
                preferredOrganizations: [],
                skills: [],
                languages: [],
                country: null,
                city: null
            },
            history: {
                cvs: [],
                applications: [],
                atsScores: [],
                jobDescriptions: [],
                searches: []
            },
            preferences: {
                cvTemplate: 'modern',
                language: 'ar',
                theme: 'light',
                notifications: true
            },
            analytics: {
                totalCVs: 0,
                totalApplications: 0,
                avgATSScore: 0,
                lastActivity: null,
                firstVisit: Date.now()
            },
            metadata: {
                version: '1.0.0',
                lastUpdated: Date.now(),
                createdAt: Date.now()
            }
        };
    }

    /**
     * حفظ السياق
     */
    saveContext() {
        try {
            this.context.metadata.lastUpdated = Date.now();

            if (this.security) {
                this.security.secureStore(this.storageKey, this.context);
            } else {
                localStorage.setItem(this.storageKey, JSON.stringify(this.context));
            }

            return true;
        } catch (error) {
            console.error('Failed to save context:', error);
            return false;
        }
    }

    /**
     * تحديث الملف الشخصي
     */
    updateProfile(updates) {
        this.context.userProfile = {
            ...this.context.userProfile,
            ...updates
        };
        this.saveContext();
    }

    /**
     * إضافة سيرة ذاتية للتاريخ
     */
    addCV(cvData) {
        const cv = {
            id: Date.now(),
            jobTitle: cvData.jobTitle,
            organization: cvData.organization,
            template: cvData.template,
            atsScore: cvData.atsScore || null,
            createdAt: Date.now()
        };

        this.context.history.cvs.unshift(cv);

        // الاحتفاظ بآخر 50 سيرة ذاتية فقط
        if (this.context.history.cvs.length > 50) {
            this.context.history.cvs = this.context.history.cvs.slice(0, 50);
        }

        this.context.analytics.totalCVs++;
        this.context.analytics.lastActivity = Date.now();

        this.saveContext();
        return cv.id;
    }

    /**
     * إضافة نتيجة ATS
     */
    addATSScore(score, jobTitle = null) {
        const atsRecord = {
            score,
            jobTitle,
            timestamp: Date.now()
        };

        this.context.history.atsScores.unshift(atsRecord);

        // الاحتفاظ بآخر 100 نتيجة
        if (this.context.history.atsScores.length > 100) {
            this.context.history.atsScores = this.context.history.atsScores.slice(0, 100);
        }

        // حساب المتوسط
        const scores = this.context.history.atsScores.map(r => r.score);
        this.context.analytics.avgATSScore =
            Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        this.saveContext();
    }

    /**
     * إضافة وصف وظيفي للتاريخ
     */
    addJobDescription(jobTitle, organization, responsibilities) {
        const jobDesc = {
            id: Date.now(),
            jobTitle,
            organization,
            responsibilities,
            usageCount: 1,
            createdAt: Date.now(),
            lastUsed: Date.now()
        };

        // البحث عن وصف مشابه
        const existing = this.context.history.jobDescriptions.find(
            jd => jd.jobTitle === jobTitle && jd.organization === organization
        );

        if (existing) {
            existing.usageCount++;
            existing.lastUsed = Date.now();
        } else {
            this.context.history.jobDescriptions.unshift(jobDesc);

            // الاحتفاظ بآخر 30 وصف
            if (this.context.history.jobDescriptions.length > 30) {
                this.context.history.jobDescriptions =
                    this.context.history.jobDescriptions.slice(0, 30);
            }
        }

        this.saveContext();
    }

    /**
     * إضافة بحث للتاريخ
     */
    addSearch(query, type = 'general') {
        const search = {
            query,
            type,
            timestamp: Date.now()
        };

        this.context.history.searches.unshift(search);

        // الاحتفاظ بآخر 50 بحث
        if (this.context.history.searches.length > 50) {
            this.context.history.searches = this.context.history.searches.slice(0, 50);
        }

        this.saveContext();
    }

    /**
     * الحصول على اقتراحات ذكية
     */
    getSmartSuggestions() {
        const suggestions = {
            jobTitles: [],
            organizations: [],
            skills: [],
            improvements: []
        };

        // اقتراحات الوظائف بناءً على التاريخ
        const jobTitles = this.context.history.cvs.map(cv => cv.jobTitle);
        const uniqueJobs = [...new Set(jobTitles)];
        suggestions.jobTitles = uniqueJobs.slice(0, 5);

        // اقتراحات المنظمات
        const orgs = this.context.history.cvs.map(cv => cv.organization);
        const uniqueOrgs = [...new Set(orgs)];
        suggestions.organizations = uniqueOrgs.slice(0, 5);

        // اقتراحات التحسين بناءً على ATS
        if (this.context.analytics.avgATSScore < 70) {
            suggestions.improvements.push({
                type: 'ats',
                priority: 'high',
                message: 'متوسط نتيجة ATS منخفض. ننصح بتحسين الكلمات المفتاحية.'
            });
        }

        // اقتراحات بناءً على عدد السير الذاتية
        if (this.context.analytics.totalCVs < 3) {
            suggestions.improvements.push({
                type: 'experience',
                priority: 'medium',
                message: 'جرّب إنشاء سير ذاتية متعددة لوظائف مختلفة.'
            });
        }

        return suggestions;
    }

    /**
     * الحصول على التوصيات المخصصة
     */
    getPersonalizedRecommendations() {
        const recommendations = [];

        // توصيات بناءً على القطاع
        if (this.context.userProfile.sector) {
            recommendations.push({
                type: 'sector',
                title: `موارد خاصة بقطاع ${this.context.userProfile.sector}`,
                action: 'view_library',
                priority: 'high'
            });
        }

        // توصيات بناءً على مستوى الخبرة
        if (this.context.userProfile.experienceLevel === 'Entry-level') {
            recommendations.push({
                type: 'training',
                title: 'دورات تدريبية للمبتدئين',
                action: 'view_courses',
                priority: 'medium'
            });
        }

        // توصيات بناءً على النشاط
        const daysSinceLastActivity = this.context.analytics.lastActivity
            ? (Date.now() - this.context.analytics.lastActivity) / (1000 * 60 * 60 * 24)
            : 0;

        if (daysSinceLastActivity > 7) {
            recommendations.push({
                type: 'engagement',
                title: 'لم نرك منذ فترة! تحقق من الوظائف الجديدة',
                action: 'view_jobs',
                priority: 'low'
            });
        }

        return recommendations;
    }

    /**
     * تحليل الأنماط
     */
    analyzePatterns() {
        const patterns = {
            mostUsedJobTitle: null,
            mostUsedOrganization: null,
            preferredTemplate: null,
            activityTrend: null,
            atsImprovement: null
        };

        // الوظيفة الأكثر استخداماً
        const jobCounts = {};
        this.context.history.cvs.forEach(cv => {
            jobCounts[cv.jobTitle] = (jobCounts[cv.jobTitle] || 0) + 1;
        });
        patterns.mostUsedJobTitle = Object.keys(jobCounts).reduce((a, b) =>
            jobCounts[a] > jobCounts[b] ? a : b, null
        );

        // المنظمة الأكثر استخداماً
        const orgCounts = {};
        this.context.history.cvs.forEach(cv => {
            orgCounts[cv.organization] = (orgCounts[cv.organization] || 0) + 1;
        });
        patterns.mostUsedOrganization = Object.keys(orgCounts).reduce((a, b) =>
            orgCounts[a] > orgCounts[b] ? a : b, null
        );

        // القالب المفضل
        const templateCounts = {};
        this.context.history.cvs.forEach(cv => {
            if (cv.template) {
                templateCounts[cv.template] = (templateCounts[cv.template] || 0) + 1;
            }
        });
        patterns.preferredTemplate = Object.keys(templateCounts).reduce((a, b) =>
            templateCounts[a] > templateCounts[b] ? a : b, null
        );

        // اتجاه النشاط
        const recentActivity = this.context.history.cvs.filter(cv =>
            Date.now() - cv.createdAt < 30 * 24 * 60 * 60 * 1000 // آخر 30 يوم
        ).length;
        patterns.activityTrend = recentActivity > 5 ? 'high' :
            recentActivity > 2 ? 'medium' : 'low';

        // تحسن ATS
        if (this.context.history.atsScores.length >= 5) {
            const recent = this.context.history.atsScores.slice(0, 5);
            const older = this.context.history.atsScores.slice(5, 10);

            if (older.length > 0) {
                const recentAvg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
                const olderAvg = older.reduce((a, b) => a + b.score, 0) / older.length;

                patterns.atsImprovement = recentAvg > olderAvg ? 'improving' :
                    recentAvg < olderAvg ? 'declining' : 'stable';
            }
        }

        return patterns;
    }

    /**
     * تصدير البيانات
     */
    exportData() {
        return {
            ...this.context,
            exportedAt: Date.now()
        };
    }

    /**
     * استيراد البيانات
     */
    importData(data) {
        try {
            // التحقق من صحة البيانات
            if (!data || !data.userProfile || !data.history) {
                throw new Error('Invalid data format');
            }

            this.context = {
                ...this.getDefaultContext(),
                ...data,
                metadata: {
                    ...data.metadata,
                    lastUpdated: Date.now()
                }
            };

            this.saveContext();
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * مسح البيانات
     */
    clearData() {
        this.context = this.getDefaultContext();
        this.saveContext();
    }

    /**
     * الحصول على إحصائيات
     */
    getStatistics() {
        return {
            ...this.context.analytics,
            patterns: this.analyzePatterns(),
            suggestions: this.getSmartSuggestions(),
            recommendations: this.getPersonalizedRecommendations()
        };
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const contextMemory = new ContextMemoryEngine();

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = contextMemory;
}
