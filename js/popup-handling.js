// Popup Handling Module
(function() {
    // Helper function to extract city from address
    function extractCity(address) {
        if (!address) return '';
        
        const addressParts = address.split(',');
        if (addressParts.length >= 2) {
            return addressParts[addressParts.length - 2].trim();
        }
        return '';
    }

    // Remove empty rows from popup content
    function removeEmptyRowsFromPopupContent(content, feature) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const rows = tempDiv.querySelectorAll('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const td = rows[i].querySelector('td.visible-with-data');
            const key = td ? td.id : '';
            if (td && td.classList.contains('visible-with-data') && feature.properties[key] == null) {
                rows[i].parentNode.removeChild(rows[i]);
            }
        }
        
        return tempDiv.innerHTML;
    }

    // Add class to popup if it contains media
    function addClassToPopupIfMedia(content, popup) {
        const tempDiv = document.createElement('div');
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

    // Create popup content for church points
    function createChurchPopupContent(feature) {
        const isMobile = window.innerWidth < 768;
        const autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});
        
        // Extract coordinates
        const lat = feature.geometry.coordinates[1].toFixed(6);
        const lng = feature.geometry.coordinates[0].toFixed(6);
        
        // Extract city from address
        const city = extractCity(feature.properties.Address);
        feature.properties.City = city;
        
        // Create popup content with mobile-friendly font sizes
        const fontSizeTitle = isMobile ? '16px' : '16px';
        const fontSizeContent = isMobile ? '14px' : '14px';
        
        const popupContent = `
            <table style="width:100%;">
                <tr>
                    <td colspan="2" style="font-size:${fontSizeTitle};"><strong>${
                        feature.properties['Title'] !== null ? 
                        autolinker.link(feature.properties['Title'].toLocaleString()) : 
                        ''
                    }</strong></td>
                </tr>
                <tr>
                    <td style="font-size:${fontSizeContent};">Jurisdiction:</td>
                    <td style="font-size:${fontSizeContent};">${
                        feature.properties['Jurisdiction'] !== null ? 
                        autolinker.link(feature.properties['Jurisdiction'].toLocaleString()) : 
                        ''
                    }</td>
                </tr>
                <tr>
                    <td style="font-size:${fontSizeContent};">Type:</td>
                    <td style="font-size:${fontSizeContent};">${
                        feature.properties['Type'] !== null ? 
                        autolinker.link(feature.properties['Type'].toLocaleString()) : 
                        ''
                    }</td>
                </tr>
                <tr>
                    <td style="font-size:${fontSizeContent};">Rite:</td>
                    <td style="font-size:${fontSizeContent};">${
                        feature.properties['Rite'] !== null ? 
                        autolinker.link(feature.properties['Rite'].toLocaleString()) : 
                        ''
                    }</td>
                </tr>
                <tr>
                    <td style="font-size:${fontSizeContent};">City:</td>
                    <td style="font-size:${fontSizeContent};">${
                        city ? autolinker.link(city) : ''
                    }</td>
                </tr>
                <tr>
                    <td style="font-size:${fontSizeContent};">Country:</td>
                    <td style="font-size:${fontSizeContent};">${
                        feature.properties['Country'] !== null ? 
                        autolinker.link(feature.properties['Country'].toLocaleString()) : 
                        ''
                    }</td>
                </tr>
                <tr>
                    <td style="font-size:${fontSizeContent};">Coordinates:</td>
                    <td style="font-size:${fontSizeContent};">Lat: ${lat}, Lng: ${lng}</td>
                </tr>
            </table>
        `;
        
        return popupContent;
    }

    // Create popup for a church point
    function createChurchPopup(feature, layer) {
        const isMobile = window.innerWidth < 768;
        
        // Create popup content
        const popupContent = createChurchPopupContent(feature);
        const cleanedContent = removeEmptyRowsFromPopupContent(popupContent, feature);
        
        // Popup configuration
        const popupWidth = isMobile ? 280 : 400;
        const popupHeight = isMobile ? 300 : 400;
        
        const popupOptions = {
            maxWidth: popupWidth,
            maxHeight: popupHeight,
            autoPanPaddingTopLeft: isMobile ? [10, 50] : [50, 50],
            autoPanPaddingBottomRight: isMobile ? [10, 10] : [50, 50],
            closeButton: true,
            closeOnClick: false,
            className: isMobile ? 'mobile-popup' : ''
        };
        
        // Bind popup to layer
        layer.bindPopup(cleanedContent, popupOptions);
        
        // Popup event handlers
        layer.on('popupopen', function(e) {
            addClassToPopupIfMedia(cleanedContent, e.popup);
            
            // Additional mobile class
            if (isMobile) {
                e.popup._container.classList.add('mobile-popup');
            }
            
            // Highlight corresponding list item
            highlightListItem(feature.properties.id);
        });
        
        // Click and hover event handling
        layer.on({
            // Only use mouseover on desktop
            mouseover: isMobile ? null : function() {
                layer.openPopup();
            },
            
            mouseout: function() {
                if (!isMobile) {
                    if (typeof layer.closePopup === 'function') {
                        layer.closePopup();
                    } else {
                        layer.eachLayer(function(feature) {
                            feature.closePopup();
                        });
                    }
                }
            },
            
            // Always open popup on click
            click: function() {
                // Ensure popup opens
                layer.openPopup();
            }
        });
    }

    // Highlight list item corresponding to a church
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
            listContainer.scrollTop = targetItem.offsetTop - listContainer.offsetTop;
            
            // On mobile, optional list panel visibility
            if (window.innerWidth < 768) {
                const panel = document.getElementById('church-list-panel');
                // You could add logic here to show/interact with the list panel if desired
            }
        }
    }

    // Expose public methods
    window.initializePopupHandling = function(map, markers) {
        // Add methods to global scope for use in other modules
        window.createChurchPopup = createChurchPopup;
        window.highlightListItem = highlightListItem;
    };
})();