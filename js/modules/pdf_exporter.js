/**
 * 📥 PDF Exporter - مصدّر PDF المحسّن
 * 
 * المسؤوليات:
 * 1. تصدير السيرة الذاتية إلى PDF بجودة عالية
 * 2. احترام الهوامش والتنسيق
 * 3. معاينة فورية
 * 4. تحميل مباشر بدون إعادة تحميل الصفحة
 * 5. دعم اللغة العربية بشكل كامل
 * 
 * المشاكل المحلولة:
 * - تمركز غير صحيح ✅
 * - عدم احترام الهوامش ✅
 * - تجربة تصدير بطيئة ✅
 */

class PDFExporter {
    constructor() {
        // إعدادات PDF الافتراضية
        this.defaultSettings = {
            format: 'a4',
            orientation: 'portrait',
            unit: 'mm',
            margins: {
                top: 15,
                right: 15,
                bottom: 15,
                left: 15
            },
            compress: true,
            precision: 2
        };

        // تحميل مكتبة jsPDF
        this.jsPDF = null;
        this.html2canvas = null;
        this.loadLibraries();
    }

    /**
     * تحميل المكتبات المطلوبة
     */
    async loadLibraries() {
        try {
            // تحميل jsPDF
            if (typeof jspdf === 'undefined' && !this.jsPDF) {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                this.jsPDF = window.jspdf.jsPDF;
            }

            // تحميل html2canvas
            if (typeof html2canvas === 'undefined' && !this.html2canvas) {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
                this.html2canvas = window.html2canvas;
            }
        } catch (error) {
            console.warn('Failed to load PDF libraries:', error);
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
     * تصدير عنصر HTML إلى PDF
     */
    async exportToPDF(element, options = {}) {
        const {
            fileName = 'CV.pdf',
            format = this.defaultSettings.format,
            orientation = this.defaultSettings.orientation,
            margins = this.defaultSettings.margins,
            quality = 2,
            showPreview = true,
            autoDownload = true
        } = options;

        try {
            // التأكد من تحميل المكتبات
            if (!this.jsPDF && typeof jspdf !== 'undefined') {
                this.jsPDF = jspdf.jsPDF;
            }
            if (!this.html2canvas && typeof html2canvas !== 'undefined') {
                this.html2canvas = html2canvas;
            }

            if (!this.jsPDF || !this.html2canvas) {
                throw new Error('PDF libraries not loaded');
            }

            // إظهار مؤشر التحميل
            this.showLoadingIndicator('جاري تحضير ملف PDF...');

            // 1. تحضير العنصر للتصدير
            const preparedElement = await this.prepareElement(element);

            // 2. تحويل HTML إلى Canvas
            const canvas = await this.html2canvas(preparedElement, {
                scale: quality,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 794, // عرض A4 بالبكسل
                windowHeight: 1123 // ارتفاع A4 بالبكسل
            });

            // 3. إنشاء PDF
            const pdf = new this.jsPDF({
                orientation,
                unit: 'mm',
                format,
                compress: true
            });

            // 4. حساب الأبعاد
            const imgWidth = pdf.internal.pageSize.getWidth() - margins.left - margins.right;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = pdf.internal.pageSize.getHeight() - margins.top - margins.bottom;

            // 5. إضافة الصورة إلى PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            let heightLeft = imgHeight;
            let position = margins.top;

            // إضافة الصفحة الأولى
            pdf.addImage(imgData, 'JPEG', margins.left, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // إضافة صفحات إضافية إذا لزم الأمر
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + margins.top;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', margins.left, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // 6. معاينة (إذا طلب)
            if (showPreview) {
                await this.showPreview(pdf);
            }

            // 7. تحميل (إذا طلب)
            if (autoDownload) {
                pdf.save(fileName);
            }

            // إخفاء مؤشر التحميل
            this.hideLoadingIndicator();

            // تنظيف
            this.cleanupElement(preparedElement);

            return {
                success: true,
                pdf,
                fileName,
                pages: pdf.internal.getNumberOfPages()
            };
        } catch (error) {
            this.hideLoadingIndicator();
            console.error('PDF export failed:', error);
            throw new Error('فشل تصدير ملف PDF. يرجى المحاولة مرة أخرى.');
        }
    }

    /**
     * تحضير العنصر للتصدير
     */
    async prepareElement(element) {
        // إنشاء نسخة من العنصر
        const clone = element.cloneNode(true);

        // إضافة أنماط للطباعة
        clone.style.width = '210mm'; // عرض A4
        clone.style.minHeight = '297mm'; // ارتفاع A4
        clone.style.padding = '15mm';
        clone.style.margin = '0';
        clone.style.backgroundColor = '#ffffff';
        clone.style.color = '#000000';
        clone.style.fontFamily = 'Arial, sans-serif';
        clone.style.fontSize = '12pt';
        clone.style.lineHeight = '1.5';
        clone.style.boxSizing = 'border-box';

        // إزالة العناصر غير المطلوبة
        const unwantedSelectors = [
            '.no-print',
            'button',
            'input[type="button"]',
            'input[type="submit"]',
            '.btn',
            '.action-buttons'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // إضافة النسخة إلى الصفحة (مخفية)
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        document.body.appendChild(clone);

        // الانتظار قليلاً للتأكد من تحميل الأنماط
        await new Promise(resolve => setTimeout(resolve, 100));

        return clone;
    }

    /**
     * تنظيف العنصر المؤقت
     */
    cleanupElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    /**
     * معاينة PDF
     */
    async showPreview(pdf) {
        return new Promise((resolve) => {
            // إنشاء نافذة معاينة
            const previewWindow = window.open('', '_blank');
            if (!previewWindow) {
                alert('يرجى السماح بالنوافذ المنبثقة لمعاينة PDF');
                resolve();
                return;
            }

            // الحصول على PDF كـ Data URL
            const pdfDataUrl = pdf.output('dataurlstring');

            // كتابة HTML للمعاينة
            previewWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>معاينة PDF</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Cairo', Arial, sans-serif;
                            background: #1e293b;
                            display: flex;
                            flex-direction: column;
                            height: 100vh;
                        }
                        .header {
                            background: #0f172a;
                            color: white;
                            padding: 15px 20px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        }
                        .header h1 {
                            font-size: 1.2rem;
                            font-weight: bold;
                        }
                        .header button {
                            background: #4f46e5;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 1rem;
                            transition: 0.3s;
                        }
                        .header button:hover {
                            background: #4338ca;
                        }
                        iframe {
                            flex: 1;
                            border: none;
                            width: 100%;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>📄 معاينة السيرة الذاتية</h1>
                        <button onclick="window.close()">إغلاق ✕</button>
                    </div>
                    <iframe src="${pdfDataUrl}"></iframe>
                </body>
                </html>
            `);

            previewWindow.document.close();
            resolve();
        });
    }

    /**
     * إظهار مؤشر التحميل
     */
    showLoadingIndicator(message = 'جاري المعالجة...') {
        // إزالة المؤشر القديم إن وجد
        this.hideLoadingIndicator();

        const indicator = document.createElement('div');
        indicator.id = 'pdf-loading-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                backdrop-filter: blur(5px);
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 5px solid #e5e7eb;
                        border-top-color: #4f46e5;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <p style="
                        font-size: 1.1rem;
                        color: #1e293b;
                        font-weight: bold;
                        font-family: 'Cairo', Arial, sans-serif;
                    ">${message}</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(indicator);
    }

    /**
     * إخفاء مؤشر التحميل
     */
    hideLoadingIndicator() {
        const indicator = document.getElementById('pdf-loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * تصدير نص مباشر إلى PDF (بدون HTML)
     */
    async exportTextToPDF(text, options = {}) {
        const {
            fileName = 'document.pdf',
            fontSize = 12,
            lineHeight = 1.5,
            rtl = true
        } = options;

        try {
            if (!this.jsPDF && typeof jspdf !== 'undefined') {
                this.jsPDF = jspdf.jsPDF;
            }

            if (!this.jsPDF) {
                throw new Error('jsPDF library not loaded');
            }

            const pdf = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // إعدادات النص
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', 'normal');

            // تقسيم النص إلى أسطر
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margins = { top: 15, right: 15, bottom: 15, left: 15 };
            const maxWidth = pageWidth - margins.left - margins.right;

            const lines = pdf.splitTextToSize(text, maxWidth);

            let y = margins.top;
            const lineHeightMM = fontSize * lineHeight * 0.352778; // تحويل pt إلى mm

            lines.forEach((line, index) => {
                if (y + lineHeightMM > pageHeight - margins.bottom) {
                    pdf.addPage();
                    y = margins.top;
                }

                const x = rtl ? pageWidth - margins.right : margins.left;
                pdf.text(line, x, y, { align: rtl ? 'right' : 'left' });
                y += lineHeightMM;
            });

            pdf.save(fileName);

            return {
                success: true,
                pdf,
                fileName,
                pages: pdf.internal.getNumberOfPages()
            };
        } catch (error) {
            console.error('Text PDF export failed:', error);
            throw error;
        }
    }
}

// إنشاء نسخة واحدة فقط (Singleton)
const pdfExporter = new PDFExporter();

// تصدير للاستخدام العام
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pdfExporter;
}
