import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const PhoneLinking = ({ user, onPhoneLinked }) => {
  const [step, setStep] = useState('input'); // 'input', 'verify'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tempPhoneUserId, setTempPhoneUserId] = useState(null); // Track temp user for cleanup

  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Remove leading zeros if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    if (!phoneRegex.test(cleaned)) {
      throw new Error('Please enter a valid international phone number (e.g., +1234567890)');
    }

    return cleaned;
  };

  const handleLinkPhone = async (e) => {
    e.preventDefault();

    if (!phone) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate and format phone
      const formattedPhone = formatPhoneNumber(phone);

      // Step 1: Send OTP for verification FIRST
      console.log('Attempting to send OTP to:', formattedPhone);
      const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms'
        }
      });

      console.log('OTP Response:', { data: otpData, error: otpError });
      console.log('OTP Data structure:', JSON.stringify(otpData, null, 2));

      if (otpError) {
        console.error('OTP Error Details:', otpError);
        throw new Error(`Failed to send OTP: ${otpError.message}`);
      }

      // Track the temporary phone user ID for potential cleanup
      if (otpData && otpData.user && otpData.user.id) {
        setTempPhoneUserId(otpData.user.id);
        console.log('Tracking temp phone user for cleanup:', otpData.user.id);
      }

      console.log('OTP sent successfully to:', formattedPhone);

      setPhone(formattedPhone);
      setStep('verify');
      setCountdown(60);

      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setSuccess('Phone linked! Please verify with the OTP sent to your phone.');

    } catch (error) {
      console.error('Phone linking error:', error);
      if (error.response?.data?.conflict) {
        setError('This phone number is already linked to another account');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to link phone');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP
      const { data: verificationData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      console.log('Phone verified successfully');
      console.log('Verification data:', verificationData);

      // Step 2: Clean up temporary phone user created by OTP verification
      if (verificationData.user && verificationData.user.id) {
        try {
          await axios.post('http://localhost:5000/api/auth/cleanup-phone-user', {
            phone_user_id: verificationData.user.id
          });
          console.log('Cleaned up temporary phone user:', verificationData.user.id);
        } catch (cleanupError) {
          console.log('Could not clean up phone user:', cleanupError);
          // Continue anyway
        }
      }

      // Step 3: NOW link phone to account using admin API (after verification and cleanup)
      const linkResponse = await axios.post('http://localhost:5000/api/auth/manual-link-phone', {
        user_id: user.supabase_id,
        phone: phone
      });

      console.log('Phone linked successfully:', linkResponse.data);

      // Step 4: Mark phone as verified in backend
      await axios.post('http://localhost:5000/api/auth/verify-linked-phone', {
        user_id: user.supabase_id,
        phone: phone
      });

      setSuccess('Phone number successfully linked and verified!');

      // Call parent callback to refresh user data
      if (onPhoneLinked) {
        onPhoneLinked(phone);
      }

      // Reset form
      setTimeout(() => {
        setStep('input');
        setPhone('');
        setOtp('');
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Verification error:', error);
      setError(error.response?.data?.message || error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: 'sms'
        }
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    console.log('Back button clicked, phone:', phone);

    // Clean up any abandoned phone verification for this phone number
    if (phone) {
      console.log('Attempting to clean up abandoned phone verification for:', phone);
      try {
        const cleanupResponse = await axios.post('http://localhost:5000/api/auth/cleanup-abandoned-phone', {
          phone: phone
        });
        console.log('Cleanup response:', cleanupResponse.data);
        console.log('Cleaned up abandoned phone verification for:', phone);
      } catch (cleanupError) {
        console.error('Could not clean up abandoned phone verification:', cleanupError);
      }
    }

    setStep('input');
    setPhone('');
    setOtp('');
    setError('');
    setSuccess('');
    setTempPhoneUserId(null);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '20px',
        fontWeight: '600',
        color: '#212529'
      }}>
        {step === 'input' ? 'Link Phone Number' : 'Verify Phone Number'}
      </h3>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {step === 'input' ? (
        <form onSubmit={handleLinkPhone}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="+1234567890"
            />
            <small style={{
              display: 'block',
              marginTop: '4px',
              color: '#6c757d',
              fontSize: '12px'
            }}>
              Include country code (e.g., +1234567890)
            </small>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Linking Phone...' : 'Link Phone Number'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{
              margin: '0 0 16px 0',
              color: '#6c757d',
              fontSize: '14px'
            }}>
              Enter the code sent to {phone}
            </p>

            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setError('');
              }}
              required
              maxLength="6"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '18px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                boxSizing: 'border-box',
                textAlign: 'center',
                letterSpacing: '2px'
              }}
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '12px'
            }}
          >
            {loading ? 'Verifying...' : 'Verify Phone'}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={countdown > 0 || loading}
              style={{
                background: 'none',
                border: 'none',
                color: countdown > 0 ? '#6c757d' : '#007bff',
                fontSize: '14px',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                textDecoration: 'underline'
              }}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleBack}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#6c757d',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
};

export default PhoneLinking;