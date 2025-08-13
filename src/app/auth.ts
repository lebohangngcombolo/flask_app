import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApiService, User } from './api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiService.login({ email, password }).toPromise();
      
      if (response.success) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.message || 'Login failed'
      };
    }
  }

  async signup(data: { full_name: string; email: string; phone_number: string; password: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiService.signup(data).toPromise();
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.message || 'Signup failed'
      };
    }
  }

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiService.verifyEmail({ email, verification_code: code }).toPromise();
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.message || 'Email verification failed'
      };
    }
  }

  async resendEmailVerification(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiService.resendEmailVerification({ email }).toPromise();
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.message || 'Failed to resend verification email'
      };
    }
  }

  async verifyPhone(phone: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiService.verifyPhone({ phone, verification_code: code }).toPromise();
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.message || 'Phone verification failed'
      };
    }
  }

  async resendEmailVerificationCode(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiService.resendEmailVerificationCode({ email }).toPromise();
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.message || 'Failed to resend email verification code'
      };
    }
  }

  async resendSmsVerificationCode(phone: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.apiService.resendSmsVerificationCode({ phone }).toPromise();
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.message || 'Failed to resend SMS verification code'
      };
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
