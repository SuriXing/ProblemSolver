export interface UserData {
  userId: string;
  accessCode: string;
  confessionText: string;
  selectedTags: string[];
  privacyOption: string;
  emailNotification: boolean;
  email: string;
  timestamp: string;
  replies: {
    replyText: string;
    replierName: string;
    replyTime: string;
  }[];
  views: number;
} 