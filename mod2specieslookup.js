/**
 * MODULE 2: SPECIES LOOKUP (Replaces Alert System)
 * 
 * This module adds:
 * - Species lookup with autocomplete
 * - Global view option
 * - Display all sightings of selected species
 * - Remove alert system completely
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Replace the "View Species" and "Active Alerts" sections
 * 2. Add JavaScript functions
 * 3. Remove all alert-related code
 */

// ============ HTML REPLACEMENT ============
// Replace lines 896-937 (Map Layers through Active Alerts) with this:

const SPECIES_LOOKUP_HTML = `
<div class="section">
    <h3>🗺️ Map Layers</h3>
    <div class="checkbox-group">
        <div class="checkbox-item">
            <input type="checkbox" id="showHotspots" onchange="toggleHotspots()">
            <label for="showHotspots">Show eBird Hotspots</label>
        </div>
        <div class="checkbox-item">
            <input type="checkbox" id="showTopChecklists" onchange="toggleTopChecklists()">
            <label for="showTopChecklists">Show Top 10 Checklists</label>
        </div>
    </div>
</div>

<div class="section">
    <h3>🔍 Species Lookup</h3>
    <div class="input-group" style="position: relative;">
        <label>Search for Species</label>
        <input 
            type="text" 
            id="speciesLookupSearch" 
            placeholder="Start typing species name..."
            autocomplete="off"
            oninput="searchSpeciesLookup()"
            onfocus="showSpeciesDropdownLookup()"
        >
        <div id="speciesLookupDropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 2px solid #10b981; border-radius: 8px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); margin-top: 5px;"></div>
    </div>
    
    <div class="checkbox-group" style="margin-top: 10px;">
        <div class="checkbox-item">
            <input type="checkbox" id="globalView">
            <label for="globalView">Show globally (not limited to search area)</label>
        </div>
    </div>
    
    <button onclick="lookupSpecies()" style="margin-top: 10px;">Find This Species</button>
    <button onclick="clearSpeciesLookup()" style="background: #6b7280; margin-top: 5px;">Clear Species</button>
    
    <div id="speciesLookupInfo" style="margin-top: 15px; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #10b981; display: none;">
        <strong style="color: #065f46;">Currently Showing:</strong>
        <p id="currentSpeciesName" style="margin: 5px 0; color: #374151;"></p>
        <p id="currentSpeciesCount" style="margin: 5px 0; font-size: 0.9em; color: #6b7280;"></p>
    </div>
</div>
`;

// ============ JAVASCRIPT FUNCTIONS ============

// Global variables for species lookup
let selectedSpeciesLookup = null;
let speciesLookupActive = false;

/**
 * Search species for lookup (similar to alert search but different purpose)
 */
function searchSpeciesLookup() {
    const input = document.getElementById('speciesLookupSearch').value.toLowerCase();
    const dropdown = document.getElementById('speciesLookupDropdown');
    
    if (!input || input.length < 2) {
        dropdown.style.display = 'none';
        return;
    }

    if (allSpecies.length === 0) {
        dropdown.innerHTML = '<div style="padding: 10px; color: #6b7280;">Loading species taxonomy...</div>';
        dropdown.style.display = 'block';
        return;
    }

    const matches = allSpecies
        .filter(sp => 
            sp.comName.toLowerCase().includes(input) || 
            sp.sciName.toLowerCase().includes(input)
        )
        .slice(0, 20);

    if (matches.length === 0) {
        dropdown.innerHTML = '<div style="padding: 10px; color: #6b7280;">No species found</div>';
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = matches.map(sp => `
        <div 
            style="padding: 10px; cursor: pointer; border-bottom: 1px solid #e9ecef;"
            onmouseover="this.style.background='#f0fdf4'"
            onmouseout="this.style.background='white'"
            onclick="selectSpeciesLookup('${sp.speciesCode}', '${sp.comName.replace(/'/g, "\\'")}')"
        >
            <strong style="color: #10b981;">${sp.comName}</strong><br>
            <small style="color: #6b7280; font-style: italic;">${sp.sciName}</small>
        </div>
    `).join('');
    
    dropdown.style.display = 'block';
}

function selectSpeciesLookup(speciesCode, commonName) {
    selectedSpeciesLookup = { code: speciesCode, name: commonName };
    document.getElementById('speciesLookupSearch').value = commonName;
    document.getElementById('speciesLookupDropdown').style.display = 'none';
}

function showSpeciesDropdownLookup() {
    if (allSpecies.length === 0 && ebirdAuthenticated) {
        loadSpeciesTaxonomy();
    }
}

/**
 * Lookup and display all sightings of selected species
 */
async function lookupSpecies() {
    if (!selectedSpeciesLookup) {
        alert('Please search and select a species');
        return;
    }

    if (!ebirdAuthenticated) {
        alert('Please connect to eBird first');
        return;
    }

    const globalView = document.getElementById('globalView').checked;
    speciesLookupActive = true;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    showNotification('Searching for ' + selectedSpeciesLookup.name + '...');

    try {
        let observations = [];
        const backDays = timeRangeDays === 'year' ? 30 : Math.min(timeRangeDays, 30);

        if (globalView) {
            // Search globally using hotspot/region query
            // For US, search by state or use notable sightings
            if (currentLocation) {
                const regionInfo = extractRegionInfo(selectedRegion.state || selectedRegion.county);
                if (regionInfo && regionInfo.stateCode) {
                    // Search by state
                    const stateCode = 'US-' + regionInfo.stateCode;
                    const url = `https://api.ebird.org/v2/data/obs/${stateCode}/recent/${selectedSpeciesLookup.code}?back=${backDays}`;
                    
                    const response = await fetch(url, {
                        headers: { 'X-eBirdApiToken': ebirdApiKey }
                    });

                    if (response.ok) {
                        observations = await response.json();
                    }
                }
            }
        } else {
            // Search within current search area
            if (!currentLocation) {
                alert('Please perform a location search first');
                return;
            }

            const radiusMiles = parseFloat(document.getElementById('radius').value) || 15;
            const radiusKm = radiusMiles * 1.60934;

            const url = `https://api.ebird.org/v2/data/obs/geo/recent/${selectedSpeciesLookup.code}?lat=${currentLocation.lat}&lng=${currentLocation.lng}&dist=${radiusKm}&back=${backDays}`;
            
            const response = await fetch(url, {
                headers: { 'X-eBirdApiToken': ebirdApiKey }
            });

            if (response.ok) {
                observations = await response.json();
            }
        }

        if (observations.length === 0) {
            showNotification('No recent sightings found for ' + selectedSpeciesLookup.name);
            document.getElementById('speciesLookupInfo').style.display = 'none';
            return;
        }

        // Display markers for each sighting
        observations.forEach(obs => {
            const onMyList = userSpeciesList.has(obs.speciesCode);
            
            const marker = new google.maps.Marker({
                position: { lat: obs.lat, lng: obs.lng },
                map: map,
                title: obs.comName,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#10b981',
                    fillOpacity: 1,
                    strokeColor: onMyList ? '#fbbf24' : '#ffffff',
                    strokeWeight: onMyList ? 4 : 2
                }
            });

            const date = new Date(obs.obsDt);
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px;">
                        <h3 style="margin: 0 0 10px 0; color: #10b981;">${obs.comName}</h3>
                        <p><strong>Location:</strong> ${obs.locName}</p>
                        <p><strong>Date:</strong> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
                        <p><strong>Count:</strong> ${obs.howMany || 'X'}</p>
                        ${onMyList ? '<p style="color: #fbbf24; font-weight: 600;">✓ On your list</p>' : ''}
                        <a href="https://ebird.org/checklist/${obs.subId}" target="_blank" style="color: #10b981; font-weight: 600;">View Checklist →</a>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });

            markers.push(marker);
        });

        // Update info box
        document.getElementById('currentSpeciesName').textContent = selectedSpeciesLookup.name;
        document.getElementById('currentSpeciesCount').textContent = 
            `${observations.length} sighting${observations.length === 1 ? '' : 's'} found ${globalView ? 'globally' : 'in search area'}`;
        document.getElementById('speciesLookupInfo').style.display = 'block';

        // Zoom to fit all markers
        if (observations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            observations.forEach(obs => {
                bounds.extend({ lat: obs.lat, lng: obs.lng });
            });
            map.fitBounds(bounds);
        }

        showNotification(`Found ${observations.length} sighting(s) of ${selectedSpeciesLookup.name}`);

    } catch (error) {
        console.error('Species lookup error:', error);
        showNotification('Error searching for species');
    }
}

/**
 * Clear species lookup and restore normal view
 */
function clearSpeciesLookup() {
    selectedSpeciesLookup = null;
    speciesLookupActive = false;
    document.getElementById('speciesLookupSearch').value = '';
    document.getElementById('speciesLookupInfo').style.display = 'none';
    document.getElementById('globalView').checked = false;
    
    // Clear markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Restore original search if there was one
    if (currentLocation) {
        const radiusMiles = parseFloat(document.getElementById('radius').value);
        const radiusKm = radiusMiles * 1.60934;
        displaySightings(currentLocation, radiusKm);
    }
    
    showNotification('Species lookup cleared');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('speciesLookupDropdown');
    const input = document.getElementById('speciesLookupSearch');
    
    if (dropdown && input && event.target !== dropdown && event.target !== input) {
        dropdown.style.display = 'none';
    }
});

// ============ INTEGRATION NOTES ============
/*
1. REMOVE these sections from your HTML:
   - The "View Species" section (old alert input)
   - The "Active Alerts" section
   - All alert-related variables and functions

2. REMOVE these JavaScript functions:
   - addAlert()
   - removeAlert()
   - updateAlertsList()
   - updateAlertCount()
   - checkAlerts()

3. REMOVE these global variables:
   - alerts = []
   - Any alert-related state

4. ADD the SPECIES_LOOKUP_HTML to replace those sections

5. ADD all the JavaScript functions from this module

6. UPDATE any references to the old alert system

7. Make sure all external links have target="_blank":
   Find all: <a href="https://
   Replace with: <a href="https://... target="_blank" rel="noopener noreferrer">
*/
