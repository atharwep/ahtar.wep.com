/**
 * 📝 Job Description Generator - مولد الأوصاف الوظيفية التلقائي
 * 
 * المسؤوليات:
 * 1. توليد مهام ومسؤوليات احترافية تلقائياً
 * 2. بناءً على المسمى الوظيفي واسم المنظمة
 * 3. متوافق مع معايير ATS
 * 4. بدون أرقام مختلقة
 * 
 * شروط الإخراج:
 * - جملة رسمية تبدأ بفعل مهني
 * - واضحة ومحددة
 * - مرتبطة بالمسمى الوظيفي
 * - من 3 إلى 5 عناصر
 */

class JobDescriptionGenerator {
    constructor() {
        // قاعدة بيانات الأفعال المهنية حسب المجال
        this.professionalVerbs = {
            management: [
                'إدارة', 'قيادة', 'توجيه', 'إشراف', 'تنسيق', 'تخطيط',
                'تطوير', 'تنظيم', 'تحسين', 'تعزيز'
            ],
            technical: [
                'تنفيذ', 'تصميم', 'تطبيق', 'تحليل', 'تقييم', 'مراقبة',
                'قياس', 'توثيق', 'إعداد', 'تطوير'
            ],
            coordination: [
                'تنسيق', 'تسهيل', 'ربط', 'تواصل', 'تعاون', 'تشبيك',
                'تنظيم', 'ترتيب', 'جدولة', 'متابعة'
            ],
            support: [
                'دعم', 'مساعدة', 'مساندة', 'تقديم', 'توفير', 'ضمان',
                'تيسير', 'تسهيل', 'تمكين', 'تعزيز'
            ]
        };

        // قوالب المهام حسب المسمى الوظيفي
        this.jobTemplates = {
            // WASH Sector
            'wash officer': {
                category: 'technical',
                responsibilities: [
                    'تنفيذ أنشطة المياه والصرف الصحي والنظافة الصحية وفقاً لمعايير Sphere',
                    'إجراء تقييمات احتياجات WASH في المجتمعات المستهدفة',
                    'مراقبة جودة المياه وضمان سلامتها للاستخدام البشري',
                    'تنسيق مع الشركاء المحليين لتنفيذ حملات التوعية الصحية',
                    'إعداد تقارير فنية دورية عن تقدم الأنشطة والتحديات'
                ]
            },
            'wash coordinator': {
                category: 'management',
                responsibilities: [
                    'قيادة فريق WASH وتوجيه الأنشطة الميدانية',
                    'تطوير خطط عمل WASH بالتنسيق مع الشركاء',
                    'ضمان الامتثال لمعايير الجودة والمساءلة في جميع التدخلات',
                    'تمثيل المنظمة في اجتماعات كتلة WASH',
                    'إدارة ميزانية المشروع ومراقبة الإنفاق'
                ]
            },

            // Protection Sector
            'protection officer': {
                category: 'technical',
                responsibilities: [
                    'تنفيذ أنشطة الحماية وفقاً للمبادئ الإنسانية',
                    'إجراء تقييمات المخاطر والاحتياجات الحمائية',
                    'تقديم الدعم النفسي والاجتماعي للفئات الضعيفة',
                    'توثيق حالات الحماية وإحالتها للجهات المختصة',
                    'تنسيق مع الشركاء لضمان الاستجابة المتكاملة'
                ]
            },

            // MEAL
            'meal officer': {
                category: 'technical',
                responsibilities: [
                    'تصميم وتنفيذ أدوات المراقبة والتقييم للمشاريع',
                    'جمع وتحليل البيانات الكمية والنوعية',
                    'إعداد تقارير MEAL دورية للمانحين والإدارة',
                    'تطوير آليات المساءلة وتلقي الشكاوى',
                    'تقديم التدريب للفرق الميدانية على أدوات MEAL'
                ]
            },

            // Project Management
            'project manager': {
                category: 'management',
                responsibilities: [
                    'إدارة دورة حياة المشروع من التخطيط إلى الإغلاق',
                    'قيادة الفريق متعدد التخصصات وتوزيع المهام',
                    'ضمان تحقيق الأهداف ضمن الميزانية والجدول الزمني',
                    'إعداد تقارير سردية ومالية للمانحين',
                    'إدارة المخاطر وتطوير خطط التخفيف'
                ]
            },

            // Logistics
            'logistics officer': {
                category: 'technical',
                responsibilities: [
                    'إدارة سلسلة التوريد وضمان توفر المواد في الوقت المناسب',
                    'تنسيق عمليات الشراء وفقاً لسياسات المنظمة',
                    'إدارة المخازن وضمان التخزين السليم للمواد',
                    'تتبع حركة البضائع وإعداد تقارير المخزون',
                    'التنسيق مع الموردين والشركاء اللوجستيين'
                ]
            },

            // HR
            'hr officer': {
                category: 'support',
                responsibilities: [
                    'إدارة عمليات التوظيف من الإعلان إلى التعيين',
                    'تطوير وتنفيذ سياسات الموارد البشرية',
                    'إدارة ملفات الموظفين وضمان سرية المعلومات',
                    'تنسيق برامج التدريب والتطوير المهني',
                    'معالجة قضايا الموظفين وضمان بيئة عمل إيجابية'
                ]
            },

            // Finance
            'finance officer': {
                category: 'technical',
                responsibilities: [
                    'إدارة العمليات المالية اليومية وفقاً للمعايير المحاسبية',
                    'إعداد التقارير المالية الشهرية والربع سنوية',
                    'مراقبة الميزانية وتتبع الإنفاق',
                    'ضمان الامتثال لسياسات المانحين المالية',
                    'دعم عمليات التدقيق الداخلي والخارجي'
                ]
            }
        };

        // قاعدة بيانات المنظمات ومجالاتها
        this.organizations = {
            'UNHCR': 'Protection and Shelter',
            'UNICEF': 'Child Protection and Education',
            'WFP': 'Food Security and Nutrition',
            'WHO': 'Health',
            'IOM': 'Migration and Displacement',
            'IRC': 'Multi-sector',
            'NRC': 'Shelter and WASH',
            'Save the Children': 'Child Protection and Education'
        };
    }

    /**
     * توليد وصف وظيفي تلقائي
     */
    async generate(jobTitle, organization, context = null) {
        try {
            // تنظيف المدخلات
            const cleanTitle = jobTitle.toLowerCase().trim();
            const cleanOrg = organization.trim();

            // البحث عن قالب مطابق
            const template = this.findTemplate(cleanTitle);

            if (template) {
                // استخدام القالب الجاهز مع التخصيص
                return this.customizeTemplate(template, cleanTitle, cleanOrg, context);
            } else {
                // توليد ديناميكي باستخدام AI
                return await this.generateWithAI(jobTitle, organization, context);
            }
        } catch (error) {
            console.error('Job description generation failed:', error);
            throw error;
        }
    }

    /**
     * البحث عن قالب مطابق
     */
    findTemplate(jobTitle) {
        // بحث مباشر
        if (this.jobTemplates[jobTitle]) {
            return this.jobTemplates[jobTitle];
        }

        // بحث جزئي
        for (const [key, template] of Object.entries(this.jobTemplates)) {
            if (jobTitle.includes(key) || key.includes(jobTitle)) {
                return template;
            }
        }

        return null;
    }

    /**
     * تخصيص القالب
     */
    customizeTemplate(template, jobTitle, organization, context) {
        let responsibilities = [...template.responsibilities];

        // إضافة سياق المنظمة إذا كان معروفاً
        const orgSector = this.organizations[organization];
        if (orgSector && context) {
            responsibilities = responsibilities.map(resp => {
                // يمكن تخصيص المهام بناءً على المنظمة
                return resp;
            });
        }

        // أخذ 3-5 مهام عشوائية
        const count = Math.min(5, Math.max(3, responsibilities.length));
        const selected = this.shuffleArray(responsibilities).slice(0, count);

        return {
            success: true,
            responsibilities: selected,
            source: 'template',
            category: template.category
        };
    }

    /**
     * توليد باستخدام AI
     */
    async generateWithAI(jobTitle, organization, context) {
        // التحقق من وجود API Proxy
        if (typeof apiProxy === 'undefined') {
            throw new Error('API Proxy not available');
        }

        const prompt = `
أنت خبير في كتابة الأوصاف الوظيفية للمنظمات الإنسانية والتنموية.

المسمى الوظيفي: ${jobTitle}
المنظمة: ${organization}
${context ? `السياق الإضافي: ${context}` : ''}

المطلوب:
قم بتوليد من 3 إلى 5 مهام ومسؤوليات احترافية لهذا المسمى الوظيفي.

شروط الإخراج الإلزامية:
1. كل مهمة يجب أن تبدأ بفعل مهني عربي (مثل: إدارة، تنسيق، تنفيذ، تطوير، مراقبة)
2. كل مهمة يجب أن تكون واضحة ومحددة ومرتبطة بالمسمى الوظيفي
3. كل مهمة يجب أن تكون متوافقة مع معايير ATS
4. ❌ لا تستخدم أرقام مختلقة أو نسب مئوية
5. ❌ لا تستخدم عبارات عامة مثل "القيام بالمهام الموكلة"
6. ✅ استخدم مصطلحات القطاع الإنساني المعروفة

أرجع النتيجة بصيغة JSON فقط بدون أي نص إضافي:
{
    "responsibilities": [
        "المهمة الأولى",
        "المهمة الثانية",
        "المهمة الثالثة"
    ]
}
        `.trim();

        try {
            const response = await apiProxy.callAI(prompt, {
                temperature: 0.8,
                maxTokens: 1024,
                useCache: true
            });

            // استخراج JSON من الاستجابة
            const result = apiProxy.extractJSON(response);

            if (result && result.responsibilities && Array.isArray(result.responsibilities)) {
                return {
                    success: true,
                    responsibilities: result.responsibilities.slice(0, 5),
                    source: 'ai',
                    category: 'generated'
                };
            } else {
                throw new Error('Invalid AI response format');
            }
        } catch (error) {
            console.error('AI generation failed:', error);

            // Fallback: استخدام قالب عام
            return this.generateGenericTemplate(jobTitle);
        }
    }

    /**
     * توليد قالب عام (Fallback)
     */
    generateGenericTemplate(jobTitle) {
        const verbs = this.professionalVerbs.technical;
        const genericTasks = [
            `${verbs[0]} الأنشطة المتعلقة بـ ${jobTitle} وفقاً للمعايير المهنية`,
            `${verbs[1]} خطط عمل تفصيلية لتحقيق أهداف المشروع`,
            `${verbs[2]} مع الفرق الميدانية والشركاء المحليين`,
            `${verbs[3]} تقارير دورية عن التقدم والتحديات`,
            `${verbs[4]} الامتثال للسياسات والإجراءات المعتمدة`
        ];

        return {
            success: true,
            responsibilities: genericTasks.slice(0, 4),
            source: 'fallback',
            category: 'generic'
        };
    }

    /**
     * خلط المصفوفة (Fisher-Yates Shuffle)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * الحصول على الأفعال المهنية حسب الفئة
     */
    getVerbsByCategory(category) {
        return this.professionalVerbs[category] || this.professionalVerbs.technical;
    }

    /**
     * التحقق من جودة الوصف الوظيفي
     */
    validateDescription(responsibilities) {
        const issues = [];

        responsibilities.forEach((resp, index) => {
            // التحقق من البداية بفعل
            const startsWithVerb = Object.values(this.professionalVerbs)
                .flat()
                .some(verb => resp.trim().startsWith(verb));

            if (!startsWithVerb) {
                issues.push(`المهمة ${index + 1} لا تبدأ بفعل مهني`);
            }

            // التحقق من الطول
            if (resp.length < 20) {
                issues.push(`المهمة ${index + 1} قصيرة جداً`);
            }

            // التحقق من الأرقام المختلقة
            if (/\d+%/.test(resp)) {
                issues.push(`المهمة ${index + 1} تحتوي على نسب مئوية (غير مسموح)`);
            }
        });

        return {
            isValid: issues.length === 0,
            issues
        };
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const jobDescriptionGenerator = new JobDescriptionGenerator();

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = jobDescriptionGenerator;
}
