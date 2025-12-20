/**
 * Traveling Birder - Top eBirders Module
 * Handles Top 10 Regional eBirders panel
 */

import { state } from './state.js';
import { getTopObservers } from './ebird-api.js';
import { showLoading, hideLoading, updateLoadingStatus } from './ui.js';

/**
 * Load top eBirders for a region
 */
export async function loadTopEBirders(regionCode, year = new Date().getFullYear(), timePeriod = '1/1') {
    if (!regionCode) {
        console.error('Region code required for top eBirders');
        return [];
    }
    
    try {
        console.log(`🏆 Loading top eBirders for ${regionCode} (${year})`);
        showLoading('Loading top eBirders...');
        
        const data = await getTopObservers(regionCode, year);
        
        if (data && data.length > 0) {
            console.log(`✅ Found ${data.length} top eBirders`);
            return data;
        } else {
            console.log('⚠️ No top eBirders data found');
            return [];
        }
        
    } catch (error) {
        console.error('❌ Error loading top eBirders:', error);
        return [];
    } finally {
        hideLoading();
    }
}

/**
 * Display top eBirders in UI
 */
export function displayTopEBirders(data, regionName = 'Region') {
    const container = document.getElementById('topEBirdersList');
    if (!container) {
        console.warn('Top eBirders container not found');
        return;
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                No top eBirders data available for this region
            </div>
        `;
        return;
    }
    
    // Take top 10
    const top10 = data.slice(0, 10);
    
    container.innerHTML = `
        <div style="margin-bottom: 15px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 5px;">
                🏆 Top 10 eBirders - ${escapeHtml(regionName)}
            </div>
            <div style="font-size: 0.85em; color: var(--text-secondary);">
                Rankings based on ${new Date().getFullYear()} species count
            </div>
        </div>
        ${top10.map((birder, index) => createEBirderCard(birder, index + 1)).join('')}
    `;
    
    console.log(`🏆 Displayed top ${top10.length} eBirders for ${regionName}`);
}

/**
 * Create HTML card for an eBirder
 */
function createEBirderCard(birder, rank) {
    const speciesCount = birder.numSpecies || 0;
    const userName = birder.userDisplayName || 'Unknown Birder';
    
    return `
        <div class="ebirder-card" style="
            padding: 10px 12px;
            margin-bottom: 8px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--bg-secondary);
            transition: all 0.2s;
        " onmouseover="this.style.background='var(--bg-tertiary)'" 
           onmouseout="this.style.background='var(--bg-secondary)'">
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; flex: 1;">
                    <div style="
                        width: 28px;
                        height: 28px;
                        background: ${getRankColor(rank)};
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 0.85em;
                        margin-right: 10px;
                    ">
                        ${rank}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="
                            font-weight: 600;
                            color: var(--text-primary);
                            font-size: 0.9em;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">
                            ${escapeHtml(userName)}
                        </div>
                    </div>
                </div>
                <div style="
                    background: #10b981;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: 600;
                    white-space: nowrap;
                    margin-left: 10px;
                ">
                    ${speciesCount} sp
                </div>
            </div>
        </div>
    `;
}

/**
 * Get color for rank badge
 */
function getRankColor(rank) {
    if (rank === 1) return '#fbbf24'; // Gold
    if (rank === 2) return '#9ca3af'; // Silver
    if (rank === 3) return '#f59e0b'; // Bronze
    return '#6b7280'; // Gray for others
}

/**
 * Auto-load top eBirders for a region after search
 */
export async function autoLoadTopEBirdersForRegion(regionCode, regionName) {
    if (!regionCode) return;
    
    try {
        // Expand the panel
        const panel = document.getElementById('topEBirdersPanelContent');
        const toggle = document.getElementById('topEBirdersPanelToggle');
        
        if (panel && toggle) {
            panel.style.display = 'block';
            toggle.textContent = '−';
        }
        
        // Load data
        const data = await loadTopEBirders(regionCode);
        
        // Display
        if (data && data.length > 0) {
            displayTopEBirders(data, regionName);
        }
        
    } catch (error) {
        console.error('Error auto-loading top eBirders:', error);
    }
}

/**
 * Get recent addition for a specific eBirder
 */
export async function getRecentAddition(userName, regionCode) {
    try {
        updateLoadingStatus(`Checking recent additions for ${userName}...`);
        
        // This would require additional API calls to get user's recent observations
        // Placeholder for future implementation
        console.log(`📊 Recent additions check for ${userName} not yet implemented`);
        
        return null;
    } catch (error) {
        console.error('Error getting recent addition:', error);
        return null;
    }
}

/**
 * Compare user's list with top eBirder
 */
export function compareWithTopEBirder(birderSpeciesCount) {
    if (!state.userList || state.userList.size === 0) {
        return {
            userCount: 0,
            birderCount: birderSpeciesCount,
            difference: birderSpeciesCount,
            percentageOfTop: 0
        };
    }
    
    const userCount = state.userList.size;
    const difference = birderSpeciesCount - userCount;
    const percentage = ((userCount / birderSpeciesCount) * 100).toFixed(1);
    
    return {
        userCount: userCount,
        birderCount: birderSpeciesCount,
        difference: difference,
        percentageOfTop: percentage,
        message: difference > 0 ? 
            `You have ${Math.abs(difference)} fewer species than the top birder` :
            difference < 0 ?
            `You have ${Math.abs(difference)} more species than the top birder!` :
            `You're tied with the top birder!`
    };
}

/**
 * Get eBirder statistics
 */
export function getEBirderStatistics(data) {
    if (!data || data.length === 0) {
        return {
            totalBirders: 0,
            averageSpecies: 0,
            maxSpecies: 0,
            minSpecies: 0,
            medianSpecies: 0
        };
    }
    
    const speciesCounts = data.map(b => b.numSpecies || 0);
    const total = speciesCounts.reduce((sum, count) => sum + count, 0);
    
    // Sort for median
    const sorted = [...speciesCounts].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 ?
        (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 :
        sorted[Math.floor(sorted.length / 2)];
    
    return {
        totalBirders: data.length,
        averageSpecies: (total / data.length).toFixed(1),
        maxSpecies: Math.max(...speciesCounts),
        minSpecies: Math.min(...speciesCounts),
        medianSpecies: median
    };
}

/**
 * Search top eBirders by name
 */
export function searchTopEBirders(data, query) {
    if (!data || !query) return data;
    
    const searchTerm = query.toLowerCase();
    
    return data.filter(birder =>
        (birder.userDisplayName || '').toLowerCase().includes(searchTerm)
    );
}

/**
 * Get eBirder rank by username
 */
export function getEBirderRank(data, userName) {
    if (!data || !userName) return null;
    
    const index = data.findIndex(b => 
        b.userDisplayName && b.userDisplayName.toLowerCase() === userName.toLowerCase()
    );
    
    if (index === -1) return null;
    
    return {
        rank: index + 1,
        birder: data[index],
        isTop10: index < 10
    };
}

/**
 * Display eBirder comparison
 */
export function displayEBirderComparison(comparison) {
    const container = document.getElementById('eBirderComparison');
    if (!container) return;
    
    container.innerHTML = `
        <div style="padding: 15px; background: var(--bg-tertiary); border-radius: 6px; margin-top: 10px;">
            <h4 style="margin: 0 0 10px 0; color: var(--text-primary); font-size: 0.95em;">
                📊 Your Progress
            </h4>
            <div style="font-size: 0.9em; line-height: 1.6; color: var(--text-secondary);">
                <div>Your Species: <strong>${comparison.userCount}</strong></div>
                <div>Top Birder: <strong>${comparison.birderCount}</strong></div>
                <div>You're at <strong>${comparison.percentageOfTop}%</strong> of the top birder</div>
                <div style="margin-top: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px; color: var(--text-primary);">
                    ${comparison.message}
                </div>
            </div>
        </div>
    `;
}

/**
 * Refresh top eBirders data
 */
export async function refreshTopEBirders(regionCode, regionName) {
    const data = await loadTopEBirders(regionCode);
    if (data && data.length > 0) {
        displayTopEBirders(data, regionName);
        
        // If user has a life list, show comparison
        if (state.userList && state.userList.size > 0 && data[0]) {
            const comparison = compareWithTopEBirder(data[0].numSpecies);
            displayEBirderComparison(comparison);
        }
    }
}

/**
 * Export top eBirders data
 */
export function exportTopEBirdersData(data) {
    if (!data) return [];
    
    return data.map((birder, index) => ({
        rank: index + 1,
        name: birder.userDisplayName,
        speciesCount: birder.numSpecies,
        location: birder.location || 'Unknown'
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
