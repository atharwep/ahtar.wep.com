/**
 * 🔒 API Proxy - بروكسي آمن لجميع استدعاءات AI
 * 
 * المسؤوليات:
 * 1. توجيه جميع طلبات AI عبر Backend آمن
 * 2. إخفاء جميع مفاتيح API
 * 3. معالجة الأخطاء بشكل آمن
 * 4. Rate Limiting
 * 5. Retry Logic
 * 
 * القاعدة الذهبية:
 * ❌ لا استدعاءات AI مباشرة من Frontend
 * ✅ جميع الطلبات عبر هذا Proxy
 */

class APIProxy {
    constructor() {
        // Use Global Config if available, otherwise fallback to hardcoded
        this.bridgeURL = (typeof AtharConfig !== 'undefined') ?
            AtharConfig.getBridgeUrl() :
            "https://script.google.com/macros/s/AKfycbzSdWq5xiGZQZ9-DuaVh57f_3UKLuuYWukgIC3x2vtvt5d2VIyEv4yiJn93-hIrgLL9/exec";

        // تحميل Security Layer
        this.security = typeof securityLayer !== 'undefined' ? securityLayer : null;

        // إعدادات Retry
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 ثانية

        // Cache للطلبات المتكررة
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 دقائق
    }

    /**
     * استدعاء AI بشكل آمن
     * 
     * @param {string} prompt - النص المطلوب معالجته
     * @param {object} options - خيارات إضافية
     * @returns {Promise<object>} - النتيجة من AI
     */
    async callAI(prompt, options = {}) {
        const {
            model = 'gemini-pro',
            temperature = 0.7,
            maxTokens = 2048,
            useCache = true,
            context = null,
            systemPrompt = null
        } = options;

        // التحقق من Rate Limiting
        if (this.security && !this.security.rateLimit('ai_calls', 30, 60000)) {
            throw new Error('تجاوزت الحد المسموح من الطلبات. يرجى الانتظار قليلاً.');
        }

        // التحقق من Cache
        if (useCache) {
            const cacheKey = this.getCacheKey(prompt, options);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // تنظيف المدخلات
        const sanitizedPrompt = this.security ?
            this.security.sanitizeInput(prompt) : prompt;

        // بناء الطلب - استخدام 'ai' كإجراء افتراضي للتوافق مع الإصدار الأخير
        const requestData = {
            action: 'ai',
            prompt: sanitizedPrompt,
            model,
            temperature,
            maxTokens,
            context,
            systemPrompt
        };

        try {
            // إرسال الطلب عبر Bridge
            const response = await this.sendRequest(requestData);

            // حفظ في Cache
            if (useCache && response) {
                const cacheKey = this.getCacheKey(prompt, options);
                this.saveToCache(cacheKey, response);
            }

            return response;
        } catch (error) {
            // معالجة الخطأ بشكل آمن
            const sanitizedError = this.security ?
                this.security.sanitizeError(error) : error.message;

            throw new Error(sanitizedError);
        }
    }

    /**
     * إرسال طلب مع Retry Logic
     */
    async sendRequest(data, retryCount = 0) {
        try {
            const response = await fetch(this.bridgeURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // التحقق من وجود خطأ في الاستجابة
            if (result.error || result.status === 'error') {
                throw new Error(result.error || result.message || 'خطأ غير معروف في السيرفر');
            }

            // إذا كان الرد يحتوي على حقل data مغلف (كما في إجراء 'ai')، نقوم بفك تغليفه
            if (result.status === 'success' && result.data) {
                try {
                    const parsedData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                    return parsedData;
                } catch (e) {
                    console.warn("Failed to parse internal data field, returning raw result.data");
                    return result.data;
                }
            }

            return result;
        } catch (error) {
            // إعادة المحاولة في حالة الفشل
            if (retryCount < this.maxRetries) {
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.sendRequest(data, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * معالجة ملف (PDF/DOCX) بشكل آمن
     */
    async processFile(file, options = {}) {
        const {
            extractText = true,
            detectLanguage = true,
            maxSize = 10 * 1024 * 1024 // 10 MB
        } = options;

        // التحقق من حجم الملف
        if (file.size > maxSize) {
            throw new Error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت.');
        }

        // التحقق من نوع الملف
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('نوع الملف غير مدعوم. يرجى رفع PDF أو DOCX فقط.');
        }

        try {
            // تحويل الملف إلى Base64
            const base64 = await this.fileToBase64(file);

            // إرسال للمعالجة
            const response = await this.sendRequest({
                action: 'process_file',
                file: base64,
                fileName: file.name,
                fileType: file.type,
                extractText,
                detectLanguage
            });

            return response;
        } catch (error) {
            const sanitizedError = this.security ?
                this.security.sanitizeError(error) : error.message;

            throw new Error(sanitizedError);
        }
    }

    /**
     * تحليل ATS
     */
    async analyzeATS(cvText, jobDescription = null) {
        try {
            const response = await this.sendRequest({
                action: 'ats_analysis',
                cvText,
                jobDescription
            });

            return response;
        } catch (error) {
            const sanitizedError = this.security ?
                this.security.sanitizeError(error) : error.message;

            throw new Error(sanitizedError);
        }
    }

    /**
     * توليد وصف وظيفي تلقائي
     */
    async generateJobDescription(jobTitle, organization, context = null) {
        const prompt = `
أنت خبير في كتابة الأوصاف الوظيفية للمنظمات الإنسانية.

المسمى الوظيفي: ${jobTitle}
المنظمة: ${organization}
${context ? `السياق: ${context}` : ''}

المطلوب:
قم بتوليد من 3 إلى 5 مهام ومسؤوليات احترافية لهذا المسمى الوظيفي.

شروط الإخراج:
1. كل مهمة يجب أن تبدأ بفعل مهني (مثل: تنسيق، إدارة، تطوير، تنفيذ)
2. كل مهمة يجب أن تكون واضحة ومحددة
3. كل مهمة يجب أن تكون متوافقة مع معايير ATS
4. لا تستخدم أرقام مختلقة
5. يجب أن تكون المهام مرتبطة بالمسمى الوظيفي والمنظمة

أرجع النتيجة بصيغة JSON:
{
    "responsibilities": ["مهمة 1", "مهمة 2", "مهمة 3"]
}
        `.trim();

        try {
            const response = await this.callAI(prompt, {
                temperature: 0.8,
                useCache: false
            });

            // محاولة استخراج JSON من الاستجابة
            return this.extractJSON(response);
        } catch (error) {
            const sanitizedError = this.security ?
                this.security.sanitizeError(error) : error.message;

            throw new Error(sanitizedError);
        }
    }

    /**
     * استخراج JSON من استجابة AI
     */
    extractJSON(response) {
        try {
            if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
                return response;
            }

            let text = typeof response === 'string' ? response : JSON.stringify(response);
            text = text.trim();

            // Handle cases where the whole response is a string literal starting with "
            if (text.startsWith('"') && text.endsWith('"') && text.includes('{')) {
                try {
                    const unquoted = JSON.parse(text);
                    if (typeof unquoted === 'string') text = unquoted.trim();
                } catch (e) {
                    // If parsing literal fails, just strip the outer quotes manually if they exist
                    text = text.substring(1, text.length - 1).trim();
                }
            }

            // Quick fix for LLM triple quotes
            if (text.startsWith('"""') && text.endsWith('"""')) {
                text = text.substring(3, text.length - 3).trim();
            }

            // 1. Try direct parse
            try {
                const parsed = JSON.parse(text);
                if (typeof parsed === 'object' && parsed !== null) return parsed;
                if (typeof parsed === 'string') return this.extractJSON(parsed); // Recursive for double-stringified
            } catch (e) { }

            // 2. Extract from Markdown
            const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (markdownMatch) {
                let candidate = markdownMatch[1].trim();
                const sub = this.extractJSON(candidate);
                if (sub) return sub;
                text = candidate; // Fall through for further repair
            }

            // 3. Robust Search & Repair
            let start = text.indexOf('{');
            let end = text.lastIndexOf('}');

            if (start !== -1) {
                // If no closing brace, or it's truncated, try to patch it
                if (end === -1 || end < start) {
                    text += '}'.repeat(10); // Extreme fallback
                    end = text.lastIndexOf('}');
                }

                let candidate = text.substring(start, end + 1);

                // --- REPAIR LOGIC ---
                // a. Fix unescaped newlines inside strings
                candidate = candidate.replace(/"([^"]*?)"/g, (match, p1) => {
                    return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
                });

                // b. Remove trailing commas
                candidate = candidate.replace(/,(\s*[\]}])/g, '$1');

                // c. Auto-balance braces (for truncated JSON)
                const balanceBraces = (str) => {
                    let open = 0;
                    for (let char of str) {
                        if (char === '{') open++;
                        if (char === '}') open--;
                    }
                    if (open > 0) str += '}'.repeat(open);
                    return str;
                };
                candidate = balanceBraces(candidate);

                // d. Try parsing repaired JSON
                try {
                    const parsed = JSON.parse(candidate);
                    if (typeof parsed === 'object' && parsed !== null) return parsed;
                } catch (e) {
                    // e. Last resort: Extreme cleaning
                    try {
                        const superCleaned = candidate.replace(/[\x00-\x1F\x7F-\x9F]/g, (c) => {
                            return (c === '\n' || c === '\r' || c === '\t') ? c : '';
                        });
                        const parsed = JSON.parse(superCleaned);
                        if (typeof parsed === 'object' && parsed !== null) return parsed;
                    } catch (e2) { }
                }
            }

            console.error('APIProxy: All extraction methods failed.');
            return null;
        } catch (error) {
            console.error('APIProxy: extractJSON Error:', error);
            return null;
        }
    }

    /**
     * تحويل ملف إلى Base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * إنشاء مفتاح Cache
     */
    getCacheKey(prompt, options) {
        const key = JSON.stringify({ prompt, ...options });
        try {
            // UTF-8 safe base64 encoding
            return btoa(encodeURIComponent(key).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
        } catch (e) {
            // Fallback if encoding fails
            return key.substring(0, 100) + key.length;
        }
    }

    /**
     * حفظ في Cache
     */
    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * استرجاع من Cache
     */
    getFromCache(key) {
        const cached = this.cache.get(key);

        if (!cached) return null;

        // التحقق من انتهاء الصلاحية
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * تأخير (للـ Retry)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * مسح Cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const apiProxy = new APIProxy();
window.apiProxy = apiProxy;

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiProxy;
}
