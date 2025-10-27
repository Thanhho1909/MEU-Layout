// INSTANT FILE INPUT FIX
(function() {
    'use strict';
    
    function setupInstantFileInput() {
        const convertUploadZone = document.getElementById('convertUploadZone');
        const convertFileInput = document.getElementById('convertFileInput');
        
        if (!convertUploadZone || !convertFileInput) {
            setTimeout(setupInstantFileInput, 50);
            return;
        }
        
        console.log('Setting up INSTANT file input handler');
        
        // Remove ALL existing event listeners by cloning
        const newZone = convertUploadZone.cloneNode(true);
        convertUploadZone.parentNode.replaceChild(newZone, convertUploadZone);
        
        // Get fresh reference
        const zone = document.getElementById('convertUploadZone');
        
        // INSTANT RESPONSE - NO DELAYS
        zone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('INSTANT CLICK - Triggering file input');
            convertFileInput.click();
        }, { passive: false });
        
        zone.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        zone.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        zone.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
        
        console.log('INSTANT file input handler setup complete');
    }
    
    // Run immediately when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInstantFileInput);
    } else {
        setupInstantFileInput();
    }
})();