import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuth()
  }

  private async checkAuth(): Promise<void> {
    // Set loading to true before making the request
    this.loadingSubject.next(true);

    //try to get user from firebase auth
    try{
      const user = this.auth.currentUser;
      this.isLoggedInSubject.next((user) ? true : false);
    }
    catch(err){
      this.isLoggedInSubject.next(false);
    }
    finally{
      this.loadingSubject.next(false);
    }
  }

  async loginOrRegister(form: FormGroup): Promise<void> {
    try {
      this.loadingSubject.next(true);

      const { email, password } = form.value;

      try {
        // Attempt to sign in
        await signInWithEmailAndPassword(this.auth, email, password);
        this.isLoggedInSubject.next(true);
        console.log(this.auth.currentUser);
      } catch (signInError: any) {
        if (signInError.code === 'auth/invalid-credential') {

          try{
            // Attempt to register
            await this.registerUser(email, password);
          }catch(registerError: any){
            if(registerError.code === 'auth/email-already-in-use'){
              console.error('Invalid credentials. Please try again.');
            }else{
              console.error('Unexpected error:', registerError);
            }
          }

        } else {
          console.error('Error signing in:', signInError);
        }
      } finally {
        this.loadingSubject.next(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async registerUser(email: string, password: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const photoUrl = await this.downloadProfilePicture(email);
      const displayName = this.generateDisplayName(email);

      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoUrl
      });

      console.log('Profile updated successfully!');
      this.isLoggedInSubject.next(true);
    } catch (registrationError) {
      console.error('Error registering user:', registrationError);
    }
  }

  private generateDisplayName(email: string): string {
    let displayName = email.split('@')[0];
    displayName = displayName.replace(/[\W_]+/g, ' ');
    displayName = displayName.replace(/\w\S*/g, (w: string) => w.replace(/^\w/, (c: string) => c.toUpperCase()));
    return displayName;
  }

  private async downloadProfilePicture(email: string): Promise<string> {
    const photoUrl = 'https://www.gravatar.com/avatar/' + email + '?d=identicon';

    try {
      const res: any = await this.http.get("/api/download-image", { params: { url: photoUrl } }).toPromise();
      return res.imagePath || '';
    } catch (error) {
      console.error('Error downloading profile picture:', error);
      return '';
    }
  }

  async logout(): Promise<void> {
    this.loadingSubject.next(true);
    await signOut(this.auth);
    this.isLoggedInSubject.next(false);
    this.loadingSubject.next(false);
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Add more methods as needed for authentication (login, logout, etc.)
}
