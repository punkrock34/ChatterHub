import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { MessagesService } from '../../services/messages/messages.service';
import { BehaviorSubject } from 'rxjs';
import { faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent{
  currentUserUid: string = '';
  private messagesListSubject = new BehaviorSubject<any>(null);
  messagesList$ = this.messagesListSubject.asObservable();

  faUser = faUser;

  constructor(public authService: AuthService, public messagesService: MessagesService) {
    this.messagesListSubject.next(messagesService.getMessages());
  }

}
