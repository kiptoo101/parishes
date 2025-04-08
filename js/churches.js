/**
 * churches.js - Handles church-specific functionality
 * This module is responsible for church list rendering, highlighting, and church data processing
 */

const ChurchesManager = (function() {
    /**
     * Extracts city from address
     * @param {string} address - Address string
     * @return {string} - Extracted city name or empty string
     * @public
     */
    function extractCity(address) {
        if (!address) return '';
        
        // Try to find city by common patterns
        const addressParts = address.split(',');
        if (addressParts.length >= 2) {
            // Typically city is the second-to-last part
            return addressParts[addressParts.length - 2].trim();
        }
        return '';
    }
    
    /**
     * Gets city from coordinates using reverse geocoding
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @return {Promise<string>} - Promise resolving to city name
     * @public
     */
    function getCityFromCoords(lat, lng) {
        return new Promise((resolve) => {
            // Check if geocoder is available
            if (typeof L !== 'undefined' && L.Control && L.Control.Geocoder) {
                const geocoder = L.Control.Geocoder.nominatim();
                geocoder.reverse({lat: lat, lng: lng}, window.map ? window.map.getZoom() : 10, results => {
                    if (results && results.length > 0 && results[0].properties && results[0].properties.address) {
                        const address = results[0].properties.address;
                        if (address.city) {
                            resolve(address.city);
                        } else if (address.town) {
                            resolve(address.town);
                        } else if (address.village) {
                            resolve(address.village);
                        } else if (address.suburb) {
                            resolve(address.suburb);
                        } else {
                            resolve('');
                        }
                    } else {
                        resolve('');
                    }
                });
            } else {
                console.warn('Geocoder not available');
                resolve('');
            }
        });
    }
    
    /**
     * Highlights a church item in the list
     * @param {string|number} id - Church ID
     * @public
     */
    function highlightListItem(id) {
        // Remove any existing highlights
        const items = document.querySelectorAll('.church-item');
        items.forEach(item => item.style.backgroundColor = '');
        
        // Highlight the clicked item
        const targetItem = document.getElementById('church-item-' + id);
        if (targetItem) {
            targetItem.style.backgroundColor = '#e6f0ff';
            
            // Scroll to the item
            const listContainer = document.getElementById('church-list');
            if (listContainer) {
                listContainer.scrollTop = targetItem.offsetTop - listContainer.offsetTop;
            }
            
            // Make sure church list panel is visible when an item is highlighted
            const panel = document.getElementById('church-list-panel');
            if (panel && panel.style.display === 'none') {
                // Show the panel if it's hidden
                panel.style.display = 'block';
                
                // Make sure the content is visible
                const content = document.getElementById('church-list-content');
                if (content && content.classList.contains('collapsed')) {
                    content.classList.remove('collapsed');
                    content.style.display = 'block';
                    
                    // Update toggle button
                    const toggleBtn = document.getElementById('church-list-toggle');
                    if (toggleBtn) toggleBtn.textContent = '−';
                }
            }
        }
    }
    
    /**
     * Populates the church list with church items
     * @param {Array} churches - Array of church GeoJSON features
     * @public
     */
    function populateChurchList(churches) {
        console.log(`Populating church list with ${churches.length} churches`);
        const listElement = document.getElementById('church-list');
        if (!listElement) {
            console.error('Church list element not found');
            return;
        }
        
        listElement.innerHTML = ''; // Clear existing items
        
        // Check if we have churches
        if (!churches || churches.length === 0) {
            listElement.innerHTML = '<div style="padding: 15px; text-align: center;">No churches found</div>';
            return;
        }
        
        // Limit number of churches to render for performance
        const renderLimit = 500;
        const limitedChurches = churches.slice(0, renderLimit);
        
        // Create church items
        limitedChurches.forEach((feature, index) => {
            try {
                // Assign a unique ID if not present
                if (!feature.properties.id) {
                    feature.properties.id = index;
                }
                
                const item = document.createElement('div');
                item.className = 'church-item';
                item.id = 'church-item-' + feature.properties.id;
                
                const title = document.createElement('div');
                title.className = 'church-title';
                title.textContent = feature.properties.Title || 'Unnamed Church';
                
                const details = document.createElement('div');
                details.className = 'church-details';
                
                // Create details with available information
                let detailsText = '';
                if (feature.properties.Type) {
                    detailsText += feature.properties.Type;
                }
                if (feature.properties.Jurisdiction) {
                    detailsText += detailsText ? ' • ' : '';
                    detailsText += feature.properties.Jurisdiction;
                }
                if (feature.properties.City) {
                    detailsText += detailsText ? ' • ' : '';
                    detailsText += feature.properties.City;
                }
                if (feature.properties.Country) {
                    detailsText += detailsText ? ' • ' : '';
                    detailsText += feature.properties.Country;
                }
                
                details.textContent = detailsText;
                
                item.appendChild(title);
                item.appendChild(details);
                
                // Click event to locate on map
                item.addEventListener('click', function() {
                    try {
                        // Get coordinates
                        const lat = feature.geometry.coordinates[1];
                        const lng = feature.geometry.coordinates[0];
                        const zoom = 15; // Good zoom level for seeing context
                        
                        // Check if map exists
                        const map = window.map || (window.MapManager ? MapManager.getMap() : null);
                        if (map) {
                            // Fly to location
                            map.flyTo([lat, lng], zoom);
                        } else {
                            console.error('Map not available');
                        }
                        
                        // Highlight the item in the list
                        highlightListItem(feature.properties.id);
                        
                        // Try to open popup if markers are available
                        setTimeout(function() {
                            const markers = window.markers || (window.MapManager ? MapManager.getMarkers() : null);
                            if (markers) {
                                markers.eachLayer(function(layer) {
                                    if (layer.feature && layer.feature.properties.id === feature.properties.id) {
                                        layer.openPopup();
                                    }
                                });
                            }
                        }, 1000);
                    } catch (e) {
                        console.error('Error clicking church item:', e);
                    }
                });
                
                listElement.appendChild(item);
            } catch (e) {
                console.error('Error creating church item:', e, feature);
            }
        });
        
        // Add a note if we had to limit the list for performance
        if (churches.length > renderLimit) {
            const note = document.createElement('div');
            note.style.padding = '10px';
            note.style.fontSize = '12px';
            note.style.color = '#666';
            note.style.textAlign = 'center';
            note.style.borderTop = '1px solid #ddd';
            note.textContent = `Showing ${renderLimit} of ${churches.length} churches. Apply filters to narrow results.`;
            listElement.appendChild(note);
        }
        
        console.log(`Added ${listElement.childNodes.length} items to church list`);
        
        // Make sure the church list panel is visible on desktop
        if (window.innerWidth >= 768) {
            const panel = document.getElementById('church-list-panel');
            if (panel) panel.style.display = 'block';
            
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
    
    /**
     * Sets up church list search functionality
     * @public
     */
    function setupListSearch() {
        const searchInput = document.getElementById('list-search');
        if (!searchInput) {
            console.error('List search input not found');
            return;
        }
        
        let debounceTimeout;
        
        searchInput.addEventListener('input', function() {
            // Clear previous timeout
            clearTimeout(debounceTimeout);
            
            // Set debounce delay
            const debounceDelay = 200;
            
            // Set new timeout
            debounceTimeout = setTimeout(() => {
                const query = this.value.toLowerCase();
                
                // Filter the list items
                const items = document.querySelectorAll('.church-item');
                items.forEach(item => {
                    const title = item.querySelector('.church-title')?.textContent.toLowerCase() || '';
                    const details = item.querySelector('.church-details')?.textContent.toLowerCase() || '';
                    
                    if (title.includes(query) || details.includes(query)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }, debounceDelay);
        });
    }
    
    /**
     * Initializes church-specific functionality
     * @public
     */
    function init() {
        // Setup list search
        setTimeout(setupListSearch, 500); // Slight delay to ensure DOM elements exist
        
        // Make church list panel visible on desktop
        setTimeout(function() {
            if (window.innerWidth >= 768) {
                const panel = document.getElementById('church-list-panel');
                if (panel) panel.style.display = 'block';
                
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
        }, 1000);
        
        // Register global access
        window.ChurchesManager = ChurchesManager;
    }
    
    // Public API
    return {
        init: init,
        extractCity: extractCity,
        getCityFromCoords: getCityFromCoords,
        highlightListItem: highlightListItem,
        populateChurchList: populateChurchList,
        setupListSearch: setupListSearch
    };
})();

// Initialize churches manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing ChurchesManager');
    ChurchesManager.init();
});

// Make sure it's accessible globally
window.ChurchesManager = ChurchesManager;