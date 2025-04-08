/**
 * ui.js - Handles UI-related functionality
 * This module manages panels, mobile detection, and UI interactions
 */

const UI = (function() {
    // Private variables
    let isMobile = window.innerWidth < 768;
    let quickActionsMenuOpen = false;
    let activeMobilePanel = null;
    
    // Panel state tracking
    let panelStates = {
        'filter-panel': { visible: false, contentExpanded: false },
        'church-list-panel': { visible: false, contentExpanded: false },
        'legend': { visible: false, contentExpanded: false }
    };
    
    /**
     * Toggles panel visibility
     * @param {string} panelId - ID of the panel to toggle
     * @public
     */
    function togglePanelVisibility(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        const isVisible = panel.style.display !== 'none' && panel.style.display !== '';
        
        if (isVisible) {
            panel.style.display = 'none';
            panelStates[panelId].visible = false;
        } else {
            panel.style.display = 'block';
            panelStates[panelId].visible = true;
        }
        
        updateActionButtonStates();
    }
    
    /**
     * Expands or collapses panel content
     * @param {string} contentId - ID of the content to expand/collapse
     * @public
     */
    function expandPanelContent(contentId) {
        const content = document.getElementById(contentId);
        if (!content) return;
        
        const panelId = contentId.split('-')[0] + '-panel';
        const toggleBtn = document.getElementById(contentId.split('-')[0] + '-toggle');
        
        // If content is collapsed, expand it
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            content.style.display = 'block';
            if (toggleBtn) toggleBtn.textContent = '−';
            
            if (panelId in panelStates) {
                panelStates[panelId].contentExpanded = true;
            } else if (contentId.split('-')[0] === 'legend') {
                // Special case for legend
                panelStates['legend'].contentExpanded = true;
            }
        } 
        // If content is expanded, collapse it
        else {
            content.classList.add('collapsed');
            content.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = '+';
            
            if (panelId in panelStates) {
                panelStates[panelId].contentExpanded = false;
            } else if (contentId.split('-')[0] === 'legend') {
                // Special case for legend
                panelStates['legend'].contentExpanded = false;
            }
        }
        
        updateActionButtonStates();
    }
    
    /**
     * Toggles panel content visibility
     * @param {string} contentId - ID of the content to toggle
     * @public
     */
    function togglePanel(contentId) {
        var content = document.getElementById(contentId);
        if (!content) return;
        
        var toggleBtn = document.getElementById(contentId.split('-')[0] + '-toggle');
        const panelId = getPanelIdFromContentId(contentId);
        
        // If on mobile, close any other open panel content first
        if (isMobile && content.style.display !== 'block') {
            closeAllPanelsExcept(contentId);
        }
        
        if (panelId) {
            const panel = document.getElementById(panelId);
            if (panel && panel.style.display === 'none') {
                togglePanelVisibility(panelId);
            }
        }
        
        // Now toggle the content
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            content.style.display = 'block';
            if (toggleBtn) toggleBtn.textContent = '−';
            
            // Track active mobile panel
            if (isMobile) {
                activeMobilePanel = contentId;
            }
            
            // Update panel state
            if (panelId && panelId in panelStates) {
                panelStates[panelId].contentExpanded = true;
            } else if (contentId.split('-')[0] === 'legend') {
                panelStates['legend'].contentExpanded = true;
            }
        } else {
            content.classList.add('collapsed');
            content.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = '+';
            
            // Clear active panel reference
            if (isMobile && activeMobilePanel === contentId) {
                activeMobilePanel = null;
            }
            
            // Update panel state
            if (panelId && panelId in panelStates) {
                panelStates[panelId].contentExpanded = false;
            } else if (contentId.split('-')[0] === 'legend') {
                panelStates['legend'].contentExpanded = false;
            }
        }
        
        updateActionButtonStates();
    }
    
    /**
     * Gets panel ID from content ID
     * @param {string} contentId - ID of the content
     * @return {string|null} - Panel ID or null
     * @private
     */
    function getPanelIdFromContentId(contentId) {
        const prefix = contentId.split('-')[0];
        
        if (prefix === 'filter' || prefix === 'church') {
            return prefix + '-panel';
        } else if (prefix === 'legend') {
            return 'legend';
        }
        
        return null;
    }
    
    /**
     * Closes all panels except the specified one
     * @param {string} exceptContentId - ID of the content to not close
     * @private
     */
    function closeAllPanelsExcept(exceptContentId) {
        const panelContents = document.querySelectorAll('.panel-content');
        panelContents.forEach(panel => {
            if (panel.id !== exceptContentId) {
                panel.classList.add('collapsed');
                panel.style.display = 'none';
                
                // Update toggle button text
                const panelId = panel.id.split('-')[0];
                const toggleBtn = document.getElementById(panelId + '-toggle');
                if (toggleBtn) {
                    toggleBtn.textContent = '+';
                }
                
                // Update panel state
                const parentPanelId = getPanelIdFromContentId(panel.id);
                if (parentPanelId && parentPanelId in panelStates) {
                    panelStates[parentPanelId].contentExpanded = false;
                }
            }
        });
        
        updateActionButtonStates();
    }
    
    /**
     * Hides all panels
     * @public
     */
    function hideAllPanels() {
        const panels = document.querySelectorAll('.panel');
        
        // Hide all panel containers
        panels.forEach(panel => {
            panel.style.display = 'none';
            if (panel.id in panelStates) {
                panelStates[panel.id].visible = false;
            }
        });
        
        // Collapse all panel contents
        const panelContents = document.querySelectorAll('.panel-content');
        panelContents.forEach(content => {
            content.classList.add('collapsed');
            content.style.display = 'none';
            
            // Update toggle button
            const prefix = content.id.split('-')[0];
            const toggleBtn = document.getElementById(prefix + '-toggle');
            if (toggleBtn) {
                toggleBtn.textContent = '+';
            }
            
            // Update panel content state
            const panelId = getPanelIdFromContentId(content.id);
            if (panelId && panelId in panelStates) {
                panelStates[panelId].contentExpanded = false;
            }
        });
        
        // Clear active panel reference
        activeMobilePanel = null;
        
        // Update action button states
        updateActionButtonStates();
    }
    
    /**
     * Updates the visibility indicators in the quick action menu
     * @private
     */
    function updateActionButtonStates() {
        // Get all action items that control panels
        const actionItems = document.querySelectorAll('.mobile-action-item[data-panel]');
        
        actionItems.forEach(item => {
            const panelId = item.getAttribute('data-panel');
            const contentId = item.getAttribute('data-content');
            
            if (panelId && panelId in panelStates) {
                // Check if panel is visible
                const isVisible = panelStates[panelId].visible;
                // Check if content is expanded
                const isExpanded = panelStates[panelId].contentExpanded;
                
                // Update visibility indicator
                if (isVisible) {
                    item.classList.add('panel-visible');
                    item.querySelector('.panel-visibility-indicator').style.display = 'block';
                    
                    // Change indicator color based on expanded state
                    item.querySelector('.panel-visibility-indicator').style.backgroundColor = 
                        isExpanded ? '#4CAF50' : '#FFA500';
                } else {
                    item.classList.remove('panel-visible');
                    item.querySelector('.panel-visibility-indicator').style.display = 'none';
                }
            }
        });
    }
    
    /**
     * Checks if the device is mobile and adjusts UI if needed
     * @public
     */
    function checkMobile() {
        const wasMobile = isMobile;
        isMobile = window.innerWidth < 768;
        
        // Only adjust if the state changed
        if (wasMobile !== isMobile) {
            adjustForMobile();
            
            // Reset panel states when switching between mobile and desktop
            resetPanelStates();
        }
    }
    
    /**
     * Resets panel states based on device type
     * @private
     */
    function resetPanelStates() {
        const panelContents = document.querySelectorAll('.panel-content');
        
        if (isMobile) {
            // On mobile, collapse all panels
            panelContents.forEach(panel => {
                panel.classList.add('collapsed');
                panel.style.display = 'none';
                
                // Update toggle button text
                const panelId = panel.id.split('-')[0];
                const toggleBtn = document.getElementById(panelId + '-toggle');
                if (toggleBtn) {
                    toggleBtn.textContent = '+';
                }
            });
            
            // Hide church list panel
            document.getElementById('church-list-panel').style.display = 'none';
            panelStates['church-list-panel'].visible = false;
            panelStates['church-list-panel'].contentExpanded = false;
            
            // Hide filter and legend panels on mobile
            document.getElementById('filter-panel').style.display = 'none';
            panelStates['filter-panel'].visible = false;
            panelStates['filter-panel'].contentExpanded = false;
            
            document.getElementById('legend').style.display = 'none';
            panelStates['legend'].visible = false;
            panelStates['legend'].contentExpanded = false;
            
            // Show mobile-specific controls
            document.getElementById('mobile-toggle-list').style.display = 'none';
            document.getElementById('mobile-quick-actions').style.display = 'flex';
        } else {
            // On desktop, expand all panels
            panelContents.forEach(panel => {
                panel.classList.remove('collapsed');
                panel.style.display = 'block';
                
                // Update toggle button text
                const panelId = panel.id.split('-')[0];
                const toggleBtn = document.getElementById(panelId + '-toggle');
                if (toggleBtn) {
                    toggleBtn.textContent = '−';
                }
            });
            
            // Show church list panel
            document.getElementById('church-list-panel').style.display = 'block';
            panelStates['church-list-panel'].visible = true;
            panelStates['church-list-panel'].contentExpanded = true;
            
            // Show filter and legend panels on desktop
            document.getElementById('filter-panel').style.display = 'block';
            panelStates['filter-panel'].visible = true;
            panelStates['filter-panel'].contentExpanded = true;
            
            document.getElementById('legend').style.display = 'block';
            panelStates['legend'].visible = true;
            panelStates['legend'].contentExpanded = true;
            
            // Hide mobile-specific controls
            document.getElementById('mobile-toggle-list').style.display = 'none';
            document.getElementById('mobile-quick-actions').style.display = 'none';
            document.getElementById('mobile-actions-menu').style.display = 'none';
            quickActionsMenuOpen = false;
        }
        
        // Update action button states
        updateActionButtonStates();
    }
    
    /**
     * Adjusts the interface for mobile devices
     * @private
     */
    function adjustForMobile() {
        // Update panel display based on device
        if (isMobile) {
            // Hide church list panel by default on mobile
            document.getElementById('church-list-panel').style.display = 'none';
            panelStates['church-list-panel'].visible = false;
            
            // Hide filter and legend panels on mobile
            document.getElementById('filter-panel').style.display = 'none';
            panelStates['filter-panel'].visible = false;
            
            document.getElementById('legend').style.display = 'none';
            panelStates['legend'].visible = false;
            
            document.getElementById('mobile-toggle-list').style.display = 'none';
            document.getElementById('mobile-quick-actions').style.display = 'flex';
            
            // Reduce cluster threshold for better mobile performance
            if (window.markers) {
                window.markers.options.disableClusteringAtZoom = 16;
                window.markers.options.maxClusterRadius = 80;
            }
            
            // Adjust map controls for better touch
            const mapControls = document.querySelectorAll('.leaflet-control-layers, .leaflet-control-zoom a');
            mapControls.forEach(control => {
                control.style.padding = '8px';
            });
            
            // Set all panels to collapsed state
            hideAllPanels();
        } else {
            // Show church list panel on desktop
            document.getElementById('church-list-panel').style.display = 'block';
            panelStates['church-list-panel'].visible = true;
            
            // Show filter and legend panels on desktop
            document.getElementById('filter-panel').style.display = 'block';
            panelStates['filter-panel'].visible = true;
            
            document.getElementById('legend').style.display = 'block';
            panelStates['legend'].visible = true;
            
            document.getElementById('mobile-toggle-list').style.display = 'none';
            document.getElementById('mobile-quick-actions').style.display = 'none';
            document.getElementById('mobile-actions-menu').style.display = 'none';
            quickActionsMenuOpen = false;
            
            // Reset cluster settings for desktop
            if (window.markers) {
                window.markers.options.disableClusteringAtZoom = 18;
                window.markers.options.maxClusterRadius = 60;
            }
            
            // Show all panel content on desktop
            const panelContents = document.querySelectorAll('.panel-content');
            panelContents.forEach(panel => {
                panel.classList.remove('collapsed');
                panel.style.display = 'block';
                
                // Update toggle button text
                const panelId = panel.id.split('-')[0];
                const toggleBtn = document.getElementById(panelId + '-toggle');
                if (toggleBtn) {
                    toggleBtn.textContent = '−';
                }
                
                // Update panel content state
                const parentPanelId = getPanelIdFromContentId(panel.id);
                if (parentPanelId && parentPanelId in panelStates) {
                    panelStates[parentPanelId].contentExpanded = true;
                }
            });
        }
        
        // Update action button states
        updateActionButtonStates();
    }
    
    /**
     * Toggles the quick actions menu
     * @public
     */
    function toggleQuickActionsMenu() {
        const menu = document.getElementById('mobile-actions-menu');
        const quickActionsBtn = document.getElementById('mobile-quick-actions');
        
        if (quickActionsMenuOpen) {
            // Hide with animation
            menu.classList.remove('visible');
            quickActionsBtn.textContent = '+';
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                if (!quickActionsMenuOpen) { // Double-check state hasn't changed
                    menu.style.display = 'none';
                }
            }, 300);
        } else {
            // Show with animation
            menu.style.display = 'flex';
            // Trigger reflow
            void menu.offsetWidth;
            menu.classList.add('visible');
            quickActionsBtn.textContent = '×';
        }
        
        quickActionsMenuOpen = !quickActionsMenuOpen;
        
        // Update action button states
        updateActionButtonStates();
    }
    
    /**
     * Sets up mobile action handlers
     * @private
     */
    function setupMobileActions() {
        // Quick actions button
        document.getElementById('mobile-quick-actions').addEventListener('click', toggleQuickActionsMenu);
        
        // Action: Toggle Filter Panel - Enhanced with state management
        document.getElementById('action-toggle-filter').addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            const contentId = this.getAttribute('data-content');
            
            // Check current state
            const isPanelVisible = document.getElementById(panelId).style.display !== 'none';
            
            if (isPanelVisible) {
                // If panel is visible, check if content is expanded
                const isContentExpanded = !document.getElementById(contentId).classList.contains('collapsed');
                
                if (isContentExpanded) {
                    // If content is expanded, collapse it
                    expandPanelContent(contentId);
                } else {
                    // If content is collapsed, hide the panel entirely
                    togglePanelVisibility(panelId);
                }
            } else {
                // If panel is hidden, show it first
                togglePanelVisibility(panelId);
                // Then expand its content
                setTimeout(() => {
                    if (document.getElementById(contentId).classList.contains('collapsed')) {
                        expandPanelContent(contentId);
                    }
                }, 50);
            }
            
            toggleQuickActionsMenu(); // Close menu after action
        });
        
        // Action: Toggle Churches List - Enhanced with state management
        document.getElementById('action-toggle-list').addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            const contentId = this.getAttribute('data-content');
            
            // Check current state
            const isPanelVisible = document.getElementById(panelId).style.display !== 'none';
            
            if (isPanelVisible) {
                // If panel is visible, check if content is expanded
                const isContentExpanded = !document.getElementById(contentId).classList.contains('collapsed');
                
                if (isContentExpanded) {
                    // If content is expanded, collapse it
                    expandPanelContent(contentId);
                } else {
                    // If content is collapsed, hide the panel entirely
                    togglePanelVisibility(panelId);
                }
            } else {
                // If panel is hidden, show it first and add mobile-visible class
                document.getElementById(panelId).classList.add('mobile-visible');
                togglePanelVisibility(panelId);
                
                // Then expand its content
                setTimeout(() => {
                    if (document.getElementById(contentId).classList.contains('collapsed')) {
                        expandPanelContent(contentId);
                    }
                }, 50);
            }
            
            toggleQuickActionsMenu(); // Close menu after action
        });
        
        // Action: Toggle Legend - Enhanced with state management
        document.getElementById('action-toggle-legend').addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            const contentId = this.getAttribute('data-content');
            
            // Check current state
            const isPanelVisible = document.getElementById(panelId).style.display !== 'none';
            
            if (isPanelVisible) {
                // If panel is visible, check if content is expanded
                const isContentExpanded = !document.getElementById(contentId).classList.contains('collapsed');
                
                if (isContentExpanded) {
                    // If content is expanded, collapse it
                    expandPanelContent(contentId);
                } else {
                    // If content is collapsed, hide the panel entirely
                    togglePanelVisibility(panelId);
                }
            } else {
                // If panel is hidden, show it first
                togglePanelVisibility(panelId);
                
                // Then expand its content
                setTimeout(() => {
                    if (document.getElementById(contentId).classList.contains('collapsed')) {
                        expandPanelContent(contentId);
                    }
                }, 50);
            }
            
            toggleQuickActionsMenu(); // Close menu after action
        });
        
        // Action: My Location - No change needed
        document.getElementById('action-my-location').addEventListener('click', function() {
            // Trigger locate control
            document.querySelector('.leaflet-control-locate a').click();
            toggleQuickActionsMenu(); // Close menu after action
        });
        
        // Action: Hide All Panels - New action
        document.getElementById('action-hide-all-panels').addEventListener('click', function() {
            hideAllPanels();
            toggleQuickActionsMenu(); // Close menu after action
        });
    }
    
    /**
     * Sets up event listeners
     * @private
     */
    function setupEventListeners() {
        // Enhanced mobile toggle for church list panel
        document.getElementById('mobile-toggle-list').addEventListener('click', function() {
            const panel = document.getElementById('church-list-panel');
            const contentId = 'church-list-content';
            
            if (panel.style.display === 'none' || !panel.style.display) {
                // Show panel
                panel.style.display = 'block';
                panel.classList.add('mobile-visible');
                this.textContent = 'Hide Churches List';
                
                // Update panel state
                panelStates['church-list-panel'].visible = true;
                
                // Open the panel content too if it's closed
                const content = document.getElementById(contentId);
                if (content.classList.contains('collapsed')) {
                    expandPanelContent(contentId);
                }
            } else {
                // Hide panel
                panel.style.display = 'none';
                panel.classList.remove('mobile-visible');
                this.textContent = 'Show Churches List';
                
                // Update panel state
                panelStates['church-list-panel'].visible = false;
                panelStates['church-list-panel'].contentExpanded = false;
            }
            
            // Update action button states
            updateActionButtonStates();
        });
        
        // Enhanced close church list on mobile
        document.getElementById('hide-church-list').addEventListener('click', function() {
            if (isMobile) {
                document.getElementById('church-list-panel').style.display = 'none';
                document.getElementById('mobile-toggle-list').textContent = 'Show Churches List';
                
                // Update panel state
                panelStates['church-list-panel'].visible = false;
                
                // Update action button states
                updateActionButtonStates();
            }
        });
        
        // Listen for window resize
        window.addEventListener('resize', checkMobile);
    }
    
    /**
     * Initializes the UI module
     * @public
     */
    function init() {
        checkMobile(); // Check initial state
        setupMobileActions(); // Setup mobile action handlers
        setupEventListeners(); // Setup event listeners
        
        // Initial update of action button states
        updateActionButtonStates();
    }
    
    // Public API
    return {
        init: init,
        togglePanel: togglePanel,
        togglePanelVisibility: togglePanelVisibility,
        expandPanelContent: expandPanelContent,
        hideAllPanels: hideAllPanels,
        toggleQuickActionsMenu: toggleQuickActionsMenu,
        checkMobile: checkMobile,
        isMobileDevice: function() { return isMobile; }
    };
})();

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', UI.init);