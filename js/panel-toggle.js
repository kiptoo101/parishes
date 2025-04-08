/**
 * panel-toggle.js - Simple script to handle panel toggling
 * This should be loaded before the other JS modules
 */

// Make togglePanel available globally
window.togglePanel = function(contentId) {
    var content = document.getElementById(contentId);
    if (!content) return;
    
    var toggleBtn = document.getElementById(contentId.split('-')[0] + '-toggle');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.display = 'block';
        if (toggleBtn) toggleBtn.textContent = '−';
    } else {
        content.classList.add('collapsed');
        content.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = '+';
    }
};

// Add event listeners to panel headers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get all panel headers
    var panelHeaders = document.querySelectorAll('.panel-header');
    
    // Add click event listeners
    panelHeaders.forEach(function(header) {
        var panelId = header.parentElement.id;
        var contentId = panelId.split('-')[0] + '-content';
        
        header.onclick = function() {
            window.togglePanel(contentId);
        };
    });
    
    console.log('Panel toggle functionality initialized');
});