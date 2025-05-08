/**
 * Storage System for Problem Solver
 * Handles storing and retrieving user data by access code
 */

const StorageSystem = (function() {
    // Storage keys
    const STORAGE_KEY = 'problemSolver_userData';
    
    /**
     * Initialize the storage system
     */
    function init() {
        // Create storage if it doesn't exist
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
            console.log('StorageSystem: Initialized with empty storage');
        } else {
            console.log('StorageSystem: Storage exists');
            // Log the current access codes for debugging
            try {
                const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                console.log('StorageSystem: Current access codes:', Object.keys(storage));
            } catch (error) {
                console.error('StorageSystem: Error reading storage during init:', error);
            }
        }
    }
    
    /**
     * Store user data with the provided access code
     * @param {string} accessCode - Unique access code for the user
     * @param {object} userData - User data to store
     * @returns {boolean} - Success status
     */
    function storeData(accessCode, userData) {
        console.log('StorageSystem: Attempting to store data for access code:', accessCode);
        try {
            if (!accessCode) {
                console.error('StorageSystem: Access code is required');
                return false;
            }
            
            // Get current data
            const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            
            // Add timestamp if not present
            if (!userData.timestamp) {
                userData.timestamp = new Date().toISOString();
            }
            
            // Store data with access code as key
            storage[accessCode] = userData;
            
            // Save back to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
            console.log('StorageSystem: Successfully stored data for access code:', accessCode);
            console.log('StorageSystem: Current access codes:', Object.keys(storage));
            
            return true;
        } catch (error) {
            console.error('StorageSystem: Error storing data:', error);
            return false;
        }
    }
    
    /**
     * Retrieve user data by access code
     * @param {string} accessCode - Access code to look up
     * @returns {object|null} - User data or null if not found
     */
    function retrieveData(accessCode) {
        console.log('StorageSystem: Attempting to retrieve data for access code:', accessCode);
        try {
            if (!accessCode) {
                console.error('StorageSystem: Access code is required');
                return null;
            }
            
            // Get current data
            const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            console.log('StorageSystem: Available access codes:', Object.keys(storage));
            
            // Return data for the access code or null
            const userData = storage[accessCode] || null;
            if (userData) {
                console.log('StorageSystem: Found data for access code:', accessCode);
            } else {
                console.log('StorageSystem: No data found for access code:', accessCode);
            }
            
            return userData;
        } catch (error) {
            console.error('StorageSystem: Error retrieving data:', error);
            return null;
        }
    }
    
    /**
     * Check if an access code exists in storage
     * @param {string} accessCode - Access code to check
     * @returns {boolean} - True if access code exists
     */
    function checkAccessCode(accessCode) {
        console.log('StorageSystem: Checking if access code exists:', accessCode);
        try {
            if (!accessCode) return false;
            
            const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            const exists = !!storage[accessCode];
            console.log('StorageSystem: Access code', accessCode, exists ? 'exists' : 'does not exist');
            console.log('StorageSystem: Available access codes:', Object.keys(storage));
            
            return exists;
        } catch (error) {
            console.error('StorageSystem: Error checking access code:', error);
            return false;
        }
    }
    
    /**
     * Generate a unique access code
     * @returns {string} - Unique access code
     */
    function generateAccessCode() {
        // Format: XXXX-XXXX-XXXX where X is alphanumeric
        const segments = 3;
        const segmentLength = 4;
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters like I, 1, O, 0
        
        let code = '';
        for (let s = 0; s < segments; s++) {
            if (s > 0) code += '-';
            for (let i = 0; i < segmentLength; i++) {
                const randomIndex = Math.floor(Math.random() * chars.length);
                code += chars[randomIndex];
            }
        }
        
        // Make sure it's unique
        if (checkAccessCode(code)) {
            return generateAccessCode(); // Try again if exists
        }
        
        console.log('StorageSystem: Generated new access code:', code);
        return code;
    }
    
    /**
     * Clear all stored data (for testing purposes)
     */
    function clearAllData() {
        console.log('StorageSystem: Clearing all data');
        localStorage.removeItem(STORAGE_KEY);
        init();
    }
    
    // Initialize on load
    init();
    
    // Public API
    return {
        storeData,
        retrieveData,
        checkAccessCode,
        generateAccessCode,
        clearAllData
    };
})();

// Make StorageSystem available globally
window.StorageSystem = StorageSystem; 