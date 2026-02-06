/**
 * 🆘 Expert Review Manager
 * Adds a floating button to request expert review via WhatsApp.
 */
class ExpertReviewManager {
    constructor() {
        this.whatsappNumber = "963936020439";
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createButton());
        } else {
            this.createButton();
        }
    }

    createButton() {
        // Avoid duplicate buttons
        if (document.getElementById('expertReviewBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'expertReviewBtn';
        btn.innerHTML = `
            <span style="font-size: 1.2rem; margin-left: 8px;">👨‍🏫</span>
            <span>طلب مراجعة خبير</span>
        `;

        // Styles
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: '9999',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 24px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer',
            fontFamily: "'Cairo', sans-serif",
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            direction: 'rtl'
        });

        // Hover effect
        btn.onmouseover = () => {
            btn.style.transform = 'translateY(-3px)';
            btn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
        };

        btn.onclick = () => this.handleRequest();

        document.body.appendChild(btn);
    }

    async handleRequest() {
        const btn = document.getElementById('expertReviewBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري التحضير...`;

        try {
            const data = await this.collectPageData();
            this.sendToWhatsApp(data);
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء تحضير البيانات. سيتم فتح المحادثة بدون بيانات مفصلة.");
            this.sendToWhatsApp({ title: document.title, url: window.location.href, content: "لم يتم استخراج البيانات بشكل آلي." });
        } finally {
            btn.innerHTML = originalText;
        }
    }

    async collectPageData() {
        const data = {
            title: document.title,
            url: window.location.href,
            content: ""
        };

        let messageBody = "";

        // 1. Try to get specific structured data based on known pages

        let structuredData = null;
        if (typeof state !== 'undefined' && state.jsonData) structuredData = state.jsonData;
        else if (typeof generatedData !== 'undefined' && generatedData) structuredData = generatedData;

        if (structuredData) {
            // If CV is generated
            const info = structuredData.info || structuredData; // Handle different structures
            messageBody += `👤 *الاسم:* ${info.name || structuredData.name || 'غير محدد'}\n`;
            messageBody += `💼 *المسمى:* ${info.title || structuredData.title || 'غير محدد'}\n`;
            messageBody += `📱 *رقم/واتساب:* ${info.phone || info.whatsapp || structuredData.phone || 'غير محدد'}\n`;
            messageBody += `📍 *الموقع:* ${info.location || structuredData.location || 'غير محدد'}\n`;
            messageBody += `📄 *ملخص:* يحتوي على بيانات سيرة ذاتية تم توليدها.\n`;
        }

        // 2. Generic Form Scraper (if no structured data or supplemental)
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
        if (inputs.length > 0) {
            messageBody += `\n📝 *البيانات المدخلة:* \n`;
            let hasData = false;

            inputs.forEach(input => {
                // Skip empty or irrelevant
                if (!input.value || input.value.trim() === "") return;

                // Try to find a label
                let label = "";
                if (input.placeholder) label = input.placeholder;
                else if (input.id) {
                    const labelElem = document.querySelector(`label[for="${input.id}"]`);
                    if (labelElem) label = labelElem.innerText;
                }

                if (!label && input.parentElement) {
                    // Try getting text from parent line
                    label = input.parentElement.innerText.split('\n')[0].substring(0, 20);
                }

                // Clean label
                label = label.replace(/[:*]/g, '').trim();
                const value = input.value.substring(0, 50) + (input.value.length > 50 ? "..." : ""); // Truncate long values

                if (label && value) {
                    messageBody += `- ${label}: ${value}\n`;
                    hasData = true;
                }
            });

            if (!hasData) messageBody += "(لا توجد مدخلات نشطة)\n";
        }

        data.content = messageBody;
        return data;
    }

    sendToWhatsApp(data) {
        const header = `👋 *طلب مراجعة خبير (منصة أثر)*\n\n`;
        const pageInfo = `📄 *الصفحة:* ${data.title}\n🔗 *الرابط:* ${data.url}\n\n`;
        const body = `📊 *تفاصيل البيانات:*\n${data.content}`;
        const footer = `\n\n🕒 *الوقت:* ${new Date().toLocaleString('ar-EG')}`;

        const fullMessage = header + pageInfo + body + footer;

        // Encode properly
        const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(fullMessage)}`;

        window.open(url, '_blank');
    }
}

// Auto-initialize
new ExpertReviewManager();
