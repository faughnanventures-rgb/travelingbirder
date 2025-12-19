/**
 * Traveling Birder - UI Module
 * Handles all UI interactions, panels, modals, and loading states
 */

import { state } from './state.js';

/**
 * Show loading overlay with message
 */
export function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    const statusEl = document.getElementById('loadingStatus');
    
    if (overlay) {
        overlay.style.display = 'flex';
        if (messageEl) messageEl.textContent = message;
        if (statusEl) statusEl.textContent = '';
        state.isLoading = true;
        console.log(`⏳ Loading: ${message}`);
    }
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        state.isLoading = false;
        console.log('✅ Loading complete');
    }
}

/**
 * Update loading status message
 */
export function updateLoadingStatus(status) {
    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) {
        statusEl.textContent = status;
        console.log(`📊 ${status}`);
    }
}

/**
 * Toggle panel visibility
 */
export function togglePanel(panelId) {
    const content = document.getElementById(`${panelId}Content`);
    const toggle = document.getElementById(`${panelId}Toggle`);
    
    if (!content || !toggle) return;
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        toggle.textContent = '−';
        state.currentPanel = panelId;
    } else {
        content.style.display = 'none';
        toggle.textContent = '+';
        state.currentPanel = null;
    }
}

/**
 * Show modal dialog
 */
export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        console.log(`📱 Opened modal: ${modalId}`);
    }
}

/**
 * Close modal dialog
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        console.log(`📱 Closed modal: ${modalId}`);
    }
}

/**
 * Show below-map panels
 */
export function showBelowMapPanels() {
    const belowMap = document.getElementById('belowMap');
    if (belowMap) {
        belowMap.style.display = 'block';
    }
}

/**
 * Hide below-map panels
 */
export function hideBelowMapPanels() {
    const belowMap = document.getElementById('belowMap');
    if (belowMap) {
        belowMap.style.display = 'none';
    }
}

/**
 * Update target species count display
 */
export function updateTargetCount(count) {
    const targetCount = document.getElementById('targetCount');
    if (targetCount) {
        targetCount.textContent = count;
    }
}

/**
 * Update sightings count display
 */
export function updateSightingsCount(count) {
    const sightingsCount = document.getElementById('sightingsCount');
    if (sightingsCount) {
        sightingsCount.textContent = count;
    }
}

/**
 * Show error message
 */
export function showError(message) {
    alert(`❌ Error: ${message}`);
    console.error(`❌ ${message}`);
}

/**
 * Show success message
 */
export function showSuccess(message) {
    alert(`✅ ${message}`);
    console.log(`✅ ${message}`);
}

/**
 * Show info message
 */
export function showInfo(message) {
    alert(`ℹ️ ${message}`);
    console.log(`ℹ️ ${message}`);
}

/**
 * Confirm action
 */
export function confirmAction(message) {
    return confirm(message);
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    state.isDarkMode = isDark;
    
    // Update button text
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
        btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
    
    console.log(`🎨 Dark mode: ${isDark ? 'enabled' : 'disabled'}`);
    return isDark;
}

/**
 * Apply dark mode
 */
export function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
        btn.textContent = enabled ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
    
    state.isDarkMode = enabled;
}

/**
 * Scroll to element
 */
export function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            showSuccess('Copied to clipboard!');
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess('Copied to clipboard!');
            return true;
        }
    } catch (error) {
        console.error('Copy failed:', error);
        showError('Failed to copy to clipboard');
        return false;
    }
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time
 */
export function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

/**
 * Format date and time
 */
export function formatDateTime(dateString) {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Show/hide element
 */
export function toggleVisibility(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * Enable/disable element
 */
export function setElementEnabled(elementId, enabled) {
    const element = document.getElementById(elementId);
    if (element) {
        element.disabled = !enabled;
    }
}

/**
 * Add loading spinner to button
 */
export function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = '⏳ Loading...';
        button.disabled = true;
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
        button.disabled = false;
    }
}
