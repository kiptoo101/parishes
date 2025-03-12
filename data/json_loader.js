// Loader script for chunked data
var totalJsonChunks = 5;
var json_complete_parish_data_1 = {
  "type": "FeatureCollection",
  "name": "complete_parish_data_1",
  "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
  "features": []
};

// Function to combine chunks when loaded
function combineJsonChunks() {
  let loadedFeatures = 0;
  
  for (let i = 1; i <= totalJsonChunks; i++) {
    const chunkVar = window["json_complete_parish_data_1_part" + i];
    if (chunkVar && chunkVar.features) {
      json_complete_parish_data_1.features = json_complete_parish_data_1.features.concat(chunkVar.features);
      loadedFeatures += chunkVar.features.length;
    }
  }
  
  console.log(`Combined ${totalJsonChunks} chunks with a total of ${loadedFeatures} features`);
  
  // Call the initialization function
  if (typeof initializeMap === 'function') {
    initializeMap();
  }
}

// Wait for DOM to be ready then combine chunks
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit to ensure all chunks are loaded
  setTimeout(combineJsonChunks, 1000);
});
