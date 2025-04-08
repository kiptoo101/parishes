/**
 * map.js - Handles map initialization and basic map functionality
 * This module is responsible for setting up the map, layers, and basic map interactions
 */

const MapManager = (function() {
    // Private variables
    let map;
    let markers;
    let autolinker;
    let bounds_group;
    
    /**
     * Highlights a feature when interacted with
     * @param {Object} e - Event object
     * @private
     */
    function highlightFeature(e) {
        const layer = e.target;
        
        if (layer.feature && layer.feature.geometry) {
            if (layer.feature.geometry.type === 'LineString' || layer.feature.geometry.type === 'MultiLineString') {
                layer.setStyle({
                    color: '#3388ff', // Blue highlight
                    weight: 5,
                    opacity: 0.8
                });
            } else {
                // For points, we change the icon scale or opacity if needed
                const icon = layer.getIcon();
                if (icon) {
                    // You could modify the icon here if needed
                }
            }
        }
        
        // Always open the popup regardless of geometry type
        if (layer.getPopup()) {
            layer.openPopup();
        }
    }
    
    /**
     * Creates popups for church points
     * @param {Object} feature - GeoJSON feature
     * @param {Object} layer - Leaflet layer
     * @public
     */
    function pop_complete_parish_data_1(feature, layer) {
        // Extract city from address or determine by coordinates
        const city = ChurchesManager.extractCity(feature.properties.Address);
        feature.properties.City = city; // Store city for filtering
        
        // Get coordinates for popup
        const lat = feature.geometry.coordinates[1].toFixed(6);
        const lng = feature.geometry.coordinates[0].toFixed(6);
        
        // Create mobile-friendly popup content with larger fonts for mobile
        var fontSizeTitle = UI.isMobileDevice() ? '16px' : '16px';
        var fontSizeContent = UI.isMobileDevice() ? '14px' : '14px';
        
        var popupContent = '<table style="width:100%;">\
                <tr>\
                    <td colspan="2" style="font-size:' + fontSizeTitle + ';"><strong>' + 
                    (feature.properties['Title'] !== null ? autolinker.link(feature.properties['Title'].toLocaleString()) : '') + '</strong></td>\
                </tr>\
                <tr>\
                    <td style="font-size:' + fontSizeContent + ';">Jurisdiction:</td>\
                    <td style="font-size:' + fontSizeContent + ';">' + 
                    (feature.properties['Jurisdiction'] !== null ? autolinker.link(feature.properties['Jurisdiction'].toLocaleString()) : '') + '</td>\
                </tr>\
                <tr>\
                    <td style="font-size:' + fontSizeContent + ';">Type:</td>\
                    <td style="font-size:' + fontSizeContent + ';">' + 
                    (feature.properties['Type'] !== null ? autolinker.link(feature.properties['Type'].toLocaleString()) : '') + '</td>\
                </tr>\
                <tr>\
                    <td style="font-size:' + fontSizeContent + ';">Rite:</td>\
                    <td style="font-size:' + fontSizeContent + ';">' + 
                    (feature.properties['Rite'] !== null ? autolinker.link(feature.properties['Rite'].toLocaleString()) : '') + '</td>\
                </tr>\
                <tr>\
                    <td style="font-size:' + fontSizeContent + ';">City:</td>\
                    <td style="font-size:' + fontSizeContent + ';">' + 
                    (city ? autolinker.link(city) : '') + '</td>\
                </tr>\
                <tr>\
                    <td style="font-size:' + fontSizeContent + ';">Country:</td>\
                    <td style="font-size:' + fontSizeContent + ';">' + 
                    (feature.properties['Country'] !== null ? autolinker.link(feature.properties['Country'].toLocaleString()) : '') + '</td>\
                </tr>\
                <tr>\
                    <td style="font-size:' + fontSizeContent + ';">Coordinates:</td>\
                    <td style="font-size:' + fontSizeContent + ';">Lat: ' + lat + ', Lng: ' + lng + '</td>\
                </tr>\
            </table>';
        var content = removeEmptyRowsFromPopupContent(popupContent, feature);
        
        // Create mobile-optimized popup with adjusted dimensions
        const popupWidth = UI.isMobileDevice() ? 280 : 400;
        const popupHeight = UI.isMobileDevice() ? 300 : 400;
        const popupOptions = {
            maxWidth: popupWidth,
            maxHeight: popupHeight,
            autoPanPaddingTopLeft: UI.isMobileDevice() ? [10, 50] : [50, 50], // Increased vertical padding for mobile
            autoPanPaddingBottomRight: UI.isMobileDevice() ? [10, 10] : [50, 50],
            closeButton: true,
            closeOnClick: false, // Prevent accidental closures on mobile
            className: UI.isMobileDevice() ? 'mobile-popup' : '' // Add class for mobile-specific CSS
        };
        
        // Bind popup to layer
        layer.bindPopup(content, popupOptions);
        
        // Setup popup open event to handle additional formatting
        layer.on('popupopen', function(e) {
            addClassToPopupIfMedia(content, e.popup);
            
            // Additional class for mobile
            if (UI.isMobileDevice()) {
                e.popup._container.classList.add('mobile-popup');
            }
        });
        
        // Setup event handlers for the layer
        layer.on({
            // Only use mouseover on desktop
            mouseover: UI.isMobileDevice() ? null : function(e) {
                layer.openPopup();
            },
            
            mouseout: function(e) {
                if (!UI.isMobileDevice()) {
                    if (typeof layer.closePopup == 'function') {
                        layer.closePopup();
                    } else {
                        layer.eachLayer(function(feature){
                            feature.closePopup();
                        });
                    }
                }
            },
            
            // Handle click events properly
            click: function(e) {
                // Highlight corresponding item in the list
                ChurchesManager.highlightListItem(feature.properties.id);
                
                // Always open the popup on click for both mobile and desktop
                layer.openPopup();
            }
        });
    }
    
    /**
     * Helper function to remove empty rows from popup content
     * @param {string} content - Popup content HTML
     * @param {Object} feature - GeoJSON feature
     * @return {string} - Processed HTML
     * @private
     */
    function removeEmptyRowsFromPopupContent(content, feature) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        var rows = tempDiv.querySelectorAll('tr');
        for (var i = 0; i < rows.length; i++) {
            var td = rows[i].querySelector('td.visible-with-data');
            var key = td ? td.id : '';
            if (td && td.classList.contains('visible-with-data') && feature.properties[key] == null) {
                rows[i].parentNode.removeChild(rows[i]);
            }
        }
        return tempDiv.innerHTML;
    }
    
    /**
     * Helper function to format popup if it contains media
     * @param {string} content - Popup content HTML
     * @param {Object} popup - Leaflet popup object
     * @private
     */
    function addClassToPopupIfMedia(content, popup) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        if (tempDiv.querySelector('td img')) {
            popup._contentNode.classList.add('media');
            // Delay to force the redraw
            setTimeout(function() {
                popup.update();
            }, 10);
        } else {
            popup._contentNode.classList.remove('media');
        }
    }
    
    /**
     * Styling function for church points
     * @param {Object} feature - GeoJSON feature
     * @return {Object} - Leaflet icon
     * @public
     */
    function style_complete_parish_data_1_0(feature) {
        // Get the type and title info
        var type = feature.properties.Type || '';
        var title = (feature.properties.Title || '').toLowerCase();
        
        // Set the icon based on type
        let iconUrl = '';
        let iconSize = [30, 30]; // Default size
        let iconClass = ''; // For applying color filters
        
        // Updated styling for green basilicas/cathedrals and white churches
        if (type.toLowerCase().includes('basilica') || type.toLowerCase().includes('cathedral')) {
            // Cathedral icon with green tint
            iconUrl = 'cathedral-icon.png'; // Use relative path
            iconSize = [30, 30];
            iconClass = 'cathedral-icon-green'; // Apply green filter
        } else if (type.toLowerCase().includes('monument')) {
            // Monument icon with green tint too
            iconUrl = 'cathedral-icon.png'; // Use relative path
            iconSize = [25, 25]; // Slightly smaller
            iconClass = 'cathedral-icon-green'; // Apply green filter
        } else {
            // Church icon with white tint
            iconUrl = 'church-icon.png'; // Use relative path
            iconSize = [30, 30];
            iconClass = 'church-icon-white'; // Apply white filter
        }
        
        // Make Marian churches slightly larger
        if (title.includes('our lady')) {
            iconSize = [iconSize[0] * 1.2, iconSize[1] * 1.2]; // 20% larger
        }
        
        // On mobile, increase icon size slightly for better touch targets
        if (UI.isMobileDevice()) {
            iconSize = [iconSize[0] * 1.2, iconSize[1] * 1.2];
        }
        
        // Create icon
        var churchIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: iconSize,
            iconAnchor: [iconSize[0]/2, iconSize[1]/2], // Center anchor
            popupAnchor: [0, -iconSize[1]/2], // Popup appears above the icon
            className: iconClass // Apply the color filter class
        });
        
        return churchIcon;
    }
    
    /**
     * Ensures the map fills the viewport
     * @private
     */
    function ensureMapFillsViewport() {
        var worldBounds = [[-90, -180], [90, 180]];
        map.setMinZoom(map.getBoundsZoom(worldBounds, true));
        map.setMaxBounds([[-90, -360], [90, 360]]);  // Set max bounds with padding for world copy
    }
    
    /**
     * Initializes the map
     * @public
     */
    function initMap() {
        // Initialize map with global extent and mobile optimizations
        map = L.map('map', {
            zoomControl: false,
            maxZoom: 28,
            minZoom: 2,
            worldCopyJump: true,
            zoomAnimation: true,
            fadeAnimation: true,
            tap: true, // Enable tap for mobile
            tapTolerance: 15, // Increase tap tolerance for mobile
            bounceAtZoomLimits: false, // Prevent bounce at zoom limits for smoother mobile experience
            dragging: true, // Enable dragging
            touchZoom: true, // Enable touch zoom
            doubleClickZoom: true, // Enable double click zoom
            keyboard: true // Enable keyboard navigation
        });
        
        // Set map bounds to world extent
        var worldBounds = [[-90, -180], [90, 180]];
        map.fitBounds(worldBounds);
        
        // Make sure map fills viewport with world view
        ensureMapFillsViewport();
        window.addEventListener('resize', ensureMapFillsViewport);
        
        // Initialize hash for URL tracking
        var hash = new L.Hash(map);
        map.attributionControl.setPrefix('<a href="https://github.com/tomchadwin/qgis2web" target="_blank">qgis2web</a> &middot; <a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> &middot; <a href="https://qgis.org">QGIS</a>');
        
        // Initialize autolinker for popup content
        autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});
        bounds_group = new L.featureGroup([]);
        
        // Add zoom control with mobile optimizations
        var zoomControl = L.control.zoom({
            position: 'topleft',
            zoomInText: '+',
            zoomOutText: '-',
            zoomInTitle: 'Zoom in',
            zoomOutTitle: 'Zoom out'
        }).addTo(map);
        
        // Mobile-optimized locate control
        var locateControl = L.control.locate({
            locateOptions: {
                maxZoom: UI.isMobileDevice() ? 16 : 19, // Lower max zoom on mobile
                enableHighAccuracy: true // Better accuracy
            },
            position: 'topleft',
            icon: 'fa fa-location-arrow', // Clearer icon
            iconLoading: 'fa fa-spinner fa-spin',
            strings: {
                title: "Show my location", // More descriptive for accessibility
                popup: "You are within {distance} {unit} from this point",
                outsideMapBoundsMsg: "You seem to be outside the map boundaries"
            },
            onLocationError: function(err) {
                // Mobile-friendly error handling
                alert("Location access was denied or unavailable. Please check your device settings.");
            },
            showPopup: false, // Don't show popup on mobile by default
            markerStyle: {
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }
        }).addTo(map);
        
        // Create map panes
        map.createPane('pane_MapboxBlue_0');
        map.getPane('pane_MapboxBlue_0').style.zIndex = 400;
        
        map.createPane('pane_complete_parish_data_1');
        map.getPane('pane_complete_parish_data_1').style.zIndex = 401;
        map.getPane('pane_complete_parish_data_1').style['mix-blend-mode'] = 'normal';
        
        // Set the background color
        document.querySelector('.leaflet-container').style.backgroundColor = '#001429';
        
        // Add Mapbox blue themed base map layer
        const mapboxAccessToken = 'pk.eyJ1Ijoia2lwdG9vMDEiLCJhIjoiY202cGlvdnRhMDRxZDJrc2JpbWprN25kaCJ9.YlAHNXzq6IJ8nfoHo0gjTQ';
        
        // Use Mapbox's dark style directly without modifications
        var layer_MapboxBlue_0 = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            pane: 'pane_MapboxBlue_0',
            opacity: 1,
            minZoom: 2,
            maxZoom: 28,
            tileSize: 512,
            zoomOffset: -1
        });
        map.addLayer(layer_MapboxBlue_0);
        
        // Add blue tint to the tiles via CSS
        const tilePane = document.querySelector('.leaflet-tile-pane');
        if (tilePane) {
            tilePane.style.filter = 'hue-rotate(210deg) brightness(1.1) saturate(1.2)';
        }
        
        // Apply the filter to new tiles as they're loaded
        map.on('tileloadstart', function() {
            const tilePane = document.querySelector('.leaflet-tile-pane');
            if (tilePane && !tilePane.style.filter) {
                tilePane.style.filter = 'hue-rotate(210deg) brightness(1.1) saturate(1.2)';
            }
        });
        
        // Initialize markers cluster group with enhanced clustering - Mobile optimized
        markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyDistanceMultiplier: UI.isMobileDevice() ? 2.5 : 2, // Increased for mobile
            // Disable clustering at high zoom levels for better interaction
            disableClusteringAtZoom: UI.isMobileDevice() ? 16 : 18, // Lower clustering threshold on mobile
            maxClusterRadius: UI.isMobileDevice() ? 80 : 60, // Increased for mobile for better performance
            spiderfyOnMaxZoom: true,
            chunkedLoading: true,
            zoomToBoundsOnClick: true, // Ensure clicking on a cluster zooms to its bounds
            chunkProgress: function(processed, total, elapsed) {
                if (processed === total) {
                    console.log('Cluster rendering completed in ' + elapsed + 'ms');
                }
            },
            // Custom cluster icon styling - Enlarged for mobile
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let size, className;
                
                if (count < 50) {
                    size = 'small';
                    className = 'cluster-small';
                } else if (count < 500) {
                    size = 'medium';
                    className = 'cluster-medium';
                } else {
                    size = 'large';
                    className = 'cluster-large';
                }
                
                // Larger size for mobile
                const iconSize = UI.isMobileDevice() ? 46 : 40;
                
                return L.divIcon({ 
                    html: '<div><span>' + count + '</span></div>', 
                    className: 'marker-cluster marker-cluster-' + size + ' ' + className,
                    iconSize: new L.Point(iconSize, iconSize)
                });
            },
            animate: true,
            animateAddingMarkers: true
        });
        
        // Add search control - Mobile optimized
        var osmGeocoder = new L.Control.Geocoder({
            collapsed: true,
            position: 'topleft',
            text: 'Search',
            title: 'Search for a location',
            placeholder: 'Search...',
            errorMessage: 'Nothing found.',
            suggestMinLength: 3,
            suggestTimeout: 250,
            showResultIcons: true
        }).addTo(map);
        document.getElementsByClassName('leaflet-control-geocoder-icon')[0]
        .className += ' fa fa-search';
        document.getElementsByClassName('leaflet-control-geocoder-icon')[0]
        .title += 'Search for a place';
        
        // Mobile optimization for geocoder input
        const geocoderInput = document.querySelector('.leaflet-control-geocoder-form input');
        if (geocoderInput) {
            geocoderInput.style.fontSize = '16px'; // Prevent iOS zoom
            geocoderInput.style.padding = '8px'; // Larger touch target
        }
        
        // Make markers available to other modules
        window.markers = markers;
        
        // Debug function to check popup functionality
        window.debugPopups = function() {
            console.log("Running popup debug...");
            markers.eachLayer(function(layer) {
                console.log("Layer found:", layer);
                if (layer.getPopup) {
                    const popup = layer.getPopup();
                    console.log("Popup exists:", !!popup);
                    if (popup) {
                        console.log("Popup content:", popup.getContent());
                    }
                } else {
                    console.log("Layer has no getPopup method");
                }
            });
        };
        
        // Return the map for access by other modules
        return map;
    }
    
    // Public API
    return {
        initMap: initMap,
        getMap: function() { return map; },
        getMarkers: function() { return markers; },
        pop_complete_parish_data_1: pop_complete_parish_data_1,
        style_complete_parish_data_1_0: style_complete_parish_data_1_0,
        highlightFeature: highlightFeature
    };
})();

// Initialize map after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map but don't populate with data yet
    // Data will be populated after chunks are loaded
    MapManager.initMap();
});