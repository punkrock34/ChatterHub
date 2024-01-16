import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MessageAction } from '../../interfaces/message';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private newMessageActionSubject = new BehaviorSubject<MessageAction>({ type: '', message_id: null, message: null, showAvatar: null, showTimestamp: null });

  newMessageAction$ = this.newMessageActionSubject.asObservable();

  triggerMessageReceived(): void {
    this.newMessageActionSubject.next({ type: 'message', message_id: null, message: null, showAvatar: null, showTimestamp: null });
  }

  triggerMessageDeleted(message_id: number): void {
    this.newMessageActionSubject.next({ type: 'delete', message_id: message_id, message: null, showAvatar: null, showTimestamp: null });
  }

  triggerMessageUpdated(message_id: number, message: string, showAvatar: boolean, showTimestamp: boolean): void {
    this.newMessageActionSubject.next({ type: 'update', message_id: message_id, message: message, showAvatar: showAvatar, showTimestamp: showTimestamp });
  }
}
