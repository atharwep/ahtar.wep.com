/**
 * 🏆 Achievement Generator - مولد الإنجازات الذكي
 * 
 * المسؤوليات:
 * 1. تحويل المهام إلى إنجازات احترافية
 * 2. صياغة قوية ومؤثرة
 * 3. بدون أرقام مختلقة
 * 4. متوافق مع ATS
 * 
 * القاعدة الذهبية:
 * ❌ لا أرقام وهمية أو نسب مئوية غير مؤكدة
 * ✅ إنجازات نوعية قوية ومؤثرة
 */

class AchievementGenerator {
    constructor() {
        // قوالب الإنجازات حسب المجال
        this.achievementTemplates = {
            management: [
                'قيادة {team} في تحقيق {goal} من خلال {method}',
                'إدارة {project} بنجاح مع ضمان {outcome}',
                'تطوير وتنفيذ {initiative} التي أدت إلى {result}',
                'توجيه {team} لتحقيق {milestone} في {context}'
            ],
            technical: [
                'تنفيذ {project} وفقاً لـ {standards} مع تحقيق {outcome}',
                'تصميم وتطبيق {solution} لمعالجة {challenge}',
                'إجراء {analysis} شامل أدى إلى {improvement}',
                'تطوير {system} لتحسين {process}'
            ],
            coordination: [
                'تنسيق {activity} بين {stakeholders} لضمان {outcome}',
                'تسهيل {process} من خلال {method} مما أدى إلى {result}',
                'ربط {parties} لتحقيق {goal} المشترك',
                'تنظيم {event} بمشاركة {participants} وتحقيق {success}'
            ],
            impact: [
                'المساهمة في {outcome} من خلال {action}',
                'تحقيق {result} عبر {method} المبتكر',
                'إحداث {change} إيجابي في {area} من خلال {initiative}',
                'تعزيز {aspect} عبر {approach} الاستراتيجي'
            ]
        };

        // كلمات قوية للإنجازات
        this.powerWords = {
            verbs: [
                'قيادة', 'تطوير', 'تحسين', 'تعزيز', 'تحقيق', 'إنجاز',
                'تنفيذ', 'تصميم', 'إنشاء', 'بناء', 'تأسيس', 'إطلاق',
                'تحويل', 'تجديد', 'تحديث', 'تطبيق', 'إدارة', 'توجيه'
            ],
            outcomes: [
                'نتائج ملموسة', 'تأثير إيجابي', 'تحسين ملحوظ', 'نجاح باهر',
                'تقدم كبير', 'إنجاز متميز', 'أداء استثنائي', 'جودة عالية'
            ],
            methods: [
                'منهجية احترافية', 'نهج استراتيجي', 'أسلوب مبتكر', 'طريقة فعالة',
                'آلية متطورة', 'عملية منظمة', 'خطة شاملة', 'استراتيجية متكاملة'
            ]
        };

        // معايير الجودة
        this.qualityStandards = [
            'معايير Sphere',
            'معايير الجودة الدولية',
            'أفضل الممارسات',
            'المعايير المهنية',
            'البروتوكولات المعتمدة',
            'الإجراءات القياسية'
        ];
    }

    /**
     * تحويل مهمة إلى إنجاز
     */
    async transformToAchievement(task, options = {}) {
        const {
            sector = 'general',
            includeContext = true,
            useAI = true,
            style = 'professional'
        } = options;

        try {
            // محاولة التحويل باستخدام AI أولاً
            if (useAI && typeof apiProxy !== 'undefined') {
                return await this.transformWithAI(task, sector, style);
            }

            // Fallback: التحويل باستخدام القوالب
            return this.transformWithTemplates(task, sector);
        } catch (error) {
            console.error('Achievement transformation failed:', error);
            // Fallback النهائي
            return this.basicTransform(task);
        }
    }

    /**
     * تحويل باستخدام AI
     */
    async transformWithAI(task, sector, style) {
        const prompt = `
أنت خبير في كتابة الإنجازات المهنية للسير الذاتية.

المهمة: ${task}
القطاع: ${sector}
الأسلوب: ${style}

المطلوب:
حوّل هذه المهمة إلى إنجاز احترافي مؤثر.

شروط الإخراج الإلزامية:
1. ✅ ابدأ بفعل قوي (قيادة، تطوير، تحقيق، إنجاز، تنفيذ)
2. ✅ اذكر النتيجة أو التأثير
3. ✅ استخدم صياغة احترافية قوية
4. ❌ لا تستخدم أرقام مختلقة أو نسب مئوية غير مؤكدة
5. ❌ لا تستخدم عبارات عامة أو مبهمة
6. ✅ اجعل الإنجاز محدداً وملموساً
7. ✅ متوافق مع معايير ATS

أرجع الإنجاز فقط بدون أي نص إضافي.
        `.trim();

        try {
            const response = await apiProxy.callAI(prompt, {
                temperature: 0.8,
                maxTokens: 256,
                useCache: false
            });

            // استخراج النص من الاستجابة
            const achievement = typeof response === 'string' ? response :
                response.text || response.achievement || '';

            // التحقق من الجودة
            if (this.validateAchievement(achievement)) {
                return {
                    success: true,
                    achievement: achievement.trim(),
                    source: 'ai',
                    quality: this.assessQuality(achievement)
                };
            } else {
                throw new Error('AI output did not meet quality standards');
            }
        } catch (error) {
            console.error('AI transformation failed:', error);
            throw error;
        }
    }

    /**
     * تحويل باستخدام القوالب
     */
    transformWithTemplates(task, sector) {
        // تحليل المهمة
        const analysis = this.analyzeTask(task);

        // اختيار القالب المناسب
        const category = this.determineCategory(analysis);
        const templates = this.achievementTemplates[category] ||
            this.achievementTemplates.impact;

        // اختيار قالب عشوائي
        const template = templates[Math.floor(Math.random() * templates.length)];

        // ملء القالب
        const achievement = this.fillTemplate(template, analysis, sector);

        return {
            success: true,
            achievement,
            source: 'template',
            quality: this.assessQuality(achievement)
        };
    }

    /**
     * تحليل المهمة
     */
    analyzeTask(task) {
        const analysis = {
            hasAction: false,
            hasOutcome: false,
            hasContext: false,
            keywords: [],
            type: 'general'
        };

        const taskLower = task.toLowerCase();

        // البحث عن أفعال
        const hasVerb = this.powerWords.verbs.some(verb =>
            taskLower.includes(verb.toLowerCase())
        );
        analysis.hasAction = hasVerb;

        // البحث عن نتائج
        const hasOutcome = this.powerWords.outcomes.some(outcome =>
            taskLower.includes(outcome.toLowerCase())
        );
        analysis.hasOutcome = hasOutcome;

        // تحديد النوع
        if (taskLower.includes('إدارة') || taskLower.includes('قيادة')) {
            analysis.type = 'management';
        } else if (taskLower.includes('تنسيق') || taskLower.includes('تنظيم')) {
            analysis.type = 'coordination';
        } else if (taskLower.includes('تنفيذ') || taskLower.includes('تطوير')) {
            analysis.type = 'technical';
        }

        return analysis;
    }

    /**
     * تحديد الفئة
     */
    determineCategory(analysis) {
        return analysis.type || 'impact';
    }

    /**
     * ملء القالب
     */
    fillTemplate(template, analysis, sector) {
        let filled = template;

        // استبدال المتغيرات
        const replacements = {
            '{team}': 'فريق متعدد التخصصات',
            '{goal}': 'الأهداف المحددة',
            '{method}': 'منهجية احترافية',
            '{project}': `مشروع ${sector}`,
            '{outcome}': 'تحقيق نتائج ملموسة',
            '{initiative}': 'مبادرة استراتيجية',
            '{result}': 'تحسين ملحوظ في الأداء',
            '{milestone}': 'إنجازات رئيسية',
            '{context}': 'بيئة عمل تحديّة',
            '{standards}': 'المعايير الدولية',
            '{solution}': 'حل مبتكر',
            '{challenge}': 'التحديات الميدانية',
            '{improvement}': 'تحسينات جوهرية',
            '{system}': 'نظام متكامل',
            '{process}': 'العمليات التشغيلية',
            '{activity}': 'الأنشطة الميدانية',
            '{stakeholders}': 'الشركاء المعنيين',
            '{parties}': 'الأطراف ذات الصلة',
            '{event}': 'فعالية مهنية',
            '{participants}': 'المشاركين',
            '{success}': 'نجاح باهر',
            '{action}': 'إجراءات فعالة',
            '{change}': 'تغيير إيجابي',
            '{area}': 'المجال المستهدف',
            '{aspect}': 'الجوانب الرئيسية',
            '{approach}': 'نهج'
        };

        Object.keys(replacements).forEach(key => {
            filled = filled.replace(key, replacements[key]);
        });

        return filled;
    }

    /**
     * تحويل أساسي (Fallback)
     */
    basicTransform(task) {
        // إضافة فعل قوي في البداية إذا لم يكن موجوداً
        const startsWithVerb = this.powerWords.verbs.some(verb =>
            task.trim().startsWith(verb)
        );

        let achievement = task;

        if (!startsWithVerb) {
            const randomVerb = this.powerWords.verbs[
                Math.floor(Math.random() * this.powerWords.verbs.length)
            ];
            achievement = `${randomVerb} ${task}`;
        }

        // إضافة سياق احترافي
        if (!achievement.includes('وفقاً') && !achievement.includes('من خلال')) {
            achievement += ' وفقاً لأفضل الممارسات المهنية';
        }

        return {
            success: true,
            achievement,
            source: 'basic',
            quality: this.assessQuality(achievement)
        };
    }

    /**
     * التحقق من صحة الإنجاز
     */
    validateAchievement(achievement) {
        if (!achievement || achievement.length < 20) {
            return false;
        }

        // التحقق من عدم وجود أرقام مختلقة
        if (/\d+%/.test(achievement)) {
            return false;
        }

        // التحقق من البداية بفعل
        const startsWithVerb = this.powerWords.verbs.some(verb =>
            achievement.trim().startsWith(verb)
        );

        return startsWithVerb;
    }

    /**
     * تقييم الجودة
     */
    assessQuality(achievement) {
        let score = 0;

        // البداية بفعل قوي (30 نقطة)
        if (this.powerWords.verbs.some(verb => achievement.startsWith(verb))) {
            score += 30;
        }

        // وجود نتيجة/تأثير (25 نقطة)
        if (this.powerWords.outcomes.some(outcome => achievement.includes(outcome))) {
            score += 25;
        }

        // وجود منهجية (20 نقطة)
        if (this.powerWords.methods.some(method => achievement.includes(method))) {
            score += 20;
        }

        // الطول المناسب (15 نقطة)
        if (achievement.length >= 50 && achievement.length <= 200) {
            score += 15;
        }

        // عدم وجود أرقام مختلقة (10 نقاط)
        if (!/\d+%/.test(achievement)) {
            score += 10;
        }

        return {
            score,
            level: score >= 80 ? 'excellent' :
                score >= 60 ? 'good' :
                    score >= 40 ? 'fair' : 'poor'
        };
    }

    /**
     * تحويل قائمة مهام
     */
    async transformMultiple(tasks, options = {}) {
        const results = [];

        for (const task of tasks) {
            try {
                const result = await this.transformToAchievement(task, options);
                results.push(result);
            } catch (error) {
                console.error(`Failed to transform task: ${task}`, error);
                results.push({
                    success: false,
                    achievement: task,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * اقتراحات تحسين
     */
    suggestImprovements(achievement) {
        const suggestions = [];

        // التحقق من البداية بفعل
        if (!this.powerWords.verbs.some(verb => achievement.startsWith(verb))) {
            suggestions.push({
                type: 'verb',
                priority: 'high',
                message: 'ابدأ بفعل قوي مثل: قيادة، تطوير، تحقيق'
            });
        }

        // التحقق من النتيجة
        if (!this.powerWords.outcomes.some(outcome => achievement.includes(outcome))) {
            suggestions.push({
                type: 'outcome',
                priority: 'high',
                message: 'أضف النتيجة أو التأثير المحقق'
            });
        }

        // التحقق من الطول
        if (achievement.length < 50) {
            suggestions.push({
                type: 'length',
                priority: 'medium',
                message: 'أضف المزيد من التفاصيل لجعل الإنجاز أكثر تأثيراً'
            });
        }

        // التحقق من الأرقام المختلقة
        if (/\d+%/.test(achievement)) {
            suggestions.push({
                type: 'numbers',
                priority: 'critical',
                message: 'تجنب استخدام نسب مئوية غير مؤكدة'
            });
        }

        return suggestions;
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const achievementGenerator = new AchievementGenerator();

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = achievementGenerator;
}
