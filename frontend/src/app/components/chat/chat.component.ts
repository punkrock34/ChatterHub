import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Auth, updateProfile } from '@angular/fire/auth';
import { faUser, faEllipsisV, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Message, MessageAction } from '../../interfaces/message';
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

    this.chatService.newMessageAction$.subscribe((messageAction: MessageAction) => {
      if(messageAction.type === '') return;

      try{
        switch (messageAction.type) {
          case 'message':
            this.getLatestMessageWebsocket();
            break;
          case 'delete':
            if(messageAction.message_id === null) throw new Error('Error deleting message: Missing "message_id" parameter.');

            this.deleteMessageWebsocket(messageAction.message_id);
            break;
          case 'update':
            if(messageAction.message_id === null) throw new Error('Error updating message: Missing "message_id" parameter.');
            if(messageAction.message === null) throw new Error('Error updating message: Missing "message" parameter.');
            if(messageAction.showAvatar === null) throw new Error('Error updating message: Missing "showAvatar" parameter.');
            if(messageAction.showTimestamp === null) throw new Error('Error updating message: Missing "showTimestamp" parameter.');

            this.updateMessageWebsocket(messageAction.message_id, messageAction.message, messageAction.showAvatar, messageAction.showTimestamp);
            break;
          default:
            console.error(`Unknown message type: ${messageAction.type}`);
            break;
        }
      }catch(error){
        console.error('Error handling message action:', error);
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

    try {
      const message_id = await this.messagesService.sendMessage(message);
      message.message_id = message_id;
      this.messages.push(message);
      this.limitMessageArraySize();
      this.messagesListSubject.next(this.messages);

      const type = 'message';
      this.websocketService.sendMessage(type, message);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async deleteMessage(message: Message): Promise<void> {
    try {
      const index = this.messages.findIndex((m) => m.message_id === message.message_id);

      if(index === -1) throw new Error('Message not found.');

      const previousMessage = index - 1;
      const nextMessage = index + 1;
      let updatedMessageIndex = -1;

      if(message.showAvatar){
        if (this.messages[previousMessage]?.uid === message.uid && this.messages[previousMessage]?.timestamp - message.timestamp < 300000) {
          this.messages[previousMessage].showAvatar = true;
          this.messages[previousMessage].showTimestamp = false;
          updatedMessageIndex = previousMessage;
        }else if (this.messages[nextMessage]?.uid === message.uid && message.timestamp - this.messages[nextMessage]?.timestamp < 300000) {
          this.messages[nextMessage].showAvatar = true;
          this.messages[nextMessage].showTimestamp = false;
          updatedMessageIndex = nextMessage;
        }
      }

      await this.messagesService.deleteMessage(message.message_id!);

      if(updatedMessageIndex !== -1) await this.messagesService.updateMessage(this.messages[updatedMessageIndex].message_id!, this.messages[updatedMessageIndex].message, this.messages[updatedMessageIndex].showAvatar!, this.messages[updatedMessageIndex].showTimestamp!);

      this.messages.splice(index, 1);
      this.messagesListSubject.next(this.messages);

      this.websocketService.sendMessage('delete', message);
      if(updatedMessageIndex !== -1) this.websocketService.sendMessage('update', this.messages[updatedMessageIndex]);

    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  private async getLatestMessageWebsocket(): Promise<void> {
    try {
      const messages = await this.messagesService.getMessages(this.messages.length - 10, this.messages.length + 10);

      this.messages = this.messages.concat(messages);

      this.messages = this.messages.filter((message, index, self) =>
        index === self.findIndex((m) => (
          m.message_id === message.message_id
        ))
      );

      this.messages = this.messages.sort((a, b) => a.timestamp - b.timestamp);
      this.limitMessageArraySize();
      this.messagesListSubject.next(this.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  private async deleteMessageWebsocket(message_id: number): Promise<void>{
    try {
      this.messages = this.messages.filter((message) => message.message_id !== message_id);
      this.messagesListSubject.next(this.messages);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  private async updateMessageWebsocket(message_id: number, message: string, showAvatar: boolean, showTimestamp: boolean): Promise<void>{
    try {
      const index = this.messages.findIndex((message) => message.message_id === message_id);
      if(index === -1) throw new Error('Message not found.');

      this.messages[index].message = message;
      this.messages[index].showAvatar = showAvatar;
      this.messages[index].showTimestamp = showTimestamp;
      this.messagesListSubject.next(this.messages);
    } catch (error) {
      console.error('Error updating message:', error);
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
