/**
 * ⚙️ Global Configuration for Athar Platform
 * 
 * This file acts as the central environment configuration.
 * - BRIDGE_URL: The connection string to the backend (Google Apps Script).
 * - APP_VERSION: Current version of the frontend.
 */

const AtharConfig = {
    // 🔗 رابط الجسر البرمجي - يجب تحديثه هنا فقط عند تغيير النشر
    // Note: To avoid changing this, use "Manage Deployments" -> "Edit" -> "New Version" in Apps Script
    BRIDGE_URL: "https://script.google.com/macros/s/AKfycbzSdWq5xiGZQZ9-DuaVh57f_3UKLuuYWukgIC3x2vtvt5d2VIyEv4yiJn93-hIrgLL9/exec",

    // 🏷️ إصدار التطبيق
    VERSION: "3.5.0",

    // 🛠️ Helper to get the URL (can be extended for dev/prod switching)
    getBridgeUrl: function () {
        // Allow local storage override for testing/admin purposes
        return localStorage.getItem('athar_bridge_custom_url') || this.BRIDGE_URL;
    }
};

// Prevent modification if frozen
if (Object.freeze) {
    Object.freeze(AtharConfig);
}
