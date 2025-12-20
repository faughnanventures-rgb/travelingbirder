/**
 * Traveling Birder - Map Module
 * Handles Google Maps initialization and management
 */

import { CONFIG } from './config.js';
import { state, setState } from './state.js';

/**
 * Initialize Google Maps
 */
export function initMap() {
    console.log('🗺️ Initializing Google Maps...');
    
    const mapOptions = {
        zoom: 7,
        center: { lat: 44.26, lng: -72.57 }, // Vermont
        mapTypeId: 'terrain',
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
    };
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return false;
    }
    
    state.map = new google.maps.Map(mapElement, mapOptions);
    state.directionsService = new google.maps.DirectionsService();
    state.directionsRenderer = new google.maps.DirectionsRenderer({
        map: state.map,
        suppressMarkers: true,
        preserveViewport: false
    });
    
    console.log('✅ Google Maps initialized');
    
    // Setup autocomplete after map is ready
    setupAutocomplete();
    
    return true;
}

/**
 * Setup Google Places Autocomplete
 */
export function setupAutocomplete() {
    const originInput = document.getElementById('origin');
    const destInput = document.getElementById('destination');
    const areaInput = document.getElementById('areaInput');
    const speciesLocationInput = document.getElementById('speciesLocation');
    
    if (originInput) {
        state.originAutocomplete = new google.maps.places.Autocomplete(originInput, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
        });
    }
    
    if (destInput) {
        state.destinationAutocomplete = new google.maps.places.Autocomplete(destInput, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
        });
    }
    
    if (areaInput) {
        state.areaAutocomplete = new google.maps.places.Autocomplete(areaInput, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
        });
    }
    
    if (speciesLocationInput) {
        state.speciesLocationAutocomplete = new google.maps.places.Autocomplete(speciesLocationInput, {
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
        });
    }
    
    console.log('✅ Autocomplete initialized');
}

/**
 * Center map on location
 */
export function centerMap(lat, lng, zoom = 10) {
    if (!state.map) return false;
    
    const position = new google.maps.LatLng(lat, lng);
    state.map.setCenter(position);
    state.map.setZoom(zoom);
    
    return true;
}

/**
 * Fit map to bounds
 */
export function fitBounds(bounds) {
    if (!state.map) return false;
    
    state.map.fitBounds(bounds);
    return true;
}

/**
 * Add polyline to map (for routes)
 */
export function addPolyline(path, color = '#4285f4') {
    if (!state.map) return null;
    
    const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: state.map
    });
    
    return polyline;
}

/**
 * Clear all overlays from map
 */
export function clearMapOverlays() {
    if (state.directionsRenderer) {
        state.directionsRenderer.setMap(null);
        state.directionsRenderer = new google.maps.DirectionsRenderer({
            map: state.map,
            suppressMarkers: true,
            preserveViewport: false
        });
    }
}

/**
 * Get route between two points
 */
export async function getRoute(origin, destination, waypoints = []) {
    if (!state.directionsService) {
        throw new Error('Directions service not initialized');
    }
    
    const waypointObjects = waypoints.map(wp => ({
        location: wp,
        stopover: true
    }));
    
    return new Promise((resolve, reject) => {
        state.directionsService.route({
            origin: origin,
            destination: destination,
            waypoints: waypointObjects,
            travelMode: 'DRIVING',
            optimizeWaypoints: true
        }, (result, status) => {
            if (status === 'OK') {
                resolve(result);
            } else {
                reject(new Error(`Directions request failed: ${status}`));
            }
        });
    });
}

/**
 * Display route on map
 */
export function displayRoute(directionsResult) {
    if (!state.directionsRenderer) return false;
    
    state.directionsRenderer.setDirections(directionsResult);
    state.currentRoute = directionsResult;
    
    return true;
}

/**
 * Geocode an address
 */
export async function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                    bounds: results[0].geometry.bounds,
                    viewport: results[0].geometry.viewport,
                    formattedAddress: results[0].formatted_address
                });
            } else {
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
}

/**
 * Reverse geocode coordinates
 */
export async function reverseGeocode(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
        geocoder.geocode({ 
            location: { lat, lng } 
        }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                reject(new Error(`Reverse geocoding failed: ${status}`));
            }
        });
    });
}

/**
 * Create info window
 */
export function createInfoWindow(content) {
    return new google.maps.InfoWindow({
        content: content,
        maxWidth: 300
    });
}

/**
 * Pan to location
 */
export function panTo(lat, lng) {
    if (!state.map) return false;
    
    state.map.panTo(new google.maps.LatLng(lat, lng));
    return true;
}

/**
 * Set map zoom
 */
export function setZoom(zoom) {
    if (!state.map) return false;
    
    state.map.setZoom(zoom);
    return true;
}

/**
 * Get current map center
 */
export function getMapCenter() {
    if (!state.map) return null;
    
    const center = state.map.getCenter();
    return {
        lat: center.lat(),
        lng: center.lng()
    };
}

/**
 * Get current map bounds
 */
export function getMapBounds() {
    if (!state.map) return null;
    
    return state.map.getBounds();
}

/**
 * Add click listener to map
 */
export function addMapClickListener(callback) {
    if (!state.map) return null;
    
    return state.map.addListener('click', callback);
}

/**
 * Remove map listener
 */
export function removeMapListener(listener) {
    if (listener) {
        google.maps.event.removeListener(listener);
    }
}

/**
 * Create custom map legend
 */
export function createMapLegend(items) {
    const legend = document.createElement('div');
    legend.id = 'mapLegend';
    legend.style.cssText = `
        background: white;
        padding: 10px;
        margin: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        font-size: 12px;
    `;
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <span style="display: inline-block; width: 16px; height: 16px; 
                         background: ${item.color}; border-radius: 50%; 
                         margin-right: 8px; vertical-align: middle;"></span>
            <span style="vertical-align: middle;">${item.label}</span>
        `;
        legend.appendChild(div);
    });
    
    if (state.map) {
        state.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    }
    
    return legend;
}

/**
 * Show/hide map legend
 */
export function toggleMapLegend(show) {
    const legend = document.getElementById('mapLegend');
    if (legend) {
        legend.style.display = show ? 'block' : 'none';
    }
}

/**
 * Calculate distance between two points (in miles)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Create bounds from coordinates
 */
export function createBounds(coordinates) {
    const bounds = new google.maps.LatLngBounds();
    
    coordinates.forEach(coord => {
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
    });
    
    return bounds;
}

/**
 * Check if map is ready
 */
export function isMapReady() {
    return state.map !== null && typeof google !== 'undefined';
}
