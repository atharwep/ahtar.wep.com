/**
 * 🔐 Security Layer - طبقة الأمان المركزية
 * 
 * المسؤوليات:
 * 1. حماية جميع مفاتيح API
 * 2. منع تسريب المعلومات الحساسة
 * 3. تشفير البيانات الحساسة
 * 4. التحقق من صحة المدخلات
 * 
 * القواعد الإلزامية:
 * - ❌ لا مفاتيح API في Frontend
 * - ❌ لا console.log للبيانات الحساسة
 * - ✅ جميع المفاتيح عبر Environment Variables
 * - ✅ جميع استدعاءات AI عبر Proxy
 */

class SecurityLayer {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1';
        this.sensitiveKeys = ['api_key', 'apiKey', 'token', 'password', 'secret'];

        // منع فتح Developer Tools في الإنتاج (اختياري)
        if (this.isProduction) {
            this.preventDevTools();
        }
    }

    /**
     * تنظيف رسائل الخطأ من المعلومات الحساسة
     */
    sanitizeError(error) {
        if (!error) return 'حدث خطأ غير متوقع';

        const errorMessage = typeof error === 'string' ? error : error.message || '';

        // إزالة أي معلومات حساسة
        let sanitized = errorMessage
            .replace(/api[_-]?key[:\s=]+[\w-]+/gi, '[API_KEY_HIDDEN]')
            .replace(/token[:\s=]+[\w-]+/gi, '[TOKEN_HIDDEN]')
            .replace(/password[:\s=]+[\w-]+/gi, '[PASSWORD_HIDDEN]')
            .replace(/https?:\/\/[^\s]+/gi, '[URL_HIDDEN]');

        // في الإنتاج، إرجاع رسالة عامة
        if (this.isProduction) {
            return 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.';
        }

        return sanitized;
    }

    /**
     * التحقق من وجود بيانات حساسة في الكائن
     */
    hasSensitiveData(obj) {
        if (!obj || typeof obj !== 'object') return false;

        const keys = Object.keys(obj);
        return keys.some(key =>
            this.sensitiveKeys.some(sensitive =>
                key.toLowerCase().includes(sensitive.toLowerCase())
            )
        );
    }

    /**
     * إزالة البيانات الحساسة من الكائن
     */
    removeSensitiveData(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        const cleaned = { ...obj };

        Object.keys(cleaned).forEach(key => {
            if (this.sensitiveKeys.some(sensitive =>
                key.toLowerCase().includes(sensitive.toLowerCase())
            )) {
                cleaned[key] = '[REDACTED]';
            }
        });

        return cleaned;
    }

    /**
     * تشفير بسيط للبيانات (Base64 + XOR)
     * ملاحظة: هذا ليس تشفيراً قوياً، فقط لإخفاء البيانات من العرض المباشر
     */
    encrypt(data, key = 'athar_2026') {
        try {
            const str = typeof data === 'string' ? data : JSON.stringify(data);
            let encrypted = '';

            for (let i = 0; i < str.length; i++) {
                encrypted += String.fromCharCode(
                    str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }

            return btoa(encrypted);
        } catch (e) {
            console.error('Encryption failed');
            return null;
        }
    }

    /**
     * فك تشفير البيانات
     */
    decrypt(encryptedData, key = 'athar_2026') {
        try {
            const encrypted = atob(encryptedData);
            let decrypted = '';

            for (let i = 0; i < encrypted.length; i++) {
                decrypted += String.fromCharCode(
                    encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }

            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        } catch (e) {
            console.error('Decryption failed');
            return null;
        }
    }

    /**
     * تخزين آمن في localStorage
     */
    secureStore(key, value) {
        try {
            const encrypted = this.encrypt(value);
            if (encrypted) {
                localStorage.setItem(key, encrypted);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Secure store failed');
            return false;
        }
    }

    /**
     * استرجاع آمن من localStorage
     */
    secureRetrieve(key) {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;

            return this.decrypt(encrypted);
        } catch (e) {
            console.error('Secure retrieve failed');
            return null;
        }
    }

    /**
     * التحقق من صحة المدخلات (XSS Prevention)
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * التحقق من صحة URL
     */
    isValidURL(url) {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * منع فتح Developer Tools (اختياري)
     */
    preventDevTools() {
        // تعطيل النقر بالزر الأيمن
        document.addEventListener('contextmenu', e => e.preventDefault());

        // تعطيل اختصارات لوحة المفاتيح
        document.addEventListener('keydown', e => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
            if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) {
                e.preventDefault();
                return false;
            }

            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
        });
    }

    /**
     * تسجيل آمن (لا يكشف معلومات حساسة)
     */
    safeLog(message, data = null) {
        if (this.isProduction) {
            // في الإنتاج، لا نسجل أي شيء
            return;
        }

        if (data && this.hasSensitiveData(data)) {
            console.log(message, this.removeSensitiveData(data));
        } else {
            console.log(message, data);
        }
    }

    /**
     * إنشاء CSRF Token
     */
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * التحقق من CSRF Token
     */
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        return storedToken === token;
    }

    /**
     * Rate Limiting بسيط
     */
    rateLimit(key, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        const requests = JSON.parse(sessionStorage.getItem(`rate_${key}`) || '[]');

        // تنظيف الطلبات القديمة
        const validRequests = requests.filter(time => now - time < windowMs);

        if (validRequests.length >= maxRequests) {
            return false; // تجاوز الحد
        }

        validRequests.push(now);
        sessionStorage.setItem(`rate_${key}`, JSON.stringify(validRequests));
        return true;
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const securityLayer = new SecurityLayer();

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = securityLayer;
}
