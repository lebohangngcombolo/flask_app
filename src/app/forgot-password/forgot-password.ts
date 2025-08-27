import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../api';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  message = '';
  error = '';
  
  // Add Math property to fix template errors
  Math = Math;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  handleSubmit(event: Event) {
    event.preventDefault();
    this.onSubmit();
  }

  handleBackToHome() {
    this.router.navigate(['/']);
  }

  async onSubmit() {
    if (!this.email) {
      this.error = 'Please enter your email address';
      return;
    }

    this.loading = true;
    this.error = '';
    this.message = '';

    try {
      // Use resetPassword method instead of forgotPassword
      const response = await this.apiService.resetPassword(this.email).toPromise();
      this.message = 'Password reset instructions have been sent to your email.';
      this.email = '';
    } catch (err: any) {
      this.error = err.error?.message || 'Failed to send reset email. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
