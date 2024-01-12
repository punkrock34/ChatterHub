import { Component } from '@angular/core';
import { GeneralService } from '../../services/general/general.service';
import { NgForm } from '@angular/forms';
import { Auth, updateProfile } from '@angular/fire/auth';
import { BehaviorSubject, last } from 'rxjs';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Message } from '../../interfaces/message';
import { WebsocketService } from '../../services/websocket/websocket.service';
import { ChatService } from '../../services/chat/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  currentUserUid: string = '';
  private messagesListSubject = new BehaviorSubject<Message[]>([]);
  messagesList$ = this.messagesListSubject.asObservable();

  faUser = faUser;
  messages: Message[] = [];
  newMessage: string = '';

  constructor(private auth: Auth, private generalService: GeneralService, private websocketService: WebsocketService, private chatService: ChatService) {
    this.messages = [];
    this.currentUserUid = this.auth.currentUser?.uid || '';
    this.getMessages(); // Fetch initial messages
  }

  ngOnInit(): void {
    this.registerUserWithWebSocket();

    this.chatService.newMessage$.subscribe((refresh) => {
      if (refresh) {
        this.getLatestMessage();
      }
    });
  }

  async getMessages(): Promise<void> {
    try {
      const messages = await this.generalService.getMessages(0, 100);
      this.messages = messages;
      this.messagesListSubject.next(this.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  async sendMessage(form: NgForm): Promise<void> {
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
    const displayName = user.displayName || 'Anonymous';
    let photoURL = user.photoURL || null;

    try {
      const res: boolean = await this.generalService.checkImageExists(user.photoURL);
      if (!res) {
        photoURL = await this.generalService.downloadProfilePicture(user.email || null);
        await updateProfile(user, { photoURL: photoURL });
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }


    const lastMessage = this.messages[this.messages.length - 1];
    const timestamp = new Date().getTime();
    const showAvatar = uid !== lastMessage?.uid || timestamp - lastMessage?.timestamp > 300000;
    const showTimestamp = !showAvatar;

    const message = {
      uid: uid,
      displayName: displayName,
      photoURL: photoURL,
      timestamp: timestamp,
      message: newMessage,
      showAvatar: showAvatar,
      showTimestamp: showTimestamp,
    };

    this.messages.push(message);
    this.messagesListSubject.next(this.messages);

    try {
      await this.generalService.sendMessage(message);

      const type = 'message';
      this.websocketService.sendMessage(type, message);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private async getLatestMessage(): Promise<void> {
    try {
      const currentMessage = (this.messages.length > 0 ? this.messages[this.messages.length - 1] : null)
      const messages = await this.generalService.getMessages(this.messages.length + 1, this.messages.length + 1);
      if (messages.length === 0) {
        return;
      }

      const lastMessage = messages[0];
      const showAvatar = currentMessage?.uid !== lastMessage.uid || lastMessage.timestamp - currentMessage?.timestamp > 300000;
      const showTimestamp = !showAvatar;

      const message = {
        uid: lastMessage.uid,
        displayName: lastMessage.displayName,
        photoURL: lastMessage.photoURL,
        timestamp: lastMessage.timestamp,
        message: lastMessage.message,
        showAvatar: showAvatar,
        showTimestamp: showTimestamp,
      };

      this.messages.push(message);
      this.messagesListSubject.next(this.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  private registerUserWithWebSocket(): void {
    const user = this.auth.currentUser;

    if (user) {
      const userData = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null
      };

      const type = 'register';
      this.websocketService.sendRegistrationMessage(type, userData);
    }
  }
}
