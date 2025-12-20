/**
 * Traveling Birder - State Management Module
 * Centralized state management for the entire application
 */

// Application State
export const state = {
    // Google Maps
    map: null,
    directionsService: null,
    directionsRenderer: null,
    
    // User Authentication
    userApiKey: null,
    userName: null,
    ebirdAuthenticated: false,
    
    // User Data
    userList: new Set(),
    lifeListSource: null, // 'csv' or 'api'
    
    // Search Results (Unfiltered - for checklists/hotspots)
    allObservations: [],
    
    // Display Data (Filtered - for map markers)
    allSightings: [],
    allHotspots: [],
    allChecklists: [],
    
    // Target Species
    targetSpecies: [],
    expectedTargets: [],
    notableTargets: [],
    targetFrequencies: new Map(),
    
    // Map Markers
    markersArray: [],
    hotspotsArray: [],
    checklistsArray: [],
    
    // Route Planning
    currentRoute: null,
    tripWaypoints: [],
    routeDuration: '',
    
    // Saved Routes
    savedRoutes: [],
    
    // UI State
    currentPanel: null,
    isDarkMode: false,
    isLoading: false,
    
    // Autocomplete
    originAutocomplete: null,
    destinationAutocomplete: null,
    areaAutocomplete: null,
    speciesLocationAutocomplete: null
};

// State Update Function with Change Detection
export function setState(updates) {
    const changedKeys = [];
    
    for (const [key, value] of Object.entries(updates)) {
        if (state[key] !== value) {
            state[key] = value;
            changedKeys.push(key);
        }
    }
    
    if (changedKeys.length > 0) {
        console.log(`📝 State updated:`, changedKeys);
    }
    
    return changedKeys;
}

// Get State Value
export function getState(key) {
    return state[key];
}

// State Getters (Convenience Functions)
export function isAuthenticated() {
    return state.ebirdAuthenticated && state.userApiKey;
}

export function getTargetList() {
    const listType = document.getElementById('targetListType')?.value || 'all';
    
    if (listType === 'all') {
        return new Set();
    } else if (listType === 'life') {
        return state.userList;
    } else if (listType === 'year') {
        // Year list logic - filter to current year
        const currentYear = new Date().getFullYear();
        return new Set(Array.from(state.userList)); // Simplified for now
    } else if (listType === 'month') {
        // Month list logic
        return new Set(Array.from(state.userList)); // Simplified for now
    }
    
    return new Set();
}

// State Initialization
export function initializeState() {
    console.log('📋 Initializing application state...');
    
    // Load from localStorage if available
    const savedApiKey = localStorage.getItem('ebirdApiKey');
    const savedUserName = localStorage.getItem('ebirdUserName');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    setState({
        userApiKey: savedApiKey,
        userName: savedUserName,
        isDarkMode: savedDarkMode,
        ebirdAuthenticated: !!savedApiKey
    });
    
    console.log('✅ State initialized');
}

// Clear State (for logout)
export function clearUserState() {
    setState({
        userApiKey: null,
        userName: null,
        ebirdAuthenticated: false,
        userList: new Set(),
        lifeListSource: null,
        allObservations: [],
        allSightings: [],
        targetSpecies: [],
        expectedTargets: [],
        notableTargets: []
    });
    
    localStorage.removeItem('ebirdApiKey');
    localStorage.removeItem('ebirdUserName');
    localStorage.removeItem('userLifeList');
    localStorage.removeItem('lifeListSource');
    
    console.log('🔓 User state cleared');
}
