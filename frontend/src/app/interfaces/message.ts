export interface Message {
  message_id: number|null;
  uid: any;
  displayName: string;
  photoURL: string | null;
  timestamp: any;
  message: string;
  showAvatar: boolean | null;
  showTimestamp: boolean | null;
}
