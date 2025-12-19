/**
 * Traveling Birder - CSV Export Module
 * Handles CSV import/export with enhanced columns
 */

import { state } from './state.js';
import { saveLifeList } from './storage.js';
import { showSuccess, showError, showInfo } from './ui.js';

/**
 * Import life list from eBird CSV file
 */
export function importLifeListCSV(file) {
    if (!file) {
        showError('No file selected');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            
            if (lines.length < 2) {
                showError('CSV file appears to be empty');
                return;
            }
            
            // Parse header
            const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const nameIndex = header.findIndex(h => 
                h.toLowerCase().includes('common name') || 
                h.toLowerCase() === 'species'
            );
            
            if (nameIndex === -1) {
                showError('Could not find species name column in CSV');
                return;
            }
            
            // Parse species
            const species = new Set();
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
                if (columns.length > nameIndex) {
                    const speciesName = columns[nameIndex];
                    if (speciesName) {
                        species.add(speciesName);
                    }
                }
            }
            
            if (species.size === 0) {
                showError('No species found in CSV file');
                return;
            }
            
            // Update state
            state.userList = species;
            state.lifeListSource = 'csv';
            
            // Save to localStorage
            saveLifeList(species, 'csv');
            
            // Update UI
            const statusEl = document.getElementById('ebirdStatus');
            if (statusEl) {
                statusEl.innerHTML = `✅ <strong>CSV Imported:</strong> ${species.size} species loaded`;
            }
            
            showSuccess(`Successfully imported ${species.size} species from CSV!`);
            console.log(`📥 Imported ${species.size} species from CSV`);
            
            // Close modal
            const modal = document.getElementById('csvImportModal');
            if (modal) modal.style.display = 'none';
            
        } catch (error) {
            console.error('CSV import error:', error);
            showError('Error parsing CSV file. Please check the format.');
        }
    };
    
    reader.onerror = function() {
        showError('Error reading file');
    };
    
    reader.readAsText(file);
}

/**
 * Export basic life list CSV
 */
export function exportLifeListCSV() {
    if (state.userList.size === 0) {
        showError('No life list to export');
        return;
    }
    
    const rows = [['Species Name']];
    state.userList.forEach(species => {
        rows.push([species]);
    });
    
    const filename = `life-list-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(rows, filename);
    
    console.log(`📥 Exported ${state.userList.size} species`);
}

/**
 * Export enhanced life list with additional columns
 */
export function exportEnhancedLifeList() {
    if (state.userList.size === 0) {
        showError('No life list to export. Connect to eBird or import CSV first.');
        return;
    }
    
    console.log(`📊 Exporting ${state.userList.size} species to enhanced CSV`);
    
    const rows = [
        ['Species Name', 'Scientific Name', 'Your Status', 'ABA Code']
    ];
    
    const speciesArray = Array.from(state.userList);
    
    speciesArray.forEach(species => {
        // Try to find additional data if available
        const obs = state.allObservations.find(o => o.comName === species);
        
        rows.push([
            species,
            obs?.sciName || '',
            'Seen',
            obs?.abaCode || ''
        ]);
    });
    
    const filename = `traveling-birder-life-list-enhanced-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(rows, filename);
    
    console.log(`✅ Exported ${rows.length - 1} species to ${filename}`);
}

/**
 * Export basic search results CSV
 */
export function exportSearchResults() {
    if (state.allSightings.length === 0) {
        showError('No search results to export');
        return;
    }
    
    const rows = [
        ['Species Name', 'Location', 'Date', 'Observer', 'How Many']
    ];
    
    state.allSightings.forEach(obs => {
        const date = new Date(obs.obsDt).toLocaleDateString();
        rows.push([
            obs.comName || '',
            obs.locName || '',
            date,
            obs.userDisplayName || 'Unknown',
            obs.howMany || ''
        ]);
    });
    
    const filename = `search-results-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(rows, filename);
    
    console.log(`📥 Exported ${state.allSightings.length} observations`);
}

/**
 * Export enhanced search results with 14 detailed columns
 */
export function exportEnhancedSearchResults() {
    if (state.allObservations.length === 0) {
        showError('No search results to export. Perform a search first.');
        return;
    }
    
    console.log(`📊 Exporting ${state.allObservations.length} observations to enhanced CSV`);
    
    const rows = [
        [
            'Species Name',
            'Scientific Name',
            'Location Name',
            'Latitude',
            'Longitude',
            'Date',
            'Time',
            'Observer',
            'Checklist Link',
            'Hotspot Rank',
            'Your Status',
            'ABA Code',
            'Target Type',
            'How Many'
        ]
    ];
    
    state.allObservations.forEach(obs => {
        // Determine hotspot rank
        let hotspotRank = '';
        if (state.allHotspots && state.allHotspots.length > 0) {
            const rankIndex = state.allHotspots.findIndex(h => h.locId === obs.locId);
            if (rankIndex >= 0 && rankIndex < 10) {
                hotspotRank = `#${rankIndex + 1}`;
            }
        }
        
        // Determine your status
        const yourStatus = state.userList.has(obs.comName) ? 'Seen' : 'Not Seen';
        
        // Determine target type
        let targetType = 'Regular';
        if (state.expectedTargets && state.expectedTargets.some(t => 
            (t.comName === obs.comName) || (t === obs.comName)
        )) {
            targetType = 'Expected Seasonal';
        } else if (state.notableTargets && state.notableTargets.some(t => 
            t.comName === obs.comName
        )) {
            targetType = 'Notable/Rare';
        }
        
        // Parse date/time
        const dateTime = new Date(obs.obsDt);
        const date = dateTime.toLocaleDateString();
        const time = dateTime.toLocaleTimeString();
        
        rows.push([
            obs.comName || '',
            obs.sciName || '',
            obs.locName || '',
            obs.lat || '',
            obs.lng || '',
            date,
            time,
            obs.userDisplayName || 'Unknown',
            obs.subId ? `https://ebird.org/checklist/${obs.subId}` : '',
            hotspotRank,
            yourStatus,
            obs.abaCode || '',
            targetType,
            obs.howMany || ''
        ]);
    });
    
    const filename = `traveling-birder-search-results-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(rows, filename);
    
    console.log(`✅ Exported ${rows.length - 1} observations to ${filename}`);
}

/**
 * Download CSV file
 */
function downloadCSV(rows, filename) {
    // Escape fields with commas or quotes
    const csvContent = rows.map(row =>
        row.map(field => {
            const str = String(field);
            // Escape fields that contain commas, quotes, or newlines
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
    console.log(`💾 Downloaded: ${filename}`);
}

/**
 * Export checklists to CSV
 */
export function exportChecklists() {
    if (state.allChecklists.length === 0) {
        showError('No checklists to export');
        return;
    }
    
    const rows = [
        ['Checklist ID', 'Location', 'Date', 'Observer', 'Species Count', 'Link']
    ];
    
    state.allChecklists.forEach(checklist => {
        const date = new Date(checklist.obsDt).toLocaleDateString();
        rows.push([
            checklist.subId || '',
            checklist.locName || '',
            date,
            checklist.observer || 'Unknown',
            checklist.species.size,
            checklist.subId ? `https://ebird.org/checklist/${checklist.subId}` : ''
        ]);
    });
    
    const filename = `checklists-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(rows, filename);
    
    console.log(`📥 Exported ${state.allChecklists.length} checklists`);
}

/**
 * Export hotspots to CSV
 */
export function exportHotspots() {
    if (state.allHotspots.length === 0) {
        showError('No hotspots to export');
        return;
    }
    
    const rows = [
        ['Hotspot Name', 'Latitude', 'Longitude', 'Species Count', 'Link']
    ];
    
    state.allHotspots.forEach(hotspot => {
        rows.push([
            hotspot.locName || '',
            hotspot.lat || '',
            hotspot.lng || '',
            hotspot.numSpeciesAllTime || '',
            hotspot.locId ? `https://ebird.org/hotspot/${hotspot.locId}` : ''
        ]);
    });
    
    const filename = `hotspots-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(rows, filename);
    
    console.log(`📥 Exported ${state.allHotspots.length} hotspots`);
}

/**
 * Export target species to CSV
 */
export function exportTargets() {
    if (state.targetSpecies.length === 0) {
        showError('No target species to export');
        return;
    }
    
    const rows = [
        ['Species Name', 'Location', 'Date', 'Latitude', 'Longitude', 'ABA Code']
    ];
    
    state.targetSpecies.forEach(obs => {
        const date = new Date(obs.obsDt).toLocaleDateString();
        rows.push([
            obs.comName || '',
            obs.locName || '',
            date,
            obs.lat || '',
            obs.lng || '',
            obs.abaCode || ''
        ]);
    });
    
    const filename = `targets-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(rows, filename);
    
    console.log(`📥 Exported ${state.targetSpecies.length} target species`);
}
