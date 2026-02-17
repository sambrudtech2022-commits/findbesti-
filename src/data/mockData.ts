import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";
import avatar6 from "@/assets/avatar6.jpg";
import avatar7 from "@/assets/avatar7.jpg";
import avatar8 from "@/assets/avatar8.jpg";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  isOnline: boolean;
  isLive: boolean;
  country: string;
  language: string;
}

export const mockUsers: UserProfile[] = [
  { id: "1", name: "Priya", age: 22, avatar: avatar1, isOnline: true, isLive: true, country: "🇮🇳", language: "Hindi" },
  { id: "2", name: "Emily", age: 24, avatar: avatar2, isOnline: true, isLive: false, country: "🇺🇸", language: "English" },
  { id: "3", name: "Meera", age: 21, avatar: avatar3, isOnline: true, isLive: true, country: "🇮🇳", language: "Hindi" },
  { id: "4", name: "Sophie", age: 23, avatar: avatar4, isOnline: false, isLive: false, country: "🇬🇧", language: "English" },
  { id: "5", name: "Sakura", age: 25, avatar: avatar6, isOnline: true, isLive: false, country: "🇯🇵", language: "Japanese" },
  { id: "6", name: "Sneha", age: 22, avatar: avatar7, isOnline: true, isLive: true, country: "🇮🇳", language: "Hindi" },
  { id: "7", name: "Maria", age: 20, avatar: avatar8, isOnline: true, isLive: false, country: "🇧🇷", language: "Portuguese" },
  { id: "8", name: "Fatima", age: 24, avatar: avatar1, isOnline: false, isLive: false, country: "🇦🇪", language: "Arabic" },
  { id: "9", name: "Ji-yeon", age: 23, avatar: avatar3, isOnline: true, isLive: true, country: "🇰🇷", language: "Korean" },
  { id: "10", name: "Aisha", age: 21, avatar: avatar6, isOnline: true, isLive: false, country: "🇵🇰", language: "Urdu" },
  { id: "11", name: "Emma", age: 22, avatar: avatar7, isOnline: true, isLive: true, country: "🇦🇺", language: "English" },
  { id: "12", name: "Ananya", age: 25, avatar: avatar8, isOnline: false, isLive: false, country: "🇮🇳", language: "Tamil" },
];

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface ChatThread {
  id: string;
  user: UserProfile;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export const mockChats: ChatThread[] = [
  { id: "c1", user: mockUsers[0], lastMessage: "Hi! How are you? 😊", timestamp: "2 min ago", unread: 3 },
  { id: "c2", user: mockUsers[2], lastMessage: "Let's video call later!", timestamp: "15 min ago", unread: 1 },
  { id: "c3", user: mockUsers[4], lastMessage: "That was so fun 😂", timestamp: "1 hr ago", unread: 0 },
  { id: "c4", user: mockUsers[5], lastMessage: "Hello! Nice to meet you", timestamp: "3 hr ago", unread: 0 },
  { id: "c5", user: mockUsers[1], lastMessage: "See you tomorrow!", timestamp: "Yesterday", unread: 0 },
];
