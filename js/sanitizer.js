/**
 * Sanitizer Module
 * Core sanitization and redaction logic
 */

window.MCTools = window.MCTools || {};

/**
 * Replace domains in a string using the provided mapping
 */
window.MCTools.replaceInString = function (str, baseDomainMap) {
    let replaced = str;
    Object.entries(baseDomainMap).forEach(([base, placeholder]) => {
        const baseRegex = new RegExp(window.MCTools.escapeRegExp(base), 'g');
        replaced = replaced.replace(baseRegex, placeholder);
    });
    return replaced;
};

/**
 * Recursively replace IP addresses with placeholders
 */
window.MCTools.replaceIPs = function (obj, ipMap) {
    if (typeof obj === 'string') {
        let replaced = obj;
        Object.entries(ipMap).forEach(([original, replacement]) => {
            const regex = new RegExp(window.MCTools.escapeRegExp(original), 'g');
            replaced = replaced.replace(regex, replacement);
        });
        return replaced;
    } else if (Array.isArray(obj)) {
        return obj.map(item => window.MCTools.replaceIPs(item, ipMap));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        Object.entries(obj).forEach(([key, value]) => {
            newObj[key] = window.MCTools.replaceIPs(value, ipMap);
        });
        return newObj;
    }
    return obj;
};

/**
 * Recursively replace domains with placeholders
 */
window.MCTools.replaceDomains = function (obj, baseDomainMap) {
    if (typeof obj === 'string') {
        return window.MCTools.replaceInString(obj, baseDomainMap);
    } else if (Array.isArray(obj)) {
        return obj.map(item => window.MCTools.replaceDomains(item, baseDomainMap));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        Object.entries(obj).forEach(([key, value]) => {
            newObj[key] = window.MCTools.replaceDomains(value, baseDomainMap);
        });
        return newObj;
    }
    return obj;
};

/**
 * Anonymize user and group paths in configuration
 */
window.MCTools.sanitizeUserGroups = function (obj, userMap, groupMap) {
    function recurse(current) {
        if (Array.isArray(current)) {
            return current.map(item => {
                if (typeof item === 'string' && item.startsWith('user/')) {
                    const parts = item.substring(5).split('/');
                    let newPath = 'user/';
                    if (parts.length >= 1) {
                        let user = parts[parts.length - 1];
                        let group = parts.length > 1 ? parts[0] : '';
                        let emailDomain = '';
                        if (user.includes('@')) {
                            const [u, d] = user.split('@');
                            user = u;
                            emailDomain = '@' + d;
                        }
                        const userPlaceholder = userMap.get(user) || user;
                        if (group === '') {
                            newPath += '/' + userPlaceholder + emailDomain;
                        } else {
                            const groupPlaceholder = groupMap.get(group) || group;
                            newPath += groupPlaceholder + '/' + userPlaceholder + emailDomain;
                        }
                    }
                    return newPath;
                }
                return recurse(item);
            });
        } else if (typeof current === 'object' && current !== null) {
            const newObj = {};
            Object.entries(current).forEach(([key, value]) => {
                if (window.MCTools.userGroupKeys.includes(key.toLowerCase()) && Array.isArray(value)) {
                    newObj[key] = recurse(value);
                } else {
                    newObj[key] = recurse(value);
                }
            });
            return newObj;
        }
        return current;
    }
    return recurse(obj);
};

/**
 * Redact entire configuration sections
 */
window.MCTools.redactSections = function (obj) {
    function recurse(current, inSection = false) {
        if (typeof current !== 'object' || current === null) {
            return inSection ? "REDACTED" : current;
        }
        if (Array.isArray(current)) {
            return current.map(item => recurse(item, inSection));
        }
        const newObj = {};
        Object.entries(current).forEach(([key, value]) => {
            const section = window.MCTools.redactSectionsSet.has(key.toLowerCase());
            newObj[key] = recurse(value, inSection || section);
        });
        return newObj;
    }
    return recurse(obj);
};

/**
 * Replace sensitive keys with REDACTED
 */
window.MCTools.replaceSensitive = function (obj, sensitiveSet, userMap, path = []) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(value => window.MCTools.replaceSensitive(value, sensitiveSet, userMap, path));
    }
    const newObj = {};
    Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...path, key];
        const keyLower = key.toLowerCase();
        let match = sensitiveSet.has(keyLower);

        if (!match) {
            let suffix = keyLower;
            for (let i = path.length - 1; i >= 0; i--) {
                suffix = path[i].toLowerCase() + "." + suffix;
                if (sensitiveSet.has(suffix)) {
                    match = true;
                    break;
                }
            }
        }

        if (match) {
            if (keyLower === "orphanagentuser" && typeof value === 'string') {
                const placeholder = userMap.get(value);
                newObj[key] = placeholder !== undefined ? placeholder : "REDACTED";
            } else {
                newObj[key] = "REDACTED";
            }
        } else {
            newObj[key] = window.MCTools.replaceSensitive(value, sensitiveSet, userMap, currentPath);
        }
    });
    return newObj;
};

/**
 * Remove irrelevant keys from configuration
 */
window.MCTools.removeIrrelevant = function (obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => window.MCTools.removeIrrelevant(item)).filter(item => item !== undefined);
    }
    const newObj = {};
    Object.entries(obj).forEach(([key, value]) => {
        if (key.startsWith('_') || window.MCTools.irrelevantKeys.includes(key.toLowerCase())) return;
        newObj[key] = window.MCTools.removeIrrelevant(value);
    });
    return newObj;
};

/**
 * Main sanitization function - redacts sensitive data
 */
window.MCTools.sanitizeConfig = function () {
    const text = window.MCTools.codeEditor.getValue().trim();
    if (!text) {
        window.MCTools.showToast('Please paste or upload a config.json first.');
        return;
    }
    try {
        const obj = JSON.parse(text);
        const { userMap, groupMap } = window.MCTools.collectUsersAndGroupsFromObj(obj);
        const ips = window.MCTools.collectIPsFromObj(obj);
        const ipMap = {};
        let ipCounter = 1;
        Array.from(ips).sort().forEach(ip => { ipMap[ip] = `REDACTED_IP-${ipCounter++}`; });
        let sanitized = window.MCTools.replaceIPs(obj, ipMap);
        const baseDomains = window.MCTools.collectBaseDomains(sanitized);
        const baseDomainMap = {};
        let counter = 1;
        Array.from(baseDomains).forEach(base => { baseDomainMap[base] = `domain-${counter++}.com`; });
        sanitized = window.MCTools.replaceDomains(sanitized, baseDomainMap);
        sanitized = window.MCTools.sanitizeUserGroups(sanitized, userMap, groupMap);
        sanitized = window.MCTools.redactSections(sanitized);
        sanitized = window.MCTools.replaceSensitive(sanitized, window.MCTools.sensitiveKeys, userMap);
        window.MCTools.codeEditor.setValue(JSON.stringify(sanitized, null, 2));
    } catch (error) {
        window.MCTools.showToast('Invalid JSON: ' + error.message);
    }
};

/**
 * Main cleanup function - removes irrelevant keys
 */
window.MCTools.cleanupConfig = function () {
    const text = window.MCTools.codeEditor.getValue().trim();
    if (!text) {
        window.MCTools.showToast('Please paste or upload a config.json first.');
        return;
    }
    try {
        const obj = JSON.parse(text);
        const cleaned = window.MCTools.removeIrrelevant(obj);
        window.MCTools.codeEditor.setValue(JSON.stringify(cleaned, null, 2));
    } catch (error) {
        window.MCTools.showToast('Invalid JSON: ' + error.message);
    }
};
