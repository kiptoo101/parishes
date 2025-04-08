/**
 * filters.js - Handles filtering functionality
 * This module is responsible for filtering churches based on user input
 */

const FiltersManager = (function() {
    // Private variables
    let allChurches = [];
    let filteredChurches = [];
    let visibleChurches = [];
    let uniqueCountries = new Set();
    let uniqueJurisdictions = new Set();
    let uniqueTypes = new Set();
    let uniqueRites = new Set();
    let uniqueTitles = new Set();
    let uniqueCities = new Set();
    let isFilterActive = false;
    let hasAppliedFilters = false;
    
    /**
     * Gets churches in current visible bounds
     * @return {Array} - Array of church features
     * @public
     */
    function getChurchesInVisibleBounds() {
        const map = MapManager.getMap();
        const bounds = map.getBounds();
        
        return allChurches.filter(feature => {
            const lat = feature.geometry.coordinates[1];
            const lng = feature.geometry.coordinates[0];
            return bounds.contains([lat, lng]);
        });
    }
    
    /**
     * Sets up searchable dropdown functionality
     * @param {string} inputId - ID of the input element
     * @param {string} suggestionsId - ID of the suggestions element
     * @param {Set} dataSet - Set of suggestion data
     * @private
     */
    function setupSearchableDropdown(inputId, suggestionsId, dataSet) {
        const input = document.getElementById(inputId);
        const suggestions = document.getElementById(suggestionsId);
        
        // Show suggestions on focus
        input.addEventListener('focus', function() {
            updateSuggestionList(input.value, suggestions, dataSet);
            suggestions.style.display = 'block';
        });
        
        // Update suggestions on input
        input.addEventListener('input', function() {
            updateSuggestionList(input.value, suggestions, dataSet);
            suggestions.style.display = 'block';
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(event) {
            if (event.target !== input && !suggestions.contains(event.target)) {
                suggestions.style.display = 'none';
            }
        });
        
        // Apply selected suggestion
        suggestions.addEventListener('click', function(event) {
            if (event.target.classList.contains('dropdown-item')) {
                input.value = event.target.textContent;
                suggestions.style.display = 'none';
                applyFilters(true); // true indicates filter was manually changed
            }
        });
    }
    
    /**
     * Updates suggestion list based on input
     * @param {string} query - Search query
     * @param {HTMLElement} suggestionElement - Suggestion list element
     * @param {Set} dataSet - Set of suggestion data
     * @private
     */
    function updateSuggestionList(query, suggestionElement, dataSet) {
        suggestionElement.innerHTML = '';
        query = query.toLowerCase();
        
        // If empty query, show all (limited to reasonable number)
        const dataArray = Array.from(dataSet);
        let matches;
        
        if (query === '') {
            // Show fewer items on mobile for better performance
            const limit = UI.isMobileDevice() ? 50 : 100;
            matches = dataArray.slice(0, limit);
        } else {
            // Limit results more aggressively on mobile
            const limit = UI.isMobileDevice() ? 50 : 100;
            matches = dataArray.filter(item => 
                item && item.toLowerCase().includes(query)
            ).slice(0, limit);
        }
        
        // Add "All" option at the top
        const allItem = document.createElement('div');
        allItem.classList.add('dropdown-item');
        allItem.textContent = 'All';
        suggestionElement.appendChild(allItem);
        
        // Add matched items
        matches.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('dropdown-item');
            div.textContent = item;
            suggestionElement.appendChild(div);
        });
    }
    
    /**
     * Checks if any filters are active
     * @return {boolean} - Whether any filters are active
     * @private
     */
    function checkActiveFilters() {
        const titleFilter = document.getElementById('title-search').value;
        const cityFilter = document.getElementById('city-search').value;
        const countryFilter = document.getElementById('country-search').value;
        const jurisdictionFilter = document.getElementById('jurisdiction-search').value;
        const typeFilter = document.getElementById('type-search').value;
        const riteFilter = document.getElementById('rite-search').value;
        
        // Check if any filter has a value
        isFilterActive = titleFilter || cityFilter || countryFilter || 
                        jurisdictionFilter || typeFilter || riteFilter;
        
        // Update UI based on filter status
        if (isFilterActive) {
            document.getElementById('filter-active-indicator').style.display = 'block';
            document.getElementById('zoom-to-filter').style.display = 'block';
        } else {
            document.getElementById('filter-active-indicator').style.display = 'none';
            document.getElementById('zoom-to-filter').style.display = 'none';
        }
        
        return isFilterActive;
    }
    
    /**
     * Applies filters and updates map and list
     * @param {boolean} manuallyChanged - Whether filters were manually changed
     * @public
     */
    function applyFilters(manuallyChanged = false) {
        // Get filter values
        const titleFilter = document.getElementById('title-search').value.toLowerCase();
        const cityFilter = document.getElementById('city-search').value.toLowerCase();
        const countryFilter = document.getElementById('country-search').value.toLowerCase();
        const jurisdictionFilter = document.getElementById('jurisdiction-search').value.toLowerCase();
        const typeFilter = document.getElementById('type-search').value.toLowerCase();
        const riteFilter = document.getElementById('rite-search').value.toLowerCase();
        
        // Check if any filters are active
        const filtersActive = checkActiveFilters();
        
        // Store whether this is a filter change
        if (manuallyChanged) {
            hasAppliedFilters = true;
        }
        
        // Show loading indicator
        document.getElementById('filter-info').textContent = 'Filtering churches...';
        
        // Use setTimeout to allow UI to update before heavy processing
        // Longer timeout for mobile to allow UI update
        const processingDelay = UI.isMobileDevice() ? 100 : 50;
        setTimeout(function() {
            // Clear existing layers
            MapManager.getMarkers().clearLayers();
            
            // Base collection to filter from - ALWAYS start with all churches
            let baseCollection = allChurches;
            
            // If no filters active, only filter by current view bounds
            if (!filtersActive) {
                // When no filters active, use the current map bounds
                const bounds = MapManager.getMap().getBounds();
                baseCollection = baseCollection.filter(feature => {
                    const lat = feature.geometry.coordinates[1];
                    const lng = feature.geometry.coordinates[0];
                    return bounds.contains([lat, lng]);
                });
            }
            
            // Apply content filters (name, city, country, etc.)
            filteredChurches = baseCollection.filter(feature => {
                const props = feature.properties;
                
                // If no filters are active, include all churches in current view
                if (!filtersActive) {
                    return true;
                }
                
                // Extract properties (defaults to empty string if null)
                const title = (props.Title || '').toLowerCase();
                const city = (props.City || '').toLowerCase();
                const country = (props.Country || '').toLowerCase();
                const jurisdiction = (props.Jurisdiction || '').toLowerCase();
                const type = (props.Type || '').toLowerCase();
                const rite = (props.Rite || '').toLowerCase();
                
                // Apply filters (partial matching for all fields)
                const titleMatch = !titleFilter || titleFilter === 'all' || title.includes(titleFilter);
                const cityMatch = !cityFilter || cityFilter === 'all' || city.includes(cityFilter);
                const countryMatch = !countryFilter || countryFilter === 'all' || country.includes(countryFilter);
                const jurisdictionMatch = !jurisdictionFilter || jurisdictionFilter === 'all' || jurisdiction.includes(jurisdictionFilter);
                const typeMatch = !typeFilter || typeFilter === 'all' || type.includes(typeFilter);
                const riteMatch = !riteFilter || riteFilter === 'all' || rite.includes(riteFilter);
                
                // Return true if all filters match
                return titleMatch && cityMatch && countryMatch && jurisdictionMatch && typeMatch && riteMatch;
            });
            // Set ALL filtered churches as visible - don't limit the count
            visibleChurches = filteredChurches;
            
            // Create GeoJSON for the map with limits for mobile performance
            let displayChurches = visibleChurches;
            if (UI.isMobileDevice() && !filtersActive && displayChurches.length > 1000) {
                // On mobile with no filters, limit the number to avoid performance issues
                displayChurches = displayChurches.slice(0, 1000);
            }
            
            const tempGeoJson = {
                "type": "FeatureCollection",
                "features": displayChurches
            };
            
            // Add markers in batch for better performance
            if (tempGeoJson.features.length > 0) {
                var tempLayer = L.geoJson(tempGeoJson, {
                    onEachFeature: MapManager.pop_complete_parish_data_1,
                    pointToLayer: function(feature, latlng) {
                        // Get the icon from our style function
                        var icon = MapManager.style_complete_parish_data_1_0(feature);
                        return L.marker(latlng, {icon: icon});
                    }
                });
                
                MapManager.getMarkers().addLayer(tempLayer);
                MapManager.getMap().addLayer(MapManager.getMarkers());
                
                // Zoom to filtered results if filters were manually changed
                if (manuallyChanged && filtersActive) {
                    // Only automatically zoom if results aren't already visible
                    if (!MapManager.getMap().getBounds().contains(MapManager.getMarkers().getBounds())) {
                        zoomToFilteredResults();
                    }
                }
            }
            
            // Update info text, with mobile-friendly text
            const infoText = UI.isMobileDevice() ? 
                `${visibleChurches.length} of ${allChurches.length} churches` :
                `Showing ${visibleChurches.length} of ${filteredChurches.length} filtered churches (${allChurches.length} total)`;
            
            document.getElementById('filter-info').textContent = infoText;
            
            // Update church list
            ChurchesManager.populateChurchList(visibleChurches);
            
        }, processingDelay); // Small delay to let the UI update
    }
    
    /**
     * Zooms map to filtered results
     * @public
     */
    function zoomToFilteredResults() {
        if (filteredChurches.length > 0) {
            // Create a bounds object from the filtered churches
            const points = filteredChurches.map(feature => {
                return [
                    feature.geometry.coordinates[1], 
                    feature.geometry.coordinates[0]
                ];
            });
            
            const bounds = L.latLngBounds(points);
            
            // Add padding to make sure all points are visible
            // More padding on mobile for better visibility
            const padding = UI.isMobileDevice() ? [40, 40] : [50, 50];
            const maxZoom = UI.isMobileDevice() ? 10 : 12; // Lower max zoom on mobile for better context
            
            MapManager.getMap().fitBounds(bounds, {
                padding: padding,
                maxZoom: maxZoom
            });
        }
    }
    
    /**
     * Resets all filters
     * @public
     */
    function resetFilters() {
        document.getElementById('title-search').value = '';
        document.getElementById('city-search').value = '';
        document.getElementById('country-search').value = '';
        document.getElementById('jurisdiction-search').value = '';
        document.getElementById('type-search').value = '';
        document.getElementById('rite-search').value = '';
        document.getElementById('list-search').value = '';
        
        // Reset list filter
        const items = document.querySelectorAll('.church-item');
        items.forEach(item => {
            item.style.display = '';
        });
        
        // Reset filter flags
        isFilterActive = false;
        hasAppliedFilters = false;
        document.getElementById('filter-active-indicator').style.display = 'none';
        document.getElementById('zoom-to-filter').style.display = 'none';
        
        applyFilters();
        
        // On mobile, collapse the filter panel after reset
        if (UI.isMobileDevice()) {
            setTimeout(() => {
                UI.togglePanel('filter-content');
            }, 300);
        }
    }
    
    /**
     * Sets up filter event listeners
     * @private
     */
    function setupFilterEventListeners() {
        // Add event listener for the zoom-to-filter button
        document.getElementById('zoom-to-filter').addEventListener('click', zoomToFilteredResults);
        
        // Reset filters button
        document.getElementById('reset-filters').addEventListener('click', resetFilters);
        
        // Apply filters when map moves (with debouncing)
        const mapMoveDelay = UI.isMobileDevice() ? 500 : 300; // Longer delay on mobile
        
        MapManager.getMap().on('moveend', debounce(function() {
            // Only update the map if no filters are active
            if (!isFilterActive) {
                applyFilters(false); // false indicates this was not a manual filter change
            }
        }, mapMoveDelay));
    }
    
    /**
     * Creates a debounced version of a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Time to wait in milliseconds
     * @return {Function} - Debounced function
     * @private
     */
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    /**
     * Sets up filter dropdowns
     * @private
     */
    function setupFilterDropdowns() {
        // Setup searchable dropdowns
        setupSearchableDropdown('title-search', 'title-suggestions', uniqueTitles);
        setupSearchableDropdown('city-search', 'city-suggestions', uniqueCities);
        setupSearchableDropdown('country-search', 'country-suggestions', uniqueCountries);
        setupSearchableDropdown('jurisdiction-search', 'jurisdiction-suggestions', uniqueJurisdictions);
        setupSearchableDropdown('type-search', 'type-suggestions', uniqueTypes);
        setupSearchableDropdown('rite-search', 'rite-suggestions', uniqueRites);
        
        // Add event listeners to filters (apply after delay to prevent excessive updates)
        const debounceDelay = UI.isMobileDevice() ? 800 : 500; // Longer delay on mobile for better performance
        
        // Create debounced version of applyFilters that also indicates a manual change
        const debounceApplyFilters = debounce(function() {
            applyFilters(true); // true indicates filter was manually changed
        }, debounceDelay);
        
        // Attach event listeners to input fields
        document.getElementById('title-search').addEventListener('input', debounceApplyFilters);
        document.getElementById('city-search').addEventListener('input', debounceApplyFilters);
        document.getElementById('country-search').addEventListener('input', debounceApplyFilters);
        document.getElementById('jurisdiction-search').addEventListener('input', debounceApplyFilters);
        document.getElementById('type-search').addEventListener('input', debounceApplyFilters);
        document.getElementById('rite-search').addEventListener('input', debounceApplyFilters);
    }
    
    /**
     * Initializes filter data from churches
     * @param {Array} churches - Array of church GeoJSON features
     * @public
     */
    function initFiltersData(churches) {
        allChurches = churches;
        
        // Extract unique values for filters
        allChurches.forEach(function(feature, index) {
            var props = feature.properties;
            
            // Extract city from address
            const city = ChurchesManager.extractCity(props.Address);
            feature.properties.City = city;
            if (city) uniqueCities.add(city);
            
            if (props.Country) uniqueCountries.add(props.Country);
            if (props.Jurisdiction) uniqueJurisdictions.add(props.Jurisdiction);
            if (props.Rite) uniqueRites.add(props.Rite);
            if (props.Title) uniqueTitles.add(props.Title);
            
            // Extract main category for Type filter
            if (props.Type) {
                uniqueTypes.add(props.Type);
                
                // Update the simplified types to match our new categories
                if (props.Type.toLowerCase().includes('basilica') || 
                    props.Type.toLowerCase().includes('cathedral')) {
                    uniqueTypes.add('Basilica or Cathedral');
                }
                else if (props.Type.toLowerCase().includes('parish') || 
                        props.Type.toLowerCase().includes('church') || 
                        props.Type.toLowerCase().includes('shrine')) {
                    uniqueTypes.add('Church or Shrine');
                }
                else if (props.Type.toLowerCase().includes('monument')) {
                    uniqueTypes.add('Historic Church or Monument');
                }
            }
        });
        
        // Setup dropdowns and event listeners
        setupFilterDropdowns();
        setupFilterEventListeners();
    }
    
    /**
     * Gets the list of visible churches
     * @return {Array} - Array of visible church GeoJSON features
     * @public
     */
    function getVisibleChurches() {
        return visibleChurches;
    }
    
    /**
     * Gets the list of filtered churches
     * @return {Array} - Array of filtered church GeoJSON features
     * @public
     */
    function getFilteredChurches() {
        return filteredChurches;
    }
    
    /**
     * Gets the list of all churches
     * @return {Array} - Array of all church GeoJSON features
     * @public
     */
    function getAllChurches() {
        return allChurches;
    }
    
    // Public API
    return {
        initFiltersData: initFiltersData,
        applyFilters: applyFilters,
        resetFilters: resetFilters,
        zoomToFilteredResults: zoomToFilteredResults,
        getChurchesInVisibleBounds: getChurchesInVisibleBounds,
        getVisibleChurches: getVisibleChurches,
        getFilteredChurches: getFilteredChurches,
        getAllChurches: getAllChurches
    };
})();