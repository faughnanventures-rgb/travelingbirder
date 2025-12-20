/**
 * Traveling Birder - Hotspots Module
 * Handles hotspot processing and display
 */

import { state } from './state.js';
import { getHotspots } from './ebird-api.js';

/**
 * Process hotspots data
 */
export function processHotspots(hotspots = null) {
    const spots = hotspots || state.allHotspots;
    
    if (!spots || spots.length === 0) {
        console.log('No hotspots to process');
        return [];
    }
    
    console.log(`🔥 Processed ${spots.length} hotspots`);
    return spots;
}

/**
 * Rank hotspots by species count
 */
export function rankHotspots(hotspots, maxResults = 10) {
    if (!hotspots || hotspots.length === 0) {
        return [];
    }
    
    // Sort by all-time species count (descending)
    const sorted = [...hotspots].sort((a, b) => {
        const countA = a.numSpeciesAllTime || 0;
        const countB = b.numSpeciesAllTime || 0;
        return countB - countA;
    });
    
    // Return top N
    const top = sorted.slice(0, maxResults);
    
    console.log(`🏆 Top hotspot has ${top[0]?.numSpeciesAllTime || 0} species all-time`);
    return top;
}

/**
 * Display hotspots in UI
 */
export function displayHotspots(hotspots = null, maxToShow = 10) {
    const container = document.getElementById('hotspotsList');
    if (!container) {
        console.warn('Hotspots container not found');
        return;
    }
    
    const spots = hotspots || state.allHotspots;
    
    if (!spots || spots.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                No hotspots found
            </div>
        `;
        return;
    }
    
    const topSpots = spots.slice(0, maxToShow);
    
    container.innerHTML = topSpots.map((hotspot, index) => 
        createHotspotCard(hotspot, index + 1)
    ).join('');
    
    console.log(`🔥 Displayed ${topSpots.length} hotspots`);
}

/**
 * Create HTML card for a hotspot
 */
function createHotspotCard(hotspot, rank) {
    const speciesCount = hotspot.numSpeciesAllTime || 'Unknown';
    
    return `
        <div class="hotspot-card" style="
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--bg-secondary);
            cursor: pointer;
            transition: all 0.2s;
        " onmouseover="this.style.background='var(--bg-tertiary)'" 
           onmouseout="this.style.background='var(--bg-secondary)'"
           onclick="window.focusOnHotspot(${hotspot.lat}, ${hotspot.lng})">
            
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95em;">
                        #${rank} - ${escapeHtml(hotspot.locName || 'Unknown Hotspot')}
                    </div>
                    ${hotspot.countryCode || hotspot.subnational1Code ? `
                        <div style="font-size: 0.8em; color: var(--text-secondary); margin-top: 4px;">
                            📍 ${hotspot.subnational1Code || hotspot.countryCode || ''}
                        </div>
                    ` : ''}
                </div>
                <div style="
                    background: #f59e0b;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.85em;
                    font-weight: 600;
                    white-space: nowrap;
                    margin-left: 10px;
                ">
                    ${speciesCount} species
                </div>
            </div>
            
            ${hotspot.lat && hotspot.lng ? `
                <div style="font-size: 0.8em; color: var(--text-secondary); margin-top: 8px;">
                    🗺️ ${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}
                </div>
            ` : ''}
            
            ${hotspot.locId ? `
                <div style="margin-top: 8px;">
                    <a href="https://ebird.org/hotspot/${hotspot.locId}" 
                       target="_blank"
                       onclick="event.stopPropagation()"
                       style="
                           color: #10b981;
                           text-decoration: none;
                           font-size: 0.85em;
                           font-weight: 600;
                       ">
                        View Hotspot →
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Get hotspot details
 */
export function getHotspotDetails(hotspotId) {
    if (!state.allHotspots) return null;
    
    return state.allHotspots.find(h => h.locId === hotspotId);
}

/**
 * Fetch hotspots near a location
 */
export async function fetchNearbyHotspots(lat, lng, radiusKm = 50) {
    try {
        const hotspots = await getHotspots(lat, lng, radiusKm);
        console.log(`🔥 Found ${hotspots.length} hotspots near ${lat}, ${lng}`);
        return hotspots;
    } catch (error) {
        console.error('Error fetching hotspots:', error);
        return [];
    }
}

/**
 * Get hotspots within bounds
 */
export function getHotspotsInBounds(bounds) {
    if (!state.allHotspots || !bounds) return [];
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    return state.allHotspots.filter(h => {
        return h.lat <= ne.lat() && h.lat >= sw.lat() &&
               h.lng <= ne.lng() && h.lng >= sw.lng();
    });
}

/**
 * Get hotspots by minimum species count
 */
export function getHotspotsByMinSpecies(minSpecies) {
    if (!state.allHotspots) return [];
    
    return state.allHotspots.filter(h => 
        (h.numSpeciesAllTime || 0) >= minSpecies
    );
}

/**
 * Search hotspots by name
 */
export function searchHotspots(query) {
    if (!state.allHotspots || !query) return state.allHotspots;
    
    const searchTerm = query.toLowerCase();
    
    return state.allHotspots.filter(h =>
        (h.locName || '').toLowerCase().includes(searchTerm) ||
        (h.locId || '').toLowerCase().includes(searchTerm)
    );
}

/**
 * Get hotspot statistics
 */
export function getHotspotStatistics() {
    if (!state.allHotspots || state.allHotspots.length === 0) {
        return {
            totalHotspots: 0,
            totalSpecies: 0,
            averageSpeciesPerHotspot: 0,
            maxSpeciesInHotspot: 0,
            minSpeciesInHotspot: 0
        };
    }
    
    const allSpecies = new Set();
    let totalSpeciesCount = 0;
    let maxSpecies = 0;
    let minSpecies = Infinity;
    
    state.allHotspots.forEach(hotspot => {
        const count = hotspot.numSpeciesAllTime || 0;
        totalSpeciesCount += count;
        maxSpecies = Math.max(maxSpecies, count);
        if (count > 0) {
            minSpecies = Math.min(minSpecies, count);
        }
    });
    
    return {
        totalHotspots: state.allHotspots.length,
        averageSpeciesPerHotspot: state.allHotspots.length > 0 ? 
            (totalSpeciesCount / state.allHotspots.length).toFixed(1) : 0,
        maxSpeciesInHotspot: maxSpecies,
        minSpeciesInHotspot: minSpecies === Infinity ? 0 : minSpecies
    };
}

/**
 * Compare hotspot diversity
 */
export function compareHotspotDiversity(hotspot1Id, hotspot2Id) {
    const h1 = getHotspotDetails(hotspot1Id);
    const h2 = getHotspotDetails(hotspot2Id);
    
    if (!h1 || !h2) return null;
    
    return {
        hotspot1: h1,
        hotspot2: h2,
        species1: h1.numSpeciesAllTime || 0,
        species2: h2.numSpeciesAllTime || 0,
        difference: Math.abs((h1.numSpeciesAllTime || 0) - (h2.numSpeciesAllTime || 0)),
        winner: (h1.numSpeciesAllTime || 0) > (h2.numSpeciesAllTime || 0) ? h1.locName : h2.locName
    };
}

/**
 * Get nearest hotspot to coordinates
 */
export function getNearestHotspot(lat, lng) {
    if (!state.allHotspots || state.allHotspots.length === 0) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    state.allHotspots.forEach(hotspot => {
        const distance = calculateDistance(lat, lng, hotspot.lat, hotspot.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = hotspot;
        }
    });
    
    return {
        hotspot: nearest,
        distanceMiles: minDistance.toFixed(2)
    };
}

/**
 * Calculate distance between two points (in miles)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Export hotspots data
 */
export function exportHotspotsData() {
    if (!state.allHotspots) return [];
    
    return state.allHotspots.map(h => ({
        id: h.locId,
        name: h.locName,
        lat: h.lat,
        lng: h.lng,
        speciesCount: h.numSpeciesAllTime,
        country: h.countryCode,
        region: h.subnational1Code,
        link: h.locId ? `https://ebird.org/hotspot/${h.locId}` : null
    }));
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Focus map on hotspot location (global function)
 */
window.focusOnHotspot = function(lat, lng) {
    if (window.panTo) {
        window.panTo(lat, lng);
        window.setZoom(13);
    }
};
