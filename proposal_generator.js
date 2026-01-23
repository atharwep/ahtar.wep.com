document.addEventListener('DOMContentLoaded', () => {
    // State Management (Local to this module)
    let state = {};

    // Helper: Status Logger
    function logStatus(type, msg) {
        const el = document.getElementById('statusLog');
        if (el) {
            el.innerText = msg;
            el.className = `status-${type}`;
        }
        console.log(`[${type}] ${msg}`);
    }

    // الإعدادات الافتراضية
    // الإعدادات الافتراضية
    const DEFAULT_CONFIG = {
        provider: 'groq',
        geminiKey: "",
        groqKey: "", // يتم جلبه الآن من السيرفر
        bridgeUrl: typeof AtharConfig !== 'undefined' ? AtharConfig.getBridgeUrl() : "https://script.google.com/macros/s/AKfycbwrr4OFEKrCpxdt1aeT35SWkaFyFTmFvdJ22OxV0iAg7Myc6g8cCUr5q6WJc4rjQxUO/exec"
    };

    let savedConfig = JSON.parse(localStorage.getItem('athar_ai_config') || '{}');
    let config = { ...DEFAULT_CONFIG, ...savedConfig };

    // 🔴 هام: فرض استخدام الرابط المركزي دائماً وتجاهل الرابط القديم المخزن في المتصفح
    if (typeof AtharConfig !== 'undefined') {
        config.bridgeUrl = AtharConfig.getBridgeUrl();
    }

    // ... (rest of the code)

    const AIGateway = {
        async call(prompt) {
            logStatus('loading', '(يتم التصميم الآن...)');
            return await this.callBridge(prompt);
        },
        async callBridge(prompt) {
            const payload = { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.7 };

            // 180-second Timeout Logic (Increased for long proposals)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000);

            try {
                console.log("Using Bridge URL:", config.bridgeUrl);
                const res = await fetch(config.bridgeUrl + "?action=ai", {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                const data = await res.json();

                if (data.status === 'success') {
                    return data.data;
                } else if (data.status === 'error') {
                    throw new Error(data.message || "خطأ من السيرفر");
                } else if (data.choices) {
                    return data.choices?.[0]?.message?.content;
                }

                return null;
            } catch (e) {
                clearTimeout(timeoutId);
                if (e.name === 'AbortError') {
                    this.handleError("انتهت مهلة الانتظار (Timeout) - التوليد استغرق وقتاً طويلاً جداً.");
                } else {
                    this.handleError(e.message);
                }
                return null;
            }
        },
        handleError(msg) {
            logStatus('err', '(خطأ في الاتصال)');
            if (msg.includes("Failed to fetch")) {
                alert(`⚠️ خطأ في الاتصال (Failed to fetch)\n\nالرابط المستخدم: ${config.bridgeUrl}\n\nالأسباب المحتملة:\n1. صلاحيات النشر (Deployment Access) ليست "Anyone".\n2. الرابط غير صحيح أو قديم.\n3. مشكلة في الإنترنت.`);
            } else if (msg.includes("UrlFetchApp") || msg.includes("external_request")) {
                alert(`⚠️ مطلوب تفعيل الصلاحيات (Authorization Required)\n\nالخطوة الناقصة:\n1. افتح محرر Apps Script.\n2. شغل الدالة "_setupAuth" واضغط Run.\n3. اضغط Review Permissions => Allow.\n4. انشر نسخة جديدة.`);
            } else {
                alert(`خطأ: ${msg}`);
            }
        }
    };

    const goToStep = (n) => {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`step${n}`).classList.add('active');
        if (n > 1) document.querySelector('.hero-section')?.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.onclick = async () => {
            try {
                const idea = document.getElementById('projectIdea').value;
                const b = document.getElementById('projectBudget').value;
                const d = document.getElementById('projectDuration').value;
                const c = document.getElementById('country').value;
                const g = document.getElementById('governorate').value;
                const v = document.getElementById('village').value;

                if (!idea) return alert("يرجى إدخال فكرة المشروع");
                if (!g) return alert("يرجى إدخال المحافظة المستهدفة");

                analyzeBtn.disabled = true;
                state.projectInfo = { idea, budget: b, duration: d, country: c, governorate: g, village: v };

                const prompt = `
                أنت خبير تطوير برامج دولي. 
                حلل فكرة المشروع: "${idea}" 
                في الموقع: "${c} - ${g} - ${v}"
                
                المطلوب رد JSON حصراً:
                {
                    "sector": "اسم القطاع الإنساني المعياري (WASH, Protection...)",
                    "summary": "ملخص استراتيجي يوضح الفجوة والحل المقترح (50 كلمة)"
                }
                بالعربية الفصحى فقط.
                `;
                const res = await AIGateway.call(prompt);

                if (res) {
                    const jsonMatch = res.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) throw new Error("استجابة غير صالحة من الذكاء الاصطناعي (JSON مفقود)");

                    const data = JSON.parse(jsonMatch[0]);
                    state.analysis = data;
                    document.getElementById('analysisResult').innerHTML = `
                        <div class="glass-card" style="padding:20px; border:2px solid var(--primary);">
                            <h3 style="color:var(--primary);">${data.sector}</h3>
                            <p>${data.summary}</p>
                            <button id="nextBtn" class="btn btn-primary" style="width:100%;">استمرار ✨</button>
                        </div>`;
                    document.getElementById('analysisResult').style.display = 'block';
                    document.getElementById('nextBtn').onclick = () => { generateIdeas(); goToStep(2); };

                    logStatus('success', 'تم التحليل بنجاح');
                } else {
                    throw new Error("لم يتم تلقي أي استجابة");
                }
            } catch (error) {
                console.error("Analysis Error:", error);
                logStatus('error', 'حدث خطأ أثناء التحليل');
                alert(`خطأ أثناء تحليل الفكرة:\n${error.message}`);
            } finally {
                analyzeBtn.disabled = false;
            }
        };
    }

    async function generateIdeas() {
        const grid = document.getElementById('ideasGrid');
        grid.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <div class="spinner"></div>
                <p>جاري توليد 6-8 أفكار ريادية ذكية...</p>
            </div>`;

        const prompt = `
        أنت استشاري تصميم مشاريع إنسانية. 
        بناءً على الملخص: ${state.analysis.summary} 
        الموقع: ${state.projectInfo.governorate} 
        الميزانية: ${state.projectInfo.budget}$
        
        اقترح 6 إلى 8 أفكار مشاريع مبتكرة وريادية تتبع معايير الجودة العالمية وتلبي احتياجات المجتمع المحلي.
        
        المطلوب رد JSON Array حصراً:
        [
            {"name": "عنوان المشروع الجذاب", "description": "وصف دقيق للأثر والتدخل (25 كلمة)"}
        ]
        بالعربية.
        `;

        try {
            const res = await AIGateway.call(prompt);
            if (!res) throw new Error("No response");

            let cleanRes = res;
            const jsonMatch = res.match(/\[[\s\S]*\]/);
            if (jsonMatch) cleanRes = jsonMatch[0];

            const data = JSON.parse(cleanRes);

            grid.innerHTML = '';
            data.forEach(idea => {
                const card = document.createElement('div');
                card.className = 'glass-card idea-card';
                card.style.padding = '15px';
                card.style.cursor = 'pointer';
                card.innerHTML = `<h4 style="color:var(--primary);">${idea.name}</h4><p>${idea.description}</p>`;
                card.onclick = () => {
                    document.querySelectorAll('.idea-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
                    card.style.borderColor = 'var(--primary)';
                    state.selectedIdea = idea;

                    const genBtn = document.getElementById('generateProposalBtn');
                    if (genBtn) {
                        genBtn.disabled = false;
                        genBtn.onclick = () => { goToStep(3); generateFullProposal(); };
                    }
                };
                grid.appendChild(card);
            });
        } catch (e) {
            console.error(e);
            grid.innerHTML = `<p style="color:red">فشل في توليد الأفكار: ${e.message}</p><button onclick="generateIdeas()" class="btn btn-sm">إعادة المحاولة</button>`;
        }
    }

    async function generateFullProposal() {
        if (!state.selectedIdea) return alert("الرجاء اختيار فكرة مشروع أولاً");

        const selected = state.selectedIdea;
        const step3 = document.getElementById('step3');

        step3.innerHTML = `
            <div class="glass-card" style="text-align:center; padding:40px;">
                <div class="spinner"></div>
                <h3 style="color:var(--primary); margin-top:20px;">جاري صياغة المقترح الكامل والشامل...</h3>
                <p>يقوم الخبير الآلي بإعداد 11 قسماً تفصيلياً وفق المعايير الدولية.</p>
                <p style="font-size:0.8rem; color:#888;">(هذه العملية دقيقة جداً وقد تستغرق حتى 3 دقائق، يرجى الانتظار)</p>
            </div>`;

        const currentLang = localStorage.getItem('athar_language') || 'ar';
        const targetLang = currentLang === 'ar' ? 'Arabic' : 'English';
        const location = `الدولة: ${state.projectInfo.country}, المحافظة: ${state.projectInfo.governorate}, القرية/الحي: ${state.projectInfo.village || 'غير محدد'}`;

        const prompt = `
        أنت خبير دولي متخصص في صياغة مقترحات المشاريع (Senior Proposal Writer) للمنظمات الدولية والمانحين الكبار (EU, USAID, UN).
        المهمة: إعداد مقترح كامل احترافي جداً لفكرة: "${selected.name}".
        
        السياق: ${location}
        الوصف: ${selected.desc || selected.description}
        الميزانية: ${state.projectInfo.budget}$

        ⚠️ قواعد ذهبية صارمة:
        1. الالتزام المطلق بالاحترافية الميدانية (NGO Professionalism).
        2. استخدام لغة المانحين (Donor Language) ومصطلحات معيارية: (CHS, RBM, AAP, PSEA, PDM, Baseline/Endline).
        3. يمنع منعاً باتاً ذكر أي إشارة للذكاء الاصطناعي أو اسم المنصة.
        4. كل قسم نصي يجب أن يكون عميقاً وتفصيلياً (300-500 كلمة للقسم الواحد).
        5. المخرج يجب أن يكون JSON صالح فقط.

        هيكل JSON المطلوب:
        {
            "executive_summary": "الملخص التنفيذي (شامل ومقنع)",
            "problem_analysis": "تحليل المشكلة والمبرر (دوافع التدخل والاحتياج)",
            "beneficiaries": "الفئات المستهدفة (معايير الاختيار والشمولية)",
            "methodology": "المنهجية والنهج (آلية التنفيذ والتميز التقني)",
            "gender_protection": "النوع الاجتماعي والحماية (Safety & Dignity)",
            "activities_plan": "خطة الأنشطة (تفصيل المخرجات والمدخلات)",
            "me_framework": "خطة المراقبة والتقييم (LogFrame & Indicators)",
            "budget_narrative": "الميزانية والسرد المالي (HTML Table + Narrative)",
            "risk_management": "إدارة المخاطر (التخفيف والوقاية)",
            "institutional_capacity": "القدرات المؤسسية (لماذا نحن؟)",
            "sustainability": "الاستدامة (استراتيجية الخروج والأثر)"
        }

        اللغة: ${targetLang}.
        `;

        try {
            const res = await AIGateway.call(prompt);

            if (!res) throw new Error("لم تصل استجابة. قد يكون النص طويلاً جداً بالنسبة للموديل.");

            let cleanRes = res;
            const jsonMatch = res.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanRes = jsonMatch[0];

            let data;
            try {
                data = JSON.parse(cleanRes);
            } catch (e) {
                console.error("JSON Error", cleanRes);
                // محاولة تنظيف يدوية بسيطة
                throw new Error("فشل تنسيق الرد (JSON). حاول مرة أخرى.");
            }

            state.proposal = data;
            // Helper for text fields
            const safe = (val) => val ? val.replace(/\n/g, '<br>') : 'غير متوفر';
            // Helper for HTML fields (like the budget table) - allows raw HTML
            const safeHTML = (val) => val || 'غير متوفر';

            let html = `
                <div class="glass-card" id="finalPreview" style="font-family:'Cairo', sans-serif; padding:40px; background:white; color:#333; direction:${currentLang === 'ar' ? 'rtl' : 'ltr'};">
                    <div style="text-align:center; border-bottom: 2px solid var(--primary); padding-bottom:20px; margin-bottom:30px;">
                        <h1 style="color:var(--primary); margin:0;">${selected.name}</h1>
                        <p style="color:#666; margin-top:10px;">مقترح مشروع متكامل وفق المعايير الدولية</p>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">1️⃣ الملخص التنفيذي</h3>
                        <div class="prop-content">${safe(data.executive_summary)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">2️⃣ المبرر وتحليل المشكلة</h3>
                        <div class="prop-content">${safe(data.problem_analysis)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">3️⃣ الفئات المستهدفة</h3>
                        <div class="prop-content">${safe(data.beneficiaries)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">4️⃣ المنهجية والنهج البرامجي</h3>
                        <div class="prop-content">${safe(data.methodology)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">5️⃣ النوع الاجتماعي والحماية</h3>
                        <div class="prop-content">${safe(data.gender_protection)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">6️⃣ خطة الأنشطة</h3>
                        <div class="prop-content">${safe(data.activities_plan)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">7️⃣ المراقبة والتقييم (M&E)</h3>
                        <div class="prop-content">${safe(data.me_framework)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">8️⃣ الميزانية التفصيلية</h3>
                        <div class="prop-content budget-container">${safeHTML(data.budget_narrative)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">9️⃣ إدارة المخاطر</h3>
                        <div class="prop-content">${safe(data.risk_management)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">🔟 القدرات المؤسسية</h3>
                        <div class="prop-content">${safe(data.institutional_capacity)}</div>
                    </div>

                    <div class="proposal-section">
                        <h3 class="prop-header">1️⃣1️⃣ الاستدامة</h3>
                        <div class="prop-content">${safe(data.sustainability)}</div>
                    </div>

                    <style>
                        .prop-header { background: var(--primary); color: white; padding: 10px 15px; border-radius: 5px; margin-top: 30px; }
                        .prop-content { padding: 15px; background: #f9f9f9; border: 1px solid #eee; line-height: 1.8; text-align: justify; }

                        /* Excel-like Table Styles */
                        .budget-container table { width: 100%; border-collapse: collapse; font-size: 0.85rem; background: white; }
                        .budget-container th { background-color: #4472C4; color: white; border: 1px solid #333; padding: 8px; text-align: center; }
                        .budget-container td { border: 1px solid #999; padding: 6px; color: #333; }
                        .budget-container tr:nth-child(even) { background-color: #D9E1F2; }
                        .budget-container tr:hover { background-color: #B4C6E7; }
                        .budget-container td:nth-child(7), .budget-container td:nth-child(8),
                        .budget-container td:nth-child(9), .budget-container td:nth-child(10) { font-family: monospace; font-weight: bold; }
                    </style>
                </div>

                <div style="margin-top:20px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                    <button id="saveProjectBtn" class="btn btn-secondary">💾 حفظ المسودة</button>
                    <button id="exportWordBtn" class="btn btn-primary" style="background:#2b579a;">📄 تصدير المقترح (Word)</button>
                    <button id="exportExcelBtn" class="btn btn-success" style="background:#217346; color:white;">📊 تصدير الميزانية (Excel)</button>
                    <button onclick="location.reload()" class="btn btn-ghost">جديد ↺</button>
                </div>`;

            step3.innerHTML = html;

            // Re-attach export listeners if defined elsewhere or add dummy
            if (window.attachExportListeners) window.attachExportListeners();

        } catch (e) {
            console.error(e);
            step3.innerHTML = `
                <div class="glass-card" style="color:red; text-align:center; padding:30px;">
                    <h3>⚠️ تعذر توليد المقترح الطويل</h3>
                    <p>السبب: ${e.message}</p>
                    <p style="font-size:0.9rem; color:#555;">قد يكون النص المولد أكبر من قدرة الاستيعاب الحالية للموديل المجاني.</p>
                    <button onclick="generateFullProposal()" class="btn btn-primary" style="margin-top:15px;">🔄 المحاولة مرة أخرى</button>
                </div>`;
        }
    }

    // --- Export Functions ---
    window.attachExportListeners = () => {
        const exportWordBtn = document.getElementById('exportWordBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');

        if (exportWordBtn) {
            exportWordBtn.onclick = () => {
                ProtectionManager.verify(() => {
                    const content = document.getElementById('step3').innerHTML;
                    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>body{font-family:'Cairo',sans-serif;direction:rtl;text-align:right;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #000;padding:5px;}</style></head><body>";
                    const postHtml = "</body></html>";

                    // Clone to strip buttons
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;
                    tempDiv.querySelectorAll('button').forEach(b => b.remove());

                    const html = preHtml + tempDiv.innerHTML + postHtml;

                    const blob = new Blob(['\ufeff', html], {
                        type: 'application/msword'
                    });

                    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);

                    const link = document.createElement('a');
                    link.download = `Athar_Proposal_${Date.now()}.doc`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            };
        }

        if (exportExcelBtn) {
            exportExcelBtn.onclick = () => {
                ProtectionManager.verify(() => {
                    const budgetDiv = document.querySelector('.budget-container');
                    let table = budgetDiv ? budgetDiv.querySelector('table') : null;

                    if (!table) return alert('لم يتم العثور على جدول الميزانية لتصديره.');

                    const cloneTable = table.cloneNode(true);
                    cloneTable.style.border = '1px solid black';

                    const tableHtml = `
                        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                        <head><meta charset="utf-8" /><style>table{border-collapse:collapse;direction:rtl;} th,td{border:1px solid #000;padding:5px;}</style></head>
                        <body>${cloneTable.outerHTML}</body>
                        </html>`;

                    const blob = new Blob(['\ufeff', tableHtml], { type: 'application/vnd.ms-excel' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Athar_Budget_${Date.now()}.xls`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            };
        }
    };

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('athar_theme', isDark ? 'dark' : 'light');
        };
    }
});
