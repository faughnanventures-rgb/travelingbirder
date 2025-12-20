/**
 * Traveling Birder - eBird API Module
 * Handles all communication with the eBird API
 */

import { CONFIG } from './config.js';
import { state } from './state.js';

/**
 * Get recent observations for a geographic location
 */
export async function getObservations(lat, lng, radiusKm, days) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${radiusKm}&back=${days}&detail=full`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get recent observations for a region (state/county)
 */
export async function getRegionObservations(regionCode, days, maxResults = 10000) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/data/obs/${regionCode}/recent?maxResults=${maxResults}&back=${days}&detail=full`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get user's life list from eBird API
 */
export async function getLifeList(apiKey) {
    const url = `${CONFIG.EBIRD_API_BASE}/product/spplist/US`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': apiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get top observers for a region
 */
export async function getTopObservers(regionCode, year = new Date().getFullYear()) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/product/top100/${regionCode}/${year}/1/1`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get hotspots near a location
 */
export async function getHotspots(lat, lng, radiusKm) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/ref/hotspot/geo?lat=${lat}&lng=${lng}&dist=${radiusKm}&fmt=json`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get notable recent observations for a region
 */
export async function getNotableObservations(regionCode, days = 30) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/data/obs/${regionCode}/recent/notable?back=${days}&detail=full`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get species observations for a region
 */
export async function getSpeciesObservations(regionCode, speciesCode, days = 30) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/data/obs/${regionCode}/recent/${speciesCode}?back=${days}&detail=full`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get regional statistics
 */
export async function getRegionalStatistics(regionCode, year = new Date().getFullYear()) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/product/stats/${regionCode}/${year}/1/1`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Test API key validity
 */
export async function testApiKey(apiKey) {
    try {
        const url = `${CONFIG.EBIRD_API_BASE}/product/spplist/US`;
        const response = await fetch(url, {
            headers: { 'X-eBirdApiToken': apiKey }
        });
        return response.ok;
    } catch (error) {
        console.error('API key test failed:', error);
        return false;
    }
}

/**
 * Get subregion list (counties for a state)
 */
export async function getSubregions(regionCode) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/ref/region/list/subnational2/${regionCode}`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get recent checklists for a region
 */
export async function getRecentChecklists(regionCode, days = 7, maxResults = 10) {
    if (!state.userApiKey) {
        throw new Error('eBird API key not configured');
    }
    
    const url = `${CONFIG.EBIRD_API_BASE}/product/lists/${regionCode}?maxResults=${maxResults}`;
    
    const response = await fetch(url, {
        headers: { 'X-eBirdApiToken': state.userApiKey }
    });
    
    if (!response.ok) {
        throw new Error(`eBird API error: ${response.status}`);
    }
    
    return await response.json();
}
