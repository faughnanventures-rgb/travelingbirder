/**
 * Traveling Birder - Checklists Module
 * Handles checklist processing and display (v7.2 - uses unfiltered observations)
 */

import { state } from './state.js';

/**
 * Process checklists from observations
 * CRITICAL v7.2 FIX: Uses allObservations (unfiltered) not allSightings (filtered)
 */
export function processChecklists(observations = null) {
    const obs = observations || state.allObservations;
    
    if (!obs || obs.length === 0) {
        console.log('No observations to process for checklists');
        return [];
    }
    
    const checklistMap = new Map();
    
    // CRITICAL: Use unfiltered observations so checklist counts are accurate
    obs.forEach(observation => {
        if (observation.subId) {
            if (!checklistMap.has(observation.subId)) {
                checklistMap.set(observation.subId, {
                    subId: observation.subId,
                    locName: observation.locName,
                    locId: observation.locId,
                    lat: observation.lat,
                    lng: observation.lng,
                    obsDt: observation.obsDt,
                    species: new Set(),
                    observer: observation.userDisplayName || 'Unknown'
                });
            }
            checklistMap.get(observation.subId).species.add(observation.comName);
        }
    });
    
    const checklists = Array.from(checklistMap.values());
    console.log(`📋 Processed ${checklists.length} checklists from ${obs.length} observations`);
    
    return checklists;
}

/**
 * Rank checklists by species count
 */
export function rankChecklists(checklists, maxResults = 10) {
    if (!checklists || checklists.length === 0) {
        return [];
    }
    
    // Sort by species count (descending)
    const sorted = [...checklists].sort((a, b) => {
        return b.species.size - a.species.size;
    });
    
    // Return top N
    const top = sorted.slice(0, maxResults);
    
    console.log(`🏆 Top checklist has ${top[0]?.species.size || 0} species`);
    return top;
}

/**
 * Display checklists in UI
 */
export function displayChecklists(checklists = null, maxToShow = 10) {
    const container = document.getElementById('checklistsList');
    if (!container) {
        console.warn('Checklists container not found');
        return;
    }
    
    const lists = checklists || state.allChecklists;
    
    if (!lists || lists.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                No checklists found
            </div>
        `;
        return;
    }
    
    const topLists = lists.slice(0, maxToShow);
    
    container.innerHTML = topLists.map((checklist, index) => 
        createChecklistCard(checklist, index + 1)
    ).join('');
    
    console.log(`📋 Displayed ${topLists.length} checklists`);
}

/**
 * Create HTML card for a checklist
 */
function createChecklistCard(checklist, rank) {
    const speciesCount = checklist.species ? checklist.species.size : 0;
    const date = new Date(checklist.obsDt).toLocaleDateString();
    
    return `
        <div class="checklist-card" style="
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--bg-secondary);
            cursor: pointer;
            transition: all 0.2s;
        " onmouseover="this.style.background='var(--bg-tertiary)'" 
           onmouseout="this.style.background='var(--bg-secondary)'"
           onclick="window.focusOnChecklist(${checklist.lat}, ${checklist.lng})">
            
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95em;">
                        #${rank} - ${escapeHtml(checklist.locName || 'Unknown Location')}
                    </div>
                    <div style="font-size: 0.8em; color: var(--text-secondary); margin-top: 4px;">
                        📅 ${date} • 👤 ${escapeHtml(checklist.observer || 'Unknown')}
                    </div>
                </div>
                <div style="
                    background: #8b5cf6;
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
            
            ${checklist.subId ? `
                <div style="margin-top: 8px;">
                    <a href="https://ebird.org/checklist/${checklist.subId}" 
                       target="_blank"
                       onclick="event.stopPropagation()"
                       style="
                           color: #10b981;
                           text-decoration: none;
                           font-size: 0.85em;
                           font-weight: 600;
                       ">
                        View Checklist →
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Get checklist details
 */
export function getChecklistDetails(checklistId) {
    if (!state.allChecklists) return null;
    
    return state.allChecklists.find(c => c.subId === checklistId);
}

/**
 * Get checklists for a specific location
 */
export function getChecklistsForLocation(locId) {
    if (!state.allChecklists) return [];
    
    return state.allChecklists.filter(c => c.locId === locId);
}

/**
 * Get species list from checklist
 */
export function getChecklistSpecies(checklistId) {
    const checklist = getChecklistDetails(checklistId);
    if (!checklist || !checklist.species) return [];
    
    return Array.from(checklist.species);
}

/**
 * Compare two checklists
 */
export function compareChecklists(checklistId1, checklistId2) {
    const c1 = getChecklistDetails(checklistId1);
    const c2 = getChecklistDetails(checklistId2);
    
    if (!c1 || !c2) return null;
    
    const species1 = c1.species;
    const species2 = c2.species;
    
    const shared = new Set([...species1].filter(s => species2.has(s)));
    const unique1 = new Set([...species1].filter(s => !species2.has(s)));
    const unique2 = new Set([...species2].filter(s => !species1.has(s)));
    
    return {
        checklist1: c1,
        checklist2: c2,
        sharedSpecies: Array.from(shared),
        uniqueToFirst: Array.from(unique1),
        uniqueToSecond: Array.from(unique2),
        totalSpecies: species1.size + species2.size - shared.size
    };
}

/**
 * Get checklists within date range
 */
export function getChecklistsInDateRange(startDate, endDate) {
    if (!state.allChecklists) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return state.allChecklists.filter(c => {
        const date = new Date(c.obsDt);
        return date >= start && date <= end;
    });
}

/**
 * Get checklists by observer
 */
export function getChecklistsByObserver(observerName) {
    if (!state.allChecklists) return [];
    
    return state.allChecklists.filter(c => 
        c.observer && c.observer.toLowerCase().includes(observerName.toLowerCase())
    );
}

/**
 * Calculate checklist statistics
 */
export function getChecklistStatistics() {
    if (!state.allChecklists || state.allChecklists.length === 0) {
        return {
            totalChecklists: 0,
            totalSpecies: 0,
            averageSpeciesPerChecklist: 0,
            maxSpeciesInChecklist: 0,
            minSpeciesInChecklist: 0
        };
    }
    
    const allSpecies = new Set();
    let totalSpeciesCount = 0;
    let maxSpecies = 0;
    let minSpecies = Infinity;
    
    state.allChecklists.forEach(checklist => {
        const count = checklist.species.size;
        totalSpeciesCount += count;
        maxSpecies = Math.max(maxSpecies, count);
        minSpecies = Math.min(minSpecies, count);
        
        checklist.species.forEach(sp => allSpecies.add(sp));
    });
    
    return {
        totalChecklists: state.allChecklists.length,
        totalSpecies: allSpecies.size,
        averageSpeciesPerChecklist: (totalSpeciesCount / state.allChecklists.length).toFixed(1),
        maxSpeciesInChecklist: maxSpecies,
        minSpeciesInChecklist: minSpecies === Infinity ? 0 : minSpecies
    };
}

/**
 * Export checklists to array format
 */
export function exportChecklistsData() {
    if (!state.allChecklists) return [];
    
    return state.allChecklists.map(c => ({
        id: c.subId,
        location: c.locName,
        lat: c.lat,
        lng: c.lng,
        date: c.obsDt,
        observer: c.observer,
        speciesCount: c.species.size,
        species: Array.from(c.species),
        link: c.subId ? `https://ebird.org/checklist/${c.subId}` : null
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
 * Focus map on checklist location (global function)
 */
window.focusOnChecklist = function(lat, lng) {
    if (window.panTo) {
        window.panTo(lat, lng);
        window.setZoom(13);
    }
};
