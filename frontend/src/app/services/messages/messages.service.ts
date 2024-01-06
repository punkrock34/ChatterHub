import { Injectable } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Auth } from '@angular/fire/auth';

export interface Message {
  uid: any;
  displayName: string;
  photoURL: string | null;
  timestamp: any;
  message: string;
  showAvatar: boolean | null;
  showTimestamp: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  messages: Message[] = [];
  newMessage: string = '';

  constructor(private auth: Auth) {
    this.messages.push({
      uid: 1234,
      displayName: 'John Doe',
      photoURL: null,
      timestamp: Date.now(),
      message: 'Hello, how are you?',
      showAvatar: null,
      showTimestamp: null,
    });
    this.messages.push({
      uid: 5678,
      displayName: 'Jane Doe',
      photoURL: null,
      timestamp: Date.now(),
      message: 'I am fine, thank you.',
      showAvatar: null,
      showTimestamp: null,
    });
    this.messages.push({
      uid: 1234,
      displayName: 'John Doe',
      photoURL: null,
      timestamp: Date.now(),
      message: 'That is great to hear!',
      showAvatar: null,
      showTimestamp: null,
    });
    this.messages.push({
      uid: 1234,
      displayName: 'John Doe',
      photoURL: null,
      timestamp: Date.now(),
      message: 'How is the weather today?',
      showAvatar: null,
      showTimestamp: null,
    })
  }

  sendMessage(form: NgForm): void {
    let { newMessage } = form.value;
    form.reset();
    newMessage = newMessage.trim();
    if (newMessage.length === 0) {
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      return;
    }

    const uid = user.uid;
    const displayName = user.displayName;

    const lastMessage = this.messages[this.messages.length - 1];
    const timestamp = Date.now();
    const showAvatar = uid !== lastMessage.uid || timestamp - lastMessage.timestamp > 300000;
    const showTimestamp = !showAvatar;

    this.messages.push({
      uid,
      displayName: displayName || 'Anonymous',
      photoURL: user.photoURL,
      timestamp:timestamp,
      message: newMessage,
      showAvatar,
      showTimestamp,
    });
  }

  getMessages(): Message[] {
    for (let i = 0; i < this.messages.length; i++) {
      const showAvatar = this.messages[i].uid !== this.messages[i - 1]?.uid || this.messages[i].timestamp - this.messages[i - 1]?.timestamp > 300000;
      this.messages[i].showAvatar = showAvatar;
      this.messages[i].showTimestamp = !showAvatar;
    }

    return this.messages;
  }

}

