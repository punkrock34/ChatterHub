import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, delay } from 'rxjs';
import { NgForm } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '/api/auth';
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<any>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true); // Set to true initially
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  user$ = this.userSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuth();
  }

  private async checkAuth(): Promise<void> {
    this.http.get(`${this.apiUrl}/check-auth`).subscribe({
      next: (response: any) => {
        const { authenticated, user } = response;
        this.isLoggedInSubject.next(authenticated);
        this.userSubject.next(user);
        setTimeout(() => this.loadingSubject.next(false), 500);
        console.log(authenticated ? 'User is logged in: ' + user.uid : 'User is not logged in');
      },
      error: (error) => {
        // Handle authentication error
        this.isLoggedInSubject.next(false);
        this.userSubject.next(null);
        setTimeout(() => this.loadingSubject.next(false), 500);
        console.error('Authentication error:', error);
      },
    });
  }

  loginOrRegister(form: NgForm): void {
    // Set loading to true before making the request
    this.loadingSubject.next(true);

    const { email, password } = form.value;
    this.http.post(`${this.apiUrl}/login-or-register`, { email, password }).subscribe({
      next: (response: any) => {
        const { user } = response;
        this.isLoggedInSubject.next(true);
        this.userSubject.next(user);
        setTimeout(() => this.loadingSubject.next(false), 500);
        console.log('User logged in:', user);
      },
      error: (error) => {
        // Handle authentication error
        const errorCode = error.error.errorCode;
        this.isLoggedInSubject.next(false);
        this.userSubject.next(null);
        setTimeout(() => this.loadingSubject.next(false), 500);
        console.error('Authentication error:', errorCode);
      },
    });
  }

  logout(): void {
    // Set loading to true before making the request
    this.loadingSubject.next(true);

    this.http.get(`${this.apiUrl}/logout`).subscribe({
      next: (response: any) => {
        this.isLoggedInSubject.next(false);
        this.userSubject.next(null);
        setTimeout(() => this.loadingSubject.next(false), 500);
        console.log('User logged out');
      },
      error: (error) => {
        // Handle authentication error
        this.isLoggedInSubject.next(false);
        this.userSubject.next(null);
        setTimeout(() => this.loadingSubject.next(false), 500);
        console.error('Authentication error:', error);
      },
    });
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  getUser(): any {
    return this.userSubject.value;
  }

  // Add more methods as needed for authentication (login, logout, etc.)
}
