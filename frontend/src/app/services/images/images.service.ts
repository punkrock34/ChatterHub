import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs/internal/lastValueFrom';

@Injectable({
  providedIn: 'root'
})
export class ImagesService {

  constructor(private http: HttpClient) { }

  async downloadProfilePicture(email: string | null): Promise<string | null> {
    if (!email) {
      return null;
    }

    const photoUrl = 'https://www.gravatar.com/avatar/' + email + '?d=identicon';

    try {
      const res: any = await lastValueFrom(this.http.get("/api/images/download-image", { params: { url: photoUrl } }));
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
      const res: any = await lastValueFrom(this.http.get("/api/images/check-image-exists", { params: { imagePath: imagePath } }));
      return res.imageExists || false;
    } catch (error) {
      console.error('Error checking if image exists:', error);
      return false;
    }
  }
}
