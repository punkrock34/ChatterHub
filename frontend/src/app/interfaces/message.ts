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

export interface MessageAction {
  type: string;
  message_id: number | null;
  message: string | null;
  showAvatar: boolean | null;
  showTimestamp: boolean | null;
}
