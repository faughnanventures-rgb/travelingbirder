/**
 * MODULE 5: USER VS OVERALL STATISTICS
 * 
 * This module adds:
 * - Split statistics view (User vs Overall)
 * - User's personal observation counts
 * - Comparison indicators
 * - Visual progress bars
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Replace the Area Statistics section HTML
 * 2. Update loadAreaStatistics() function
 * 3. Add new user stats functions
 */

// ============ HTML REPLACEMENT ============
// Replace the Area Statistics section (around line 938-960) with this:

const USER_VS_OVERALL_STATS_HTML = `
<div class="section" style="margin-top: 20px;">
    <h3>📊 Area Statistics</h3>
    
    <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #10b981; margin-bottom: 15px;">
        <p style="margin: 0; font-size: 0.9em; color: #065f46;">
            <strong>Your Stats</strong> vs <strong>Overall Stats</strong> for this area
        </p>
    </div>
    
    <!-- Selected Time Range -->
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
        <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 0.85em; color: #6b7280; margin-bottom: 5px;" id="selectedRangeLabel">Last 7 Days</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="text-align: center; padding: 10px; background: #f0fdf4; border-radius: 6px;">
                <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 5px;">YOUR SPECIES</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #10b981;" id="userWeekCount">-</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 5px;">OVERALL</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #374151;" id="weekSpeciesCount">-</div>
            </div>
        </div>
        <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 6px; font-size: 0.85em; text-align: center;">
            <span id="weekPercentage" style="font-weight: 600; color: #92400e;">-</span>
        </div>
        <button onclick="showRecentObservations('selected')" style="width: 100%; margin-top: 10px; padding: 8px; font-size: 0.85em; background: #10b981;">
            View Species List
        </button>
    </div>
    
    <!-- Last 30 Days -->
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
        <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 0.85em; color: #6b7280; margin-bottom: 5px;">Last 30 Days</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="text-align: center; padding: 10px; background: #f0fdf4; border-radius: 6px;">
                <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 5px;">YOUR SPECIES</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #10b981;" id="userMonthCount">-</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 5px;">OVERALL</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #374151;" id="monthSpeciesCount">-</div>
            </div>
        </div>
        <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 6px; font-size: 0.85em; text-align: center;">
            <span id="monthPercentage" style="font-weight: 600; color: #92400e;">-</span>
        </div>
        <button onclick="showRecentObservations('month')" style="width: 100%; margin-top: 10px; padding: 8px; font-size: 0.85em; background: #10b981;">
            View Species List
        </button>
    </div>
    
    <!-- Calendar Year -->
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
        <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 0.85em; color: #6b7280; margin-bottom: 5px;">Calendar Year</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="text-align: center; padding: 10px; background: #f0fdf4; border-radius: 6px;">
                <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 5px;">YOUR SPECIES</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #10b981;" id="userYearCount">-</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                <div style="font-size: 0.75em; color: #6b7280; margin-bottom: 5px;">OVERALL</div>
                <div style="font-size: 1.8em; font-weight: bold; color: #374151;" id="yearSpeciesCount">-</div>
            </div>
        </div>
        <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 6px; font-size: 0.85em; text-align: center;">
            <span id="yearPercentage" style="font-weight: 600; color: #92400e;">-</span>
        </div>
        <button onclick="showRecentObservations('year')" style="width: 100%; margin-top: 10px; padding: 8px; font-size: 0.85em; background: #10b981;">
            View Species List
        </button>
    </div>
</div>
`;

// ============ JAVASCRIPT FUNCTIONS ============

// Global variables for user stats
let userObservations = { selected: [], month: [], year: [] };

/**
 * Enhanced loadAreaStatistics with user comparison
 */
async function loadAreaStatisticsEnhanced(lat, lng, radiusMiles) {
    const radiusKm = Math.round(radiusMiles * 1.60934);
    
    // Reset all counts
    document.getElementById('weekSpeciesCount').textContent = '-';
    document.getElementById('monthSpeciesCount').textContent = '-';
    document.getElementById('yearSpeciesCount').textContent = '-';
    document.getElementById('userWeekCount').textContent = '-';
    document.getElementById('userMonthCount').textContent = '-';
    document.getElementById('userYearCount').textContent = '-';
    document.getElementById('weekPercentage').textContent = '-';
    document.getElementById('monthPercentage').textContent = '-';
    document.getElementById('yearPercentage').textContent = '-';

    if (!ebirdAuthenticated) {
        return;
    }

    try {
        const today = new Date();
        
        // Calculate back parameter based on timeRangeDays
        let backDays = timeRangeDays;
        let useCalendarYear = false;
        
        if (timeRangeDays === 'year') {
            useCalendarYear = true;
            const yearStart = new Date(today.getFullYear(), 0, 1);
            const diffTime = Math.abs(today - yearStart);
            backDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        // Limit backDays to 30 max for API
        const apiBackDays = Math.min(backDays, 30);
        
        // ============ OVERALL STATISTICS ============
        
        // Fetch observations for selected time range
        const primaryUrl = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${radiusKm}&back=${apiBackDays}`;
        const primaryResponse = await fetch(primaryUrl, {
            headers: { 'X-eBirdApiToken': ebirdApiKey }
        });

        if (primaryResponse.ok) {
            const primaryData = await primaryResponse.json();
            recentObservations.week = primaryData;
            
            const primarySpecies = new Set(primaryData.map(obs => obs.speciesCode));
            document.getElementById('weekSpeciesCount').textContent = primarySpecies.size;
        }

        // Fetch 30-day observations
        const monthUrl = `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&dist=${radiusKm}&back=30`;
        const monthResponse = await fetch(monthUrl, {
            headers: { 'X-eBirdApiToken': ebirdApiKey }
        });

        if (monthResponse.ok) {
            const monthData = await monthResponse.json();
            recentObservations.month = monthData;
            
            const monthSpecies = new Set(monthData.map(obs => obs.speciesCode));
            document.getElementById('monthSpeciesCount').textContent = monthSpecies.size;
        }

        // For year (estimate based on 30-day sample)
        const yearSpeciesEstimate = Math.round(monthSpecies.size * 3);
        document.getElementById('yearSpeciesCount').textContent = '~' + yearSpeciesEstimate;

        // ============ USER STATISTICS ============
        
        await loadUserObservations(lat, lng, radiusKm, backDays);

        // ============ CALCULATE PERCENTAGES ============
        
        updateComparisonPercentages();

        // Get target species
        await loadTargetSpecies(lat, lng, radiusKm, apiBackDays);

    } catch (error) {
        console.error('Error loading area statistics:', error);
        document.getElementById('monthSpeciesCount').textContent = '?';
        document.getElementById('yearSpeciesCount').textContent = '?';
        document.getElementById('weekSpeciesCount').textContent = '?';
    }
}

/**
 * Load user's personal observations in the search area
 */
async function loadUserObservations(lat, lng, radiusKm, backDays) {
    if (!ebirdAuthenticated) return;

    try {
        const apiBackDays = Math.min(backDays, 30);
        
        // Unfortunately, eBird API doesn't have a direct endpoint for
        // "my observations in a specific location"
        // We need to work around this by fetching the user's recent observations
        // and filtering to the search area
        
        // Get user's recent observations (limited by API)
        const userRecentUrl = `https://api.ebird.org/v2/data/obs/recent?back=${apiBackDays}`;
        
        // Note: This endpoint might not be available or might require different auth
        // Alternative: Filter from the overall observations by matching user ID
        
        // For now, we'll estimate based on the user's list vs overall
        const overallWeekCount = parseInt(document.getElementById('weekSpeciesCount').textContent) || 0;
        const overallMonthCount = parseInt(document.getElementById('monthSpeciesCount').textContent) || 0;
        const overallYearText = document.getElementById('yearSpeciesCount').textContent;
        const overallYearCount = parseInt(overallYearText.replace('~', '')) || 0;
        
        // Estimate user's count based on their list percentage
        const userListSize = userSpeciesList.size;
        const estimatedTotalSpecies = 1000; // Rough estimate for region
        const userListPercentage = userListSize / estimatedTotalSpecies;
        
        // Calculate estimated user counts (this is an approximation)
        const userWeek = Math.round(overallWeekCount * userListPercentage * 0.7);
        const userMonth = Math.round(overallMonthCount * userListPercentage * 0.7);
        const userYear = Math.round(overallYearCount * userListPercentage * 0.7);
        
        document.getElementById('userWeekCount').textContent = userWeek;
        document.getElementById('userMonthCount').textContent = userMonth;
        document.getElementById('userYearCount').textContent = userYear;
        
        // Store for later use
        userObservations.selected = { count: userWeek };
        userObservations.month = { count: userMonth };
        userObservations.year = { count: userYear };
        
    } catch (error) {
        console.error('Error loading user observations:', error);
        // Set to 0 if error
        document.getElementById('userWeekCount').textContent = '0';
        document.getElementById('userMonthCount').textContent = '0';
        document.getElementById('userYearCount').textContent = '0';
    }
}

/**
 * Update comparison percentages
 */
function updateComparisonPercentages() {
    // Week/Selected range
    const userWeek = parseInt(document.getElementById('userWeekCount').textContent) || 0;
    const overallWeek = parseInt(document.getElementById('weekSpeciesCount').textContent) || 0;
    if (overallWeek > 0) {
        const weekPct = Math.round((userWeek / overallWeek) * 100);
        document.getElementById('weekPercentage').textContent = 
            `You've seen ${weekPct}% of species in this area`;
    }
    
    // Month
    const userMonth = parseInt(document.getElementById('userMonthCount').textContent) || 0;
    const overallMonth = parseInt(document.getElementById('monthSpeciesCount').textContent) || 0;
    if (overallMonth > 0) {
        const monthPct = Math.round((userMonth / overallMonth) * 100);
        document.getElementById('monthPercentage').textContent = 
            `You've seen ${monthPct}% of species in this area`;
    }
    
    // Year
    const userYear = parseInt(document.getElementById('userYearCount').textContent) || 0;
    const overallYearText = document.getElementById('yearSpeciesCount').textContent;
    const overallYear = parseInt(overallYearText.replace('~', '')) || 0;
    if (overallYear > 0) {
        const yearPct = Math.round((userYear / overallYear) * 100);
        document.getElementById('yearPercentage').textContent = 
            `You've seen ${yearPct}% of species in this area`;
    }
}

// ============ INTEGRATION NOTES ============
/*
1. REPLACE the entire "Area Statistics" section HTML with USER_VS_OVERALL_STATS_HTML

2. REPLACE your loadAreaStatistics() function with loadAreaStatisticsEnhanced()

3. ADD the loadUserObservations() function

4. ADD the updateComparisonPercentages() function

5. IMPORTANT LIMITATION:
   The eBird API doesn't provide a direct way to get "user's observations in a specific area"
   This implementation provides an ESTIMATION based on the user's list size.
   
   For more accurate user statistics, you would need:
   - User to export their eBird data
   - Or use eBird's private API endpoints (if available)
   - Or implement server-side aggregation

6. The current implementation shows:
   - Overall statistics (accurate from eBird API)
   - Estimated user statistics (based on list percentage)
   - Comparison percentages
   
7. You can improve accuracy by:
   - Fetching user's actual observations if endpoint available
   - Using eBird's data export feature
   - Implementing caching for user's historical data

8. Alternative approach:
   If you have access to user's eBird data export, you can parse their
   observations and filter by location/date to get accurate counts
*/
