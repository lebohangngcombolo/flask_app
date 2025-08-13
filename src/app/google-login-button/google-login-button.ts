import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-google-login-button',
  templateUrl: './google-login-button.html',
  styleUrls: ['./google-login-button.scss'],
  standalone: true
})
export class GoogleLoginButtonComponent {
  @Input() text: string = 'Continue with Google';
  @Input() disabled: boolean = false;

  async handleGoogleLogin() {
    if (this.disabled) return;

    try {
      // For now, just show a placeholder implementation
      console.log('Google login clicked');
      
      // You can implement the actual Google OAuth flow here
      // For now, we'll just show a message
      alert('Google login functionality will be implemented here');
      
    } catch (error) {
      console.error('Google login error:', error);
    }
  }
}
