/**
 * MODULE 3: TARGET SPECIES REPORT
 * 
 * This module adds:
 * - Collapsible report section below map
 * - List of target/notable species
 * - Most recent location and timestamp
 * - Links to checklists (opens in new tab)
 * - Auto-updates with search changes
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Add HTML section below the map (after </div> for map container)
 * 2. Add JavaScript functions
 * 3. Call loadTargetReport() after search functions
 */

// ============ HTML ADDITION ============
// Add this RIGHT AFTER the map container (around line 730, after the map div closes):

const TARGET_REPORT_HTML = `
<div class="container" style="margin-top: 20px; max-width: 1400px; margin-left: auto; margin-right: auto;">
    <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleTargetReport()">
            <h2 style="margin: 0; color: #065f46; font-size: 1.5em;">🎯 Target Species Report</h2>
            <span id="targetReportToggle" style="font-size: 1.5em; font-weight: bold; color: #10b981;">−</span>
        </div>
        
        <div id="targetReportContent" style="margin-top: 20px;">
            <div id="targetReportSummary" style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #10b981; margin-bottom: 20px;">
                <p style="margin: 0; color: #065f46; font-weight: 600;">
                    <span id="targetSpeciesCount">0</span> notable/rare species found in this area
                </p>
                <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #6b7280;">
                    Based on recent observations and rarity for this region
                </p>
            </div>
            
            <div id="targetReportList" style="display: grid; gap: 12px;">
                <!-- Target species cards will be inserted here -->
            </div>
            
            <div id="targetReportEmpty" style="display: none; text-align: center; padding: 40px; color: #6b7280;">
                <p style="font-size: 1.1em; margin: 0;">No target species found</p>
                <p style="margin: 10px 0 0 0; font-size: 0.9em;">
                    Perform a search to find notable birds in an area
                </p>
            </div>
        </div>
    </div>
</div>
`;

// ============ CSS ADDITIONS ============
// Add these styles to your <style> section:

const TARGET_REPORT_CSS = `
.target-species-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #10b981;
    border-radius: 8px;
    padding: 15px;
    transition: all 0.3s;
}

.target-species-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateX(4px);
}

.target-species-card h3 {
    margin: 0 0 10px 0;
    color: #065f46;
    font-size: 1.2em;
}

.target-species-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #f3f4f6;
}

.target-species-meta-item {
    font-size: 0.9em;
    color: #6b7280;
}

.target-species-meta-item strong {
    color: #374151;
    display: block;
    margin-bottom: 3px;
}

.target-checklist-link {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 16px;
    background: #10b981;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9em;
    transition: all 0.3s;
}

.target-checklist-link:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
`;

// ============ JAVASCRIPT FUNCTIONS ============

/**
 * Toggle target report visibility
 */
function toggleTargetReport() {
    const content = document.getElementById('targetReportContent');
    const toggle = document.getElementById('targetReportToggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '−';
    } else {
        content.style.display = 'none';
        toggle.textContent = '+';
    }
}

/**
 * Load and display target species report
 * Call this after loadTargetSpecies() completes
 */
async function loadTargetReport() {
    if (!ebirdAuthenticated) {
        document.getElementById('targetReportEmpty').style.display = 'block';
        document.getElementById('targetReportList').innerHTML = '';
        document.getElementById('targetSpeciesCount').textContent = '0';
        return;
    }

    if (!currentLocation) {
        return; // No search performed yet
    }

    const listElement = document.getElementById('targetReportList');
    const emptyElement = document.getElementById('targetReportEmpty');
    const countElement = document.getElementById('targetSpeciesCount');

    // targetSpecies should already be loaded by loadTargetSpecies()
    if (!targetSpecies || targetSpecies.length === 0) {
        emptyElement.style.display = 'block';
        listElement.innerHTML = '';
        countElement.textContent = '0';
        return;
    }

    emptyElement.style.display = 'none';
    countElement.textContent = targetSpecies.length;

    // Group observations by species
    const speciesMap = new Map();
    targetSpecies.forEach(obs => {
        if (!speciesMap.has(obs.speciesCode)) {
            speciesMap.set(obs.speciesCode, {
                code: obs.speciesCode,
                name: obs.comName,
                sciName: obs.sciName || '',
                observations: []
            });
        }
        speciesMap.get(obs.speciesCode).observations.push(obs);
    });

    // Sort species by most recent observation
    const sortedSpecies = Array.from(speciesMap.values()).sort((a, b) => {
        const dateA = new Date(a.observations[0].obsDt);
        const dateB = new Date(b.observations[0].obsDt);
        return dateB - dateA;
    });

    // Build HTML for each species
    const cardsHTML = sortedSpecies.map(species => {
        // Get most recent observation
        const mostRecent = species.observations.sort((a, b) => {
            return new Date(b.obsDt) - new Date(a.obsDt);
        })[0];

        const date = new Date(mostRecent.obsDt);
        const timeAgo = getTimeAgo(date);
        const onMyList = userSpeciesList.has(species.code);

        return `
            <div class="target-species-card">
                <h3>
                    ${species.name}
                    ${onMyList ? '<span style="background: #fbbf24; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.7em; margin-left: 8px;">ON YOUR LIST</span>' : ''}
                </h3>
                <p style="font-style: italic; color: #6b7280; margin: 5px 0;">${species.sciName}</p>
                
                <div class="target-species-meta">
                    <div class="target-species-meta-item">
                        <strong>📍 Location</strong>
                        ${mostRecent.locName}
                    </div>
                    <div class="target-species-meta-item">
                        <strong>🕐 Observed</strong>
                        ${timeAgo}
                    </div>
                    <div class="target-species-meta-item">
                        <strong>📊 Count</strong>
                        ${mostRecent.howMany || 'Present'}
                    </div>
                    <div class="target-species-meta-item">
                        <strong>👁️ Total Sightings</strong>
                        ${species.observations.length} in search area
                    </div>
                </div>
                
                <a href="https://ebird.org/checklist/${mostRecent.subId}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="target-checklist-link">
                    View Checklist →
                </a>
            </div>
        `;
    }).join('');

    listElement.innerHTML = cardsHTML;
}

/**
 * Helper function to get human-readable time ago
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
}

// ============ INTEGRATION NOTES ============
/*
1. ADD the TARGET_REPORT_HTML to your HTML after the map container closes
   (Search for: </div> <!-- map container end -->
   Add the HTML right after that)

2. ADD the TARGET_REPORT_CSS styles to your <style> section

3. ADD all the JavaScript functions from this module

4. UPDATE your loadAreaStatistics() function to call loadTargetReport() at the end:
   
   async function loadAreaStatistics(lat, lng, radiusMiles) {
       // ... existing code ...
       
       await loadTargetSpecies(lat, lng, radiusKm, backDays);
       
       // ADD THIS LINE:
       await loadTargetReport();
   }

5. UPDATE searchLocation() to call loadTargetReport():
   
   async function searchLocation() {
       // ... existing code ...
       await loadAreaStatistics(...);
       
       // ADD THIS LINE:
       await loadTargetReport();
   }

6. UPDATE searchRoute() to call loadTargetReport():
   
   async function searchRoute() {
       // ... existing code ...
       await loadAreaStatistics(...);
       
       // ADD THIS LINE:
       await loadTargetReport();
   }

7. Make sure all eBird checklist links use target="_blank":
   Example: <a href="https://ebird.org/checklist/..." target="_blank" rel="noopener noreferrer">
*/
