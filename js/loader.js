/**
 * loader.js - Handles data chunk loading and progress tracking
 * This module is responsible for loading data chunks sequentially and tracking loading progress
 */

// Configuration for chunk loading
const ChunkLoader = (function() {
    // Private variables
    const totalChunks = 5;
    let loadedChunks = 0;
    
    /**
     * Updates the loading progress UI
     * @private
     */
    function updateLoadingProgress() {
        loadedChunks++;
        const percentage = Math.round((loadedChunks / totalChunks) * 100);
        
        // Update progress bar
        document.getElementById('loading-progress-fill').style.width = percentage + '%';
        document.getElementById('loading-status').textContent = 
            `${loadedChunks} of ${totalChunks} chunks loaded (${percentage}%)`;
        
        // When all chunks are loaded, hide the loading indicator after a short delay
        if (loadedChunks >= totalChunks) {
            setTimeout(function() {
                document.getElementById('loading-indicator').style.display = 'none';
            }, 500);
        }
    }
    
    /**
     * Creates a script element and loads it
     * @param {string} url - URL of the script to load
     * @param {Function} callback - Function to call when script is loaded
     * @private
     */
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        
        // When script is loaded, call the callback
        script.onload = callback;
        
        // If there's an error, still update the counter but log the error
        script.onerror = function() {
            console.error('Failed to load script:', url);
            callback();
        };
        
        // Add the script to the document to start loading
        document.head.appendChild(script);
    }
    
    /**
     * Loads all data chunks sequentially
     * @public
     */
    function loadDataChunks() {
        // Load each chunk one by one
        function loadNextChunk(index) {
            if (index > totalChunks) {
                return; // All chunks loaded
            }
            
            if (index <= 5) { // Regular data chunks
                loadScript(`data/json_complete_parish_data_1_part${index}.js`, function() {
                    updateLoadingProgress();
                    loadNextChunk(index + 1);
                });
            } else { // Load the loader script last
                loadScript('data/json_loader.js', function() {
                    // The loader will call initializeMap() automatically
                });
            }
        }
        
        // Start loading the first chunk
        loadNextChunk(1);
    }
    
    // Public API
    return {
        loadDataChunks: loadDataChunks
    };
})();

// Start loading data chunks when the page loads
window.addEventListener('load', ChunkLoader.loadDataChunks);