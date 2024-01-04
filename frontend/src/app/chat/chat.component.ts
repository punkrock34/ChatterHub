import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { MessagesService } from '../messages.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent{
  currentUserUid: string = '';
  private messagesListSubject = new BehaviorSubject<any>(null);
  messagesList$ = this.messagesListSubject.asObservable();

  constructor(public authService: AuthService, public messagesService: MessagesService) {
    this.currentUserUid = this.authService.getUser().uid;
    this.messagesListSubject.next(messagesService.getMessages());
  }

}
