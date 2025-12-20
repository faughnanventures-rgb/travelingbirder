/**
 * Traveling Birder - Markers Module
 * Handles creation and management of map markers
 */

import { state } from './state.js';
import { getABAColor } from './config.js';
import { createInfoWindow } from './map.js';

/**
 * Create bird observation marker
 */
export function createBirdMarker(observation, type = 'target') {
    if (!state.map) return null;
    
    const color = getMarkerColor(observation, type);
    const icon = createMarkerIcon(color);
    
    const marker = new google.maps.Marker({
        position: { lat: observation.lat, lng: observation.lng },
        map: state.map,
        title: observation.comName,
        icon: icon,
        animation: google.maps.Animation.DROP
    });
    
    const infoWindow = createBirdInfoWindow(observation);
    
    marker.addListener('click', () => {
        closeAllInfoWindows();
        infoWindow.open(state.map, marker);
    });
    
    marker.observation = observation;
    marker.infoWindow = infoWindow;
    
    return marker;
}

/**
 * Create hotspot marker
 */
export function createHotspotMarker(hotspot, rank = null) {
    if (!state.map) return null;
    
    const label = rank ? `${rank}` : '';
    
    const marker = new google.maps.Marker({
        position: { lat: hotspot.lat, lng: hotspot.lng },
        map: state.map,
        title: hotspot.locName,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#f59e0b',
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2
        },
        label: {
            text: label,
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold'
        },
        zIndex: 1000
    });
    
    const infoWindow = createHotspotInfoWindow(hotspot, rank);
    
    marker.addListener('click', () => {
        closeAllInfoWindows();
        infoWindow.open(state.map, marker);
    });
    
    marker.hotspot = hotspot;
    marker.infoWindow = infoWindow;
    
    return marker;
}

/**
 * Create checklist marker
 */
export function createChecklistMarker(checklist, rank = null) {
    if (!state.map) return null;
    
    const label = rank ? `${rank}` : '';
    
    const marker = new google.maps.Marker({
        position: { lat: checklist.lat, lng: checklist.lng },
        map: state.map,
        title: checklist.locName,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#8b5cf6',
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2
        },
        label: {
            text: label,
            color: '#fff',
            fontSize: '11px',
            fontWeight: 'bold'
        },
        zIndex: 999
    });
    
    const infoWindow = createChecklistInfoWindow(checklist, rank);
    
    marker.addListener('click', () => {
        closeAllInfoWindows();
        infoWindow.open(state.map, marker);
    });
    
    marker.checklist = checklist;
    marker.infoWindow = infoWindow;
    
    return marker;
}

/**
 * Get marker color based on observation type
 */
function getMarkerColor(observation, type) {
    if (type === 'notable' || type === 'rare') {
        return '#ef4444'; // Red for notable/rare
    }
    
    if (type === 'expected') {
        return '#10b981'; // Green for expected
    }
    
    // Use ABA code color
    if (observation.abaCode) {
        return getABAColor(observation.abaCode);
    }
    
    return '#3b82f6'; // Blue default
}

/**
 * Create custom marker icon
 */
function createMarkerIcon(color) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: color,
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: 2
    };
}

/**
 * Create info window for bird observation
 */
function createBirdInfoWindow(obs) {
    const content = `
        <div style="max-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 1.1em;">
                ${obs.comName}
            </h3>
            <div style="color: #6b7280; font-style: italic; margin-bottom: 10px; font-size: 0.9em;">
                ${obs.sciName || ''}
            </div>
            <div style="line-height: 1.6; font-size: 0.9em;">
                <div style="margin-bottom: 5px;">
                    <strong>📍 Location:</strong> ${obs.locName || 'Unknown'}
                </div>
                <div style="margin-bottom: 5px;">
                    <strong>📅 Date:</strong> ${new Date(obs.obsDt).toLocaleDateString()}
                </div>
                ${obs.howMany ? `<div style="margin-bottom: 5px;"><strong>🔢 Count:</strong> ${obs.howMany}</div>` : ''}
                ${obs.userDisplayName ? `<div style="margin-bottom: 5px;"><strong>👤 Observer:</strong> ${obs.userDisplayName}</div>` : ''}
                ${obs.abaCode ? `<div style="margin-bottom: 5px;"><strong>⭐ ABA Code:</strong> ${obs.abaCode}</div>` : ''}
            </div>
            ${obs.subId ? `
                <div style="margin-top: 10px;">
                    <a href="https://ebird.org/checklist/${obs.subId}" target="_blank" 
                       style="color: #10b981; text-decoration: none; font-weight: 600;">
                        View Checklist →
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    return createInfoWindow(content);
}

/**
 * Create info window for hotspot
 */
function createHotspotInfoWindow(hotspot, rank) {
    const content = `
        <div style="max-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 1.1em;">
                ${rank ? `#${rank} - ` : ''}${hotspot.locName}
            </h3>
            <div style="line-height: 1.6; font-size: 0.9em;">
                ${hotspot.numSpeciesAllTime ? `
                    <div style="margin-bottom: 5px;">
                        <strong>🐦 Total Species:</strong> ${hotspot.numSpeciesAllTime}
                    </div>
                ` : ''}
                ${hotspot.lat && hotspot.lng ? `
                    <div style="margin-bottom: 5px;">
                        <strong>📍 Coordinates:</strong> ${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}
                    </div>
                ` : ''}
            </div>
            ${hotspot.locId ? `
                <div style="margin-top: 10px;">
                    <a href="https://ebird.org/hotspot/${hotspot.locId}" target="_blank" 
                       style="color: #10b981; text-decoration: none; font-weight: 600;">
                        View Hotspot →
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    return createInfoWindow(content);
}

/**
 * Create info window for checklist
 */
function createChecklistInfoWindow(checklist, rank) {
    const speciesCount = checklist.species ? checklist.species.size : 0;
    
    const content = `
        <div style="max-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 1.1em;">
                ${rank ? `#${rank} - ` : ''}Checklist
            </h3>
            <div style="line-height: 1.6; font-size: 0.9em;">
                <div style="margin-bottom: 5px;">
                    <strong>📍 Location:</strong> ${checklist.locName || 'Unknown'}
                </div>
                <div style="margin-bottom: 5px;">
                    <strong>🐦 Species:</strong> ${speciesCount}
                </div>
                <div style="margin-bottom: 5px;">
                    <strong>📅 Date:</strong> ${new Date(checklist.obsDt).toLocaleDateString()}
                </div>
                ${checklist.observer ? `
                    <div style="margin-bottom: 5px;">
                        <strong>👤 Observer:</strong> ${checklist.observer}
                    </div>
                ` : ''}
            </div>
            ${checklist.subId ? `
                <div style="margin-top: 10px;">
                    <a href="https://ebird.org/checklist/${checklist.subId}" target="_blank" 
                       style="color: #10b981; text-decoration: none; font-weight: 600;">
                        View Checklist →
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    return createInfoWindow(content);
}

/**
 * Close all open info windows
 */
function closeAllInfoWindows() {
    state.markersArray.forEach(marker => {
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
    });
    
    state.hotspotsArray.forEach(marker => {
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
    });
    
    state.checklistsArray.forEach(marker => {
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
    });
}

/**
 * Clear all markers from map
 */
export function clearAllMarkers() {
    clearBirdMarkers();
    clearHotspotMarkers();
    clearChecklistMarkers();
}

/**
 * Clear bird markers
 */
export function clearBirdMarkers() {
    state.markersArray.forEach(marker => {
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
        marker.setMap(null);
    });
    state.markersArray = [];
}

/**
 * Clear hotspot markers
 */
export function clearHotspotMarkers() {
    state.hotspotsArray.forEach(marker => {
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
        marker.setMap(null);
    });
    state.hotspotsArray = [];
}

/**
 * Clear checklist markers
 */
export function clearChecklistMarkers() {
    state.checklistsArray.forEach(marker => {
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
        marker.setMap(null);
    });
    state.checklistsArray = [];
}

/**
 * Display all bird observations on map
 */
export function displayBirds() {
    clearBirdMarkers();
    
    if (!state.allSightings || state.allSightings.length === 0) {
        console.log('No sightings to display');
        return;
    }
    
    // Determine marker type based on target list
    const targetList = state.userList;
    
    state.allSightings.forEach(obs => {
        const isTarget = !targetList.has(obs.comName);
        const isNotable = state.notableTargets && 
                         state.notableTargets.some(t => t.comName === obs.comName);
        const isExpected = state.expectedTargets && 
                          state.expectedTargets.some(t => t.comName === obs.comName || t === obs.comName);
        
        let type = 'regular';
        if (isNotable) type = 'notable';
        else if (isExpected) type = 'expected';
        else if (isTarget) type = 'target';
        
        const marker = createBirdMarker(obs, type);
        if (marker) {
            state.markersArray.push(marker);
        }
    });
    
    console.log(`📍 Displayed ${state.markersArray.length} bird markers`);
}

/**
 * Display hotspots on map
 */
export function displayHotspots(hotspots, maxToShow = 10) {
    clearHotspotMarkers();
    
    if (!hotspots || hotspots.length === 0) return;
    
    const topHotspots = hotspots.slice(0, maxToShow);
    
    topHotspots.forEach((hotspot, index) => {
        const marker = createHotspotMarker(hotspot, index + 1);
        if (marker) {
            state.hotspotsArray.push(marker);
        }
    });
    
    console.log(`📍 Displayed ${state.hotspotsArray.length} hotspot markers`);
}

/**
 * Display checklists on map
 */
export function displayChecklists(checklists, maxToShow = 10) {
    clearChecklistMarkers();
    
    if (!checklists || checklists.length === 0) return;
    
    const topChecklists = checklists.slice(0, maxToShow);
    
    topChecklists.forEach((checklist, index) => {
        const marker = createChecklistMarker(checklist, index + 1);
        if (marker) {
            state.checklistsArray.push(marker);
        }
    });
    
    console.log(`📍 Displayed ${state.checklistsArray.length} checklist markers`);
}

/**
 * Highlight specific species on map
 */
export function highlightSpecies(speciesName) {
    state.markersArray.forEach(marker => {
        if (marker.observation && marker.observation.comName === speciesName) {
            // Bounce animation
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 2000);
            
            // Open info window
            if (marker.infoWindow) {
                closeAllInfoWindows();
                marker.infoWindow.open(state.map, marker);
            }
        }
    });
}

/**
 * Get markers in current map bounds
 */
export function getMarkersInBounds() {
    if (!state.map) return [];
    
    const bounds = state.map.getBounds();
    if (!bounds) return state.markersArray;
    
    return state.markersArray.filter(marker => {
        const position = marker.getPosition();
        return bounds.contains(position);
    });
}

/**
 * Cluster markers by proximity
 */
export function createMarkerClusters() {
    // Note: Would require MarkerClusterer library
    // This is a placeholder for future implementation
    console.log('Marker clustering not yet implemented');
}
