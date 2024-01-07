import { Injectable } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Auth, updateProfile } from '@angular/fire/auth';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { GeneralService } from '../general/general.service';
import { from } from 'rxjs';

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

  faUser = faUser;

  constructor(private generalService: GeneralService, private auth: Auth) {
    from(this.generalService.getMessages(0, 100)).subscribe((messages: Message[]) => {
      this.messages = messages;
      console.log('Messages:', this.messages);
    });
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
    const displayName = user.displayName;
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
    const timestamp = Date.now();
    const showAvatar = uid !== lastMessage?.uid || timestamp - lastMessage?.timestamp > 300000;
    const showTimestamp = !showAvatar;

    var message = {
      uid: uid,
      displayName: displayName || 'Anonymous',
      photoURL: photoURL || null,
      timestamp: timestamp,
      message: newMessage,
      showAvatar: showAvatar,
      showTimestamp: showTimestamp,
    };

    this.messages.push(message);

    this.generalService.sendMessage(message);
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

