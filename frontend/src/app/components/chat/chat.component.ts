import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Auth, updateProfile } from '@angular/fire/auth';
import { faUser, faEllipsisV, faPaperPlane, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
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

  editingMessage: Message | null = null;

  faUser = faUser;
  faEllipsisV = faEllipsisV;
  faPaperPlane = faPaperPlane;
  faTimesCircle = faTimesCircle;

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

      const type = 'message';
      this.websocketService.sendMessage(type, message);

      this.messages.push(message);
      this.limitMessageArraySize();
      this.messagesListSubject.next(this.messages);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async deleteMessage(message: Message): Promise<void> {
    try {
      const index = this.messages.findIndex((m) => m.message_id === message.message_id);

      if (index === -1) {
        throw new Error('Message not found.');
      }

      const previousMessage = this.messages[index - 1];
      const nextMessage = this.messages[index + 1];
      let updatedMessage: Message | null = null;

      if (message.showAvatar) {
        if (previousMessage?.uid === message.uid && previousMessage?.timestamp - message.timestamp < 300000) {
          previousMessage.showAvatar = true;
          previousMessage.showTimestamp = false;
          updatedMessage = previousMessage;
        } else if (nextMessage?.uid === message.uid && message.timestamp - nextMessage?.timestamp < 300000) {
          nextMessage.showAvatar = true;
          nextMessage.showTimestamp = false;
          updatedMessage = nextMessage;
        }
      }

      const currentMessageId = message.message_id;

      this.messages.splice(index, 1);
      this.messagesListSubject.next(this.messages);

      await this.messagesService.deleteMessage(currentMessageId!);

      if (updatedMessage !== null) {
        await this.messagesService.updateMessage(updatedMessage.message_id!, updatedMessage.message, updatedMessage.showAvatar!,updatedMessage.showTimestamp!);
        this.websocketService.sendMessage('update', updatedMessage);
      }

      this.websocketService.sendMessage('delete', message);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  startEditing(message: Message): void {
    this.editingMessage = { ...message };
  }

  cancelEditing(): void {
    this.editingMessage = null;
  }

  async updateMessage(message: Message): Promise<void> {
    try {
      const index = this.messages.findIndex((m) => m.message_id === message.message_id);

      if (index === -1) {
        throw new Error('Message not found.');
      }

      if(message.message === null || message.message.trim().length === 0){
        throw new Error('Message cannot be empty.');
      }

      this.messages[index].message = message.message;

      await this.messagesService.updateMessage(message.message_id!, message.message, message.showAvatar!, message.showTimestamp!);
      this.websocketService.sendMessage('update', message);

      this.editingMessage = null;

    } catch (error) {
      console.error('Error updating message:', error);
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
