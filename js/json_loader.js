/**
 * json_loader.js - Initializes the map with loaded data chunks
 * This file is loaded after all data chunks are loaded
 */

// Create the complete JSON by concatenating chunks
console.log("json_loader.js executing");

var json_complete_parish_data_1 = {
    "type": "FeatureCollection",
    "name": "complete_parish_data_1",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": []
};

// Safely add features from each chunk
function addFeaturesFromChunk(chunkVar) {
    try {
        if (window[chunkVar] && window[chunkVar].features) {
            json_complete_parish_data_1.features = json_complete_parish_data_1.features.concat(window[chunkVar].features);
            console.log(`Added ${window[chunkVar].features.length} features from ${chunkVar}`);
            return window[chunkVar].features.length;
        } else {
            console.warn(`Warning: Chunk ${chunkVar} not found or has no features`);
            return 0;
        }
    } catch (e) {
        console.error(`Error adding features from ${chunkVar}:`, e);
        return 0;
    }
}

// Count total features
let totalFeaturesAdded = 0;

// Add features from each chunk if available
totalFeaturesAdded += addFeaturesFromChunk('json_complete_parish_data_1_part1');
totalFeaturesAdded += addFeaturesFromChunk('json_complete_parish_data_1_part2');
totalFeaturesAdded += addFeaturesFromChunk('json_complete_parish_data_1_part3');
totalFeaturesAdded += addFeaturesFromChunk('json_complete_parish_data_1_part4');
totalFeaturesAdded += addFeaturesFromChunk('json_complete_parish_data_1_part5');

console.log(`Combined ${json_complete_parish_data_1.features.length} features from all chunks`);

// Add direct reference to map in window for easier access
function storeMapReference() {
    if (window.MapManager && MapManager.getMap()) {
        window.map = MapManager.getMap();
        console.log("Stored map reference in window.map");
    } else {
        console.log("MapManager not available yet, will try again");
        setTimeout(storeMapReference, 500);
    }
}

// Function to initialize the map with data
function initializeMap() {
    console.log("Initializing map with combined data");
    
    // Store map reference for easier access
    storeMapReference();
    
    // If no features were loaded, show an error
    if (json_complete_parish_data_1.features.length === 0) {
        console.error("No features loaded from any chunks!");
        document.getElementById('loading-status').textContent = 'Error: No church data loaded. Please check console.';
        return;
    }
    
    // Assign unique IDs to all features
    json_complete_parish_data_1.features.forEach(function(feature, index) {
        feature.properties.id = index;
    });
    
    // Update loading status
    document.getElementById('loading-status').textContent = 
        `Loaded ${json_complete_parish_data_1.features.length} churches. Initializing map...`;
    
    // Initialize filters with all church data
    if (window.FiltersManager) {
        try {
            console.log("Initializing FiltersManager with church data");
            FiltersManager.initFiltersData(json_complete_parish_data_1.features);
            console.log("FiltersManager initialized");
        } catch (e) {
            console.error("Error initializing FiltersManager:", e);
        }
    } else {
        console.error("FiltersManager not found");
    }
    
    // Apply filters to show churches on map
    if (window.FiltersManager) {
        try {
            console.log("Applying filters");
            FiltersManager.applyFilters();
        } catch (e) {
            console.error("Error applying filters:", e);
        }
    }
    
    // Directly populate church list with all churches (limited to 500 for performance)
    if (window.ChurchesManager) {
        try {
            console.log("Populating church list with all churches");
            ChurchesManager.populateChurchList(json_complete_parish_data_1.features.slice(0, 500));
        } catch (e) {
            console.error("Error populating church list:", e);
        }
    } else {
        console.error("ChurchesManager not found");
        // Create a fallback church list if ChurchesManager isn't available
        createFallbackChurchList();
    }
    
    // Hide loading indicator
    setTimeout(function() {
        document.getElementById('loading-indicator').style.display = 'none';
    }, 1000);
    
    // Ensure church list panel is visible on desktop
    if (window.innerWidth >= 768) {
        const panel = document.getElementById('church-list-panel');
        if (panel) {
            panel.style.display = 'block';
            
            // Make sure the content is visible
            const content = document.getElementById('church-list-content');
            if (content) {
                content.classList.remove('collapsed');
                content.style.display = 'block';
                
                // Update toggle button
                const toggleBtn = document.getElementById('church-list-toggle');
                if (toggleBtn) toggleBtn.textContent = '−';
            }
        }
    }
    
    console.log("Map initialization complete");
}

// Fallback function to create church list if ChurchesManager isn't available
function createFallbackChurchList() {
    console.log("Creating fallback church list");
    const listElement = document.getElementById('church-list');
    if (!listElement) return;
    
    listElement.innerHTML = ''; // Clear existing items
    
    // Limit to 500 churches for performance
    const limitedChurches = json_complete_parish_data_1.features.slice(0, 500);
    
    limitedChurches.forEach((feature, index) => {
        const item = document.createElement('div');
        item.className = 'church-item';
        item.id = 'church-item-' + index;
        
        const title = document.createElement('div');
        title.className = 'church-title';
        title.textContent = feature.properties.Title || 'Unnamed Church';
        
        const details = document.createElement('div');
        details.className = 'church-details';
        
        // Create details with available information
        let detailsText = '';
        if (feature.properties.Type) detailsText += feature.properties.Type;
        if (feature.properties.Country) {
            detailsText += detailsText ? ' • ' : '';
            detailsText += feature.properties.Country;
        }
        
        details.textContent = detailsText;
        
        item.appendChild(title);
        item.appendChild(details);
        
        listElement.appendChild(item);
    });
    
    console.log(`Added ${listElement.childNodes.length} churches to fallback list`);
}

// Wait a moment to make sure all modules are loaded
setTimeout(function() {
    console.log("Starting map initialization");
    initializeMap();
}, 800);