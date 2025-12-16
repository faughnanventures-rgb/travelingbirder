/**
 * MODULE 1: ENHANCED SEARCH & AUTOCOMPLETE
 * 
 * This module adds:
 * - Google Places Autocomplete for City, County, State
 * - ZIP code field
 * - Reset All functionality
 * - Region limiting checkbox
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Replace the existing <div class="section"> for "Search Options" in your HTML
 * 2. Add the JavaScript functions to your <script> section
 * 3. Call initializeAutocomplete() inside your initMap() function
 */

// ============ HTML REPLACEMENT ============
// Replace lines 829-894 (the Search Options section) with this:

const SEARCH_HTML = `
<div class="section">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">🔍 Search Options</h3>
        <button onclick="resetAllFilters()" style="width: auto; padding: 8px 16px; background: #6b7280; font-size: 0.85em; margin: 0;">🔄 Reset All</button>
    </div>
    
    <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #374151;">Search Mode</label>
        <div class="filter-group">
            <button class="filter-btn active" data-mode="location" onclick="setSearchMode('location')">Single Location</button>
            <button class="filter-btn" data-mode="route" onclick="setSearchMode('route')">Driving Route</button>
        </div>
    </div>

    <div style="margin-bottom: 15px;">
        <label class="filter-section-label">Time Range</label>
        <div class="time-filter-group">
            <button class="time-filter-btn" data-days="1" onclick="setTimeRange(1)">1 day</button>
            <button class="time-filter-btn" data-days="3" onclick="setTimeRange(3)">3 days</button>
            <button class="time-filter-btn active" data-days="7" onclick="setTimeRange(7)">7 days</button>
            <button class="time-filter-btn" data-days="14" onclick="setTimeRange(14)">14 days</button>
        </div>
        <div class="time-filter-group">
            <button class="time-filter-btn" data-days="21" onclick="setTimeRange(21)">21 days</button>
            <button class="time-filter-btn" data-days="30" onclick="setTimeRange(30)">30 days</button>
            <button class="time-filter-btn" data-days="year" onclick="setTimeRange('year')">Cal Year</button>
            <button class="time-filter-btn" data-days="30" onclick="setTimeRange(30)">Last 30</button>
        </div>
    </div>

    <div id="locationSearch">
        <div class="input-group">
            <label>City/Town</label>
            <input type="text" id="cityAutocomplete" placeholder="Start typing city name..." class="autocomplete-input">
        </div>
        <div class="input-group">
            <label>County</label>
            <input type="text" id="countyAutocomplete" placeholder="Start typing county name..." class="autocomplete-input">
        </div>
        <div class="location-row">
            <div class="input-group">
                <label>State</label>
                <input type="text" id="stateAutocomplete" placeholder="Start typing state..." class="autocomplete-input">
            </div>
            <div class="input-group">
                <label>ZIP (Optional)</label>
                <input type="text" id="zipCode" placeholder="12345" maxlength="5" pattern="[0-9]{5}">
            </div>
        </div>
        <div class="input-group">
            <label>Search Radius (miles)</label>
            <input type="number" id="radius" placeholder="15" value="15" min="1" max="50">
        </div>
        <div class="checkbox-group">
            <div class="checkbox-item">
                <input type="checkbox" id="limitToRegion">
                <label for="limitToRegion">Limit results to selected county/state only</label>
            </div>
        </div>
        <button onclick="searchLocation()">Search Sightings</button>
    </div>

    <div id="routeSearch" style="display: none;">
        <div class="input-group">
            <label>Starting Location</label>
            <input type="text" id="originAutocomplete" placeholder="e.g., Boston, MA" class="autocomplete-input">
        </div>
        <div class="input-group">
            <label>Destination</label>
            <input type="text" id="destinationAutocomplete" placeholder="e.g., Portland, ME" class="autocomplete-input">
        </div>
        <div class="input-group">
            <label>Route Buffer (miles)</label>
            <input type="number" id="routeBuffer" placeholder="10" value="10" min="1" max="50">
        </div>
        <div class="checkbox-group">
            <div class="checkbox-item">
                <input type="checkbox" id="limitToRouteRegion">
                <label for="limitToRouteRegion">Limit to route regions only</label>
            </div>
        </div>
        <button onclick="searchRoute()">Find Route & Sightings</button>
        <button onclick="clearRouteSearch()" style="background: #6b7280; margin-top: 5px;">Clear Route</button>
    </div>
</div>
`;

// ============ JAVASCRIPT FUNCTIONS ============

// Global variables for autocomplete
let cityAutocomplete, countyAutocomplete, stateAutocomplete, originAutocomplete, destinationAutocomplete;
let selectedRegion = { city: null, county: null, state: null, zip: null };

/**
 * Initialize all Google Places Autocomplete inputs
 * Call this inside initMap() after map is created
 */
function initializeAutocomplete() {
    // City autocomplete - cities only
    cityAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('cityAutocomplete'),
        { types: ['(cities)'] }
    );
    
    cityAutocomplete.addListener('place_changed', function() {
        const place = cityAutocomplete.getPlace();
        selectedRegion.city = place;
        extractRegionInfo(place);
    });

    // County autocomplete - administrative areas
    countyAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('countyAutocomplete'),
        { types: ['administrative_area_level_2'] }
    );
    
    countyAutocomplete.addListener('place_changed', function() {
        const place = countyAutocomplete.getPlace();
        selectedRegion.county = place;
        extractRegionInfo(place);
    });

    // State autocomplete
    stateAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('stateAutocomplete'),
        { types: ['administrative_area_level_1'] }
    );
    
    stateAutocomplete.addListener('place_changed', function() {
        const place = stateAutocomplete.getPlace();
        selectedRegion.state = place;
        extractRegionInfo(place);
    });

    // Route autocomplete
    originAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('originAutocomplete')
    );
    
    destinationAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('destinationAutocomplete')
    );
}

/**
 * Extract region information from selected place
 */
function extractRegionInfo(place) {
    if (!place.address_components) return;
    
    let regionInfo = {
        city: null,
        county: null,
        state: null,
        stateCode: null,
        country: null,
        countryCode: null
    };
    
    place.address_components.forEach(component => {
        if (component.types.includes('locality')) {
            regionInfo.city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_2')) {
            regionInfo.county = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
            regionInfo.state = component.long_name;
            regionInfo.stateCode = component.short_name;
        }
        if (component.types.includes('country')) {
            regionInfo.country = component.long_name;
            regionInfo.countryCode = component.short_name;
        }
    });
    
    return regionInfo;
}

/**
 * Reset all filters and clear the map
 */
function resetAllFilters() {
    // Clear all input fields
    document.getElementById('cityAutocomplete').value = '';
    document.getElementById('countyAutocomplete').value = '';
    document.getElementById('stateAutocomplete').value = '';
    document.getElementById('zipCode').value = '';
    document.getElementById('radius').value = '15';
    document.getElementById('originAutocomplete').value = '';
    document.getElementById('destinationAutocomplete').value = '';
    document.getElementById('routeBuffer').value = '10';
    
    // Uncheck checkboxes
    document.getElementById('limitToRegion').checked = false;
    if (document.getElementById('limitToRouteRegion')) {
        document.getElementById('limitToRouteRegion').checked = false;
    }
    
    // Reset time range to 7 days
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-days') === '7') {
            btn.classList.add('active');
        }
    });
    timeRangeDays = 7;
    document.getElementById('selectedRangeLabel').textContent = 'Last 7 Days';
    
    // Reset search mode to location
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-mode') === 'location') {
            btn.classList.add('active');
        }
    });
    searchMode = 'location';
    document.getElementById('locationSearch').style.display = 'block';
    document.getElementById('routeSearch').style.display = 'none';
    
    // Clear map markers and route
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    hotspotMarkers.forEach(marker => marker.setMap(null));
    hotspotMarkers = [];
    checklistMarkers.forEach(marker => marker.setMap(null));
    checklistMarkers = [];
    directionsRenderer.setDirections({routes: []});
    
    // Reset map center
    map.setCenter({ lat: 42.3601, lng: -71.0589 });
    map.setZoom(10);
    
    // Clear region selection
    selectedRegion = { city: null, county: null, state: null, zip: null };
    currentLocation = null;
    currentRoute = null;
    
    // Reset toggles
    document.getElementById('showHotspots').checked = false;
    document.getElementById('showTopChecklists').checked = false;
    
    showNotification('All filters reset');
}

/**
 * Enhanced searchLocation with region filtering
 */
async function searchLocationEnhanced() {
    const radiusMiles = parseFloat(document.getElementById('radius').value);
    const radiusKm = radiusMiles * 1.60934;
    const zipCode = document.getElementById('zipCode').value.trim();
    const limitToRegion = document.getElementById('limitToRegion').checked;

    let searchLocation = null;

    // Priority: ZIP > County > City > State
    if (zipCode && /^\d{5}$/.test(zipCode)) {
        // Search by ZIP code
        try {
            const results = await new Promise((resolve, reject) => {
                geocoder.geocode({ address: zipCode + ', USA' }, (results, status) => {
                    if (status === 'OK') resolve(results);
                    else reject(status);
                });
            });
            
            if (results && results[0]) {
                searchLocation = results[0].geometry.location;
            }
        } catch (error) {
            console.error('ZIP geocoding error:', error);
        }
    } else if (selectedRegion.county && selectedRegion.county.geometry) {
        // Use selected county
        searchLocation = selectedRegion.county.geometry.location;
    } else if (selectedRegion.city && selectedRegion.city.geometry) {
        // Use selected city
        searchLocation = selectedRegion.city.geometry.location;
    } else if (selectedRegion.state && selectedRegion.state.geometry) {
        // Use selected state
        searchLocation = selectedRegion.state.geometry.location;
    }

    if (!searchLocation) {
        alert('Please select a location using the autocomplete fields or enter a ZIP code');
        return;
    }

    currentLocation = { lat: searchLocation.lat(), lng: searchLocation.lng() };
    map.setCenter(currentLocation);
    
    // Apply region filtering if checkbox is checked
    if (limitToRegion && (selectedRegion.county || selectedRegion.state)) {
        // Filter sightings to only show those within the selected region bounds
        const regionInfo = extractRegionInfo(selectedRegion.county || selectedRegion.state);
        // Pass region info to display function for filtering
        displaySightings(currentLocation, radiusKm, regionInfo);
    } else {
        displaySightings(currentLocation, radiusKm);
    }
    
    await loadAreaStatistics(currentLocation.lat, currentLocation.lng, radiusMiles);
    
    if (document.getElementById('showHotspots').checked) {
        await loadHotspots(currentLocation.lat, currentLocation.lng, radiusMiles);
    }
    if (document.getElementById('showTopChecklists').checked) {
        await loadTopChecklists(currentLocation.lat, currentLocation.lng, radiusMiles);
    }
}

// ============ INTEGRATION NOTES ============
/*
1. Add initializeAutocomplete() call inside your initMap() function after map creation:
   
   function initMap() {
       map = new google.maps.Map(...);
       geocoder = new google.maps.Geocoder();
       directionsService = new google.maps.DirectionsService();
       directionsRenderer = new google.maps.DirectionsRenderer(...);
       
       // ADD THIS LINE:
       initializeAutocomplete();
       
       updateAlertsList();
       updateAuthUI();
   }

2. Replace your existing searchLocation() function with searchLocationEnhanced()
   OR rename the existing one and call searchLocationEnhanced from it

3. Update the HTML by replacing the Search Options section with the SEARCH_HTML above

4. Make sure all links open in new tabs by adding target="_blank" to <a> tags
*/
