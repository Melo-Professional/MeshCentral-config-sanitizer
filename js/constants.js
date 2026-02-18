/**
 * Constants Module
 * Centralized configuration constants and lookup data structures
 */

// Initialize global namespace
window.MCTools = window.MCTools || {};

// Keys that should be redacted in output
window.MCTools.redactKeys = [
    "Title", "title", "title2", "subtitle", "titlePicture", "loginPicture",
    "welcomePicture", "welcomeText", "pwaLogo", "meshMessengerTitle",
    "image", "loginfooter", "footer", "filename"
].map(k => k.toLowerCase());

// Keys to remove when cleaning config
window.MCTools.irrelevantKeys = [
    "agentCustomization", "agentFileInfo", "assistantCustomization",
    "androidCustomization", "Title", "title", "title2", "titlePicture",
    "loginPicture", "welcomePicture", "welcomeText", "pwaLogo",
    "meshMessengerTitle", "maxDeviceView", "nightMode", "scrollToTop",
    "meshMessengerPicture", "footer", "hide", "loginfooter",
    "passwordRequirements", "showNotesPanel", "userSessionsSort",
    "consentMessages", "redirects", "userConsentFlags",
    "notificationMessages", "desktopPrivacyBarText",
    "localSessionRecording", "sessionRecording", "showPasswordLogin",
    "showLanguageSelect", "welcomePictureFullScreen"
].map(k => k.toLowerCase());

// Sensitive keys that need protection
window.MCTools.sensitiveKeys = new Set([
    ...window.MCTools.redactKeys, "key", "password", "secret", "clientSecret", "clientId",
    "authCookieEncryptionKey", "agentAuthToken", "bindPw", "bindDn",
    "connectionString", "sessionKey", "orphanAgentUser", "pass", "ssid",
    "certfiles", "user", "names", "clientid", "clientsecret",
    "refreshToken", "tenantid", "keyfile", "apikey", "token", "runas",
    "loginfooter", "footer", "agentKey", "loginKey", "zipPassword",
    "syslogauth", "dbRecordsEncryptKey", "dbRecordsDecryptKey",
    "dbEncryptKey", "certificatePrivateKeyPassword", "id",
    "newMebxPassword", "username", "from", "agentCoreDumpUsers", "kid",
    "hmackey", "mongoDb", "mongoDbName", "webPush.email", "ldapOptions.bindDN",
    "ldapOptions.bindCredentials", "ldapOptions.searchBase", "LDAPSiteAdminGroups",
    "ldapUserRequiredGroupMembership", "client_secret"
].map(k => k.toLowerCase()));

// Keys related to user/group management
window.MCTools.userGroupKeys = [
    "manageAllDeviceGroups", "manageCrossDomain", "adminAccounts",
    "InterUserMessaging", "newAccountsUserGroups"
].map(k => k.toLowerCase());

// Sections to fully redact
window.MCTools.redactSectionsSet = new Set([
    "agentCustomization", "agentFileInfo", "assistantCustomization", "androidCustomization"
].map(k => k.toLowerCase()));

// Domains exempt from sanitization
window.MCTools.whitelistedDomains = new Set([
    "meshcentral.com", "cloudflare.com", "google.com"
]);

// Valid top-level domains - fallback list (will be replaced with IANA list if available)
window.MCTools.tldsFallback = [
    "com", "net", "org", "info", "biz", "name", "pro", "io",
    "dev", "app", "cloud", "tech", "systems", "services",
    "network", "host", "edu", "gov", "mil", "be", "de", "fr",
    "it", "es", "pt", "nl", "ch", "se", "no", "fi", "dk", "ie",
    "at", "pl", "cz", "br", "ar", "cl", "mx", "co", "ca", "us",
    "jp", "cn", "in", "kr", "sg", "hk", "tw", "au", "nz", "uk", "me"
];

// Initialize TLDs with fallback list
window.MCTools.tlds = new Set(window.MCTools.tldsFallback);

// Regular expressions for domain and IP detection
window.MCTools.domainRegex = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;
window.MCTools.ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b/g;

/**
 * Fetch and update the official IANA TLD list
 * Uses localStorage caching (24 hour TTL) for performance
 * Falls back to hardcoded list if fetch fails
 */
window.MCTools.updateTLDList = function () {
    const CACHE_KEY = 'meshcentral-tlds';
    const CACHE_TIMESTAMP_KEY = 'meshcentral-tlds-timestamp';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const IANA_TLD_URL = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt';

    // Check if we have cached TLDs and they're still fresh
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedTLDs = localStorage.getItem(CACHE_KEY);

    if (cachedTimestamp && cachedTLDs) {
        const age = Date.now() - parseInt(cachedTimestamp, 10);
        if (age < CACHE_TTL) {
            // Use cached TLDs
            try {
                const tldArray = JSON.parse(cachedTLDs);
                window.MCTools.tlds = new Set(tldArray);
                console.log(`Loaded ${tldArray.length} TLDs from cache`);
                return;
            } catch (e) {
                console.warn('Failed to parse cached TLDs, fetching new list');
            }
        }
    }

    // Fetch fresh TLD list from IANA
    fetch(IANA_TLD_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            // Parse the IANA list (skip comment lines starting with #)
            const lines = text.split('\n');
            const tldArray = lines
                .filter(line => line && !line.startsWith('#'))
                .map(line => line.trim().toLowerCase());

            if (tldArray.length > 0) {
                // Update the TLD set
                window.MCTools.tlds = new Set(tldArray);

                // Cache the result
                localStorage.setItem(CACHE_KEY, JSON.stringify(tldArray));
                localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

                console.log(`Loaded ${tldArray.length} TLDs from IANA`);
            } else {
                throw new Error('Empty TLD list received');
            }
        })
        .catch(error => {
            console.warn('Failed to fetch IANA TLD list, using fallback:', error.message);
            // Keep the fallback list that was already set
        });
};

// Auto-update TLD list on module load
window.MCTools.updateTLDList();
