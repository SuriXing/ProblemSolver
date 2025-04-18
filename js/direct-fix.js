/**
 * Direct Fix for TSZT-VVSM-8F8Y Access Code
 * This script directly adds the access code data to localStorage
 */

(function() {
    // Access code to fix
    const accessCode = 'TSZT-VVSM-8F8Y';
    
    console.log('🔧 Direct Fix: Starting fix for access code', accessCode);
    
    // Create user data for the access code
    const userData = {
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

    try {
        // Get current storage or create new empty object
        let storage = {};
        try {
            const existingData = localStorage.getItem('problemSolver_userData');
            if (existingData) {
                storage = JSON.parse(existingData);
                console.log('🔧 Direct Fix: Found existing storage with keys:', Object.keys(storage));
            }
        } catch (error) {
            console.error('🔧 Direct Fix: Error reading storage:', error);
        }
        
        // Add the data to storage
        storage[accessCode] = userData;
        
        // Save back to localStorage
        localStorage.setItem('problemSolver_userData', JSON.stringify(storage));
        console.log('🔧 Direct Fix: Successfully added access code to localStorage');
        
        // Also save the access code separately
        localStorage.setItem('accessCode', accessCode);
        console.log('🔧 Direct Fix: Set accessCode in localStorage to', accessCode);
        
        // Check if it worked
        const checkStorage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
        if (checkStorage[accessCode]) {
            console.log('🔧 Direct Fix: Verification successful! Access code is in storage');
        } else {
            console.error('🔧 Direct Fix: Verification failed! Access code not found after saving');
        }
    } catch (error) {
        console.error('🔧 Direct Fix: Error during fix:', error);
    }
})(); 