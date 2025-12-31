/**
 * UI Module
 * UI interaction handlers and utilities
 */

window.MCTools = window.MCTools || {};

/**
 * Display toast notification message
 */
window.MCTools.showToast = function (message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

/**
 * Copy editor content to clipboard
 */
window.MCTools.copyToClipboard = function () {
    const text = window.MCTools.codeEditor.getValue().trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
    }).catch(err => { console.error('Failed to copy: ', err); });
};

/**
 * Handle file upload and load into editor
 */
window.MCTools.handleFileUpload = function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            let content = e.target.result;
            try {
                const obj = JSON.parse(content);
                content = JSON.stringify(obj, null, 2);
            } catch (error) {
                window.MCTools.showToast('Invalid JSON: loaded as is.');
            }
            window.MCTools.codeEditor.setValue(content);
        };
        reader.readAsText(file);
    }
};

/**
 * Download editor content as JSON file
 */
window.MCTools.downloadConfig = function () {
    const text = window.MCTools.codeEditor.getValue().trim();
    if (!text) {
        window.MCTools.showToast('No content to download.');
        return;
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sanitized-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Toggle dropdown menu visibility
 */
window.MCTools.toggleDropdown = function () {
    const menu = document.getElementById('dropdown-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
};

/**
 * Initialize help tooltip hover functionality
 */
window.MCTools.initHelpTooltip = function () {
    let timeout;
    const helpIcon = document.querySelector('.help-icon');
    const helpTooltip = document.querySelector('.help-tooltip');
    if (!helpIcon || !helpTooltip) return;

    helpIcon.addEventListener('mouseenter', () => {
        helpTooltip.style.display = 'block';
    });
    helpIcon.addEventListener('mouseleave', () => {
        timeout = setTimeout(() => {
            helpTooltip.style.display = 'none';
        }, 300);
    });
    helpTooltip.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
    });
    helpTooltip.addEventListener('mouseleave', () => {
        helpTooltip.style.display = 'none';
    });
};

/**
 * Initialize theme toggle functionality
 */
window.MCTools.initThemeToggle = function () {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;

    const moon = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";
    const sun = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m15.364 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z";

    const saved = localStorage.getItem('meshcentral-theme') || 'dark';
    html.dataset.theme = saved;
    themeIcon.innerHTML = `<path d="${saved === 'light' ? sun : moon}"></path>`;
    window.MCTools.codeEditor.setOption('theme', saved === 'light' ? 'default' : 'dracula');

    themeToggle.addEventListener('click', () => {
        const isLight = html.dataset.theme === 'light';
        const newTheme = isLight ? 'dark' : 'light';
        html.dataset.theme = newTheme;
        localStorage.setItem('meshcentral-theme', newTheme);
        themeIcon.innerHTML = `<path d="${newTheme === 'light' ? sun : moon}"></path>`;
        window.MCTools.codeEditor.setOption('theme', newTheme === 'light' ? 'default' : 'dracula');
    });
};
