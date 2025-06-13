import StorageSystem, { UserData } from './StorageSystem';

/**
 * Initialize demo data including special access codes
 */
const initDemoData = (): void => {
  console.log('Initializing demo data...');
  
  // Add the special TSZT-VVSM-8F8Y access code if it doesn't exist
  if (!StorageSystem.checkAccessCode('TSZT-VVSM-8F8Y')) {
    const userData: UserData = {
      userId: "9524",
      accessCode: "TSZT-VVSM-8F8Y",
      confessionText: "我最近在社交场合感到焦虑，尤其是与新同事交流时。我担心自己说错话或给人留下不好的印象。有谁能给我一些建议如何克服这种社交焦虑？",
      selectedTags: ["焦虑", "社交"],
      privacyOption: "public",
      emailNotification: false,
      email: "",
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
      ],
      views: 0
    };
    
    StorageSystem.storeData('TSZT-VVSM-8F8Y', userData);
    console.log('Demo data initialized: TSZT-VVSM-8F8Y access code added');
  } else {
    console.log('Demo data already exists: TSZT-VVSM-8F8Y access code already present');
  }
  
  // Add the J23B-F42A-LCRZ access code if it doesn't exist
  if (!StorageSystem.checkAccessCode('J23B-F42A-LCRZ')) {
    const userData: UserData = {
      userId: "7291",
      accessCode: "J23B-F42A-LCRZ",
      confessionText: "I have been struggling with my coursework lately. The assignments are getting harder and I'm falling behind. I'm afraid I might fail this semester.",
      selectedTags: ["Study", "Stress", "Academic"],
      privacyOption: "public",
      emailNotification: false,
      email: "",
      timestamp: new Date().toISOString(),
      replies: [
        {
          replyText: "It's completely normal to feel overwhelmed with coursework. Have you tried speaking with your professor about your concerns? Many instructors are willing to provide extra help or extensions if you explain your situation. Also, consider forming or joining a study group - sometimes explaining concepts to others can help solidify your understanding.",
          replierName: "Helper #4215",
          replyTime: "Just now"
        }
      ],
      views: 0
    };
    
    StorageSystem.storeData('J23B-F42A-LCRZ', userData);
    console.log('Demo data initialized: J23B-F42A-LCRZ access code added');
  } else {
    console.log('Demo data already exists: J23B-F42A-LCRZ access code already present');
  }
};

export default initDemoData;
