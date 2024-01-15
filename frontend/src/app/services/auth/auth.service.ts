import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, onAuthStateChanged } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImagesService } from '../images/images.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private imagesService: ImagesService, private snackBar: MatSnackBar) {
    this.checkAuth()
  }

  private async checkAuth(): Promise<void> {

    onAuthStateChanged(this.auth, (user) => {
      this.isLoggedInSubject.next((user) ? true : false);
      this.loadingSubject.next(false);
    });

  }

  async loginOrRegister(form: FormGroup): Promise<void> {
    try {
      const { email, password } = form.value;

      try {
        // Attempt to sign in
        await signInWithEmailAndPassword(this.auth, email, password);
        this.isLoggedInSubject.next(true);
      } catch (signInError: any) {
        if (signInError.code === 'auth/invalid-credential') {
            await this.registerUser(email, password);
        } else {
          console.error('Error signing in:', signInError);
          this.snackBar.open('Error signing in. Please try again.', 'Close', { duration: 5000 });
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      this.snackBar.open('Unexpected error. Please try again.', 'Close', { duration: 5000 });
    }
  }

  private async registerUser(email: string, password: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('User registered:', userCredential.user.uid);

      const user = userCredential.user;

      const photoUrl = await this.imagesService.downloadProfilePicture(email);
      const displayName = this.generateDisplayName(email);

      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoUrl
      });

      console.log('Profile updated:', user.displayName, user.photoURL);

      await sendEmailVerification(user);
      console.log('Verification email sent.');


      this.isLoggedInSubject.next(true);
    } catch (registrationError: any) {
      if(registrationError.code === 'auth/email-already-in-use'){
        console.log("Username or password is incorrect!");
        this.snackBar.open('Username or password is incorrect!', 'Close', { duration: 5000 });
      }else{
        console.error('Error registering user:', registrationError);
        this.snackBar.open('Error registering user. Please try again.', 'Close', { duration: 5000 });
      }
    }
  }

  private generateDisplayName(email: string): string {
    let displayName = email.split('@')[0];
    displayName = displayName.replace(/[\W_]+/g, ' ');
    displayName = displayName.replace(/\w\S*/g, (w: string) => w.replace(/^\w/, (c: string) => c.toUpperCase()));
    return displayName;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.isLoggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Add more methods as needed for authentication (login, logout, etc.)
}
