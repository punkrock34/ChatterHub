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
      const { message_id } = await lastValueFrom(this.http.post<{ message_id: number }>("/api/messages/send-message", message));
      return message_id;
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

  async deleteMessage(message_id: number): Promise<number> {
    try {
      return await lastValueFrom(this.http.post<number>("/api/messages/delete-message", { message_id }));
    } catch (error) {
      console.error('Error deleting message:', error);
      return -1;
    }
  }

  async updateMessage(message_id: number, message: string, showAvatar: boolean, showTimestamp:boolean): Promise<number> {
    try {
      console.log("Updating message:", message);
      return await lastValueFrom(this.http.post<number>("/api/messages/update-message", { message_id, message, showAvatar, showTimestamp }));
    } catch (error) {
      console.error('Error updating message:', error);
      return -1;
    }
  }
}
