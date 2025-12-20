/**
 * Traveling Birder - Targets Module
 * Handles target species identification and display
 */

import { state, getTargetList } from './state.js';
import { getNotableObservations, getRegionalStatistics } from './ebird-api.js';
import { updateTargetCount } from './ui.js';
import { highlightSpecies } from './markers.js';

/**
 * Identify target species from observations
 */
export function identifyTargets(observations, userList) {
    if (!observations || observations.length === 0) {
        return [];
    }
    
    const targetList = userList || getTargetList();
    const listType = document.getElementById('targetListType')?.value || 'all';
    
    if (listType === 'all') {
        return []; // Show all species, no targets
    }
    
    // Filter to species not in user's list
    const targets = observations.filter(obs => !targetList.has(obs.comName));
    
    console.log(`🎯 Found ${targets.length} target species`);
    return targets;
}

/**
 * Get expected seasonal targets for a region
 */
export async function getExpectedTargets(regionCode, timeRange = 30) {
    try {
        // Fetch regional stats to determine expected species
        const stats = await getRegionalStatistics(regionCode);
        
        // For now, return empty - would need frequency data from eBird
        // This is a placeholder for future implementation with frequency API
        console.log('📊 Expected targets calculation pending frequency data');
        return [];
        
    } catch (error) {
        console.error('Error getting expected targets:', error);
        return [];
    }
}

/**
 * Get notable/rare targets for a region
 */
export async function getNotableTargets(regionCode, timeRange = 30) {
    try {
        const notable = await getNotableObservations(regionCode, timeRange);
        
        console.log(`⭐ Found ${notable.length} notable observations`);
        return notable;
        
    } catch (error) {
        console.error('Error getting notable targets:', error);
        return [];
    }
}

/**
 * Calculate frequency for target species
 */
export function calculateTargetFrequencies(targets, allObservations) {
    const frequencies = new Map();
    
    targets.forEach(target => {
        const count = allObservations.filter(obs => 
            obs.comName === target.comName
        ).length;
        
        const frequency = (count / allObservations.length) * 100;
        
        frequencies.set(target.comName, {
            count: count,
            frequency: frequency.toFixed(1),
            category: categor izeFrequency(frequency)
        });
    });
    
    state.targetFrequencies = frequencies;
    return frequencies;
}

/**
 * Categorize frequency into expected/notable/rare
 */
function categorizeFrequency(frequency) {
    if (frequency >= 30) return 'expected';
    if (frequency >= 10) return 'uncommon';
    if (frequency >= 1) return 'notable';
    return 'rare';
}

/**
 * Display target species cards
 */
export function displayTargetCards(targets) {
    const container = document.getElementById('targetList');
    if (!container) return;
    
    if (!targets || targets.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                No target species found in this search
            </div>
        `;
        updateTargetCount(0);
        return;
    }
    
    // Group by species name (deduplicate)
    const uniqueTargets = new Map();
    targets.forEach(obs => {
        if (!uniqueTargets.has(obs.comName)) {
            uniqueTargets.set(obs.comName, obs);
        }
    });
    
    const targetArray = Array.from(uniqueTargets.values());
    
    // Sort by rarity (ABA code) then alphabetically
    targetArray.sort((a, b) => {
        if (a.abaCode && b.abaCode && a.abaCode !== b.abaCode) {
            return b.abaCode - a.abaCode; // Higher ABA code first (rarer)
        }
        return (a.comName || '').localeCompare(b.comName || '');
    });
    
    container.innerHTML = targetArray.map(obs => createTargetCard(obs)).join('');
    updateTargetCount(targetArray.length);
    
    console.log(`📋 Displayed ${targetArray.length} target species cards`);
}

/**
 * Create HTML for a target species card
 */
function createTargetCard(obs) {
    const frequency = state.targetFrequencies?.get(obs.comName);
    const freqText = frequency ? 
        `${frequency.frequency}% (${frequency.count} sightings)` : 
        'Unknown frequency';
    
    const rarityBadge = getRarityBadge(obs.abaCode);
    
    return `
        <div class="target-card" onclick="window.highlightTargetSpecies('${escapeHtml(obs.comName)}')">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div>
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 1em;">
                        ${escapeHtml(obs.comName)}
                    </h4>
                    <div style="color: var(--text-secondary); font-size: 0.85em; font-style: italic; margin-top: 4px;">
                        ${escapeHtml(obs.sciName || '')}
                    </div>
                </div>
                ${rarityBadge}
            </div>
            <div style="font-size: 0.85em; color: var(--text-secondary); line-height: 1.5;">
                <div style="margin-bottom: 4px;">
                    <strong>📍</strong> ${escapeHtml(obs.locName || 'Unknown location')}
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>📅</strong> ${new Date(obs.obsDt).toLocaleDateString()}
                </div>
                <div>
                    <strong>📊</strong> ${freqText}
                </div>
            </div>
        </div>
    `;
}

/**
 * Get rarity badge HTML
 */
function getRarityBadge(abaCode) {
    if (!abaCode) return '';
    
    const badges = {
        1: { text: 'Common', color: '#10b981' },
        2: { text: 'Uncommon', color: '#fbbf24' },
        3: { text: 'Rare', color: '#f59e0b' },
        4: { text: 'Very Rare', color: '#ef4444' },
        5: { text: 'Mega Rare', color: '#a855f7' },
        6: { text: 'Extirpated', color: '#374151' }
    };
    
    const badge = badges[abaCode];
    if (!badge) return '';
    
    return `
        <span style="
            background: ${badge.color}; 
            color: white; 
            padding: 3px 8px; 
            border-radius: 4px; 
            font-size: 0.75em; 
            font-weight: 600;
            white-space: nowrap;
        ">
            ${badge.text}
        </span>
    `;
}

/**
 * Apply target filter to observations
 */
export function applyTargetFilter() {
    const listType = document.getElementById('targetListType')?.value || 'all';
    const abaFilter = document.getElementById('abaFilter')?.value || 'all';
    
    let filtered = state.allSightings;
    
    // Apply list type filter
    if (listType !== 'all') {
        const targetList = getTargetList();
        filtered = filtered.filter(obs => !targetList.has(obs.comName));
    }
    
    // Apply ABA rarity filter
    if (abaFilter !== 'all') {
        const minRarity = parseInt(abaFilter);
        filtered = filtered.filter(obs => 
            obs.abaCode && obs.abaCode >= minRarity
        );
    }
    
    state.targetSpecies = filtered;
    
    console.log(`🔍 Applied filters: ${filtered.length} species remain`);
    return filtered;
}

/**
 * Highlight target species on map (wrapper for markers module)
 */
export function highlightTargetSpecies(speciesName) {
    highlightSpecies(speciesName);
    
    // Also scroll to species in list if visible
    const cards = document.querySelectorAll('.target-card');
    cards.forEach(card => {
        if (card.textContent.includes(speciesName)) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            card.style.backgroundColor = 'var(--bg-tertiary)';
            setTimeout(() => {
                card.style.backgroundColor = '';
            }, 2000);
        }
    });
}

/**
 * Get target statistics
 */
export function getTargetStatistics() {
    const total = state.targetSpecies.length;
    const expected = state.expectedTargets?.length || 0;
    const notable = state.notableTargets?.length || 0;
    
    return {
        total: total,
        expected: expected,
        notable: notable,
        regular: total - expected - notable
    };
}

/**
 * Display target statistics
 */
export function displayTargetStatistics() {
    const stats = getTargetStatistics();
    const container = document.getElementById('targetStats');
    
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px;">
            <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                <div style="font-size: 1.5em; font-weight: 600; color: var(--text-primary);">
                    ${stats.total}
                </div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    Total Targets
                </div>
            </div>
            <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                <div style="font-size: 1.5em; font-weight: 600; color: #10b981;">
                    ${stats.expected}
                </div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    Expected
                </div>
            </div>
            <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                <div style="font-size: 1.5em; font-weight: 600; color: #f59e0b;">
                    ${stats.notable}
                </div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    Notable
                </div>
            </div>
            <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                <div style="font-size: 1.5em; font-weight: 600; color: #3b82f6;">
                    ${stats.regular}
                </div>
                <div style="font-size: 0.85em; color: var(--text-secondary);">
                    Regular
                </div>
            </div>
        </div>
    `;
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
 * Sort targets by various criteria
 */
export function sortTargets(targets, sortBy = 'name') {
    const sorted = [...targets];
    
    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => (a.comName || '').localeCompare(b.comName || ''));
            break;
        case 'rarity':
            sorted.sort((a, b) => (b.abaCode || 0) - (a.abaCode || 0));
            break;
        case 'date':
            sorted.sort((a, b) => new Date(b.obsDt) - new Date(a.obsDt));
            break;
        case 'frequency':
            sorted.sort((a, b) => {
                const freqA = state.targetFrequencies?.get(a.comName)?.frequency || 0;
                const freqB = state.targetFrequencies?.get(b.comName)?.frequency || 0;
                return freqB - freqA;
            });
            break;
    }
    
    return sorted;
}

/**
 * Filter targets by search query
 */
export function searchTargets(query) {
    if (!query || query.trim() === '') {
        return state.targetSpecies;
    }
    
    const searchTerm = query.toLowerCase();
    
    return state.targetSpecies.filter(obs =>
        (obs.comName || '').toLowerCase().includes(searchTerm) ||
        (obs.sciName || '').toLowerCase().includes(searchTerm) ||
        (obs.locName || '').toLowerCase().includes(searchTerm)
    );
}
