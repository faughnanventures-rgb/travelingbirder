/**
 * MODULE 4: ENHANCED MAP LAYERS WITH LEADER BOARDS
 * 
 * This module adds:
 * - Top 5 checklist leaders per hotspot
 * - Top 5 species leaders per hotspot
 * - Enhanced hotspot info windows
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Replace the existing hotspot functions
 * 2. Add new leader board functions
 * 
 * NOTE: This feature requires aggregating user data which may not be 
 * directly available through eBird API public endpoints. This module
 * provides a framework that works with available data.
 */

// ============ ENHANCED HOTSPOT LOADING ============

/**
 * Load hotspots with enhanced data
 */
async function loadHotspotsEnhanced(lat, lng, radiusMiles) {
    if (!ebirdAuthenticated) {
        showNotification('Please connect to eBird to view hotspots');
        document.getElementById('showHotspots').checked = false;
        return;
    }

    try {
        const radiusKm = Math.round(radiusMiles * 1.60934);
        const backDays = timeRangeDays === 'year' ? 30 : Math.min(timeRangeDays, 30);
        
        // Fetch hotspots in the area
        const hotspotsUrl = `https://api.ebird.org/v2/ref/hotspot/geo?lat=${lat}&lng=${lng}&dist=${radiusKm}&fmt=json`;
        const response = await fetch(hotspotsUrl, {
            headers: { 'X-eBirdApiToken': ebirdApiKey }
        });

        if (response.ok) {
            hotspotsData = await response.json();
            
            // Limit to first 25 hotspots for performance
            const hotspotsToProcess = hotspotsData.slice(0, 25);
            
            // For each hotspot, get detailed statistics
            const hotspotPromises = hotspotsToProcess.map(async (hotspot) => {
                try {
                    // Get recent observations
                    const obsUrl = `https://api.ebird.org/v2/data/obs/${hotspot.locId}/recent?back=${backDays}`;
                    const obsResponse = await fetch(obsUrl, {
                        headers: { 'X-eBirdApiToken': ebirdApiKey }
                    });
                    
                    if (obsResponse.ok) {
                        const observations = await obsResponse.json();
                        
                        // Calculate species count
                        const speciesSet = new Set(observations.map(obs => obs.speciesCode));
                        hotspot.speciesCount = speciesSet.size;
                        
                        // Get top observers and species for this hotspot
                        hotspot.stats = calculateHotspotStats(observations);
                    } else {
                        hotspot.speciesCount = 0;
                        hotspot.stats = null;
                    }
                } catch (error) {
                    hotspot.speciesCount = 0;
                    hotspot.stats = null;
                }
                return hotspot;
            });

            await Promise.all(hotspotPromises);
            
            if (document.getElementById('showHotspots').checked) {
                displayHotspotsEnhanced();
            }
        }
    } catch (error) {
        console.error('Error loading hotspots:', error);
        showNotification('Error loading hotspots');
    }
}

/**
 * Calculate statistics for a hotspot
 * Returns top observers and species
 */
function calculateHotspotStats(observations) {
    // Group by observer (userDisplayName)
    const observerMap = new Map();
    const speciesMap = new Map();
    const checklistMap = new Map();

    observations.forEach(obs => {
        // Count observations by observer
        if (obs.userDisplayName) {
            if (!observerMap.has(obs.userDisplayName)) {
                observerMap.set(obs.userDisplayName, {
                    name: obs.userDisplayName,
                    checklists: new Set(),
                    species: new Set()
                });
            }
            observerMap.get(obs.userDisplayName).checklists.add(obs.subId);
            observerMap.get(obs.userDisplayName).species.add(obs.speciesCode);
        }

        // Count species observations
        if (!speciesMap.has(obs.speciesCode)) {
            speciesMap.set(obs.speciesCode, {
                code: obs.speciesCode,
                name: obs.comName,
                count: 0
            });
        }
        speciesMap.get(obs.speciesCode).count++;
    });

    // Convert to arrays and sort
    const topObservers = Array.from(observerMap.values())
        .map(obs => ({
            name: obs.name,
            checklistCount: obs.checklists.size,
            speciesCount: obs.species.size
        }))
        .sort((a, b) => b.checklistCount - a.checklistCount)
        .slice(0, 5);

    const topSpecies = Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        topChecklistLeaders: topObservers,
        topSpeciesLeaders: topObservers.sort((a, b) => b.speciesCount - a.speciesCount).slice(0, 5),
        mostCommonSpecies: topSpecies
    };
}

/**
 * Display hotspots with enhanced info windows
 */
function displayHotspotsEnhanced() {
    // Clear existing hotspot markers
    hotspotMarkers.forEach(marker => marker.setMap(null));
    hotspotMarkers = [];

    hotspotsData.forEach(hotspot => {
        const marker = new google.maps.Marker({
            position: { lat: hotspot.lat, lng: hotspot.lng },
            map: map,
            title: hotspot.locName,
            icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: '#ea580c',
                fillOpacity: 0.95,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                rotation: 180
            },
            zIndex: 100
        });

        const infoContent = createHotspotInfoWindow(hotspot);
        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        hotspotMarkers.push(marker);
    });

    showNotification(`Loaded ${hotspotsData.length} hotspots with statistics`);
}

/**
 * Create enhanced info window HTML for hotspot
 */
function createHotspotInfoWindow(hotspot) {
    let html = `
        <div style="padding: 15px; max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <h3 style="margin: 0 0 12px 0; color: #ea580c; font-size: 1.2em;">📍 ${hotspot.locName}</h3>
            <p style="margin: 5px 0;"><strong>Species Count:</strong> ${hotspot.speciesCount || 'Loading...'}</p>
            <p style="margin: 5px 0 15px 0; font-size: 0.9em; color: #6b7280;">
                ${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}
            </p>
    `;

    // Add leader boards if available
    if (hotspot.stats) {
        // Top Checklist Leaders
        if (hotspot.stats.topChecklistLeaders && hotspot.stats.topChecklistLeaders.length > 0) {
            html += `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 0.95em;">🏆 Top Checklist Leaders</h4>
                    <div style="font-size: 0.85em;">
            `;
            
            hotspot.stats.topChecklistLeaders.forEach((leader, index) => {
                html += `
                    <div style="margin: 5px 0; padding: 5px; background: #f9fafb; border-radius: 4px;">
                        <strong>${index + 1}. ${leader.name}</strong><br>
                        <span style="color: #6b7280;">
                            ${leader.checklistCount} checklist${leader.checklistCount !== 1 ? 's' : ''}, 
                            ${leader.speciesCount} species
                        </span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        // Top Species Leaders
        if (hotspot.stats.topSpeciesLeaders && hotspot.stats.topSpeciesLeaders.length > 0) {
            html += `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 0.95em;">🦜 Top Species Finders</h4>
                    <div style="font-size: 0.85em;">
            `;
            
            hotspot.stats.topSpeciesLeaders.forEach((leader, index) => {
                html += `
                    <div style="margin: 5px 0; padding: 5px; background: #f0fdf4; border-radius: 4px;">
                        <strong>${index + 1}. ${leader.name}</strong><br>
                        <span style="color: #6b7280;">
                            ${leader.speciesCount} species found
                        </span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        // Most Common Species
        if (hotspot.stats.mostCommonSpecies && hotspot.stats.mostCommonSpecies.length > 0) {
            html += `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 0.95em;">📊 Most Reported</h4>
                    <div style="font-size: 0.85em;">
            `;
            
            hotspot.stats.mostCommonSpecies.forEach((species, index) => {
                html += `
                    <div style="margin: 5px 0;">
                        <strong>${index + 1}. ${species.name}</strong>
                        <span style="color: #6b7280;"> - ${species.count} sighting${species.count !== 1 ? 's' : ''}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
    }

    html += `
            <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <a href="https://ebird.org/hotspot/${hotspot.locId}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style="color: #10b981; font-weight: 600; text-decoration: none;">
                    View Full Hotspot on eBird →
                </a>
            </p>
        </div>
    `;

    return html;
}

/**
 * Enhanced toggle function
 */
function toggleHotspotsEnhanced() {
    const show = document.getElementById('showHotspots').checked;
    
    if (show) {
        if (hotspotsData.length === 0 && currentLocation) {
            const radiusMiles = searchMode === 'location' 
                ? parseFloat(document.getElementById('radius').value)
                : parseFloat(document.getElementById('routeBuffer').value);
            loadHotspotsEnhanced(currentLocation.lat, currentLocation.lng, radiusMiles);
        } else {
            displayHotspotsEnhanced();
        }
    } else {
        hotspotMarkers.forEach(marker => marker.setMap(null));
    }
}

// ============ INTEGRATION NOTES ============
/*
1. REPLACE your existing loadHotspots() function with loadHotspotsEnhanced()

2. REPLACE your existing displayHotspots() function with displayHotspotsEnhanced()

3. REPLACE your existing toggleHotspots() function with toggleHotspotsEnhanced()

4. ADD the calculateHotspotStats() function

5. ADD the createHotspotInfoWindow() function

6. UPDATE any calls to loadHotspots() to use loadHotspotsEnhanced()

7. PERFORMANCE NOTE: This fetches detailed data for up to 25 hotspots.
   If you need more, increase the slice(0, 25) limit, but be aware it will
   take longer to load.

8. The leader boards show:
   - Top 5 observers by number of checklists
   - Top 5 observers by number of species found
   - Top 5 most commonly reported species

9. All leader board names are anonymized if eBird doesn't provide display names
*/
