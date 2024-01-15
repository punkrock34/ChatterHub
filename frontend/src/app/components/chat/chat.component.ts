import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Auth, updateProfile } from '@angular/fire/auth';
import { faUser, faEllipsisV, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Message } from '../../interfaces/message';
import { WebsocketService } from '../../services/websocket/websocket.service';
import { ChatService } from '../../services/chat/chat.service';
import { ImagesService } from '../../services/images/images.service';
import { MessagesService } from '../../services/messages/messages.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  currentUserUID: string = '';
  private messagesListSubject = new BehaviorSubject<Message[]>([]);
  messagesList$ = this.messagesListSubject.asObservable();

  faUser = faUser;
  faEllipsisV = faEllipsisV;
  faPaperPlane = faPaperPlane;

  messages: Message[] = [];
  newMessage: string = '';

  constructor(private auth: Auth, private imagesService: ImagesService, private messagesService: MessagesService, private websocketService: WebsocketService, private chatService: ChatService) {
    this.messages = [];
    this.currentUserUID = this.auth.currentUser?.uid || '';
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
      const messages = await this.messagesService.getMessages(0, 100);
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
      const res: boolean = await this.imagesService.checkImageExists(user.photoURL);
      if (!res) {
        photoURL = await this.imagesService.downloadProfilePicture(user.email || null);
        await updateProfile(user, { photoURL: photoURL });
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }


    const lastMessage = this.messages[this.messages.length - 1];
    const timestamp = new Date().getTime();
    const showAvatar = uid !== lastMessage?.uid || timestamp - lastMessage?.timestamp > 300000;
    const showTimestamp = !showAvatar;

    const message: Message = {
      message_id: null,
      uid: uid,
      displayName: displayName,
      photoURL: photoURL,
      timestamp: timestamp,
      message: newMessage,
      showAvatar: showAvatar,
      showTimestamp: showTimestamp,
    };

    this.messages.push(message);
    this.limitMessageArraySize();
    this.messagesListSubject.next(this.messages);

    try {
      const message_id = await this.messagesService.sendMessage(message);
      this.messages[this.messages.length - 1].message_id = message_id;
      this.messagesListSubject.next(this.messages);

      const type = 'message';
      this.websocketService.sendMessage(type, message);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private async getLatestMessage(): Promise<void> {
    try {
      const messages = await this.messagesService.getMessages(this.messages.length - 10, this.messages.length + 10);

      this.messages = this.messages.concat(messages);

      this.messages = this.messages.filter((message, index, self) =>
        index === self.findIndex((m) => (
          m.uid === message.uid && m.timestamp === message.timestamp
        ))
      );

      this.messages = this.messages.sort((a, b) => a.timestamp - b.timestamp);
      this.limitMessageArraySize();
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

  private limitMessageArraySize(): void {
    const maxMessages = 100;
    if(this.messages.length <= maxMessages) return;

    this.messages = this.messages.slice(-maxMessages);
  }
}
