import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Message } from '../../interfaces/message';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  constructor(private http: HttpClient) { }

  async sendMessage(message: Message): Promise<number> {
    try {
      return await lastValueFrom(this.http.post<number>("/api/messages/send-message", message));
    } catch (error) {
      console.error('Error sending message:', error);
      return -1;
    }
  }

  async getMessages(start: number, end: number): Promise<Message[]> {
    try {
      const res: any = await lastValueFrom(this.http.get("/api/messages/get-messages", { params: { start: start, end: end } }));
      return res.messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }
}
