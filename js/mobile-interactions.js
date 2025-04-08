// Mobile Interactions Module
(function() {
    // Panel state tracking
    const panelStates = {
        'filter-panel': { visible: false, contentExpanded: false },
        'church-list-panel': { visible: false, contentExpanded: false },
        'legend': { visible: false, contentExpanded: false }
    };

    // Mobile state tracking
    let isMobile = false;
    let activeMobilePanel = null;
    let quickActionsMenuOpen = false;

    // (Previous functions remain the same...)

    // Initialization function (continued)
    function initializeMobileInteractions() {
        // Initial mobile check
        checkMobile();
        
        // Setup mobile actions
        setupMobileActions();
        
        // Listen for window resize
        window.addEventListener('resize', checkMobile);
        
        // Expose public methods
        window.togglePanel = togglePanel;
        window.expandPanelContent = expandPanelContent;
        window.hideAllPanels = hideAllPanels;
    }

    // Expose initialization to global scope
    window.initializeMobileInteractions = initializeMobileInteractions;
})();