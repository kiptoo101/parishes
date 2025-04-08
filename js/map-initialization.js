// Map Initialization Module
(function() {
    // Ensure the map is only initialized once
    let mapInitialized = false;

    // Function to ensure map fills viewport with world view
    function ensureMapFillsViewport(map) {
        const worldBounds = [[-90, -180], [90, 180]];
        map.setMinZoom(map.getBoundsZoom(worldBounds, true));
        map.setMaxBounds([[-90, -360], [90, 360]]);  // Set max bounds with padding for world copy
    }

    // Function to extract city from address
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

    // Initialize the map with configuration options
    function createMapInstance() {
        const isMobile = window.innerWidth < 768;

        const map = L.map('map', {
            zoomControl: false,
            maxZoom: 28,
            minZoom: 2,
            worldCopyJump: true,
            zoomAnimation: true,
            fadeAnimation: true,
            tap: true,
            tapTolerance: 15,
            bounceAtZoomLimits: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            keyboard: true
        });

        // Set initial world view
        const worldBounds = [[-90, -180], [90, 180]];
        map.fitBounds(worldBounds);

        // Add hash for maintaining map state in URL
        const hash = new L.Hash(map);

        // Set attribution
        map.attributionControl.setPrefix(
            '<a href="https://github.com/tomchadwin/qgis2web" target="_blank">qgis2web</a> &middot; ' +
            '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a> &middot; ' +
            '<a href="https://qgis.org">QGIS</a>'
        );

        // Add Zoom Control
        const zoomControl = L.control.zoom({
            position: 'topleft',
            zoomInText: '+',
            zoomOutText: '-',
            zoomInTitle: 'Zoom in',
            zoomOutTitle: 'Zoom out'
        }).addTo(map);

        // Mobile-optimized Locate Control
        const locateControl = L.control.locate({
            locateOptions: {
                maxZoom: isMobile ? 16 : 19,
                enableHighAccuracy: true
            },
            position: 'topleft',
            icon: 'fa fa-location-arrow',
            iconLoading: 'fa fa-spinner fa-spin',
            strings: {
                title: "Show my location",
                popup: "You are within {distance} {unit} from this point",
                outsideMapBoundsMsg: "You seem to be outside the map boundaries"
            },
            onLocationError: function(err) {
                alert("Location access was denied or unavailable. Please check your device settings.");
            },
            showPopup: false,
            markerStyle: {
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }
        }).addTo(map);

        // Add Mapbox Blue Base Map Layer
        const mapboxAccessToken = 'pk.eyJ1Ijoia2lwdG9vMDEiLCJhIjoiY202cGlvdnRhMDRxZDJrc2JpbWprN25kaCJ9.YlAHNXzq6IJ8nfoHo0gjTQ';
        
        const baseLayer = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${mapboxAccessToken}`, {
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            pane: 'pane_MapboxBlue_0',
            opacity: 1,
            minZoom: 2,
            maxZoom: 28,
            tileSize: 512,
            zoomOffset: -1
        });
        map.addLayer(baseLayer);

        // Apply blue tint to tiles
        const tilePane = document.querySelector('.leaflet-tile-pane');
        if (tilePane) {
            tilePane.style.filter = 'hue-rotate(210deg) brightness(1.1) saturate(1.2)';
        }

        // Add event listener to apply filter to new tiles
        map.on('tileloadstart', function() {
            const tilePane = document.querySelector('.leaflet-tile-pane');
            if (tilePane && !tilePane.style.filter) {
                tilePane.style.filter = 'hue-rotate(210deg) brightness(1.1) saturate(1.2)';
            }
        });

        // Resize handling
        function handleResize() {
            ensureMapFillsViewport(map);
        }
        window.addEventListener('resize', handleResize);

        return map;
    }

    // Global initialization function
    window.initializeMap = function() {
        if (mapInitialized) return;
        mapInitialized = true;

        // Create map instance
        const map = createMapInstance();

        // Process churches data to extract unique values for filters
        const allChurches = json_complete_parish_data_1.features;
        
        // Expose map and churches globally for other modules
        window.globalMap = map;
        window.allChurches = allChurches;

        // Trigger any post-initialization logic
        if (typeof postMapInitialization === 'function') {
            postMapInitialization(map, allChurches);
        }
    };
})();