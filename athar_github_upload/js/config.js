/**
 * ⚙️ Global Configuration for Athar Platform (Template)
 * 
 * Replace "YOUR_BRIDGE_URL_HERE" with your actual Google Apps Script Deployment URL.
 */

const AtharConfig = {
    // 🔗 رابط الجسر البرمجي - أدخل رابطك هنا
    BRIDGE_URL: "YOUR_BRIDGE_URL_HERE",

    VERSION: "3.5.0",

    getBridgeUrl: function () {
        return localStorage.getItem('athar_bridge_custom_url') || this.BRIDGE_URL;
    }
};

if (Object.freeze) {
    Object.freeze(AtharConfig);
}
