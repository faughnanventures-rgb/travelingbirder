/**
 * Traveling Birder - Search Module
 * Handles all search operations (v7.2 - fixed checklist filtering)
 * CRITICAL: Uses global allObservations for accurate checklist counts
 */

import { state, setState, getTargetList } from './state.js';
import { getObservations, getRegionObservations, getHotspots } from './ebird-api.js';
import { showLoading, hideLoading, updateLoadingStatus, showBelowMapPanels } from './ui.js';
import { geocodeAddress, getRoute, displayRoute, centerMap, fitBounds } from './map.js';
import { displayBirds, displayHotspots as displayHotspotMarkers, displayChecklists as displayChecklistMarkers } from './markers.js';
import { processChecklists, rankChecklists, displayChecklists } from './checklists.js';
import { processHotspots, rankHotspots, displayHotspots } from './hotspots.js';
import { identifyTargets, displayTargetCards, applyTargetFilter } from './targets.js';
import { autoLoadTopEBirdersForRegion } from './top-ebirders.js';

/**
 * Perform region search with boundaries
 * v7.2 FIX: Stores allObservations for accurate checklists
 */
export async function performRegionSearch(regionCode, timeRange) {
    console.log(`🗺️ Searching region ${regionCode} (within boundaries only)`);
    showLoading('Searching region...');
    
    try {
        updateLoadingStatus(`Fetching observations from ${regionCode}...`);
        
        const observations = await getRegionObservations(regionCode, timeRange);
        console.log(`📍 Found ${observations.length} observations in ${regionCode}`);
        
        // v7.2 CRITICAL FIX: Store ALL unfiltered observations for checklists/hotspots
        state.allObservations = observations;
        
        // Deduplicate for display
        const uniqueObs = {};
        observations.forEach(obs => {
            const key = `${obs.lat}-${obs.lng}-${obs.speciesCode}`;
            if (!uniqueObs[key] || new Date(obs.obsDt) > new Date(uniqueObs[key].obsDt)) {
                uniqueObs[key] = obs;
            }
        });
        
        state.allSightings = Object.values(uniqueObs);
        console.log(`📍 ${state.allSightings.length} unique observations`);
        
        // Calculate targets
        const listType = document.getElementById('targetListType')?.value || 'all';
        const targetList = getTargetList();
        state.targetSpecies = listType === 'all' ? [] : state.allSightings.filter(obs => !targetList.has(obs.comName));
        console.log(`🎯 Found ${state.targetSpecies.length} target species`);
        
        // Process checklists from UNFILTERED observations
        const checklists = processChecklists(state.allObservations);
        const rankedChecklists = rankChecklists(checklists, 10);
        state.allChecklists = rankedChecklists;
        
        // Try to get hotspots (with error handling)
        try {
            // Use first observation location as reference
            if (state.allSightings.length > 0) {
                const refObs = state.allSightings[0];
                const hotspots = await getHotspots(refObs.lat, refObs.lng, 50);
                const rankedHotspots = rankHotspots(hotspots, 10);
                state.allHotspots = rankedHotspots;
            }
        } catch (hotspotError) {
            console.warn('⚠️ Could not load hotspots:', hotspotError);
            state.allHotspots = [];
        }
        
        // Display results
        displayBirds();
        displayChecklists(state.allChecklists);
        displayHotspots(state.allHotspots);
        displayHotspotMarkers(state.allHotspots);
        displayChecklistMarkers(state.allChecklists);
        displayTargetCards(state.targetSpecies);
        
        // Show panels
        showBelowMapPanels();
        
        // Auto-load top eBirders
        const regionName = regionCode.replace('US-', '');
        autoLoadTopEBirdersForRegion(regionCode, regionName);
        
        hideLoading();
        console.log('✅ Region search complete');
        
    } catch (error) {
        console.error('❌ Region search error:', error);
        hideLoading();
        throw error;
    }
}

/**
 * Perform grid search for large areas
 * v7.2 FIX: Uses global allObservations (not const)
 */
export async function performGridSearch(bounds, radiusKm, timeRange) {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Create grid of overlapping search points
    const gridSpacingMiles = 20;
    const gridSpacingDegrees = gridSpacingMiles / 69;
    
    const searchPoints = [];
    let latStep = sw.lat();
    while (latStep <= ne.lat()) {
        let lngStep = sw.lng();
        while (lngStep <= ne.lng()) {
            searchPoints.push({ lat: latStep, lng: lngStep });
            lngStep += gridSpacingDegrees;
        }
        latStep += gridSpacingDegrees;
    }
    
    console.log(`🎯 Creating ${searchPoints.length} overlapping search areas`);
    updateLoadingStatus(`Searching ${searchPoints.length} overlapping areas...`);
    
    // v7.2 CRITICAL FIX: Use global allObservations (NOT const allObservations)
    state.allObservations = [];
    const allHotspotsData = [];
    
    // Fetch from each grid point
    for (let i = 0; i < searchPoints.length; i++) {
        const point = searchPoints[i];
        const progress = Math.round(((i + 1) / searchPoints.length) * 100);
        updateLoadingStatus(`Searching area ${i + 1}/${searchPoints.length} (${progress}%)...`);
        
        try {
            const observations = await getObservations(point.lat, point.lng, radiusKm, timeRange);
            state.allObservations.push(...observations);
            
            // Progressive display every 5 searches
            if (i === 0 || (i + 1) % 5 === 0 || i === searchPoints.length - 1) {
                // Deduplicate
                const uniqueObs = {};
                state.allObservations.forEach(obs => {
                    const key = `${obs.speciesCode}-${obs.lat}-${obs.lng}-${obs.obsDt}`;
                    if (!uniqueObs[key]) uniqueObs[key] = obs;
                });
                state.allSightings = Object.values(uniqueObs);
                
                // Update targets
                const targetList = getTargetList();
                const listType = document.getElementById('targetListType')?.value || 'all';
                state.targetSpecies = listType === 'all' ? [] : state.allSightings.filter(obs => !targetList.has(obs.comName));
                
                // Display
                displayBirds();
                updateLoadingStatus(`Found ${state.allSightings.length} birds so far...`);
            }
        } catch (error) {
            console.warn(`⚠️ Error searching point ${i + 1}:`, error);
        }
        
        // Get hotspots from every 3rd point
        if (i % 3 === 0) {
            try {
                const hotspots = await getHotspots(point.lat, point.lng, radiusKm);
                allHotspotsData.push(...hotspots);
            } catch (error) {
                console.warn('⚠️ Could not load hotspots');
            }
        }
    }
    
    // Process final results
    const uniqueObs = {};
    state.allObservations.forEach(obs => {
        const key = `${obs.speciesCode}-${obs.lat}-${obs.lng}-${obs.obsDt}`;
        if (!uniqueObs[key]) uniqueObs[key] = obs;
    });
    state.allSightings = Object.values(uniqueObs);
    
    // Process checklists from unfiltered observations
    const checklists = processChecklists(state.allObservations);
    state.allChecklists = rankChecklists(checklists, 10);
    
    // Process hotspots
    const uniqueHotspots = {};
    allHotspotsData.forEach(h => {
        if (!uniqueHotspots[h.locId]) uniqueHotspots[h.locId] = h;
    });
    state.allHotspots = rankHotspots(Object.values(uniqueHotspots), 10);
    
    console.log(`✅ Grid search complete: ${state.allSightings.length} observations`);
}

/**
 * Plan route search
 * v7.2 FIX: Uses global allObservations (not const)
 */
export async function planRoute() {
    const origin = document.getElementById('origin')?.value;
    const destination = document.getElementById('destination')?.value;
    const radiusKm = parseInt(document.getElementById('searchRadius')?.value) || 15;
    const timeRange = parseInt(document.getElementById('timeRange')?.value) || 30;
    
    if (!origin || !destination) {
        alert('Please enter both origin and destination');
        return;
    }
    
    console.log(`🗺️ Planning route: ${origin} → ${destination}`);
    showLoading('Planning route...');
    
    try {
        // Get route
        updateLoadingStatus('Calculating route...');
        const result = await getRoute(origin, destination, state.tripWaypoints);
        displayRoute(result);
        
        const route = result.routes[0];
        const path = route.overview_path;
        const totalDistanceMiles = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1609.34;
        
        console.log(`📏 Total route distance: ${totalDistanceMiles.toFixed(1)} miles`);
        
        // Create overlapping search circles every 20 miles
        const searchIntervalMiles = 20;
        const numSearchPoints = Math.max(2, Math.ceil(totalDistanceMiles / searchIntervalMiles) + 1);
        
        // Sample points along route
        const samplePoints = [];
        const sampleInterval = Math.max(1, Math.floor(path.length / (numSearchPoints - 1)));
        
        for (let i = 0; i < path.length; i += sampleInterval) {
            samplePoints.push({
                lat: path[i].lat(),
                lng: path[i].lng()
            });
        }
        
        // Always include start and end
        if (samplePoints.length === 0 || samplePoints[0].lat !== path[0].lat()) {
            samplePoints.unshift({ lat: path[0].lat(), lng: path[0].lng() });
        }
        const lastPoint = path[path.length - 1];
        if (samplePoints[samplePoints.length - 1].lat !== lastPoint.lat()) {
            samplePoints.push({ lat: lastPoint.lat(), lng: lastPoint.lng() });
        }
        
        console.log(`📍 Searching ${samplePoints.length} overlapping areas along route`);
        
        // v7.2 CRITICAL FIX: Use global allObservations (NOT const)
        state.allObservations = [];
        const allHotspotsData = [];
        
        // Fetch from each search area
        for (let i = 0; i < samplePoints.length; i++) {
            const point = samplePoints[i];
            const progress = Math.round(((i + 1) / samplePoints.length) * 100);
            updateLoadingStatus(`Searching area ${i + 1}/${samplePoints.length} (${progress}%)...`);
            
            try {
                const observations = await getObservations(point.lat, point.lng, radiusKm, timeRange);
                state.allObservations.push(...observations);
                
                // Progressive display
                if (i === 0 || (i + 1) % 3 === 0 || i === samplePoints.length - 1) {
                    const uniqueObs = {};
                    state.allObservations.forEach(obs => {
                        const key = `${obs.speciesCode}-${obs.lat}-${obs.lng}-${obs.obsDt}`;
                        if (!uniqueObs[key]) uniqueObs[key] = obs;
                    });
                    state.allSightings = Object.values(uniqueObs);
                    
                    const targetList = getTargetList();
                    const listType = document.getElementById('targetListType')?.value || 'all';
                    state.targetSpecies = listType === 'all' ? [] : state.allSightings.filter(obs => !targetList.has(obs.comName));
                    
                    displayBirds();
                    updateLoadingStatus(`Found ${state.allSightings.length} birds so far...`);
                }
            } catch (error) {
                console.warn(`⚠️ Error searching point ${i + 1}:`, error);
            }
            
            // Get hotspots
            if (i % 2 === 0) {
                try {
                    const hotspots = await getHotspots(point.lat, point.lng, radiusKm);
                    allHotspotsData.push(...hotspots);
                } catch (error) {
                    console.warn('⚠️ Could not load hotspots');
                }
            }
        }
        
        // Final processing
        const uniqueObs = {};
        state.allObservations.forEach(obs => {
            const key = `${obs.speciesCode}-${obs.lat}-${obs.lng}-${obs.obsDt}`;
            if (!uniqueObs[key]) uniqueObs[key] = obs;
        });
        state.allSightings = Object.values(uniqueObs);
        
        // Process checklists and hotspots
        state.allChecklists = rankChecklists(processChecklists(state.allObservations), 10);
        
        const uniqueHotspots = {};
        allHotspotsData.forEach(h => {
            if (!uniqueHotspots[h.locId]) uniqueHotspots[h.locId] = h;
        });
        state.allHotspots = rankHotspots(Object.values(uniqueHotspots), 10);
        
        // Display everything
        displayBirds();
        displayChecklists(state.allChecklists);
        displayHotspots(state.allHotspots);
        displayHotspotMarkers(state.allHotspots);
        displayChecklistMarkers(state.allChecklists);
        displayTargetCards(state.targetSpecies);
        
        showBelowMapPanels();
        hideLoading();
        
        console.log(`✅ Route search complete: ${state.allSightings.length} observations`);
        
    } catch (error) {
        console.error('❌ Route planning error:', error);
        hideLoading();
        alert('Error planning route: ' + error.message);
    }
}

/**
 * Search area (state, county, or location)
 */
export async function searchArea() {
    const areaInput = document.getElementById('areaInput')?.value;
    const radiusKm = parseInt(document.getElementById('searchRadius')?.value) || 15;
    const timeRange = parseInt(document.getElementById('timeRange')?.value) || 30;
    const useRegionBoundaries = document.getElementById('useRegionBoundaries')?.checked || false;
    
    if (!areaInput) {
        alert('Please enter a location');
        return;
    }
    
    showLoading('Searching area...');
    
    try {
        // Check if it's a region code
        const regionCode = await getRegionCodeFromLocation(areaInput);
        
        if (regionCode && useRegionBoundaries) {
            // Use region search
            await performRegionSearch(regionCode, timeRange);
        } else {
            // Geocode and search
            updateLoadingStatus('Finding location...');
            const location = await geocodeAddress(areaInput);
            
            centerMap(location.lat, location.lng, 10);
            
            if (location.bounds) {
                // Large area - use grid search
                await performGridSearch(location.bounds, radiusKm, timeRange);
            } else {
                // Single point search
                const observations = await getObservations(location.lat, location.lng, radiusKm, timeRange);
                state.allObservations = observations;
                
                const uniqueObs = {};
                observations.forEach(obs => {
                    const key = `${obs.lat}-${obs.lng}-${obs.speciesCode}`;
                    if (!uniqueObs[key]) uniqueObs[key] = obs;
                });
                state.allSightings = Object.values(uniqueObs);
                
                const targetList = getTargetList();
                const listType = document.getElementById('targetListType')?.value || 'all';
                state.targetSpecies = listType === 'all' ? [] : state.allSightings.filter(obs => !targetList.has(obs.comName));
                
                state.allChecklists = rankChecklists(processChecklists(state.allObservations), 10);
                
                const hotspots = await getHotspots(location.lat, location.lng, radiusKm);
                state.allHotspots = rankHotspots(hotspots, 10);
                
                displayBirds();
                displayChecklists(state.allChecklists);
                displayHotspots(state.allHotspots);
                displayHotspotMarkers(state.allHotspots);
                displayChecklistMarkers(state.allChecklists);
                displayTargetCards(state.targetSpecies);
                
                showBelowMapPanels();
            }
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('❌ Area search error:', error);
        hideLoading();
        alert('Error searching area: ' + error.message);
    }
}

/**
 * Species-specific search
 */
export async function performSpeciesSearch(speciesCode, location, radiusKm, timeRange) {
    console.log(`🔍 Searching for ${speciesCode} near ${location}`);
    showLoading(`Searching for species...`);
    
    try {
        const geocoded = await geocodeAddress(location);
        centerMap(geocoded.lat, geocoded.lng, 10);
        
        // For species search, we search in a grid pattern
        const searchRadiusDegrees = (radiusKm * 1.60934) / 69; // Convert km to degrees
        
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(geocoded.lat - searchRadiusDegrees, geocoded.lng - searchRadiusDegrees),
            new google.maps.LatLng(geocoded.lat + searchRadiusDegrees, geocoded.lng + searchRadiusDegrees)
        );
        
        await performGridSearch(bounds, radiusKm, timeRange);
        
        // Filter to just the target species
        state.allSightings = state.allSightings.filter(obs => obs.speciesCode === speciesCode);
        state.targetSpecies = state.allSightings;
        
        displayBirds();
        displayTargetCards(state.targetSpecies);
        showBelowMapPanels();
        
        hideLoading();
        console.log(`✅ Found ${state.allSightings.length} observations of ${speciesCode}`);
        
    } catch (error) {
        console.error('❌ Species search error:', error);
        hideLoading();
        alert('Error searching for species: ' + error.message);
    }
}

/**
 * Get region code from location string
 */
async function getRegionCodeFromLocation(locationString) {
    const stateMap = {
        'alabama': 'US-AL', 'alaska': 'US-AK', 'arizona': 'US-AZ', 'arkansas': 'US-AR',
        'california': 'US-CA', 'colorado': 'US-CO', 'connecticut': 'US-CT', 'delaware': 'US-DE',
        'florida': 'US-FL', 'georgia': 'US-GA', 'hawaii': 'US-HI', 'idaho': 'US-ID',
        'illinois': 'US-IL', 'indiana': 'US-IN', 'iowa': 'US-IA', 'kansas': 'US-KS',
        'kentucky': 'US-KY', 'louisiana': 'US-LA', 'maine': 'US-ME', 'maryland': 'US-MD',
        'massachusetts': 'US-MA', 'michigan': 'US-MI', 'minnesota': 'US-MN', 'mississippi': 'US-MS',
        'missouri': 'US-MO', 'montana': 'US-MT', 'nebraska': 'US-NE', 'nevada': 'US-NV',
        'new hampshire': 'US-NH', 'new jersey': 'US-NJ', 'new mexico': 'US-NM', 'new york': 'US-NY',
        'north carolina': 'US-NC', 'north dakota': 'US-ND', 'ohio': 'US-OH', 'oklahoma': 'US-OK',
        'oregon': 'US-OR', 'pennsylvania': 'US-PA', 'rhode island': 'US-RI', 'south carolina': 'US-SC',
        'south dakota': 'US-SD', 'tennessee': 'US-TN', 'texas': 'US-TX', 'utah': 'US-UT',
        'vermont': 'US-VT', 'virginia': 'US-VA', 'washington': 'US-WA', 'west virginia': 'US-WV',
        'wisconsin': 'US-WI', 'wyoming': 'US-WY'
    };
    
    const location = locationString.toLowerCase();
    for (const [key, code] of Object.entries(stateMap)) {
        if (location.includes(key)) {
            return code;
        }
    }
    return null;
}
