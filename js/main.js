// Variables for mobile and panel state tracking
let isMobile = window.innerWidth < 768;
let panelStates = {
    'filter-panel': { visible: false, contentExpanded: false },
    'church-list-panel': { visible: false, contentExpanded: false },
    'legend': { visible: false, contentExpanded: false }
};
let activeMobilePanel = null;
let quickActionsMenuOpen = false;

// Enhanced panel control functions
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

function expandPanelContent(contentId) {
    const content = document.getElementById(contentId);
    if (!content) return;
    
    const panelId = contentId.split('-')[0] + '-panel';
    const toggleBtn = document.getElementById(contentId.split('-')[0] + '-toggle');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.display = 'block';
        if (toggleBtn) toggleBtn.textContent = '−';
        
        if (panelId in panelStates) {
            panelStates[panelId].contentExpanded = true;
        } else if (contentId.split('-')[0] === 'legend') {
            panelStates['legend'].contentExpanded = true;
        }
    } else {
        content.classList.add('collapsed');
        content.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = '+';
        
        if (panelId in panelStates) {
            panelStates[panelId].contentExpanded = false;
        } else if (contentId.split('-')[0] === 'legend') {
            panelStates['legend'].contentExpanded = false;
        }
    }
    
    updateActionButtonStates();
}

function togglePanel(contentId) {
    var content = document.getElementById(contentId);
    if (!content) return;
    
    var toggleBtn = document.getElementById(contentId.split('-')[0] + '-toggle');
    const panelId = getPanelIdFromContentId(contentId);
    
    if (isMobile && content.style.display !== 'block') {
        closeAllPanelsExcept(contentId);
    }
    
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel && panel.style.display === 'none') {
            togglePanelVisibility(panelId);
        }
    }
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.display = 'block';
        if (toggleBtn) toggleBtn.textContent = '−';
        
        if (isMobile) {
            activeMobilePanel = contentId;
        }
        
        if (panelId && panelId in panelStates) {
            panelStates[panelId].contentExpanded = true;
        } else if (contentId.split('-')[0] === 'legend') {
            panelStates['legend'].contentExpanded = true;
        }
    } else {
        content.classList.add('collapsed');
        content.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = '+';
        
        if (isMobile && activeMobilePanel === contentId) {
            activeMobilePanel = null;
        }
        
        if (panelId && panelId in panelStates) {
            panelStates[panelId].contentExpanded = false;
        } else if (contentId.split('-')[0] === 'legend') {
            panelStates['legend'].contentExpanded = false;
        }
    }
    
    updateActionButtonStates();
}

function getPanelIdFromContentId(contentId) {
    const prefix = contentId.split('-')[0];
    
    if (prefix === 'filter' || prefix === 'church') {
        return prefix + '-panel';
    } else if (prefix === 'legend') {
        return 'legend';
    }
    
    return null;
}

function closeAllPanelsExcept(exceptContentId) {
    const panelContents = document.querySelectorAll('.panel-content');
    panelContents.forEach(panel => {
        if (panel.id !== exceptContentId) {
            panel.classList.add('collapsed');
            panel.style.display = 'none';
            
            const panelId = panel.id.split('-')[0];
            const toggleBtn = document.getElementById(panelId + '-toggle');
            if (toggleBtn) {
                toggleBtn.textContent = '+';
            }
            
            const parentPanelId = getPanelIdFromContentId(panel.id);
            if (parentPanelId && parentPanelId in panelStates) {
                panelStates[parentPanelId].contentExpanded = false;
            }
        }
    });
    
    updateActionButtonStates();
}

function hideAllPanels() {
    const panels = document.querySelectorAll('.panel');
    
    panels.forEach(panel => {
        panel.style.display = 'none';
        if (panel.id in panelStates) {
            panelStates[panel.id].visible = false;
        }
    });
    
    const panelContents = document.querySelectorAll('.panel-content');
    panelContents.forEach(content => {
        content.classList.add('collapsed');
        content.style.display = 'none';
        
        const prefix = content.id.split('-')[0];
        const toggleBtn = document.getElementById(prefix + '-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = '+';
        }
        
        const panelId = getPanelIdFromContentId(content.id);
        if (panelId && panelId in panelStates) {
            panelStates[panelId].contentExpanded = false;
        }
    });
    
    activeMobilePanel = null;
    updateActionButtonStates();
}

function updateActionButtonStates() {
    const actionItems = document.querySelectorAll('.mobile-action-item[data-panel]');
    
    actionItems.forEach(item => {
        const panelId = item.getAttribute('data-panel');
        const contentId = item.getAttribute('data-content');
        
        if (panelId && panelId in panelStates) {
            const isVisible = panelStates[panelId].visible;
            const isExpanded = panelStates[panelId].contentExpanded;
            
            if (isVisible) {
                item.classList.add('panel-visible');
                item.querySelector('.panel-visibility-indicator').style.display = 'block';
                item.querySelector('.panel-visibility-indicator').style.backgroundColor = 
                    isExpanded ? '#4CAF50' : '#FFA500';
            } else {
                item.classList.remove('panel-visible');
                item.querySelector('.panel-visibility-indicator').style.display = 'none';
            }
        }
    });
}

// Mobile detection and adjustments
function checkMobile() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;
    
    if (wasMobile !== isMobile) {
        adjustForMobile();
        resetPanelStates();
    }
}

function resetPanelStates() {
    const panelContents = document.querySelectorAll('.panel-content');
    
    if (isMobile) {
        panelContents.forEach(panel => {
            panel.classList.add('collapsed');
            panel.style.display = 'none';
            const panelId = panel.id.split('-')[0];
            const toggleBtn = document.getElementById(panelId + '-toggle');
            if (toggleBtn) toggleBtn.textContent = '+';
        });
        
        document.getElementById('church-list-panel').style.display = 'none';
        panelStates['church-list-panel'].visible = false;
        panelStates['church-list-panel'].contentExpanded = false;
        
        document.getElementById('filter-panel').style.display = 'none';
        panelStates['filter-panel'].visible = false;
        panelStates['filter-panel'].contentExpanded = false;
        
        document.getElementById('legend').style.display = 'none';
        panelStates['legend'].visible = false;
        panelStates['legend'].contentExpanded = false;
        
        document.getElementById('mobile-toggle-list').style.display = 'none';
        document.getElementById('mobile-quick-actions').style.display = 'flex';
    } else {
        panelContents.forEach(panel => {
            panel.classList.remove('collapsed');
            panel.style.display = 'block';
            const panelId = panel.id.split('-')[0];
            const toggleBtn = document.getElementById(panelId + '-toggle');
            if (toggleBtn) toggleBtn.textContent = '−';
        });
        
        document.getElementById('church-list-panel').style.display = 'block';
        panelStates['church-list-panel'].visible = true;
        panelStates['church-list-panel'].contentExpanded = true;
        
        document.getElementById('filter-panel').style.display = 'block';
        panelStates['filter-panel'].visible = true;
        panelStates['filter-panel'].contentExpanded = true;
        
        document.getElementById('legend').style.display = 'block';
        panelStates['legend'].visible = true;
        panelStates['legend'].contentExpanded = true;
        
        document.getElementById('mobile-toggle-list').style.display = 'none';
        document.getElementById('mobile-quick-actions').style.display = 'none';
        document.getElementById('mobile-actions-menu').style.display = 'none';
        quickActionsMenuOpen = false;
    }
    
    updateActionButtonStates();
}

function adjustForMobile() {
    if (isMobile) {
        document.getElementById('church-list-panel').style.display = 'none';
        panelStates['church-list-panel'].visible = false;
        
        document.getElementById('filter-panel').style.display = 'none';
        panelStates['filter-panel'].visible = false;
        
        document.getElementById('legend').style.display = 'none';
        panelStates['legend'].visible = false;
        
        document.getElementById('mobile-toggle-list').style.display = 'none';
        document.getElementById('mobile-quick-actions').style.display = 'flex';
        
        const mapControls = document.querySelectorAll('.leaflet-control-layers, .leaflet-control-zoom a');
        mapControls.forEach(control => {
            control.style.padding = '8px';
        });
        
        hideAllPanels();
    } else {
        document.getElementById('church-list-panel').style.display = 'block';
        panelStates['church-list-panel'].visible = true;
        
        document.getElementById('filter-panel').style.display = 'block';
        panelStates['filter-panel'].visible = true;
        
        document.getElementById('legend').style.display = 'block';
        panelStates['legend'].visible = true;
        
        document.getElementById('mobile-toggle-list').style.display = 'none';
        document.getElementById('mobile-quick-actions').style.display = 'none';
        document.getElementById('mobile-actions-menu').style.display = 'none';
        quickActionsMenuOpen = false;
        
        const panelContents = document.querySelectorAll('.panel-content');
        panelContents.forEach(panel => {
            panel.classList.remove('collapsed');
            panel.style.display = 'block';
            const panelId = panel.id.split('-')[0];
            const toggleBtn = document.getElementById(panelId + '-toggle');
            if (toggleBtn) toggleBtn.textContent = '−';
            
            const parentPanelId = getPanelIdFromContentId(panel.id);
            if (parentPanelId && parentPanelId in panelStates) {
                panelStates[parentPanelId].contentExpanded = true;
            }
        });
    }
    
    updateActionButtonStates();
}

function toggleQuickActionsMenu() {
    const menu = document.getElementById('mobile-actions-menu');
    const quickActionsBtn = document.getElementById('mobile-quick-actions');
    
    if (quickActionsMenuOpen) {
        menu.classList.remove('visible');
        quickActionsBtn.textContent = '+';
        setTimeout(() => {
            if (!quickActionsMenuOpen) {
                menu.style.display = 'none';
            }
        }, 300);
    } else {
        menu.style.display = 'flex';
        void menu.offsetWidth;
        menu.classList.add('visible');
        quickActionsBtn.textContent = '×';
    }
    
    quickActionsMenuOpen = !quickActionsMenuOpen;
    updateActionButtonStates();
}

// Mobile action handlers setup
function setupMobileActions() {
    document.getElementById('mobile-quick-actions').addEventListener('click', toggleQuickActionsMenu);
    
    document.getElementById('action-toggle-filter').addEventListener('click', function() {
        const panelId = this.getAttribute('data-panel');
        const contentId = this.getAttribute('data-content');
        const isPanelVisible = document.getElementById(panelId).style.display !== 'none';
        
        if (isPanelVisible) {
            const isContentExpanded = !document.getElementById(contentId).classList.contains('collapsed');
            if (isContentExpanded) {
                expandPanelContent(contentId);
            } else {
                togglePanelVisibility(panelId);
            }
        } else {
            togglePanelVisibility(panelId);
            setTimeout(() => {
                if (document.getElementById(contentId).classList.contains('collapsed')) {
                    expandPanelContent(contentId);
                }
            }, 50);
        }
        toggleQuickActionsMenu();
    });
    
    document.getElementById('action-toggle-list').addEventListener('click', function() {
        const panelId = this.getAttribute('data-panel');
        const contentId = this.getAttribute('data-content');
        const isPanelVisible = document.getElementById(panelId).style.display !== 'none';
        
        if (isPanelVisible) {
            const isContentExpanded = !document.getElementById(contentId).classList.contains('collapsed');
            if (isContentExpanded) {
                expandPanelContent(contentId);
            } else {
                togglePanelVisibility(panelId);
            }
        } else {
            document.getElementById(panelId).classList.add('mobile-visible');
            togglePanelVisibility(panelId);
            setTimeout(() => {
                if (document.getElementById(contentId).classList.contains('collapsed')) {
                    expandPanelContent(contentId);
                }
            }, 50);
        }
        toggleQuickActionsMenu();
    });
    
    document.getElementById('action-toggle-legend').addEventListener('click', function() {
        const panelId = this.getAttribute('data-panel');
        const contentId = this.getAttribute('data-content');
        const isPanelVisible = document.getElementById(panelId).style.display !== 'none';
        
        if (isPanelVisible) {
            const isContentExpanded = !document.getElementById(contentId).classList.contains('collapsed');
            if (isContentExpanded) {
                expandPanelContent(contentId);
            } else {
                togglePanelVisibility(panelId);
            }
        } else {
            togglePanelVisibility(panelId);
            setTimeout(() => {
                if (document.getElementById(contentId).classList.contains('collapsed')) {
                    expandPanelContent(contentId);
                }
            }, 50);
        }
        toggleQuickActionsMenu();
    });
    
    document.getElementById('action-my-location').addEventListener('click', function() {
        document.querySelector('.leaflet-control-locate a').click();
        toggleQuickActionsMenu();
    });
    
    document.getElementById('action-hide-all-panels').addEventListener('click', function() {
        hideAllPanels();
        toggleQuickActionsMenu();
    });
}

document.getElementById('mobile-toggle-list').addEventListener('click', function() {
    const panel = document.getElementById('church-list-panel');
    const contentId = 'church-list-content';
    
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'none';
        panel.classList.add('mobile-visible');
        this.textContent = 'Hide Churches List';
        panelStates['church-list-panel'].visible = true;
        
        const content = document.getElementById(contentId);
        if (content.classList.contains('collapsed')) {
            expandPanelContent(contentId);
        }
    } else {
        panel.style.display = 'none';
        panel.classList.remove('mobile-visible');
        this.textContent = 'Show Churches List';
        panelStates['church-list-panel'].visible = false;
        panelStates['church-list-panel'].contentExpanded = false;
    }
    
    updateActionButtonStates();
});

document.getElementById('hide-church-list').addEventListener('click', function() {
    if (isMobile) {
        document.getElementById('church-list-panel').style.display = 'none';
        document.getElementById('mobile-toggle-list').textContent = 'Show Churches List';
        panelStates['church-list-panel'].visible = false;
        updateActionButtonStates();
    }
});

// Event listeners
window.addEventListener('resize', checkMobile);

window.addEventListener('load', function() {
    checkMobile();
    setupMobileActions();
    updateActionButtonStates();
});