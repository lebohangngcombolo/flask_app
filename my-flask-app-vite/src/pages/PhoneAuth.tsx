import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendSmsVerificationCode, verifyPhoneCode, resendSmsVerificationCode, login } from '../utils/auth';
import { toast } from 'react-toastify';

const PhoneAuth: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'input' | 'verify' | 'password'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  // Helper to mask phone except last 4 digits
  const getMaskedPhone = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '';
    return `****${digits.slice(-4)}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('verify');
    setCodeSent(true);
    sendSmsVerificationCode(phone)
      .then(result => {
        if (!result.success) {
          toast.error(result.message || 'Failed to send verification code.');
        }
      })
      .catch(() => {
        toast.error('Failed to send verification code.');
      });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const values = value.split('').slice(0, 6);
      setOtp(values.concat(Array(6 - values.length).fill('')));
      if (values.length === 6) {
        setTimeout(() => {
          handleVerifyOtp(new Event('submit') as any, values.join(''));
        }, 100);
      }
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (index === 5 && value) {
      setTimeout(() => {
        handleVerifyOtp(new Event('submit') as any, newOtp.join(''));
      }, 100);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent, code?: string) => {
    e.preventDefault();
    const verificationCode = code || otp.join('');
    if (verificationCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }
    setVerifying(true);
    const result = await verifyPhoneCode(phone, verificationCode);
    if (result.success) {
      toast.success('Phone verified! Redirecting to login...');
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setTimeout(() => {
        setVerifying(false);
        navigate('/login');
      }, 2000);
    } else {
      setOtpError(result.message);
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setOtpError('');
    await resendSmsVerificationCode(phone);
    setOtp(['', '', '', '', '', '']);
    setCodeSent(true);
    setIsLoading(false);
  };

  const handleLoginAfterOtp = async (phone, password) => {
    const result = await login(phone, password);
    if (result.success) {
      // Store token is handled in your login util
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    const result = await login(phone, password); // Your login util must support phone+password
    if (result.success) {
      toast.success('Login successful! Redirecting...');
      navigate('/dashboard');
    } else {
      setLoginError(result.message || 'Login failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 animate-fade-in">
        <button
          onClick={() => navigate('/signup')}
          className="absolute top-4 left-4 text-gray-600 hover:text-blue-600 transition-colors duration-200"
          type="button"
          aria-label="Back to signup"
          title="Back to signup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {step === 'input' ? 'Continue with Phone' : 'Verify Your Phone'}
        </h2>
        {step === 'input' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
            >
              Send Verification Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="mb-2 text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded text-sm text-center">
              Verification code sent to phone ending in <b>{getMaskedPhone(phone)}</b>
            </div>
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  name={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/, '');
                    if (!value) return;
                    const newOtp = [...otp];
                    newOtp[index] = value;
                    setOtp(newOtp);
                    if (index < otp.length - 1) {
                      const nextInput = document.getElementById(`otp-${index + 1}`);
                      if (nextInput) (nextInput as HTMLInputElement).focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[index] && index > 0) {
                      const prevInput = document.getElementById(`otp-${index - 1}`);
                      if (prevInput) (prevInput as HTMLInputElement).focus();
                    }
                  }}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ))}
            </div>
            {otpError && <p className="text-sm text-red-600 text-center">{otpError}</p>}
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
            {verifying ? (
              <div className="flex flex-col items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-600">Verifying...</span>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm flex items-center justify-center"
              >
                Verify
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneAuth;
