// Filter functionality for churches
document.addEventListener('DOMContentLoaded', function() {
    // Global references
    let allChurches = [];  // All churches from data
    let filteredChurches = []; // Currently filtered churches
    
    // Filter collections
    let uniqueCountries = new Set();
    let uniqueCities = new Set();
    let uniqueJurisdictions = new Set();
    let uniqueTypes = new Set();
    let uniqueRites = new Set();
    
    // Initialize filters when churches are loaded
    function initializeFilters(churches) {
        console.log("Initializing filters with", churches.length, "churches");
        allChurches = churches;
        
        // Extract unique values for filters
        churches.forEach(function(church) {
            if (church.properties.Country) uniqueCountries.add(church.properties.Country);
            if (church.properties.City) uniqueCities.add(church.properties.City);
            if (church.properties.Jurisdiction) uniqueJurisdictions.add(church.properties.Jurisdiction);
            if (church.properties.Type) uniqueTypes.add(church.properties.Type);
            if (church.properties.Rite) uniqueRites.add(church.properties.Rite);
        });
        
        console.log("Found", uniqueCountries.size, "countries,", uniqueCities.size, "cities");
        
        // Setup suggestion inputs
        setupSearchableDropdown('title-search', allChurches.map(c => c.properties.Title).filter(Boolean));
        setupSearchableDropdown('city-search', Array.from(uniqueCities));
        setupSearchableDropdown('country-search', Array.from(uniqueCountries));
        setupSearchableDropdown('jurisdiction-search', Array.from(uniqueJurisdictions));
        setupSearchableDropdown('type-search', Array.from(uniqueTypes));
        setupSearchableDropdown('rite-search', Array.from(uniqueRites));
        
        // Add event listeners to filter inputs
        document.getElementById('title-search').addEventListener('input', debounce(applyFilters, 300));
        document.getElementById('city-search').addEventListener('input', debounce(applyFilters, 300));
        document.getElementById('country-search').addEventListener('input', debounce(applyFilters, 300));
        document.getElementById('jurisdiction-search').addEventListener('input', debounce(applyFilters, 300));
        document.getElementById('type-search').addEventListener('input', debounce(applyFilters, 300));
        document.getElementById('rite-search').addEventListener('input', debounce(applyFilters, 300));
        
        // Reset filters button
        document.getElementById('reset-filters').addEventListener('click', resetFilters);
        
        // Initial filter
        applyFilters();
    }
    
    // Setup searchable dropdown
    function setupSearchableDropdown(inputId, items) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        // When input changes, update suggestions
        input.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const matches = items.filter(item => 
                item && item.toLowerCase().includes(query)
            ).slice(0, 10); // Limit to 10 suggestions
            
            showSuggestions(inputId, matches);
        });
        
        // When input gets focus, show suggestions
        input.addEventListener('focus', function() {
            const query = this.value.toLowerCase();
            const matches = items.filter(item => 
                item && item.toLowerCase().includes(query)
            ).slice(0, 10);
            
            showSuggestions(inputId, matches);
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== input) {
                hideSuggestions(inputId);
            }
        });
    }
    
    // Show suggestions for dropdown
    function showSuggestions(inputId, suggestions) {
        // Create suggestions container if it doesn't exist
        let suggestionsContainer = document.getElementById(inputId + '-suggestions');
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'dropdown-list';
            suggestionsContainer.id = inputId + '-suggestions';
            
            // Insert after input
            const input = document.getElementById(inputId);
            input.parentNode.appendChild(suggestionsContainer);
            
            // Add click handler for suggestions
            suggestionsContainer.addEventListener('click', function(e) {
                if (e.target.classList.contains('dropdown-item')) {
                    input.value = e.target.textContent;
                    hideSuggestions(inputId);
                    applyFilters();
                }
            });
        }
        
        // Clear existing suggestions
        suggestionsContainer.innerHTML = '';
        
        // Add "All" option
        const allItem = document.createElement('div');
        allItem.className = 'dropdown-item';
        allItem.textContent = 'All';
        suggestionsContainer.appendChild(allItem);
        
        // Add each suggestion
        suggestions.forEach(item => {
            if (!item) return;
            
            const element = document.createElement('div');
            element.className = 'dropdown-item';
            element.textContent = item;
            suggestionsContainer.appendChild(element);
        });
        
        // Show the suggestions
        suggestionsContainer.style.display = 'block';
    }
    
    // Hide suggestions dropdown
    function hideSuggestions(inputId) {
        const suggestions = document.getElementById(inputId + '-suggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }
    
    // Apply filters based on current input values
    function applyFilters() {
        console.log("Applying filters...");
        
        // Get filter values
        const titleFilter = document.getElementById('title-search').value.toLowerCase();
        const cityFilter = document.getElementById('city-search').value.toLowerCase();
        const countryFilter = document.getElementById('country-search').value.toLowerCase();
        const jurisdictionFilter = document.getElementById('jurisdiction-search').value.toLowerCase();
        const typeFilter = document.getElementById('type-search').value.toLowerCase();
        const riteFilter = document.getElementById('rite-search').value.toLowerCase();
        
        // Check if any filters are active
        const filtersActive = titleFilter || cityFilter || countryFilter || 
                              jurisdictionFilter || typeFilter || riteFilter;
        
        // Update filter indicator
        document.getElementById('filter-active-indicator').style.display = 
            filtersActive ? 'block' : 'none';
        
        // Update loading status
        document.getElementById('filter-info').textContent = 'Filtering churches...';
        
        // Filter churches
        filteredChurches = allChurches.filter(church => {
            const props = church.properties;
            
            // Extract properties (defaults to empty string if null)
            const title = (props.Title || '').toLowerCase();
            const city = (props.City || '').toLowerCase();
            const country = (props.Country || '').toLowerCase();
            const jurisdiction = (props.Jurisdiction || '').toLowerCase();
            const type = (props.Type || '').toLowerCase();
            const rite = (props.Rite || '').toLowerCase();
            
            // Check if each filter matches (if set)
            const titleMatch = !titleFilter || titleFilter === 'all' || title.includes(titleFilter);
            const cityMatch = !cityFilter || cityFilter === 'all' || city.includes(cityFilter);
            const countryMatch = !countryFilter || countryFilter === 'all' || country.includes(countryFilter);
            const jurisdictionMatch = !jurisdictionFilter || jurisdictionFilter === 'all' || jurisdiction.includes(jurisdictionFilter);
            const typeMatch = !typeFilter || typeFilter === 'all' || type.includes(typeFilter);
            const riteMatch = !riteFilter || riteFilter === 'all' || rite.includes(riteFilter);
            
            // All conditions must match
            return titleMatch && cityMatch && countryMatch && jurisdictionMatch && typeMatch && riteMatch;
        });
        
        console.log(`Filtered to ${filteredChurches.length} churches`);
        
        // Update church list and map
        populateChurchList(filteredChurches);
        displayChurches(filteredChurches);
        
        // Update info text
        document.getElementById('filter-info').textContent = 
            `Showing ${filteredChurches.length} of ${allChurches.length} churches`;
            
        // Show/hide zoom to filtered results button
        document.getElementById('zoom-to-filter').style.display = 
            (filtersActive && filteredChurches.length > 0) ? 'block' : 'none';
            
        // Add zoom to filter click handler
        document.getElementById('zoom-to-filter').onclick = function() {
            if (filteredChurches.length > 0 && window.map) {
                // Create bounds to contain all filtered churches
                const points = filteredChurches.map(church => [
                    church.geometry.coordinates[1],
                    church.geometry.coordinates[0]
                ]);
                
                const bounds = L.latLngBounds(points);
                window.map.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 12
                });
            }
        };
    }
    
    // Reset all filters
    function resetFilters() {
        console.log("Resetting filters");
        
        // Clear all filter inputs
        document.getElementById('title-search').value = '';
        document.getElementById('city-search').value = '';
        document.getElementById('country-search').value = '';
        document.getElementById('jurisdiction-search').value = '';
        document.getElementById('type-search').value = '';
        document.getElementById('rite-search').value = '';
        
        // Hide filter indicator
        document.getElementById('filter-active-indicator').style.display = 'none';
        
        // Reapply filters (which now shows all)
        applyFilters();
    }
    
    // Debounce function to prevent excessive filter application
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Connect to the church data when it's loaded
    // This will be called by the processChurchData function
    window.initializeFilters = initializeFilters;
});