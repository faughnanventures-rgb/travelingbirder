/**
 * Traveling Birder - Routes Module
 * Handles route saving, loading, sharing, and management
 */

import { state } from './state.js';
import { saveSavedRoutes, loadSavedRoutes } from './storage.js';
import { showModal, closeModal, showSuccess, showError, copyToClipboard } from './ui.js';

/**
 * Initialize routes on page load
 */
export function initializeRoutes() {
    state.savedRoutes = loadSavedRoutes();
    displaySavedRoutes();
    loadRouteFromURL();
    console.log(`📁 Loaded ${state.savedRoutes.length} saved routes`);
}

/**
 * Save current route
 */
export function saveCurrentRoute(name, notes = '') {
    const origin = document.getElementById('origin')?.value;
    const destination = document.getElementById('destination')?.value;
    
    if (!origin || !destination) {
        showError('No route to save. Plan a route first.');
        return false;
    }
    
    if (!name || name.trim() === '') {
        showError('Please enter a route name');
        return false;
    }
    
    const route = {
        id: 'route_' + Date.now(),
        name: name.trim(),
        notes: notes.trim(),
        origin: origin,
        destination: destination,
        waypoints: state.tripWaypoints.slice(), // Copy array
        radius: parseInt(document.getElementById('searchRadius')?.value) || 15,
        timeRange: parseInt(document.getElementById('timeRange')?.value) || 30,
        savedDate: new Date().toISOString(),
        resultCount: state.allSightings.length
    };
    
    state.savedRoutes.push(route);
    saveSavedRoutes(state.savedRoutes);
    displaySavedRoutes();
    
    showSuccess(`Route "${name}" saved!`);
    console.log(`💾 Saved route: ${name}`);
    
    return true;
}

/**
 * Load a saved route
 */
export function loadRoute(routeId) {
    const route = state.savedRoutes.find(r => r.id === routeId);
    
    if (!route) {
        showError('Route not found');
        return false;
    }
    
    // Fill in the form
    const originInput = document.getElementById('origin');
    const destInput = document.getElementById('destination');
    const radiusInput = document.getElementById('searchRadius');
    const timeRangeInput = document.getElementById('timeRange');
    
    if (originInput) originInput.value = route.origin;
    if (destInput) destInput.value = route.destination;
    if (radiusInput) radiusInput.value = route.radius;
    if (timeRangeInput) timeRangeInput.value = route.timeRange;
    
    // Restore waypoints
    state.tripWaypoints = route.waypoints ? route.waypoints.slice() : [];
    
    showSuccess(`Loaded route "${route.name}"\n\nClick "Plan Route" to search.`);
    console.log(`📍 Loaded route: ${route.name}`);
    
    return true;
}

/**
 * Delete a saved route
 */
export function deleteRoute(routeId) {
    const route = state.savedRoutes.find(r => r.id === routeId);
    
    if (!route) {
        showError('Route not found');
        return false;
    }
    
    if (!confirm(`Delete route "${route.name}"?`)) {
        return false;
    }
    
    state.savedRoutes = state.savedRoutes.filter(r => r.id !== routeId);
    saveSavedRoutes(state.savedRoutes);
    displaySavedRoutes();
    
    console.log(`🗑️ Deleted route: ${route.name}`);
    
    return true;
}

/**
 * Share a saved route
 */
export function shareRoute(routeId) {
    const route = routeId ? 
        state.savedRoutes.find(r => r.id === routeId) : 
        getCurrentRouteData();
    
    if (!route) {
        showError('No route to share');
        return false;
    }
    
    try {
        // Encode route in URL
        const routeData = {
            origin: route.origin,
            destination: route.destination,
            waypoints: route.waypoints || [],
            radius: route.radius,
            timeRange: route.timeRange,
            name: route.name || 'Shared Route'
        };
        
        const encoded = btoa(JSON.stringify(routeData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?route=${encoded}`;
        
        copyToClipboard(shareUrl);
        console.log(`🔗 Shared route: ${route.name || 'unnamed'}`);
        
        return true;
    } catch (error) {
        console.error('Error sharing route:', error);
        showError('Error creating share link');
        return false;
    }
}

/**
 * Share current route (not saved)
 */
export function shareCurrentRoute() {
    const origin = document.getElementById('origin')?.value;
    const destination = document.getElementById('destination')?.value;
    
    if (!origin || !destination) {
        showError('Plan a route first before sharing');
        return false;
    }
    
    return shareRoute(null);
}

/**
 * Get current route data (for sharing unsaved route)
 */
function getCurrentRouteData() {
    const origin = document.getElementById('origin')?.value;
    const destination = document.getElementById('destination')?.value;
    
    if (!origin || !destination) return null;
    
    return {
        origin: origin,
        destination: destination,
        waypoints: state.tripWaypoints.slice(),
        radius: parseInt(document.getElementById('searchRadius')?.value) || 15,
        timeRange: parseInt(document.getElementById('timeRange')?.value) || 30,
        name: 'Shared Route'
    };
}

/**
 * Load route from URL parameter
 */
export function loadRouteFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const routeParam = urlParams.get('route');
    
    if (!routeParam) return false;
    
    try {
        const routeData = JSON.parse(atob(routeParam));
        
        // Wait for DOM to be ready
        setTimeout(() => {
            const originInput = document.getElementById('origin');
            const destInput = document.getElementById('destination');
            const radiusInput = document.getElementById('searchRadius');
            const timeRangeInput = document.getElementById('timeRange');
            
            if (originInput) originInput.value = routeData.origin || '';
            if (destInput) destInput.value = routeData.destination || '';
            if (radiusInput) radiusInput.value = routeData.radius || 15;
            if (timeRangeInput) timeRangeInput.value = routeData.timeRange || 30;
            
            state.tripWaypoints = routeData.waypoints || [];
            
            showSuccess(`Loaded shared route: ${routeData.name || 'Unnamed Route'}\n\nClick "Plan Route" to search.`);
            console.log(`🔗 Loaded shared route from URL`);
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('Error loading shared route:', error);
        return false;
    }
}

/**
 * Display saved routes in sidebar
 */
export function displaySavedRoutes() {
    const container = document.getElementById('savedRoutesList');
    if (!container) return;
    
    if (state.savedRoutes.length === 0) {
        container.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 0.9em; padding: 10px; text-align: center;">
                No saved routes yet
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.savedRoutes.map(route => `
        <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 10px; background: var(--bg-secondary);">
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-size: 0.95em;">
                ${escapeHtml(route.name)}
            </div>
            <div style="font-size: 0.8em; color: var(--text-secondary); margin-bottom: 8px;">
                ${escapeHtml(route.origin)} → ${escapeHtml(route.destination)}<br>
                ${route.resultCount || 0} species • ${new Date(route.savedDate).toLocaleDateString()}
            </div>
            <div style="display: flex; gap: 6px;">
                <button onclick="window.loadRoute('${route.id}')" class="secondary-btn" style="padding: 5px 10px; font-size: 0.8em; flex: 1;">
                    📍 Load
                </button>
                <button onclick="window.shareRoute('${route.id}')" class="secondary-btn" style="padding: 5px 10px; font-size: 0.8em; flex: 1;">
                    🔗 Share
                </button>
                <button onclick="window.deleteRoute('${route.id}')" class="secondary-btn" style="padding: 5px 10px; font-size: 0.8em; background: #fee2e2; border-color: #ef4444;">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Show save route modal
 */
export function showSaveRouteModal() {
    const modal = document.getElementById('saveRouteModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Clear form
        const nameInput = document.getElementById('routeName');
        const notesInput = document.getElementById('routeNotes');
        if (nameInput) nameInput.value = '';
        if (notesInput) notesInput.value = '';
    }
}

/**
 * Handle save route form submission
 */
export function handleSaveRouteSubmit() {
    const nameInput = document.getElementById('routeName');
    const notesInput = document.getElementById('routeNotes');
    
    if (!nameInput) return;
    
    const name = nameInput.value;
    const notes = notesInput ? notesInput.value : '';
    
    if (saveCurrentRoute(name, notes)) {
        closeModal('saveRouteModal');
    }
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
 * Show route actions after successful route plan
 */
export function showRouteActions() {
    const routeActions = document.getElementById('routeActions');
    if (routeActions) {
        routeActions.style.display = 'flex';
    }
}

/**
 * Hide route actions
 */
export function hideRouteActions() {
    const routeActions = document.getElementById('routeActions');
    if (routeActions) {
        routeActions.style.display = 'none';
    }
}

/**
 * Export all routes as JSON
 */
export function exportRoutes() {
    if (state.savedRoutes.length === 0) {
        showError('No routes to export');
        return false;
    }
    
    const dataStr = JSON.stringify(state.savedRoutes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `traveling-birder-routes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log(`📥 Exported ${state.savedRoutes.length} routes`);
    
    return true;
}

/**
 * Import routes from JSON
 */
export function importRoutes(jsonFile) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const routes = JSON.parse(e.target.result);
            
            if (!Array.isArray(routes)) {
                showError('Invalid routes file format');
                return;
            }
            
            // Merge with existing routes
            const existingIds = new Set(state.savedRoutes.map(r => r.id));
            const newRoutes = routes.filter(r => !existingIds.has(r.id));
            
            state.savedRoutes.push(...newRoutes);
            saveSavedRoutes(state.savedRoutes);
            displaySavedRoutes();
            
            showSuccess(`Imported ${newRoutes.length} routes`);
            console.log(`📤 Imported ${newRoutes.length} routes`);
        } catch (error) {
            console.error('Import error:', error);
            showError('Error importing routes file');
        }
    };
    
    reader.readAsText(jsonFile);
}
