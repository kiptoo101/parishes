// Filter and list interaction functions
function setupFilters(filters, churchData, churchMarkers) {
    const filterInputs = {
        title: document.getElementById('title-search'),
        city: document.getElementById('city-search'),
        country: document.getElementById('country-search'),
        jurisdiction: document.getElementById('jurisdiction-search'),
        type: document.getElementById('type-search'),
        rite: document.getElementById('rite-search')
    };

    const suggestionDropdowns = {
        title: document.getElementById('title-suggestions'),
        city: document.getElementById('city-suggestions'),
        country: document.getElementById('country-suggestions'),
        jurisdiction: document.getElementById('jurisdiction-suggestions'),
        type: document.getElementById('type-suggestions'),
        rite: document.getElementById('rite-suggestions')
    };

    function applyFilters() {
        const filteredMarkers = churchMarkers.filter((marker, index) => {
            const church = churchData[index];
            return (
                (!filters.title || church.title.toLowerCase().includes(filters.title.toLowerCase())) &&
                (!filters.city || (church.city && church.city.toLowerCase().includes(filters.city.toLowerCase()))) &&
                (!filters.country || (church.country && church.country.toLowerCase().includes(filters.country.toLowerCase()))) &&
                (!filters.jurisdiction || (church.jurisdiction && church.jurisdiction.toLowerCase().includes(filters.jurisdiction.toLowerCase()))) &&
                (!filters.type || (church.type && church.type.toLowerCase().includes(filters.type.toLowerCase()))) &&
                (!filters.rite || (church.rite && church.rite.toLowerCase().includes(filters.rite.toLowerCase())))
            );
        });

        markersLayer.clearLayers();
        markersLayer.addLayers(filteredMarkers);

        const filterActive = Object.values(filters).some(val => val !== '');
        document.getElementById('filter-active-indicator').style.display = filterActive ? 'block' : 'none';
        document.getElementById('zoom-to-filter').style.display = filteredMarkers.length > 0 ? 'block' : 'none';

        const filterInfo = document.getElementById('filter-info');
        filterInfo.textContent = `${filteredMarkers.length} churches match your filters`;

        populateChurchList(churchData.filter((church, index) => {
            return filteredMarkers.includes(churchMarkers[index]);
        }), filters);

        updateActionButtonStates();
    }

    function populateSuggestions(input, dropdown, field) {
        const value = input.value.toLowerCase();
        dropdown.innerHTML = '';

        if (value.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        const uniqueValues = [...new Set(churchData
            .map(church => church[field])
            .filter(val => val && val.toLowerCase().includes(value))
        )].sort();

        if (uniqueValues.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        uniqueValues.slice(0, 10).forEach(val => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = val;
            item.addEventListener('click', () => {
                input.value = val;
                filters[field] = val;
                applyFilters();
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    Object.keys(filterInputs).forEach(key => {
        const input = filterInputs[key];
        const dropdown = suggestionDropdowns[key];

        input.addEventListener('input', () => {
            filters[key] = input.value;
            applyFilters();
            populateSuggestions(input, dropdown, key);
        });

        input.addEventListener('focus', () => {
            populateSuggestions(input, dropdown, key);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        });
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        Object.keys(filters).forEach(key => {
            filters[key] = '';
            filterInputs[key].value = '';
            suggestionDropdowns[key].style.display = 'none';
        });
        applyFilters();
    });

    document.getElementById('zoom-to-filter').addEventListener('click', () => {
        const filteredMarkers = churchMarkers.filter((marker, index) => {
            const church = churchData[index];
            return (
                (!filters.title || church.title.toLowerCase().includes(filters.title.toLowerCase())) &&
                (!filters.city || (church.city && church.city.toLowerCase().includes(filters.city.toLowerCase()))) &&
                (!filters.country || (church.country && church.country.toLowerCase().includes(filters.country.toLowerCase()))) &&
                (!filters.jurisdiction || (church.jurisdiction && church.jurisdiction.toLowerCase().includes(filters.jurisdiction.toLowerCase()))) &&
                (!filters.type || (church.type && church.type.toLowerCase().includes(filters.type.toLowerCase()))) &&
                (!filters.rite || (church.rite && church.rite.toLowerCase().includes(filters.rite.toLowerCase())))
            );
        });

        if (filteredMarkers.length > 0) {
            const group = L.featureGroup(filteredMarkers);
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    });

    applyFilters();
}

function populateChurchList(churchData, filters) {
    const churchList = document.getElementById('church-list');
    const listSearch = document.getElementById('list-search');
    churchList.innerHTML = '';

    function updateList(searchTerm = '') {
        churchList.innerHTML = '';
        const filteredList = churchData.filter(church => {
            const searchLower = searchTerm.toLowerCase();
            return (
                church.title.toLowerCase().includes(searchLower) ||
                (church.city && church.city.toLowerCase().includes(searchLower)) ||
                (church.country && church.country.toLowerCase().includes(searchLower))
            );
        });

        filteredList.forEach((church, index) => {
            const item = document.createElement('div');
            item.className = 'church-item';
            item.innerHTML = `
                <div class="church-title">${church.title}</div>
                <div class="church-details">
                    ${church.city ? church.city + ', ' : ''}${church.country || ''}<br>
                    ${church.type ? 'Type: ' + church.type : ''}
                </div>
            `;
            item.addEventListener('click', () => {
                const marker = markersLayer.getLayers().find(m => {
                    const latLng = m.getLatLng();
                    return latLng.lat === church.latitude && latLng.lng === church.longitude;
                });
                if (marker) {
                    map.setView([church.latitude, church.longitude], 15);
                    marker.openPopup();
                    if (isMobile) {
                        hideAllPanels();
                    }
                }
            });
            churchList.appendChild(item);
        });
    }

    listSearch.addEventListener('input', () => {
        updateList(listSearch.value);
    });

    updateList();
}

// Ensure this runs after map-data.js
document.addEventListener('DOMContentLoaded', function() {
    // No direct initialization here; setupFilters and populateChurchList are called from initializeMap in map-data.js
});