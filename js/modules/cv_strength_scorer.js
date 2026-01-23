/**
 * 📊 CV Strength Scorer - مؤشر قوة السيرة الذاتية
 * 
 * المسؤوليات:
 * 1. تقييم شامل للسيرة الذاتية (0-100)
 * 2. تحليل متعدد الأبعاد
 * 3. اقتراحات تحسين محددة
 * 4. مقارنة مع المعايير الدولية
 * 
 * معايير التقييم:
 * - الصياغة (20 نقطة)
 * - الوضوح (20 نقطة)
 * - ATS Compatibility (30 نقطة)
 * - المهارات (15 نقطة)
 * - الإنجازات (15 نقطة)
 */

class CVStrengthScorer {
    constructor() {
        // معايير التقييم
        this.criteria = {
            writing: {
                weight: 20,
                name: 'الصياغة',
                description: 'جودة الكتابة والصياغة المهنية'
            },
            clarity: {
                weight: 20,
                name: 'الوضوح',
                description: 'وضوح المعلومات وسهولة القراءة'
            },
            ats: {
                weight: 30,
                name: 'التوافق مع ATS',
                description: 'قابلية القراءة بواسطة أنظمة الفرز الآلي'
            },
            skills: {
                weight: 15,
                name: 'المهارات',
                description: 'تنوع وجودة المهارات المذكورة'
            },
            achievements: {
                weight: 15,
                name: 'الإنجازات',
                description: 'وجود إنجازات قابلة للقياس ومؤثرة'
            }
        };

        // مستويات التقييم
        this.levels = {
            excellent: { min: 85, max: 100, label: 'ممتاز', color: '#10b981', icon: '🌟' },
            veryGood: { min: 75, max: 84, label: 'جيد جداً', color: '#3b82f6', icon: '⭐' },
            good: { min: 65, max: 74, label: 'جيد', color: '#8b5cf6', icon: '✨' },
            fair: { min: 50, max: 64, label: 'مقبول', color: '#f59e0b', icon: '💫' },
            needsWork: { min: 0, max: 49, label: 'يحتاج تحسين', color: '#ef4444', icon: '⚠️' }
        };

        // الأفعال القوية
        this.strongVerbs = [
            'قاد', 'طور', 'أنشأ', 'حقق', 'أدار', 'نسق', 'نفذ', 'صمم',
            'حسّن', 'عزز', 'أسس', 'بنى', 'حوّل', 'جدد', 'أطلق', 'وجه'
        ];

        // الأفعال الضعيفة
        this.weakVerbs = [
            'ساعد', 'شارك', 'عمل', 'قام', 'كان', 'تم'
        ];
    }

    /**
     * تقييم شامل للسيرة الذاتية
     */
    async scoreCV(cvData, options = {}) {
        const {
            includeATS = true,
            jobDescription = null,
            detailedAnalysis = true
        } = options;

        try {
            const score = {
                total: 0,
                breakdown: {},
                level: null,
                strengths: [],
                weaknesses: [],
                suggestions: [],
                details: {}
            };

            // 1. تقييم الصياغة
            score.breakdown.writing = this.scoreWriting(cvData);
            score.details.writing = this.analyzeWriting(cvData);

            // 2. تقييم الوضوح
            score.breakdown.clarity = this.scoreClarity(cvData);
            score.details.clarity = this.analyzeClarity(cvData);

            // 3. تقييم ATS
            if (includeATS && typeof atsEngine !== 'undefined') {
                const atsAnalysis = await atsEngine.analyzeCVAsync(
                    this.extractText(cvData),
                    jobDescription
                );
                score.breakdown.ats = (atsAnalysis.score / 100) * this.criteria.ats.weight;
                score.details.ats = atsAnalysis;
            } else {
                score.breakdown.ats = this.scoreATSBasic(cvData);
            }

            // 4. تقييم المهارات
            score.breakdown.skills = this.scoreSkills(cvData);
            score.details.skills = this.analyzeSkills(cvData);

            // 5. تقييم الإنجازات
            score.breakdown.achievements = this.scoreAchievements(cvData);
            score.details.achievements = this.analyzeAchievements(cvData);

            // حساب المجموع
            score.total = Math.round(
                Object.values(score.breakdown).reduce((a, b) => a + b, 0)
            );

            // تحديد المستوى
            score.level = this.determineLevel(score.total);

            // تحديد نقاط القوة والضعف
            this.identifyStrengthsWeaknesses(score);

            // توليد اقتراحات
            score.suggestions = this.generateSuggestions(score);

            return score;
        } catch (error) {
            console.error('CV scoring failed:', error);
            throw error;
        }
    }

    /**
     * تقييم الصياغة
     */
    scoreWriting(cvData) {
        let score = 0;
        const maxScore = this.criteria.writing.weight;

        const text = this.extractText(cvData);

        // 1. استخدام أفعال قوية (8 نقاط)
        const strongVerbCount = this.strongVerbs.filter(verb =>
            text.includes(verb)
        ).length;
        score += Math.min((strongVerbCount / 5) * 8, 8);

        // 2. تجنب أفعال ضعيفة (4 نقاط)
        const weakVerbCount = this.weakVerbs.filter(verb =>
            text.includes(verb)
        ).length;
        score += Math.max(4 - weakVerbCount, 0);

        // 3. طول الجمل المناسب (4 نقاط)
        const sentences = text.split(/[.!؟]/).filter(s => s.trim().length > 0);
        const avgLength = sentences.reduce((a, s) => a + s.length, 0) / sentences.length;
        if (avgLength >= 50 && avgLength <= 150) {
            score += 4;
        } else if (avgLength >= 30 && avgLength <= 200) {
            score += 2;
        }

        // 4. تنوع المفردات (4 نقاط)
        const words = text.split(/\s+/);
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const vocabularyRatio = uniqueWords.size / words.length;
        score += Math.min(vocabularyRatio * 8, 4);

        return Math.min(score, maxScore);
    }

    /**
     * تحليل الصياغة
     */
    analyzeWriting(cvData) {
        const text = this.extractText(cvData);

        return {
            strongVerbs: this.strongVerbs.filter(verb => text.includes(verb)),
            weakVerbs: this.weakVerbs.filter(verb => text.includes(verb)),
            sentenceCount: text.split(/[.!؟]/).length,
            wordCount: text.split(/\s+/).length,
            vocabularyDiversity: this.calculateVocabularyDiversity(text)
        };
    }

    /**
     * تقييم الوضوح
     */
    scoreClarity(cvData) {
        let score = 0;
        const maxScore = this.criteria.clarity.weight;

        // 1. وجود أقسام واضحة (8 نقاط)
        const sections = this.identifySections(cvData);
        score += Math.min((sections.length / 6) * 8, 8);

        // 2. تنسيق متسق (6 نقاط)
        if (this.hasConsistentFormatting(cvData)) {
            score += 6;
        }

        // 3. معلومات الاتصال واضحة (3 نقاط)
        if (this.hasContactInfo(cvData)) {
            score += 3;
        }

        // 4. تواريخ واضحة (3 نقاط)
        if (this.hasClearDates(cvData)) {
            score += 3;
        }

        return Math.min(score, maxScore);
    }

    /**
     * تحليل الوضوح
     */
    analyzeClarity(cvData) {
        return {
            sections: this.identifySections(cvData),
            hasContactInfo: this.hasContactInfo(cvData),
            hasClearDates: this.hasClearDates(cvData),
            consistentFormatting: this.hasConsistentFormatting(cvData)
        };
    }

    /**
     * تقييم ATS أساسي
     */
    scoreATSBasic(cvData) {
        let score = 0;
        const maxScore = this.criteria.ats.weight;

        const text = this.extractText(cvData);

        // 1. كلمات مفتاحية (12 نقاط)
        const keywords = this.extractKeywords(text);
        score += Math.min((keywords.length / 20) * 12, 12);

        // 2. تنسيق بسيط (9 نقاط)
        if (!this.hasComplexFormatting(cvData)) {
            score += 9;
        }

        // 3. أقسام قياسية (9 نقاط)
        const standardSections = ['experience', 'education', 'skills'];
        const foundSections = standardSections.filter(section =>
            text.toLowerCase().includes(section)
        );
        score += (foundSections.length / standardSections.length) * 9;

        return Math.min(score, maxScore);
    }

    /**
     * تقييم المهارات
     */
    scoreSkills(cvData) {
        let score = 0;
        const maxScore = this.criteria.skills.weight;

        const skills = this.extractSkills(cvData);

        // 1. عدد المهارات (7 نقاط)
        score += Math.min((skills.length / 10) * 7, 7);

        // 2. تنوع المهارات (4 نقاط)
        const categories = this.categorizeSkills(skills);
        score += Math.min((categories.length / 3) * 4, 4);

        // 3. مهارات تقنية (4 نقاط)
        const technicalSkills = skills.filter(s => this.isTechnicalSkill(s));
        score += Math.min((technicalSkills.length / 5) * 4, 4);

        return Math.min(score, maxScore);
    }

    /**
     * تحليل المهارات
     */
    analyzeSkills(cvData) {
        const skills = this.extractSkills(cvData);

        return {
            total: skills.length,
            technical: skills.filter(s => this.isTechnicalSkill(s)),
            soft: skills.filter(s => !this.isTechnicalSkill(s)),
            categories: this.categorizeSkills(skills)
        };
    }

    /**
     * تقييم الإنجازات
     */
    scoreAchievements(cvData) {
        let score = 0;
        const maxScore = this.criteria.achievements.weight;

        const text = this.extractText(cvData);

        // 1. وجود أرقام/نتائج (7 نقاط)
        const hasNumbers = /\d+/.test(text);
        if (hasNumbers) {
            score += 7;
        }

        // 2. استخدام كلمات إنجاز (5 نقاط)
        const achievementWords = ['حقق', 'أنجز', 'نجح', 'تفوق', 'تميز'];
        const achievementCount = achievementWords.filter(word =>
            text.includes(word)
        ).length;
        score += Math.min(achievementCount * 2, 5);

        // 3. تأثير واضح (3 نقاط)
        const impactWords = ['تحسين', 'زيادة', 'تطوير', 'تعزيز'];
        const impactCount = impactWords.filter(word =>
            text.includes(word)
        ).length;
        score += Math.min(impactCount, 3);

        return Math.min(score, maxScore);
    }

    /**
     * تحليل الإنجازات
     */
    analyzeAchievements(cvData) {
        const text = this.extractText(cvData);

        return {
            hasQuantifiableResults: /\d+/.test(text),
            achievementIndicators: this.findAchievementIndicators(text),
            impactStatements: this.findImpactStatements(text)
        };
    }

    /**
     * تحديد المستوى
     */
    determineLevel(score) {
        for (const [key, level] of Object.entries(this.levels)) {
            if (score >= level.min && score <= level.max) {
                return {
                    key,
                    ...level,
                    score
                };
            }
        }
        return this.levels.needsWork;
    }

    /**
     * تحديد نقاط القوة والضعف
     */
    identifyStrengthsWeaknesses(score) {
        Object.entries(score.breakdown).forEach(([key, value]) => {
            const criterion = this.criteria[key];
            const percentage = (value / criterion.weight) * 100;

            if (percentage >= 80) {
                score.strengths.push({
                    area: criterion.name,
                    score: value,
                    maxScore: criterion.weight,
                    percentage: Math.round(percentage)
                });
            } else if (percentage < 60) {
                score.weaknesses.push({
                    area: criterion.name,
                    score: value,
                    maxScore: criterion.weight,
                    percentage: Math.round(percentage)
                });
            }
        });
    }

    /**
     * توليد اقتراحات
     */
    generateSuggestions(score) {
        const suggestions = [];

        // اقتراحات بناءً على نقاط الضعف
        score.weaknesses.forEach(weakness => {
            switch (weakness.area) {
                case 'الصياغة':
                    suggestions.push({
                        priority: 'high',
                        area: weakness.area,
                        text: 'استخدم أفعالاً قوية في بداية كل جملة (قاد، طور، حقق)'
                    });
                    break;
                case 'الوضوح':
                    suggestions.push({
                        priority: 'high',
                        area: weakness.area,
                        text: 'نظّم السيرة الذاتية بأقسام واضحة ومتسقة'
                    });
                    break;
                case 'التوافق مع ATS':
                    suggestions.push({
                        priority: 'critical',
                        area: weakness.area,
                        text: 'أضف المزيد من الكلمات المفتاحية المتعلقة بمجالك'
                    });
                    break;
                case 'المهارات':
                    suggestions.push({
                        priority: 'medium',
                        area: weakness.area,
                        text: 'أضف مهارات تقنية وناعمة متنوعة'
                    });
                    break;
                case 'الإنجازات':
                    suggestions.push({
                        priority: 'high',
                        area: weakness.area,
                        text: 'حوّل المهام إلى إنجازات مع ذكر النتائج'
                    });
                    break;
            }
        });

        return suggestions;
    }

    // ===== Helper Methods =====

    extractText(cvData) {
        if (typeof cvData === 'string') {
            return cvData;
        }
        // استخراج النص من كائن CV
        return JSON.stringify(cvData);
    }

    calculateVocabularyDiversity(text) {
        const words = text.split(/\s+/);
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        return (uniqueWords.size / words.length) * 100;
    }

    identifySections(cvData) {
        const text = this.extractText(cvData).toLowerCase();
        const sections = [];
        const sectionKeywords = [
            'personal', 'experience', 'education', 'skills',
            'languages', 'summary', 'objective'
        ];

        sectionKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                sections.push(keyword);
            }
        });

        return sections;
    }

    hasConsistentFormatting(cvData) {
        // تحقق بسيط - يمكن تحسينه
        return true;
    }

    hasContactInfo(cvData) {
        const text = this.extractText(cvData);
        return /\d{10}|@|email/i.test(text);
    }

    hasClearDates(cvData) {
        const text = this.extractText(cvData);
        return /\d{4}|20\d{2}/i.test(text);
    }

    hasComplexFormatting(cvData) {
        // تحقق من التنسيقات المعقدة
        return false;
    }

    extractKeywords(text) {
        // استخراج كلمات مفتاحية بسيط
        const words = text.split(/\s+/);
        return words.filter(w => w.length > 4);
    }

    extractSkills(cvData) {
        // استخراج المهارات - يمكن تحسينه
        return [];
    }

    categorizeSkills(skills) {
        return ['technical', 'soft', 'language'];
    }

    isTechnicalSkill(skill) {
        const technicalKeywords = ['software', 'programming', 'analysis', 'data'];
        return technicalKeywords.some(kw => skill.toLowerCase().includes(kw));
    }

    findAchievementIndicators(text) {
        const indicators = ['حقق', 'أنجز', 'نجح', 'تفوق'];
        return indicators.filter(ind => text.includes(ind));
    }

    findImpactStatements(text) {
        const impacts = ['تحسين', 'زيادة', 'تطوير'];
        return impacts.filter(imp => text.includes(imp));
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const cvStrengthScorer = new CVStrengthScorer();

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = cvStrengthScorer;
}
