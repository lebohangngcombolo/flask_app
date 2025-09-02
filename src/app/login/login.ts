import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GoogleLoginButtonComponent } from '../google-login-button/google-login-button';
import { AuthService } from '../auth';
import { ApiService } from '../api';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleLoginButtonComponent]
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  loading = false;
  show2FALogin = false;
  twoFAUserId: string | null = null;
  otp = '';
  isVerifying = false;
  
  // Pre-calculated random values for animations
  animatedItems: Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
  }> = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private api: ApiService
  ) {}

  ngOnInit() {
    // Pre-calculate random values to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.animatedItems = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      animationDelay: Math.random() * 5 + 's',
      animationDuration: (5 + Math.random() * 5) + 's'
    }));
  }

  async handleSubmit() {
    this.error = '';
    this.loading = true;

    if (!this.email || !this.password) {
      this.error = 'Email and password are required';
      this.loading = false;
      return;
    }

    try {
      console.log('Attempting login...');
      const result = await this.authService.login(this.email, this.password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, checking user role...');
        this.loading = false;
        
        // Get the current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        console.log('Current user:', currentUser);
        
        // Check user role and redirect accordingly
        if (currentUser.role === 'admin') {
          console.log('Admin user detected, redirecting to admin dashboard');
          this.router.navigate(['/admin']);
        } else {
          console.log('Regular user detected, redirecting to user dashboard');
          this.router.navigate(['/dashboard']);
        }
      } else {
        console.error('Login failed:', result.message);
        this.error = result.message || 'Login failed';
        this.loading = false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      this.error = err.message || 'An error occurred during login';
      this.loading = false;
    }
  }

  async login(email: string, password: string) {
    return await this.authService.login(email, password);
  }

  handleBackToHome() {
    this.router.navigate(['/']);
  }

  async handleVerify2FALogin() {
    this.isVerifying = true;
    try {
      const data = await this.api.verify2FALogin({
        user_id: String(this.twoFAUserId || ''),
        otp_code: this.otp,
      }).toPromise();
      localStorage.setItem('access_token', data.access_token);
      this.show2FALogin = false;
      
      // Check user role for 2FA login as well
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      this.error = 'Invalid or expired code';
    } finally {
      this.isVerifying = false;
    }
  }

  navigateToPhoneAuth() {
    this.router.navigate(['/phone-auth']);
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  navigateToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
