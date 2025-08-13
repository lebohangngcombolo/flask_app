import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GoogleLoginButtonComponent } from '../google-login-button/google-login-button';
import { AuthService } from '../auth';

// Password strength types
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

// Password requirement interface
interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

// Errors interface
interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleLoginButtonComponent]
})
export class SignupComponent implements OnInit {
  // Pre-calculated animated items to avoid ExpressionChangedAfterItHasBeenCheckedError
  animatedItems: Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
  }> = [];

  formData = {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  };

  errors: FormErrors = {};
  isLoading = false;
  successMessage = '';
  showOtpVerification = false;
  otp = ['', '', '', '', '', ''];
  otpError = '';
  userEmailForVerification = '';
  userPhoneForVerification = '';
  verificationMethod: 'email' | 'phone' | null = null;
  showTransition = false;
  
  // Password visibility states
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength: PasswordStrength = 'weak';
  showPasswordStrength = false;

  // Resend functionality states
  resendCountdown = 0;
  resendMessage = '';

  // Password requirements
  passwordRequirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (password: string) => password.length >= 8,
      met: false
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      test: (password: string) => /[A-Z]/.test(password),
      met: false
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      test: (password: string) => /[a-z]/.test(password),
      met: false
    },
    {
      id: 'number',
      label: 'One number',
      test: (password: string) => /\d/.test(password),
      met: false
    },
    {
      id: 'special',
      label: 'One special character',
      test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
      met: false
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
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

  // Calculate password strength
  calculatePasswordStrength(password: string): PasswordStrength {
    if (password.length === 0) return 'weak';
    
    let score = 0;
    
    // Length contribution
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety contribution
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Bonus for mixed case and numbers
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'fair';
    if (score <= 6) return 'good';
    if (score <= 8) return 'strong';
    return 'very-strong';
  }

  // Update password requirements
  updatePasswordRequirements(password: string) {
    this.passwordRequirements = this.passwordRequirements.map(req => ({
      ...req,
      met: req.test(password)
    }));
  }

  // Get strength info with modern styling
  getStrengthInfo(strength: PasswordStrength) {
    switch (strength) {
      case 'weak':
        return { 
          color: 'text-red-600', 
          bgColor: 'bg-red-500', 
          borderColor: 'border-red-200',
          bgLight: 'bg-red-50',
          label: 'Too weak', 
          progress: 20,
          icon: '❌'
        };
      case 'fair':
        return { 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-500', 
          borderColor: 'border-orange-200',
          bgLight: 'bg-orange-50',
          label: 'Fair', 
          progress: 40,
          icon: '⚠️'
        };
      case 'good':
        return { 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-500', 
          borderColor: 'border-yellow-200',
          bgLight: 'bg-yellow-50',
          label: 'Good', 
          progress: 60,
          icon: '🔶'
        };
      case 'strong':
        return { 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-500', 
          borderColor: 'border-blue-200',
          bgLight: 'bg-blue-50',
          label: 'Strong', 
          progress: 80,
          icon: '🔒'
        };
      case 'very-strong':
        return { 
          color: 'text-green-600', 
          bgColor: 'bg-green-500', 
          borderColor: 'border-green-200',
          bgLight: 'bg-green-50',
          label: 'Very strong', 
          progress: 100,
          icon: '⚡'
        };
      default:
        return { 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-500', 
          borderColor: 'border-gray-200',
          bgLight: 'bg-gray-50',
          label: 'Weak', 
          progress: 0,
          icon: '❌'
        };
    }
  }

  handleChange(field: keyof typeof this.formData, value: string) {
    this.formData[field] = value;
    
    // Update password strength and requirements when password changes
    if (field === 'password') {
      const strength = this.calculatePasswordStrength(value);
      this.passwordStrength = strength;
      this.updatePasswordRequirements(value);
      this.showPasswordStrength = value.length > 0;
    }
    
    // Clear errors when user starts typing
    if (this.errors[field]) {
      this.errors[field] = '';
    }
  }

  validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!this.formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!this.formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(this.formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!this.formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(this.formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!this.formData.password) {
      newErrors.password = 'Password is required';
    } else if (this.formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (this.passwordStrength === 'weak') {
      newErrors.password = 'Please choose a stronger password';
    }

    if (!this.formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (this.formData.password !== this.formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    this.errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  handleOtpChange(index: number, value: string) {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // Handle paste event - distribute the pasted value across boxes
      const pastedValue = numericValue.slice(0, 6); // Take only first 6 digits
      const newOtp = [...this.otp];
      
      // Fill current and subsequent boxes with pasted digits
      for (let i = 0; i < pastedValue.length && index + i < 6; i++) {
        newOtp[index + i] = pastedValue[i];
      }
      
      this.otp = newOtp;
      
      // Focus the next empty box or the last box
      const nextIndex = Math.min(index + pastedValue.length, 5);
      const nextInput = document.querySelector(`input[name="otp-${nextIndex}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    } else {
      // Single digit input
      const newOtp = [...this.otp];
      newOtp[index] = numericValue;
      this.otp = newOtp;
      
      // Move to next input if a digit was entered
      if (numericValue && index < 5) {
        const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
    
    this.otpError = '';
  }

  handleOtpKeyDown(index: number, event: KeyboardEvent) {
    // Handle backspace
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const newOtp = [...this.otp];
      newOtp[index - 1] = '';
      this.otp = newOtp;
      
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  handleOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericText = pastedText.replace(/[^0-9]/g, '').slice(0, 6);
    
    if (numericText.length > 0) {
      const newOtp = [...this.otp];
      for (let i = 0; i < numericText.length && i < 6; i++) {
        newOtp[i] = numericText[i];
      }
      this.otp = newOtp;
      
      // Focus the next empty box or the last box
      const nextIndex = Math.min(numericText.length, 5);
      const nextInput = document.querySelector(`input[name="otp-${nextIndex}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  async handleSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errors = {};

    try {
      // Fix property names to match the API interface
      const signupData = {
        full_name: this.formData.fullName,
        email: this.formData.email,
        phone_number: this.formData.phoneNumber,
        password: this.formData.password
      };
      
      const result = await this.authService.signup(signupData);
      
      if (result.success) {
        this.userEmailForVerification = this.formData.email;
        this.userPhoneForVerification = this.formData.phoneNumber;
        this.verificationMethod = 'email';
        this.showOtpVerification = true;
        this.successMessage = 'Account created successfully! Please check your email for verification code.';
      } else {
        this.errors = { submit: result.message };
      }
    } catch (error: any) {
      this.errors = { submit: 'Signup failed. Please try again.' };
    } finally {
      this.isLoading = false;
    }
  }

  async handleVerifyOtp(code?: string) {
    const verificationCode = code || this.otp.join('');
    
    if (verificationCode.length !== 6) {
      this.otpError = 'Please enter the 6-digit verification code';
      return;
    }

    this.isLoading = true;
    this.otpError = '';

    try {
      let result;
      if (this.verificationMethod === 'email') {
        result = await this.authService.verifyEmail(this.userEmailForVerification, verificationCode);
      } else if (this.verificationMethod === 'phone') {
        result = await this.authService.verifyPhone(this.userPhoneForVerification, verificationCode);
      }

      if (result && result.success) {
        this.showOtpVerification = false;
        this.router.navigate(['/login']);
      } else {
        this.otpError = result?.message || 'Verification failed. Please try again.';
      }
    } catch (error: any) {
      this.otpError = 'Verification failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async handleResendCode() {
    this.isLoading = true;
    this.otpError = '';
    this.successMessage = '';
    this.resendMessage = '';

    try {
      let result;
      if (this.verificationMethod === 'email') {
        result = await this.authService.resendEmailVerificationCode(this.userEmailForVerification);
      } else if (this.verificationMethod === 'phone') {
        result = await this.authService.resendSmsVerificationCode(this.userPhoneForVerification);
      }
      
      if (result && result.success) {
        // Show success message
        this.resendMessage = 'New verification code sent successfully!';
        this.otp = ['', '', '', '', '', ''];
        
        // Start countdown timer (30 seconds)
        this.resendCountdown = 30;
        const timer = setInterval(() => {
          this.resendCountdown--;
          if (this.resendCountdown <= 0) {
            clearInterval(timer);
          }
        }, 1000);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.resendMessage = '';
        }, 3000);
      } else {
        this.otpError = result?.message || 'Failed to resend code. Please try again.';
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to resend code. Please try again.';
      this.otpError = errorMessage;
    } finally {
      this.isLoading = false;
    }
  }

  handleBackToHome() {
    this.showTransition = true;
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 500);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  get strengthInfo() {
    return this.getStrengthInfo(this.passwordStrength);
  }

  get allRequirementsMet() {
    return this.passwordRequirements.every(req => req.met);
  }
}
