/**
 * Traveling Birder - Storage Module
 * Manages all localStorage operations
 */

import { CONFIG } from './config.js';

/**
 * Save data to localStorage
 */
export function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`💾 Saved to localStorage: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Error saving ${key} to localStorage:`, error);
        return false;
    }
}

/**
 * Load data from localStorage
 */
export function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        if (data) {
            console.log(`📥 Loaded from localStorage: ${key}`);
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error(`❌ Error loading ${key} from localStorage:`, error);
        return null;
    }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed from localStorage: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Error removing ${key} from localStorage:`, error);
        return false;
    }
}

/**
 * Clear all application data from localStorage
 */
export function clearAllStorage() {
    try {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🧹 Cleared all localStorage');
        return true;
    } catch (error) {
        console.error('❌ Error clearing localStorage:', error);
        return false;
    }
}

/**
 * Save user's life list
 */
export function saveLifeList(species, source = 'api') {
    const data = {
        species: Array.isArray(species) ? species : Array.from(species),
        source: source,
        updated: new Date().toISOString(),
        count: species.length || species.size || 0
    };
    
    saveToStorage(CONFIG.STORAGE_KEYS.LIFE_LIST, data);
    saveToStorage(CONFIG.STORAGE_KEYS.LIFE_LIST_SOURCE, source);
    
    console.log(`✅ Saved ${data.count} species from ${source}`);
    return true;
}

/**
 * Load user's life list
 */
export function loadLifeList() {
    const data = loadFromStorage(CONFIG.STORAGE_KEYS.LIFE_LIST);
    
    if (!data) {
        return { species: new Set(), source: null, updated: null, count: 0 };
    }
    
    return {
        species: new Set(data.species),
        source: data.source,
        updated: data.updated,
        count: data.count
    };
}

/**
 * Save API credentials
 */
export function saveCredentials(apiKey, userName) {
    saveToStorage(CONFIG.STORAGE_KEYS.API_KEY, apiKey);
    saveToStorage(CONFIG.STORAGE_KEYS.USER_NAME, userName);
    console.log(`✅ Saved credentials for ${userName}`);
}

/**
 * Load API credentials
 */
export function loadCredentials() {
    const apiKey = loadFromStorage(CONFIG.STORAGE_KEYS.API_KEY);
    const userName = loadFromStorage(CONFIG.STORAGE_KEYS.USER_NAME);
    
    if (apiKey && userName) {
        console.log(`✅ Loaded credentials for ${userName}`);
        return { apiKey, userName };
    }
    
    return null;
}

/**
 * Clear API credentials
 */
export function clearCredentials() {
    removeFromStorage(CONFIG.STORAGE_KEYS.API_KEY);
    removeFromStorage(CONFIG.STORAGE_KEYS.USER_NAME);
    console.log('🔓 Cleared credentials');
}

/**
 * Save routes
 */
export function saveSavedRoutes(routes) {
    return saveToStorage(CONFIG.STORAGE_KEYS.SAVED_ROUTES, routes);
}

/**
 * Load saved routes
 */
export function loadSavedRoutes() {
    const routes = loadFromStorage(CONFIG.STORAGE_KEYS.SAVED_ROUTES);
    return routes || [];
}

/**
 * Save dark mode preference
 */
export function saveDarkMode(enabled) {
    return saveToStorage(CONFIG.STORAGE_KEYS.DARK_MODE, enabled);
}

/**
 * Load dark mode preference
 */
export function loadDarkMode() {
    const darkMode = loadFromStorage(CONFIG.STORAGE_KEYS.DARK_MODE);
    return darkMode === true;
}

/**
 * Get storage usage information
 */
export function getStorageInfo() {
    try {
        let totalSize = 0;
        const items = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = new Blob([value]).size;
            
            totalSize += size;
            items[key] = {
                size: size,
                sizeKB: (size / 1024).toFixed(2)
            };
        }
        
        return {
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            itemCount: localStorage.length,
            items: items
        };
    } catch (error) {
        console.error('❌ Error getting storage info:', error);
        return null;
    }
}
