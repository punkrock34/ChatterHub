import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Message } from '../../interfaces/message';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor(private http: HttpClient) { }

  async downloadProfilePicture(email: string | null): Promise<string | null> {
    if (!email) {
      return null;
    }

    const photoUrl = 'https://www.gravatar.com/avatar/' + email + '?d=identicon';

    try {
      const res: any = await lastValueFrom(this.http.get("/api/download-image", { params: { url: photoUrl } }));
      return res.imagePath || null;
    } catch (error) {
      console.error('Error downloading profile picture:', error);
      return null;
    }
  }

  async checkImageExists(imagePath: string | null): Promise<boolean> {
    if (!imagePath) {
      return false;
    }

    try {
      const res: any = await lastValueFrom(this.http.get("/api/check-image-exists", { params: { imagePath: imagePath } }));
      return res.imageExists || false;
    } catch (error) {
      console.error('Error checking if image exists:', error);
      return false;
    }
  }

  async sendMessage(message: Message): Promise<void> {
    try {
      await lastValueFrom(this.http.post("/api/send-message", message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async getMessages(start: number, end: number): Promise<Message[]> {
    try {
      const res: any = await lastValueFrom(this.http.get("/api/get-messages", { params: { start: start, end: end } }));
      return res.messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }
}
