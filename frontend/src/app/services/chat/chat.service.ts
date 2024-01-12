import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private newMessageSubject = new BehaviorSubject<boolean>(false);

  newMessage$ = this.newMessageSubject.asObservable();

  triggerRefresh() {
    this.newMessageSubject.next(true);
  }
}
