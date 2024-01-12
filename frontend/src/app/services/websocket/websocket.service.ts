import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Message } from '../../interfaces/message';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChatService } from '../chat/chat.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$!: WebSocketSubject<any>;
  private sentWelcomeMessage: boolean = false;

  constructor(private snackBar: MatSnackBar, private chatService: ChatService) {
    this.sentWelcomeMessage = localStorage.getItem('sentWelcomeMessage') === 'true';
    this.socket$ = new WebSocketSubject("ws://localhost:3001");

    this.socket$.subscribe({
      next: (message) => {
        if (message.type === 'notification') {
          if (message.welcome && this.sentWelcomeMessage) {
            return;
          }

          if (message.welcome && !this.sentWelcomeMessage) {
            this.snackBar.open(message.message, 'Close', { duration: 5000 });
            this.sentWelcomeMessage = true;
            localStorage.setItem('sentWelcomeMessage', 'true');
          } else {
            this.snackBar.open(message.message, 'Close', { duration: 5000 });
          }
        }else if (message.type === 'message') {
          this.chatService.triggerRefresh();
        }
      },
      error: (err) => console.error('Error: ', err),
      complete: () => console.warn('Completed!')
    });
  }

  sendMessage(type: string, message: Message) {
    this.socket$.next({ type, message });
  }

  sendRegistrationMessage(type: string, user: any) {
    this.socket$.next({ type, user });
  }
}
