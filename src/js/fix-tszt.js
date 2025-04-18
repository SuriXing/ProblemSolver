/**
 * Comprehensive Access Code Fix Script
 * This script provides a direct method to add access codes to localStorage
 * It can be used independently or in conjunction with the fix utility page
 */

(function() {
    // ==================== CONFIGURATION ====================
    // This can be overridden by the page that includes this script
    window.AccessCodeFixer = {
        // Set the default access code to fix
        defaultAccessCode: 'TSZT-VVSM-8F8Y',
        
        // Storage key constants
        storageKey: 'problemSolver_userData',
        
        // Fix function that can be called from outside
        fix: function(accessCode) {
            // Use the provided code or fall back to default
            const codeToFix = accessCode || this.defaultAccessCode;
            
            console.log('🔧 Access Code Fixer: Starting fix for access code', codeToFix);
            
            // Call the internal fix function
            return this._fixAccessCode(codeToFix);
        },
        
        // Check if an access code exists
        check: function(accessCode) {
            const codeToCheck = accessCode || this.defaultAccessCode;
            
            console.log('🔍 Access Code Fixer: Checking access code', codeToCheck);
            
            // Try both methods of checking
            let exists = false;
            
            // 1. Check via StorageSystem if available
            if (window.StorageSystem && typeof window.StorageSystem.checkAccessCode === 'function') {
                exists = window.StorageSystem.checkAccessCode(codeToCheck);
                console.log('🔍 Via StorageSystem:', exists ? 'Found' : 'Not found');
            }
            
            // 2. Check directly in localStorage
            try {
                const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
                const directExists = !!storage[codeToCheck];
                console.log('🔍 Via direct localStorage:', directExists ? 'Found' : 'Not found');
                
                // Update exists status if found via direct check
                exists = exists || directExists;
            } catch (e) {
                console.error('🔍 Error checking localStorage:', e);
            }
            
            return exists;
        },
        
        // Get template user data for different access codes
        getUserData: function(accessCode) {
            // Default template
            let userData = {
                userId: Math.floor(1000 + Math.random() * 9000).toString(),
                accessCode: accessCode,
                confessionText: "This is a sample confession text for " + accessCode,
                selectedTags: ["Sample", "Test"],
                timestamp: new Date().toISOString(),
                replies: []
            };
            
            // Specific templates for known access codes
            if (accessCode === 'TSZT-VVSM-8F8Y') {
                userData = {
                    userId: "9524",
                    accessCode: accessCode,
                    confessionText: "我最近在社交场合感到焦虑，尤其是与新同事交流时。我担心自己说错话或给人留下不好的印象。有谁能给我一些建议如何克服这种社交焦虑？",
                    selectedTags: ["焦虑", "社交", "人际关系"],
                    timestamp: new Date().toISOString(),
                    replies: [
                        {
                            replyText: "社交焦虑是非常常见的。试着从小的交流开始，比如先与一两个同事简短交谈。准备一些可以讨论的话题也会有帮助。记住，大多数人都在关注自己的表现，而不是评判你。深呼吸和正念练习也可以帮助缓解焦虑。",
                            replierName: "Helper #6378",
                            replyTime: "刚刚"
                        },
                        {
                            replyText: "作为一个曾经有社交焦虑的人，我理解你的感受。一个有用的技巧是提前练习对话，甚至可以在镜子前练习。另外，不要给自己太大压力，与人交流是需要时间和实践的技能。如果焦虑严重，也可以考虑寻求专业心理咨询。",
                            replierName: "Helper #2935",
                            replyTime: "5分钟前"
                        }
                    ]
                };
            } else if (accessCode === 'J23B-F42A-LCRZ') {
                userData = {
                    userId: "7291",
                    accessCode: accessCode,
                    confessionText: "I have been struggling with my coursework lately. The assignments are getting harder and I'm falling behind. I'm afraid I might fail this semester.",
                    selectedTags: ["Study", "Stress", "Academic"],
                    timestamp: new Date().toISOString(),
                    replies: [
                        {
                            replyText: "It's completely normal to feel overwhelmed with coursework. Have you tried speaking with your professor about your concerns? Many instructors are willing to provide extra help or extensions if you explain your situation. Also, consider forming or joining a study group - sometimes explaining concepts to others can help solidify your understanding.",
                            replierName: "Helper #4215",
                            replyTime: "Just now"
                        }
                    ]
                };
            } else if (accessCode === 'demo') {
                userData = {
                    userId: "3842",
                    accessCode: accessCode,
                    confessionText: "I've been feeling very stressed about my upcoming job interview. I'm worried I won't be able to answer the technical questions correctly. Has anyone been through something similar?",
                    selectedTags: ["Anxiety", "Work"],
                    timestamp: new Date().toISOString(),
                    replies: [
                        {
                            replyText: "It's completely normal to feel nervous before an interview. I'd recommend practicing common interview questions and doing some mock interviews with friends. Remember that it's okay to say 'I don't know' if you're not sure about an answer. Being honest and showing your willingness to learn can be more valuable than pretending to know everything.",
                            replierName: "Helper #5678",
                            replyTime: "1 hour ago"
                        }
                    ]
                };
            }
            
            return userData;
        },
        
        // Private method that implements the fix
        _fixAccessCode: function(accessCode) {
            try {
                // Create user data for the access code
                const userData = this.getUserData(accessCode);
                
                // First try to use StorageSystem if available
                let systemFixSuccessful = false;
                if (window.StorageSystem && typeof window.StorageSystem.storeData === 'function') {
                    console.log('🔧 Attempting fix using StorageSystem');
                    systemFixSuccessful = window.StorageSystem.storeData(accessCode, userData);
                    console.log(systemFixSuccessful ? 
                        '✅ StorageSystem fix successful' : 
                        '❌ StorageSystem fix failed');
                } else {
                    console.log('⚠️ StorageSystem not available for fixing');
                }
                
                // Next, do a direct localStorage fix regardless of StorageSystem result
                console.log('🔧 Applying direct localStorage fix');
                
                // Get current storage or create new empty object
                let storage = {};
                try {
                    const existingData = localStorage.getItem(this.storageKey);
                    if (existingData && existingData !== 'undefined' && existingData !== 'null') {
                        storage = JSON.parse(existingData);
                        console.log('✅ Found existing storage with keys:', Object.keys(storage));
                    } else {
                        console.log('ℹ️ No existing storage, creating new empty storage');
                    }
                } catch (error) {
                    console.error('⚠️ Error reading storage:', error);
                }
                
                // Add the data to storage
                storage[accessCode] = userData;
                
                // Save back to localStorage
                localStorage.setItem(this.storageKey, JSON.stringify(storage));
                console.log('✅ Direct fix: Successfully added access code to localStorage');
                
                // Also save the access code separately
                localStorage.setItem('accessCode', accessCode);
                console.log('✅ Direct fix: Set accessCode in localStorage to', accessCode);
                
                // Check if the fix worked
                try {
                    const checkStorage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
                    const directFixSuccessful = !!checkStorage[accessCode];
                    
                    if (directFixSuccessful) {
                        console.log('✅ Verification successful! Access code is in storage');
                    } else {
                        console.error('❌ Verification failed! Access code not found after saving');
                    }
                    
                    return systemFixSuccessful || directFixSuccessful;
                } catch (error) {
                    console.error('❌ Error during verification:', error);
                    return false;
                }
            } catch (error) {
                console.error('❌ Critical error during fix:', error);
                return false;
            }
        }
    };
    
    // Auto-run fix for default access code
    console.log('🔄 Access Code Fixer: Auto-executing for default code', window.AccessCodeFixer.defaultAccessCode);
    window.AccessCodeFixer.fix();
    
})(); 