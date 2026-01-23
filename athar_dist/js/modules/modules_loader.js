/**
 * 🚀 Athar Modules Loader - محمّل وحدات منصة أثر
 * 
 * هذا الملف يحمل جميع الوحدات المطلوبة بالترتيب الصحيح
 * ويوفر واجهة موحدة للوصول إليها
 * 
 * الاستخدام:
 * <script src="js/modules/modules_loader.js"></script>
 * 
 * ثم يمكن الوصول إلى:
 * - window.AtharModules.security
 * - window.AtharModules.apiProxy
 * - window.AtharModules.atsEngine
 * - window.AtharModules.jobDescriptionGenerator
 * - window.AtharModules.fileProcessor
 * - window.AtharModules.pdfExporter
 */

(function () {
    'use strict';

    // مسار الوحدات
    const MODULES_PATH = 'js/modules/';

    // قائمة الوحدات بالترتيب
    const MODULES = [
        {
            name: 'security',
            file: 'security_layer.js',
            global: 'securityLayer',
            required: true
        },
        {
            name: 'apiProxy',
            file: 'api_proxy.js',
            global: 'apiProxy',
            required: true
        },
        {
            name: 'atsEngine',
            file: 'ats_engine.js',
            global: 'atsEngine',
            required: false
        },
        {
            name: 'jobDescriptionGenerator',
            file: 'job_description_generator.js',
            global: 'jobDescriptionGenerator',
            required: false
        },
        {
            name: 'fileProcessor',
            file: 'file_processor.js',
            global: 'fileProcessor',
            required: false
        },
        {
            name: 'pdfExporter',
            file: 'pdf_exporter.js',
            global: 'pdfExporter',
            required: false
        }
    ];

    // كائن لتخزين الوحدات المحملة
    const loadedModules = {};

    /**
     * تحميل سكريبت
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // تحميل متسلسل
            script.onload = () => resolve(src);
            script.onerror = () => reject(new Error(`Failed to load: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * تحميل جميع الوحدات
     */
    async function loadAllModules() {
        console.log('🚀 Loading Athar Modules...');

        for (const module of MODULES) {
            try {
                const path = MODULES_PATH + module.file;
                await loadScript(path);

                // التحقق من تحميل الوحدة
                if (window[module.global]) {
                    loadedModules[module.name] = window[module.global];
                    console.log(`✅ ${module.name} loaded successfully`);
                } else if (module.required) {
                    console.error(`❌ Required module ${module.name} failed to load`);
                } else {
                    console.warn(`⚠️ Optional module ${module.name} not loaded`);
                }
            } catch (error) {
                if (module.required) {
                    console.error(`❌ Failed to load required module ${module.name}:`, error);
                } else {
                    console.warn(`⚠️ Failed to load optional module ${module.name}:`, error);
                }
            }
        }

        console.log('✅ Athar Modules loaded');
        return loadedModules;
    }

    /**
     * التحقق من جاهزية الوحدات
     */
    function checkModulesReady() {
        const required = MODULES.filter(m => m.required);
        const loaded = required.filter(m => loadedModules[m.name]);

        return loaded.length === required.length;
    }

    /**
     * الحصول على وحدة
     */
    function getModule(name) {
        return loadedModules[name] || null;
    }

    /**
     * التحقق من تحميل وحدة
     */
    function isModuleLoaded(name) {
        return !!loadedModules[name];
    }

    // تحميل الوحدات عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllModules);
    } else {
        loadAllModules();
    }

    // تصدير للاستخدام العام
    window.AtharModules = {
        // الوحدات المحملة
        get security() { return loadedModules.security; },
        get apiProxy() { return loadedModules.apiProxy; },
        get atsEngine() { return loadedModules.atsEngine; },
        get jobDescriptionGenerator() { return loadedModules.jobDescriptionGenerator; },
        get fileProcessor() { return loadedModules.fileProcessor; },
        get pdfExporter() { return loadedModules.pdfExporter; },

        // دوال مساعدة
        isReady: checkModulesReady,
        getModule: getModule,
        isModuleLoaded: isModuleLoaded,
        reload: loadAllModules,

        // معلومات
        version: '1.0.0',
        modules: MODULES.map(m => m.name)
    };

    // حدث عند اكتمال التحميل
    window.addEventListener('load', () => {
        if (checkModulesReady()) {
            const event = new CustomEvent('athar-modules-ready', {
                detail: { modules: loadedModules }
            });
            window.dispatchEvent(event);
        }
    });
})();
