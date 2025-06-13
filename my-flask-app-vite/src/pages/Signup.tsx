import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
<<<<<<< HEAD
import { signup, verifyEmailCode, resendEmailVerificationCode, verifyPhoneCode, resendSmsVerificationCode } from '../utils/auth';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import GoogleAuthButton from '../components/GoogleAuthButton';
=======
import { signup, verifyEmailCode, resendEmailVerificationCode } from '../utils/auth';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
>>>>>>> origin/master

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [userEmailForVerification, setUserEmailForVerification] = useState('');
<<<<<<< HEAD
  const [userPhoneForVerification, setUserPhoneForVerification] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone' | null>(null);
=======
>>>>>>> origin/master
  const [showTransition, setShowTransition] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(\+27|0)[6-8][0-9]{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid South African phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // If this is the last input and a value was entered
    if (index === 5 && value) {
        // Wait a brief moment for the last digit to be visible
        setTimeout(() => {
            // Automatically submit the form
            const verificationCode = newOtp.join('');
            handleVerifyOtp(new Event('submit') as any, verificationCode);
        }, 100); // Small delay to ensure the last digit is visible
    } else if (value && index < 5) {
        // Auto-focus next input for other positions
      const nextInput = document.querySelector(`input[name=otp-${index + 1}]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[name=otp-${index - 1}]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      try {
        const result = await signup({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
        });

<<<<<<< HEAD
        if (result.success) {
          setSuccessMessage(result.message || 'Registration successful. Please verify your account.');
          setErrors({});
          setOtpError('');
          setShowOtpVerification(true);

          if (formData.email) {
            setVerificationMethod('email');
            setUserEmailForVerification(formData.email);
          } else {
            setVerificationMethod('phone');
            setUserPhoneForVerification(formData.phoneNumber);
          }
=======
        // Check for successful registration
        if (result.success) {
          setSuccessMessage(result.message || 'Registration successful. Please verify your email.');
          setUserEmailForVerification(formData.email);
          setShowOtpVerification(true);
          setErrors({});
          setOtpError('');
>>>>>>> origin/master
        } else {
          setErrors({ submit: result.message || 'Registration failed' });
        }
      } catch (error: any) {
<<<<<<< HEAD
=======
        console.error('Registration error:', error);
>>>>>>> origin/master
        setErrors({ 
          submit: error.response?.data?.error || error.response?.data?.message || 'An error occurred during registration' 
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent, code?: string) => {
    e.preventDefault();
    const verificationCode = code || otp.join('');
    
    if (verificationCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
<<<<<<< HEAD
      let result;
      if (verificationMethod === 'email') {
        result = await verifyEmailCode(userEmailForVerification, verificationCode);
      } else if (verificationMethod === 'phone') {
        result = await verifyPhoneCode(userPhoneForVerification, verificationCode);
      }

      if (result?.success) {
        toast.success(result.message);
        setSuccessMessage(result.message);
        setUserEmailForVerification('');
        setUserPhoneForVerification('');
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
          navigate('/login');
      } else {
        setOtpError(result?.message || 'Verification failed');
=======
      const result = await verifyEmailCode(userEmailForVerification, verificationCode);

      if (result.success) {
        toast.success(result.message);
        setSuccessMessage(result.message);
        setUserEmailForVerification('');
        setOtp(['', '', '', '', '', '']);
        setOtpError('');

            // Redirect to login page immediately after success
          navigate('/login');
      } else {
        setOtpError(result.message);
>>>>>>> origin/master
      }
    } catch (error: any) {
      setOtpError(error.response?.data?.error || error.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
<<<<<<< HEAD
=======
    if (!userEmailForVerification) return;

>>>>>>> origin/master
    setIsLoading(true);
    setOtpError('');
    setSuccessMessage('');

    try {
<<<<<<< HEAD
      let result;
      if (verificationMethod === 'email') {
        result = await resendEmailVerificationCode(userEmailForVerification);
      } else if (verificationMethod === 'phone') {
        result = await resendSmsVerificationCode(userPhoneForVerification);
      }
=======
      const result = await resendEmailVerificationCode(userEmailForVerification);
>>>>>>> origin/master
      if (result.success) {
        toast.success(result.message);
        setOtp(['', '', '', '', '', '']);
      } else {
        toast.error(result.message);
        setOtpError(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to resend code. Please try again.');
      setOtpError(error.response?.data?.error || error.response?.data?.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    setShowTransition(true);
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
<<<<<<< HEAD
    <PageTransition show={showTransition}>
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
=======
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      <PageTransition show={showTransition} />

>>>>>>> origin/master
      {/* Animated Coins Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, index) => (
          <div
            key={index}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full opacity-20 transform rotate-45" />
          </div>
        ))}
      </div>

      {/* Animated Savings Jar */}
      <div className="absolute top-10 right-10 w-32 h-40 animate-bounce-slow">
        <div className="relative w-full h-full">
          <div className="absolute bottom-0 w-full h-3/4 bg-blue-100 rounded-b-3xl border-2 border-blue-300">
            <div className="absolute inset-0 bg-blue-200 opacity-50 rounded-b-3xl animate-fill" />
          </div>
          <div className="absolute top-0 w-full h-1/4 bg-blue-200 rounded-t-3xl border-2 border-blue-300" />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center h-screen p-4">
        <div className="w-full max-w-[600px] bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6">
          <div className="mb-4 text-center">
            <button
              onClick={handleBackToHome}
              className="absolute top-4 left-4 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
<<<<<<< HEAD
                {showOtpVerification
                  ? verificationMethod === 'email'
                    ? 'Verify Your Email'
                    : 'Verify Your Phone Number'
                  : 'Create Your Account'}
            </h2>
            <p className="text-sm text-gray-600">
              {showOtpVerification 
                  ? verificationMethod === 'email'
                ? `Enter the 6-digit code sent to ${userEmailForVerification}`
                    : `Enter the 6-digit code sent to ${userPhoneForVerification}`
=======
              {showOtpVerification ? 'Verify Your Account' : 'Create Your Account'}
            </h2>
            <p className="text-sm text-gray-600">
              {showOtpVerification 
                ? `Enter the 6-digit code sent to ${userEmailForVerification}`
>>>>>>> origin/master
                : 'Join i-STOKVEL and start your savings journey'}
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {errors.submit && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {showOtpVerification ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    name={`otp-${index}`}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ))}
              </div>
              
              {otpError && (
                <p className="text-sm text-red-600 text-center">{otpError}</p>
              )}

              <div className="text-center text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  Resend
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Verifying...' : 'Verify Account'}
              </button>
            </form>
          ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 text-sm border ${
                    errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="+27 71 234 5678"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
<<<<<<< HEAD
              <GoogleAuthButton onClick={() => {
                window.location.href = 'http://127.0.0.1:5001/api/auth/google';
              }} />
=======
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
                  <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00"/>
                  <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.6055 17.5455 13.3575 18 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50"/>
                  <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
                </svg>
                Continue with Google
              </button>
              
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M17.5 2C19.9853 2 22 4.01472 22 6.5V17.5C22 19.9853 19.9853 22 17.5 22H6.5C4.01472 22 2 19.9853 2 17.5V6.5C2 4.01472 4.01472 2 6.5 2H17.5ZM17.5 3.5H6.5C4.84315 3.5 3.5 4.84315 3.5 6.5V17.5C3.5 19.1569 4.84315 20.5 6.5 20.5H17.5C19.1569 20.5 20.5 19.1569 20.5 17.5V6.5C20.5 4.84315 19.1569 3.5 17.5 3.5ZM12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11C8 8.79086 9.79086 7 12 7ZM12 8.5C10.6193 8.5 9.5 9.61929 9.5 11C9.5 12.3807 10.6193 13.5 12 13.5C13.3807 13.5 14.5 12.3807 14.5 11C14.5 9.61929 13.3807 8.5 12 8.5ZM6.5 17.5C6.5 16.1193 7.61929 15 9 15H15C16.3807 15 17.5 16.1193 17.5 17.5V18C17.5 18.8284 16.8284 19.5 16 19.5H8C7.17157 19.5 6.5 18.8284 6.5 18V17.5ZM9 16.5C8.17157 16.5 7.5 17.1716 7.5 18V18H16.5V18C16.5 17.1716 15.8284 16.5 15 16.5H9Z" fill="currentColor"/>
                </svg>
                Continue with Phone
              </button>
>>>>>>> origin/master
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
<<<<<<< HEAD
    </PageTransition>
=======
>>>>>>> origin/master
  );
};

export default Signup;