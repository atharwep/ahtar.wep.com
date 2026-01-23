/**
 * 🎯 ATS Engine - محرك تحليل أنظمة الفرز الآلي
 * 
 * المسؤوليات:
 * 1. تحليل السيرة الذاتية
 * 2. استخراج الكلمات المفتاحية
 * 3. مطابقة المهارات مع الوظيفة
 * 4. حساب نسبة التوافق
 * 5. تقديم اقتراحات للتحسين
 * 
 * معايير ATS:
 * - Simple Format (لا تنسيقات معقدة)
 * - Keywords Matching
 * - Proper Sections
 * - Quantifiable Achievements
 */

class ATSEngine {
    constructor() {
        // الكلمات المفتاحية الشائعة في القطاع الإنساني
        this.humanitarianKeywords = {
            // المهارات التقنية
            technical: [
                'WASH', 'Protection', 'MEAL', 'M&E', 'Monitoring', 'Evaluation',
                'Accountability', 'Learning', 'Nutrition', 'Health', 'Education',
                'Shelter', 'CCCM', 'Camp Coordination', 'Camp Management',
                'Cash Transfer', 'CVA', 'Cash and Voucher', 'Livelihoods',
                'Food Security', 'NFI', 'Non-Food Items', 'Logistics',
                'Supply Chain', 'Procurement', 'HR', 'Human Resources',
                'Finance', 'Budget', 'Grant Management', 'Proposal Writing',
                'Report Writing', 'Data Analysis', 'Database Management',
                'GIS', 'Geographic Information System', 'Mapping'
            ],

            // المهارات الناعمة
            soft: [
                'Communication', 'التواصل', 'Leadership', 'القيادة',
                'Teamwork', 'العمل الجماعي', 'Problem Solving', 'حل المشكلات',
                'Critical Thinking', 'التفكير النقدي', 'Adaptability', 'التكيف',
                'Time Management', 'إدارة الوقت', 'Multitasking', 'تعدد المهام',
                'Coordination', 'التنسيق', 'Negotiation', 'التفاوض',
                'Conflict Resolution', 'حل النزاعات', 'Cultural Sensitivity', 'الحساسية الثقافية'
            ],

            // المنظمات الدولية
            organizations: [
                'UN', 'UNHCR', 'UNICEF', 'WFP', 'WHO', 'IOM', 'UNDP',
                'OCHA', 'FAO', 'UNESCO', 'UNRWA', 'IRC', 'NRC',
                'Norwegian Refugee Council', 'International Rescue Committee',
                'Save the Children', 'Oxfam', 'CARE', 'Mercy Corps',
                'World Vision', 'Islamic Relief', 'Red Cross', 'Red Crescent',
                'MSF', 'Médecins Sans Frontières', 'Doctors Without Borders'
            ],

            // الأفعال القوية
            actionVerbs: [
                'Managed', 'أدار', 'Coordinated', 'نسق', 'Developed', 'طور',
                'Implemented', 'نفذ', 'Led', 'قاد', 'Established', 'أسس',
                'Designed', 'صمم', 'Conducted', 'أجرى', 'Facilitated', 'يسر',
                'Monitored', 'راقب', 'Evaluated', 'قيّم', 'Analyzed', 'حلل',
                'Improved', 'حسّن', 'Achieved', 'حقق', 'Delivered', 'قدّم'
            ]
        };

        // الأقسام المطلوبة في السيرة الذاتية
        this.requiredSections = [
            'Personal Information',
            'Professional Summary',
            'Work Experience',
            'Education',
            'Skills',
            'Languages'
        ];

        // الأخطاء الشائعة التي تسبب الرفض
        this.commonErrors = [
            {
                id: 'no_keywords',
                name: 'عدم وجود كلمات مفتاحية',
                severity: 'critical',
                description: 'السيرة الذاتية لا تحتوي على كلمات مفتاحية كافية من إعلان الوظيفة'
            },
            {
                id: 'complex_format',
                name: 'تنسيق معقد',
                severity: 'high',
                description: 'استخدام تنسيقات معقدة (جداول، أعمدة، صور) قد تعيق قراءة ATS'
            },
            {
                id: 'missing_sections',
                name: 'أقسام ناقصة',
                severity: 'high',
                description: 'السيرة الذاتية تفتقد أقساماً مهمة'
            },
            {
                id: 'no_quantifiable',
                name: 'لا إنجازات قابلة للقياس',
                severity: 'medium',
                description: 'عدم وجود إنجازات مدعومة بأرقام أو نتائج ملموسة'
            },
            {
                id: 'generic_summary',
                name: 'ملخص عام',
                severity: 'medium',
                description: 'الملخص المهني عام جداً وغير مخصص للوظيفة'
            },
            {
                id: 'typos',
                name: 'أخطاء إملائية',
                severity: 'low',
                description: 'وجود أخطاء إملائية أو نحوية'
            }
        ];
    }

    /**
     * تحليل السيرة الذاتية
     */
    async analyzeCVAsync(cvText, jobDescription = null) {
        const analysis = {
            score: 0,
            maxScore: 100,
            breakdown: {},
            keywords: {
                found: [],
                missing: [],
                total: 0
            },
            sections: {
                found: [],
                missing: []
            },
            errors: [],
            suggestions: [],
            strengths: []
        };

        try {
            // 1. تحليل الأقسام
            this.analyzeSections(cvText, analysis);

            // 2. استخراج الكلمات المفتاحية
            this.extractKeywords(cvText, analysis);

            // 3. إذا كان هناك وصف وظيفي، قارن معه
            if (jobDescription) {
                await this.compareWithJob(cvText, jobDescription, analysis);
            }

            // 4. اكتشاف الأخطاء الشائعة
            this.detectCommonErrors(cvText, analysis);

            // 5. حساب النتيجة النهائية
            this.calculateScore(analysis);

            // 6. تقديم اقتراحات
            this.generateSuggestions(analysis);

            return analysis;
        } catch (error) {
            console.error('ATS Analysis failed:', error);
            throw error;
        }
    }

    /**
     * تحليل الأقسام
     */
    analyzeSections(cvText, analysis) {
        const text = cvText.toLowerCase();

        const sectionPatterns = {
            'Personal Information': /personal\s+information|معلومات\s+شخصية|contact|الاتصال/i,
            'Professional Summary': /professional\s+summary|summary|ملخص\s+مهني|objective|الهدف/i,
            'Work Experience': /work\s+experience|experience|خبرة\s+عملية|employment|الوظائف/i,
            'Education': /education|تعليم|academic|الدراسة/i,
            'Skills': /skills|مهارات|competencies|الكفاءات/i,
            'Languages': /languages|لغات|language\s+skills/i
        };

        this.requiredSections.forEach(section => {
            const pattern = sectionPatterns[section];
            if (pattern && pattern.test(text)) {
                analysis.sections.found.push(section);
            } else {
                analysis.sections.missing.push(section);
            }
        });

        // حساب نقاط الأقسام (30 نقطة)
        const sectionScore = (analysis.sections.found.length / this.requiredSections.length) * 30;
        analysis.breakdown.sections = Math.round(sectionScore);
    }

    /**
     * استخراج الكلمات المفتاحية
     */
    extractKeywords(cvText, analysis) {
        const text = cvText.toLowerCase();
        const foundKeywords = new Set();

        // البحث عن الكلمات المفتاحية
        Object.values(this.humanitarianKeywords).forEach(category => {
            category.forEach(keyword => {
                // Support for both Latin and Arabic word boundaries
                const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`(?:^|[^\\w\\u0600-\\u06FF])${escaped.toLowerCase()}(?![\\w\\u0600-\\u06FF])`, 'i');
                if (pattern.test(text)) {
                    foundKeywords.add(keyword);
                }
            });
        });

        analysis.keywords.found = Array.from(foundKeywords);
        analysis.keywords.total = foundKeywords.size;

        // حساب نقاط الكلمات المفتاحية (40 نقطة)
        // 20+ كلمة مفتاحية = نقاط كاملة
        const keywordScore = Math.min((foundKeywords.size / 20) * 40, 40);
        analysis.breakdown.keywords = Math.round(keywordScore);
    }

    /**
     * مقارنة مع الوظيفة
     */
    async compareWithJob(cvText, jobDescription, analysis) {
        // استخراج الكلمات المفتاحية من الوظيفة
        const jobKeywords = this.extractJobKeywords(jobDescription);

        const cvText_lower = cvText.toLowerCase();
        const matched = [];
        const missing = [];

        jobKeywords.forEach(keyword => {
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`(?:^|[^\\w\\u0600-\\u06FF])${escaped.toLowerCase()}(?![\\w\\u0600-\\u06FF])`, 'i');
            if (pattern.test(cvText_lower)) {
                matched.push(keyword);
            } else {
                missing.push(keyword);
            }
        });

        analysis.keywords.jobMatched = matched;
        analysis.keywords.jobMissing = missing;

        // حساب نسبة التطابق (20 نقطة)
        if (jobKeywords.length > 0) {
            const matchScore = (matched.length / jobKeywords.length) * 20;
            analysis.breakdown.jobMatch = Math.round(matchScore);
        }
    }

    /**
     * استخراج الكلمات المفتاحية من الوظيفة
     */
    extractJobKeywords(jobDescription) {
        const keywords = new Set();
        const text = jobDescription.toLowerCase();

        // البحث عن الكلمات المفتاحية المعروفة
        Object.values(this.humanitarianKeywords).forEach(category => {
            category.forEach(keyword => {
                const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`(?:^|[^\\w\\u0600-\\u06FF])${escaped.toLowerCase()}(?![\\w\\u0600-\\u06FF])`, 'i');
                if (pattern.test(text)) {
                    keywords.add(keyword);
                }
            });
        });

        // استخراج كلمات إضافية (الأسماء والأفعال)
        const words = text.match(/\b[a-z]{4,}\b/gi) || [];
        const commonWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will', 'your', 'their'];

        words.forEach(word => {
            if (!commonWords.includes(word.toLowerCase()) && word.length >= 4) {
                keywords.add(word);
            }
        });

        return Array.from(keywords).slice(0, 30); // أخذ أهم 30 كلمة
    }

    /**
     * اكتشاف الأخطاء الشائعة
     */
    detectCommonErrors(cvText, analysis) {
        const text = cvText.toLowerCase();

        // 1. عدم وجود كلمات مفتاحية كافية
        if (analysis.keywords.total < 10) {
            analysis.errors.push(this.commonErrors.find(e => e.id === 'no_keywords'));
        }

        // 2. أقسام ناقصة
        if (analysis.sections.missing.length > 0) {
            analysis.errors.push(this.commonErrors.find(e => e.id === 'missing_sections'));
        }

        // 3. لا إنجازات قابلة للقياس
        const hasNumbers = /\d+/.test(text);
        const hasAchievements = /achieved|accomplished|increased|decreased|improved|reduced/i.test(text);
        if (!hasNumbers || !hasAchievements) {
            analysis.errors.push(this.commonErrors.find(e => e.id === 'no_quantifiable'));
        }

        // 4. ملخص عام
        const hasSummary = /summary|objective/i.test(text);
        const summaryLength = text.match(/summary[\s\S]{0,500}/i)?.[0]?.length || 0;
        if (!hasSummary || summaryLength < 100) {
            analysis.errors.push(this.commonErrors.find(e => e.id === 'generic_summary'));
        }

        // حساب نقاط الأخطاء (10 نقاط)
        const errorPenalty = analysis.errors.length * 2.5;
        analysis.breakdown.errors = Math.max(10 - errorPenalty, 0);
    }

    /**
     * حساب النتيجة النهائية
     */
    calculateScore(analysis) {
        const breakdown = analysis.breakdown;

        analysis.score = Math.round(
            (breakdown.sections || 0) +
            (breakdown.keywords || 0) +
            (breakdown.jobMatch || 0) +
            (breakdown.errors || 0)
        );

        // تحديد المستوى
        if (analysis.score >= 80) {
            analysis.level = 'excellent';
            analysis.levelText = 'ممتاز';
            analysis.levelColor = '#10b981';
        } else if (analysis.score >= 60) {
            analysis.level = 'good';
            analysis.levelText = 'جيد';
            analysis.levelColor = '#3b82f6';
        } else if (analysis.score >= 40) {
            analysis.level = 'fair';
            analysis.levelText = 'مقبول';
            analysis.levelColor = '#f59e0b';
        } else {
            analysis.level = 'poor';
            analysis.levelText = 'ضعيف';
            analysis.levelColor = '#ef4444';
        }
    }

    /**
     * تقديم اقتراحات
     */
    generateSuggestions(analysis) {
        // اقتراحات بناءً على الأقسام الناقصة
        if (analysis.sections.missing.length > 0) {
            analysis.suggestions.push({
                type: 'sections',
                priority: 'high',
                text: `أضف الأقسام التالية: ${analysis.sections.missing.join(', ')}`
            });
        }

        // اقتراحات بناءً على الكلمات المفتاحية
        if (analysis.keywords.total < 15) {
            analysis.suggestions.push({
                type: 'keywords',
                priority: 'high',
                text: 'أضف المزيد من الكلمات المفتاحية المتعلقة بالقطاع الإنساني'
            });
        }

        // اقتراحات بناءً على المطابقة مع الوظيفة
        if (analysis.keywords.jobMissing && analysis.keywords.jobMissing.length > 0) {
            analysis.suggestions.push({
                type: 'job_match',
                priority: 'critical',
                text: `أضف الكلمات المفتاحية التالية من إعلان الوظيفة: ${analysis.keywords.jobMissing.slice(0, 5).join(', ')}`
            });
        }

        // اقتراحات بناءً على الأخطاء
        analysis.errors.forEach(error => {
            analysis.suggestions.push({
                type: 'error',
                priority: error.severity,
                text: error.description
            });
        });

        // نقاط القوة
        if (analysis.keywords.total >= 15) {
            analysis.strengths.push('عدد جيد من الكلمات المفتاحية');
        }
        if (analysis.sections.found.length === this.requiredSections.length) {
            analysis.strengths.push('جميع الأقسام المطلوبة موجودة');
        }
        if (analysis.keywords.jobMatched && analysis.keywords.jobMatched.length >= 10) {
            analysis.strengths.push('تطابق جيد مع متطلبات الوظيفة');
        }
    }

    /**
     * تحليل سريع (بدون AI)
     */
    quickAnalyze(cvText) {
        const analysis = {
            score: 0,
            keywords: 0,
            sections: 0,
            hasNumbers: false,
            hasActionVerbs: false
        };

        const text = cvText.toLowerCase();

        // عد الكلمات المفتاحية
        Object.values(this.humanitarianKeywords).forEach(category => {
            category.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) {
                    analysis.keywords++;
                }
            });
        });

        // عد الأقسام
        this.requiredSections.forEach(section => {
            if (text.includes(section.toLowerCase())) {
                analysis.sections++;
            }
        });

        // التحقق من الأرقام
        analysis.hasNumbers = /\d+/.test(text);

        // التحقق من الأفعال القوية
        analysis.hasActionVerbs = this.humanitarianKeywords.actionVerbs.some(verb =>
            text.includes(verb.toLowerCase())
        );

        // حساب النتيجة
        analysis.score = Math.min(
            (analysis.keywords * 2) +
            (analysis.sections * 5) +
            (analysis.hasNumbers ? 10 : 0) +
            (analysis.hasActionVerbs ? 10 : 0),
            100
        );

        return analysis;
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const atsEngine = new ATSEngine();
window.atsEngine = atsEngine;

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = atsEngine;
}
