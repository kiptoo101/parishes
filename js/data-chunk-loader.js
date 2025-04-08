// Data Chunk Loading System
(function() {
    // Configuration for chunk loading
    const totalChunks = 5;
    let loadedChunks = 0;
    
    // Track loading progress
    function updateLoadingProgress() {
        loadedChunks++;
        const percentage = Math.round((loadedChunks / totalChunks) * 100);
        
        // Update progress bar
        const progressFill = document.getElementById('loading-progress-fill');
        const loadingStatus = document.getElementById('loading-status');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (loadingStatus) {
            loadingStatus.textContent = 
                `${loadedChunks} of ${totalChunks} chunks loaded (${percentage}%)`;
        }
        
        // When all chunks are loaded, hide the loading indicator after a short delay
        if (loadedChunks >= totalChunks) {
            setTimeout(function() {
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Call map initialization (assuming it's a global function)
                if (typeof initializeMap === 'function') {
                    initializeMap();
                }
            }, 500);
        }
    }
    
    // Create script loading helper
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
    
    // Sequential script loading to ensure proper order
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
                    // The loader will call initializeMap automatically
                });
            }
        }
        
        // Start loading the first chunk
        loadNextChunk(1);
    }
    
    // Start loading data chunks when the page loads
    window.addEventListener('load', loadDataChunks);
})();
