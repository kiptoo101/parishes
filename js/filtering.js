// Filtering Module
(function() {
    // Global variables for filter state
    let filteredChurches = [];
    let visibleChurches = [];
    let isFilterActive = false;
    let hasAppliedFilters = false;

    // Unique value sets for suggestions
    const filterSets = {
        uniqueCities: new Set(),
        uniqueCountries: new Set(),
        uniqueJurisdictions: new Set(),
        uniqueRites: new Set(),
        uniqueTitles: new Set(),
        uniqueTypes: new Set()
    };

    // Debounce function to limit rapid filter applications
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Extract unique values for filters
    function processChurchData(churches) {
        churches.forEach((feature, index) => {
            // Assign a unique ID for identification
            feature.properties.id = index;
            
            const props = feature.properties;
            
            // Extract city from address
            const city = extractCity(props.Address);
            feature.properties.City = city;
            
            // Populate unique sets
            if (city) filterSets.uniqueCities.add(city);
            if (props.Country) filterSets.uniqueCountries.add(props.Country);
            if (props.Jurisdiction) filterSets.uniqueJurisdictions.add(props.Jurisdiction);
            if (props.Rite) filterSets.uniqueRites.add(props.Rite);
            if (props.Title) filterSets.uniqueTitles.add(props.Title);
            
            // Extract main category for Type filter
            if (props.Type) {
                filterSets.uniqueTypes.add(props.Type);
                
                // Update simplified types
                if (props.Type.toLowerCase().includes('basilica') || 
                    props.Type.toLowerCase().includes('cathedral')) {
                    filterSets.uniqueTypes.add('Basilica or Cathedral');
                }
                else if (props.Type.toLowerCase().includes('parish') || 
                        props.Type.toLowerCase().includes('church') || 
                        props.Type.toLowerCase().includes('shrine')) {
                    filterSets.uniqueTypes.add('Church or Shrine');
                }
                else if (props.Type.toLowerCase().includes('monument')) {
                    filterSets.uniqueTypes.add('Historic Church or Monument');
                }
            }
        });

        return filterSets;
    }

    // Extract city from address
    function extractCity(address) {
        if (!address) return '';
        
        const addressParts = address.split(',');
        if (addressParts.length >= 2) {
            return addressParts[addressParts.length - 2].trim();
        }
        return '';
    }

    // Setup searchable dropdowns for filters
    function setupSearchableDropdown(inputId, suggestionsId, dataSet) {
        const input = document.getElementById(inputId);
        const suggestions = document.getElementById(suggestionsId);
        
        // Show suggestions on focus
        input.addEventListener('focus', () => {
            updateSuggestionList(input.value, suggestions, dataSet);
            suggestions.style.display = 'block';
        });
        
        // Update suggestions on input
        input.addEventListener('input', () => {
            updateSuggestionList(input.value, suggestions, dataSet);
            suggestions.style.display = 'block';
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (event) => {
            if (event.target !== input && !suggestions.contains(event.target)) {
                suggestions.style.display = 'none';
            }
        });
        
        // Apply selected suggestion
        suggestions.addEventListener('click', (event) => {
            if (event.target.classList.contains('dropdown-item')) {
                input.value = event.target.textContent;
                suggestions.style.display = 'none';
                applyFilters(true); // true indicates filter was manually changed
            }
        });
    }

    // Update suggestion list based on input
    function updateSuggestionList(query, suggestionElement, dataSet) {
        suggestionElement.innerHTML = '';
        query = query.toLowerCase();
        
        const dataArray = Array.from(dataSet);
        let matches;
        
        const isMobile = window.innerWidth < 768;
        const limit = isMobile ? 50 : 100;
        
        if (query === '') {
            matches = dataArray.slice(0, limit);
        } else {
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

    // Check if any filters are active
    function checkActiveFilters() {
        const filterInputs = [
            'title-search', 'city-search', 'country-search', 
            'jurisdiction-search', 'type-search', 'rite-search'
        ];
        
        isFilterActive = filterInputs.some(inputId => 
            document.getElementById(inputId).value.trim() !== ''
        );
        
        // Update UI based on filter status
        const filterActiveIndicator = document.getElementById('filter-active-indicator');
        const zoomToFilterBtn = document.getElementById('zoom-to-filter');
        
        if (filterActiveIndicator) {
            filterActiveIndicator.style.display = isFilterActive ? 'block' : 'none';
        }
        
        if (zoomToFilterBtn) {
            zoomToFilterBtn.style.display = isFilterActive ? 'block' : 'none';
        }
        
        return isFilterActive;
    }

    // Apply filters to churches
    function applyFilters(manuallyChanged = false) {
        // Get filter values
        const filters = {
            title: document.getElementById('title-search').value.toLowerCase(),
            city: document.getElementById('city-search').value.toLowerCase(),
            country: document.getElementById('country-search').value.toLowerCase(),
            jurisdiction: document.getElementById('jurisdiction-search').value.toLowerCase(),
            type: document.getElementById('type-search').value.toLowerCase(),
            rite: document.getElementById('rite-search').value.toLowerCase()
        };
        
        // Check if any filters are active
        const filtersActive = checkActiveFilters();
        
        // Store whether this is a filter change
        if (manuallyChanged) {
            hasAppliedFilters = true;
        }
        
        // Show loading indicator
        const filterInfo = document.getElementById('filter-info');
        if (filterInfo) {
            filterInfo.textContent = 'Filtering churches...';
        }
        
        // Use setTimeout to allow UI to update before heavy processing
        const isMobile = window.innerWidth < 768;
        const processingDelay = isMobile ? 100 : 50;
        
        setTimeout(() => {
            // Clear existing layers if markers exist
            if (window.markers) {
                window.markers.clearLayers();
            }
            
            // Base collection to filter from - ALWAYS start with all churches
            let baseCollection = window.allChurches;
            
            // If no filters active, only filter by current view bounds
            if (!filtersActive) {
                const bounds = window.globalMap.getBounds();
                baseCollection = baseCollection.filter(feature => {
                    const lat = feature.geometry.coordinates[1];
                    const lng = feature.geometry.coordinates[0];
                    return bounds.contains([lat, lng]);
                });
            }
            
            // Apply content filters
            filteredChurches = baseCollection.filter(feature => {
                const props = feature.properties;
                
                // If no filters are active, include all churches in current view
                if (!filtersActive) {
                    return true;
                }
                
                // Extract properties (defaults to empty string if null)
                const matchChecks = {
                    title: !filters.title || filters.title === 'all' || 
                           (props.Title || '').toLowerCase().includes(filters.title),
                    city: !filters.city || filters.city === 'all' || 
                          (props.City || '').toLowerCase().includes(filters.city),
                    country: !filters.country || filters.country === 'all' || 
                             (props.Country || '').toLowerCase().includes(filters.country),
                    jurisdiction: !filters.jurisdiction || filters.jurisdiction === 'all' || 
                                  (props.Jurisdiction || '').toLowerCase().includes(filters.jurisdiction),
                    type: !filters.type || filters.type === 'all' || 
                          (props.Type || '').toLowerCase().includes(filters.type),
                    rite: !filters.rite || filters.rite === 'all' || 
                          (props.Rite || '').toLowerCase().includes(filters.rite)
                };
                
                // Return true if all filters match
                return Object.values(matchChecks).every(Boolean);
            });
            
            // Set ALL filtered churches as visible
            visibleChurches = filteredChurches;
            
            // Limit churches for mobile performance
            let displayChurches = visibleChurches;
            if (isMobile && !filtersActive && displayChurches.length > 1000) {
                displayChurches = displayChurches.slice(0, 1000);
            }
            
            // Create GeoJSON for the map
            const tempGeoJson = {
                "type": "FeatureCollection",
                "features": displayChurches
            };
            
            // Add markers if churches exist
            if (tempGeoJson.features.length > 0 && window.addMarkersToMap) {
                window.addMarkersToMap(tempGeoJson);
                
                // Zoom to filtered results if filters were manually changed
                if (manuallyChanged && filtersActive) {
                    zoomToFilteredResults();
                }
            }
            
            // Update info text
            const infoText = isMobile ? 
                `${visibleChurches.length} of ${window.allChurches.length} churches` :
                `Showing ${visibleChurches.length} of ${filteredChurches.length} filtered churches (${window.allChurches.length} total)`;
            
            if (filterInfo) {
                filterInfo.textContent = infoText;
            }
            
            // Update church list
            if (window.populateChurchList) {
                window.populateChurchList(visibleChurches);
            }
        }, processingDelay);
    }

    // Zoom to filtered results
    function zoomToFilteredResults() {
        if (filteredChurches.length > 0) {
            const points = filteredChurches.map(feature => [
                feature.geometry.coordinates[1], 
                feature.geometry.coordinates[0]
            ]);
            
            const bounds = L.latLngBounds(points);
            
            const isMobile = window.innerWidth < 768;
            const padding = isMobile ? [40, 40] : [50, 50];
            const maxZoom = isMobile ? 10 : 12;
            
            window.globalMap.fitBounds(bounds, {
                padding: padding,
                maxZoom: maxZoom
            });
        }
    }

    // Reset filters
    function resetFilters() {
        // Reset all filter inputs
        const filterInputs = [
            'title-search', 'city-search', 'country-search', 
            'jurisdiction-search', 'type-search', 'rite-search',
            'list-search'
        ];
        
        filterInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) input.value = '';
        });
        
        // Reset list filter visibility
        const listItems = document.querySelectorAll('.church-item');
        listItems.forEach(item => {
            item.style.display = '';
        });
        
        // Reset filter flags
        isFilterActive = false;
        hasAppliedFilters = false;
        
        // Hide indicators
        const filterActiveIndicator = document.getElementById('filter-active-indicator');
        const zoomToFilterBtn = document.getElementById('zoom-to-filter');
        
        if (filterActiveIndicator) filterActiveIndicator.style.display = 'none';
        if (zoomToFilterBtn) zoomToFilterBtn.style.display = 'none';
        
        // Reapply filters
        applyFilters();
        
        // On mobile, collapse the filter panel after reset
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setTimeout(() => {
                if (typeof togglePanel === 'function') {
                    togglePanel('filter-content');
                }
            }, 300);
        }
    }

    // Expose public methods and initialize
    window.initializeFiltering = function(churches) {
        // Process church data and get unique sets
        const uniqueSets = processChurchData(churches);
        
        // Setup searchable dropdowns
        setupSearchableDropdown('title-search', 'title-suggestions', uniqueSets.uniqueTitles);
        setupSearchableDropdown('city-search', 'city-suggestions', uniqueSets.uniqueCities);
        setupSearchableDropdown('country-search', 'country-suggestions', uniqueSets.uniqueCountries);
        setupSearchableDropdown('jurisdiction-search', 'jurisdiction-suggestions', uniqueSets.uniqueJurisdictions);
        setupSearchableDropdown('type-search', 'type-suggestions', uniqueSets.uniqueTypes);
        setupSearchableDropdown('rite-search', 'rite-suggestions', uniqueSets.uniqueRites);
        
        // Add event listeners to filter inputs
        const filterInputs = [
            'title-search', 'city-search', 'country-search', 
            'jurisdiction-search', 'type-search', 'rite-search'
        ];
        
        const debouncedApplyFilters = debounce(() => applyFilters(true), 500);
        
        filterInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', debouncedApplyFilters);
            }
        });
        
        // Setup reset filters button
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetFilters);
        }
        
        // Setup zoom to filter button
        const zoomBtn = document.getElementById('zoom-to-filter');
        if (zoomBtn) {
            zoomBtn.addEventListener('click', zoomToFilteredResults);
        }
        
        // Initial filter application
        applyFilters();
    };
})();