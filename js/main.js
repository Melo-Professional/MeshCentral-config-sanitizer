/**
 * Main Module
 * Application initialization and event binding
 */

window.MCTools = window.MCTools || {};

/**
 * Initialize the application
 */
window.MCTools.init = function () {
    // Initialize CodeMirror editor
    window.MCTools.initEditor();

    // Initialize help tooltip
    window.MCTools.initHelpTooltip();

    // Initialize theme toggle
    window.MCTools.initThemeToggle();

    // File input event listener
    document.getElementById('fileInput').addEventListener('change', window.MCTools.handleFileUpload);

    // Dropdown click-outside handler
    document.addEventListener('click', function (event) {
        const dropdown = document.querySelector('.profile-dropdown');
        const menu = document.getElementById('dropdown-menu');
        if (dropdown && !dropdown.contains(event.target)) {
            menu.style.display = 'none';
        }
    });
};

// Expose functions to global scope for HTML onclick handlers
window.sanitizeConfig = window.MCTools.sanitizeConfig;
window.cleanupConfig = window.MCTools.cleanupConfig;
window.copyToClipboard = window.MCTools.copyToClipboard;
window.downloadConfig = window.MCTools.downloadConfig;
window.toggleDropdown = window.MCTools.toggleDropdown;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.MCTools.init);
} else {
    window.MCTools.init();
}
