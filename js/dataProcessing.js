/**
 * Data Processing Module
 * Utilities for data extraction and transformation
 */

window.MCTools = window.MCTools || {};

/**
 * Check if an IP address is internal/private
 */
window.MCTools.isInternalIP = function (ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => p < 0 || p > 255)) return false;
    const [a, b] = parts;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
};

/**
 * Extract base domain from a full domain name
 */
window.MCTools.getBaseDomain = function (fullDomain) {
    const parts = fullDomain.split('.');
    if (parts.length < 2) return fullDomain;
    return parts.slice(-2).join('.');
};

/**
 * Recursively collect all base domains from configuration object
 */
window.MCTools.collectBaseDomains = function (obj, baseDomains = new Set()) {
    if (typeof obj === 'string') {
        let match;
        window.MCTools.domainRegex.lastIndex = 0;
        while ((match = window.MCTools.domainRegex.exec(obj)) !== null) {
            const full = match[0];
            const base = window.MCTools.getBaseDomain(full);
            const lastPart = base.split('.').pop().toLowerCase();
            if (!window.MCTools.tlds.has(lastPart)) continue;
            if (!window.MCTools.whitelistedDomains.has(base)) {
                baseDomains.add(base);
            }
        }
    } else if (Array.isArray(obj)) {
        obj.forEach(value => window.MCTools.collectBaseDomains(value, baseDomains));
    } else if (obj !== null && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
            if (key === '$schema') return;
            window.MCTools.collectBaseDomains(value, baseDomains);
        });
    }
    return baseDomains;
};

/**
 * Recursively collect all external IP addresses from configuration object
 */
window.MCTools.collectIPsFromObj = function (obj, ips = new Set()) {
    if (typeof obj === 'string') {
        let match;
        window.MCTools.ipRegex.lastIndex = 0;
        while ((match = window.MCTools.ipRegex.exec(obj)) !== null) {
            const ip = match[0];
            if (!window.MCTools.isInternalIP(ip)) ips.add(ip);
        }
    } else if (Array.isArray(obj)) {
        obj.forEach(value => window.MCTools.collectIPsFromObj(value, ips));
    } else if (obj !== null && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => window.MCTools.collectIPsFromObj(value, ips));
    }
    return ips;
};

/**
 * Collect user and group mappings from configuration object
 */
window.MCTools.collectUsersAndGroupsFromObj = function (obj) {
    const userMap = new Map();
    const groupMap = new Map();

    function recurse(current) {
        if (Array.isArray(current)) {
            current.forEach(item => recurse(item));
        } else if (typeof current === 'object' && current !== null) {
            Object.entries(current).forEach(([key, value]) => {
                if (window.MCTools.userGroupKeys.includes(key.toLowerCase()) && Array.isArray(value)) {
                    value.forEach(path => {
                        if (typeof path === 'string' && path.startsWith("user/")) {
                            const parts = path.substring(5).split('/');
                            let group = '';
                            let user = '';
                            if (parts.length >= 1) {
                                user = parts[parts.length - 1];
                                if (parts.length > 1) group = parts[0];
                            }
                            if (user.includes('@')) {
                                const [u] = user.split('@');
                                user = u;
                            }
                            if (user && !userMap.has(user)) userMap.set(user, `user-${userMap.size + 1}`);
                            if (group && !groupMap.has(group)) groupMap.set(group, `domain-${groupMap.size + 1}`);
                        }
                    });
                } else {
                    recurse(value);
                }
            });
        }
    }
    recurse(obj);

    function findOrphan(current) {
        if (Array.isArray(current)) {
            current.forEach(findOrphan);
        } else if (typeof current === 'object' && current !== null) {
            Object.entries(current).forEach(([key, value]) => {
                if (key.toLowerCase() === "orphanagentuser" && typeof value === 'string') {
                    if (!userMap.has(value)) userMap.set(value, `user-${userMap.size + 1}`);
                } else {
                    findOrphan(value);
                }
            });
        }
    }
    findOrphan(obj);

    return { userMap, groupMap };
};

/**
 * Escape special characters in a string for use in regular expressions
 */
window.MCTools.escapeRegExp = function (string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
