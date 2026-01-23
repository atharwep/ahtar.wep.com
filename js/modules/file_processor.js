/**
 * 📄 File Processor - معالج الملفات (PDF/DOCX)
 * 
 * المسؤوليات:
 * 1. رفع ومعالجة ملفات PDF و DOCX
 * 2. استخراج النص من الملفات
 * 3. اكتشاف اللغة
 * 4. تنظيف وتعقيم النص
 * 5. عدم التخزين إلا بموافقة المستخدم
 * 
 * الأمان:
 * - التحقق من نوع الملف
 * - التحقق من حجم الملف
 * - تعقيم المحتوى
 * - عدم التخزين التلقائي
 */

class FileProcessor {
    constructor() {
        // الأنواع المسموحة
        this.allowedTypes = {
            'application/pdf': 'PDF',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
            'application/msword': 'DOC',
            'text/plain': 'TXT'
        };

        // الحد الأقصى لحجم الملف (10 MB)
        this.maxFileSize = 10 * 1024 * 1024;

        // مكتبات معالجة الملفات
        this.pdfLib = null;
        this.mammothLib = null;

        // تحميل المكتبات
        this.loadLibraries();
    }

    /**
     * تحميل المكتبات المطلوبة
     */
    async loadLibraries() {
        try {
            // تحميل PDF.js (إذا لم يكن محملاً)
            if (typeof pdfjsLib === 'undefined' && !this.pdfLib) {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
                this.pdfLib = window.pdfjsLib;
                if (this.pdfLib) {
                    this.pdfLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
            }

            // تحميل Mammoth.js للـ DOCX (إذا لم يكن محملاً)
            if (typeof mammoth === 'undefined' && !this.mammothLib) {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
                this.mammothLib = window.mammoth;
            }
        } catch (error) {
            console.warn('Failed to load file processing libraries:', error);
        }
    }

    /**
     * تحميل سكريبت خارجي
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * معالجة ملف
     */
    async processFile(file, options = {}) {
        const {
            extractText = true,
            detectLanguage = true,
            cleanText = true,
            storeFile = false
        } = options;

        try {
            // 1. التحقق من الملف
            this.validateFile(file);

            // 2. استخراج النص
            let text = '';
            if (extractText) {
                text = await this.extractText(file);
            }

            // 3. تنظيف النص
            if (cleanText && text) {
                text = this.cleanText(text);
            }

            // 4. اكتشاف اللغة
            let language = null;
            if (detectLanguage && text) {
                language = this.detectLanguage(text);
            }

            // 5. التخزين (فقط إذا طلب المستخدم)
            let stored = false;
            if (storeFile) {
                stored = await this.storeFile(file, text);
            }

            return {
                success: true,
                fileName: file.name,
                fileType: this.allowedTypes[file.type],
                fileSize: file.size,
                text,
                language,
                wordCount: text ? text.split(/\s+/).length : 0,
                charCount: text ? text.length : 0,
                stored
            };
        } catch (error) {
            console.error('File processing failed:', error);
            throw error;
        }
    }

    /**
     * التحقق من صحة الملف
     */
    validateFile(file) {
        // التحقق من وجود الملف
        if (!file) {
            throw new Error('لم يتم اختيار ملف');
        }

        // التحقق من نوع الملف
        if (!this.allowedTypes[file.type]) {
            throw new Error(`نوع الملف غير مدعوم. الأنواع المسموحة: ${Object.values(this.allowedTypes).join(', ')}`);
        }

        // التحقق من حجم الملف
        if (file.size > this.maxFileSize) {
            const maxSizeMB = this.maxFileSize / (1024 * 1024);
            throw new Error(`حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت`);
        }

        // التحقق من اسم الملف
        if (!file.name || file.name.length === 0) {
            throw new Error('اسم الملف غير صالح');
        }

        return true;
    }

    /**
     * استخراج النص من الملف
     */
    async extractText(file) {
        const fileType = file.type;

        if (fileType === 'application/pdf') {
            return await this.extractFromPDF(file);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return await this.extractFromDOCX(file);
        } else if (fileType === 'text/plain') {
            return await this.extractFromTXT(file);
        } else {
            throw new Error('نوع الملف غير مدعوم للاستخراج');
        }
    }

    /**
     * استخراج النص من PDF
     */
    async extractFromPDF(file) {
        try {
            // التأكد من تحميل المكتبة
            if (!this.pdfLib && typeof pdfjsLib !== 'undefined') {
                this.pdfLib = pdfjsLib;
                this.pdfLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }

            if (!this.pdfLib) {
                throw new Error('PDF library not loaded');
            }

            // قراءة الملف
            const arrayBuffer = await file.arrayBuffer();

            // تحميل PDF
            const pdf = await this.pdfLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';

            // استخراج النص من كل صفحة
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            return fullText.trim();
        } catch (error) {
            console.error('PDF extraction failed:', error);
            throw new Error('فشل استخراج النص من ملف PDF');
        }
    }

    /**
     * استخراج النص من DOCX
     */
    async extractFromDOCX(file) {
        try {
            // التأكد من تحميل المكتبة
            if (!this.mammothLib && typeof mammoth !== 'undefined') {
                this.mammothLib = mammoth;
            }

            if (!this.mammothLib) {
                throw new Error('DOCX library not loaded');
            }

            // قراءة الملف
            const arrayBuffer = await file.arrayBuffer();

            // استخراج النص
            const result = await this.mammothLib.extractRawText({ arrayBuffer });

            return result.value.trim();
        } catch (error) {
            console.error('DOCX extraction failed:', error);
            throw new Error('فشل استخراج النص من ملف DOCX');
        }
    }

    /**
     * استخراج النص من TXT
     */
    async extractFromTXT(file) {
        try {
            const text = await file.text();
            return text.trim();
        } catch (error) {
            console.error('TXT extraction failed:', error);
            throw new Error('فشل قراءة ملف النص');
        }
    }

    /**
     * تنظيف النص
     */
    cleanText(text) {
        if (!text) return '';

        return text
            // إزالة الأسطر الفارغة المتعددة
            .replace(/\n{3,}/g, '\n\n')
            // إزالة المسافات المتعددة
            .replace(/[ \t]{2,}/g, ' ')
            // إزالة المسافات في بداية ونهاية الأسطر
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            // إزالة الأحرف الخاصة غير المرغوبة
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .trim();
    }

    /**
     * اكتشاف اللغة
     */
    detectLanguage(text) {
        if (!text) return null;

        // عد الأحرف العربية
        const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
        // عد الأحرف الإنجليزية
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

        const total = arabicChars + englishChars;
        if (total === 0) return 'unknown';

        const arabicRatio = arabicChars / total;
        const englishRatio = englishChars / total;

        if (arabicRatio > 0.6) {
            return 'ar';
        } else if (englishRatio > 0.6) {
            return 'en';
        } else if (arabicRatio > 0.3 && englishRatio > 0.3) {
            return 'mixed';
        } else {
            return 'unknown';
        }
    }

    /**
     * تخزين الملف (فقط إذا طلب المستخدم)
     */
    async storeFile(file, text) {
        try {
            // التحقق من الموافقة
            const consent = confirm('هل تريد حفظ هذا الملف محلياً؟');
            if (!consent) {
                return false;
            }

            // حفظ في localStorage (مشفر)
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                text,
                timestamp: Date.now()
            };

            // استخدام Security Layer للتشفير
            if (typeof securityLayer !== 'undefined') {
                securityLayer.secureStore(`file_${Date.now()}`, fileData);
            } else {
                localStorage.setItem(`file_${Date.now()}`, JSON.stringify(fileData));
            }

            return true;
        } catch (error) {
            console.error('File storage failed:', error);
            return false;
        }
    }

    /**
     * تحويل ملف إلى Base64
     */
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * الحصول على معلومات الملف
     */
    getFileInfo(file) {
        return {
            name: file.name,
            type: this.allowedTypes[file.type] || 'Unknown',
            size: this.formatFileSize(file.size),
            sizeBytes: file.size,
            lastModified: new Date(file.lastModified).toLocaleDateString('ar')
        };
    }

    /**
     * تنسيق حجم الملف
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * مسح الملفات المخزنة
     */
    clearStoredFiles() {
        const keys = Object.keys(localStorage);
        const fileKeys = keys.filter(key => key.startsWith('file_'));

        fileKeys.forEach(key => localStorage.removeItem(key));

        return fileKeys.length;
    }

    /**
     * الحصول على الملفات المخزنة
     */
    getStoredFiles() {
        const keys = Object.keys(localStorage);
        const fileKeys = keys.filter(key => key.startsWith('file_'));

        return fileKeys.map(key => {
            try {
                const data = localStorage.getItem(key);
                if (typeof securityLayer !== 'undefined') {
                    return securityLayer.secureRetrieve(key);
                } else {
                    return JSON.parse(data);
                }
            } catch {
                return null;
            }
        }).filter(file => file !== null);
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const fileProcessor = new FileProcessor();

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = fileProcessor;
}
