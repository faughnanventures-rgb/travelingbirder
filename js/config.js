/**
 * Traveling Birder - Configuration Module
 * Contains all constants, API endpoints, and configuration settings
 */

export const CONFIG = {
    // API Configuration
    EBIRD_API_BASE: 'https://api.ebird.org/v2',
    GOOGLE_MAPS_API_KEY: 'AIzaSyBvpU9tANBmnbKqMM2UWvELa9nRcrhneY0',
    
    // Search Constraints
    MAX_RADIUS_KM: 50,
    MAX_RADIUS_MILES: 31,
    DEFAULT_RADIUS: 15,
    DEFAULT_TIME_RANGE: 30,
    GRID_SPACING_MILES: 20,
    
    // Display Settings
    MAX_HOTSPOTS_DISPLAY: 10,
    MAX_CHECKLISTS_DISPLAY: 10,
    MAX_TOP_EBIRDERS: 10,
    
    // ABA Rarity Codes
    ABA_CODES: {
        1: { name: 'Common', color: '#10b981' },
        2: { name: 'Uncommon', color: '#fbbf24' },
        3: { name: 'Rare', color: '#f59e0b' },
        4: { name: 'Very Rare', color: '#ef4444' },
        5: { name: 'Mega Rare', color: '#a855f7' },
        6: { name: 'Extirpated', color: '#374151' }
    },
    
    // US States with eBird Region Codes
    REGIONS: [
        { name: 'Alabama', code: 'US-AL' },
        { name: 'Alaska', code: 'US-AK' },
        { name: 'Arizona', code: 'US-AZ' },
        { name: 'Arkansas', code: 'US-AR' },
        { name: 'California', code: 'US-CA' },
        { name: 'Colorado', code: 'US-CO' },
        { name: 'Connecticut', code: 'US-CT' },
        { name: 'Delaware', code: 'US-DE' },
        { name: 'Florida', code: 'US-FL' },
        { name: 'Georgia', code: 'US-GA' },
        { name: 'Hawaii', code: 'US-HI' },
        { name: 'Idaho', code: 'US-ID' },
        { name: 'Illinois', code: 'US-IL' },
        { name: 'Indiana', code: 'US-IN' },
        { name: 'Iowa', code: 'US-IA' },
        { name: 'Kansas', code: 'US-KS' },
        { name: 'Kentucky', code: 'US-KY' },
        { name: 'Louisiana', code: 'US-LA' },
        { name: 'Maine', code: 'US-ME' },
        { name: 'Maryland', code: 'US-MD' },
        { name: 'Massachusetts', code: 'US-MA' },
        { name: 'Michigan', code: 'US-MI' },
        { name: 'Minnesota', code: 'US-MN' },
        { name: 'Mississippi', code: 'US-MS' },
        { name: 'Missouri', code: 'US-MO' },
        { name: 'Montana', code: 'US-MT' },
        { name: 'Nebraska', code: 'US-NE' },
        { name: 'Nevada', code: 'US-NV' },
        { name: 'New Hampshire', code: 'US-NH' },
        { name: 'New Jersey', code: 'US-NJ' },
        { name: 'New Mexico', code: 'US-NM' },
        { name: 'New York', code: 'US-NY' },
        { name: 'North Carolina', code: 'US-NC' },
        { name: 'North Dakota', code: 'US-ND' },
        { name: 'Ohio', code: 'US-OH' },
        { name: 'Oklahoma', code: 'US-OK' },
        { name: 'Oregon', code: 'US-OR' },
        { name: 'Pennsylvania', code: 'US-PA' },
        { name: 'Rhode Island', code: 'US-RI' },
        { name: 'South Carolina', code: 'US-SC' },
        { name: 'South Dakota', code: 'US-SD' },
        { name: 'Tennessee', code: 'US-TN' },
        { name: 'Texas', code: 'US-TX' },
        { name: 'Utah', code: 'US-UT' },
        { name: 'Vermont', code: 'US-VT' },
        { name: 'Virginia', code: 'US-VA' },
        { name: 'Washington', code: 'US-WA' },
        { name: 'West Virginia', code: 'US-WV' },
        { name: 'Wisconsin', code: 'US-WI' },
        { name: 'Wyoming', code: 'US-WY' }
    ],
    
    // Storage Keys
    STORAGE_KEYS: {
        API_KEY: 'ebirdApiKey',
        USER_NAME: 'ebirdUserName',
        LIFE_LIST: 'userLifeList',
        LIFE_LIST_SOURCE: 'lifeListSource',
        SAVED_ROUTES: 'savedRoutes',
        DARK_MODE: 'darkMode'
    },
    
    // Feature Flags
    FEATURES: {
        DARK_MODE: true,
        CSV_IMPORT: true,
        ROUTE_SAVE: true,
        TOP_EBIRDERS: true,
        ENHANCED_EXPORT: true
    }
};

// Helper function to validate radius
export function validateAndConvertRadius(radiusMiles) {
    const miles = parseInt(radiusMiles) || CONFIG.DEFAULT_RADIUS;
    const clampedMiles = Math.min(miles, CONFIG.MAX_RADIUS_MILES);
    return Math.round(clampedMiles * 1.60934); // Convert to km
}

// Helper function to get ABA color
export function getABAColor(code) {
    return CONFIG.ABA_CODES[code]?.color || '#6b7280';
}

// Helper function to get region by code
export function getRegionByCode(code) {
    return CONFIG.REGIONS.find(r => r.code === code);
}
