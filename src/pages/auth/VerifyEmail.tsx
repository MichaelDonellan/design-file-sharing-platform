import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Check, X } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');
      
      if (!token || !email) {
        toast.error('No verification token or email found');
        setLoading(false);
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          email: email as string,
          type: 'signup',
          token,
        });

        if (error) throw error;

        toast.success('Email verified successfully!');
        setSuccess(true);
        navigate('/');
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Failed to verify email. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {loading ? 'Verifying email...' : success ? 'Email Verified!' : 'Verification Failed'}
          </h2>
          <div className="mt-4">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            ) : success ? (
              <Check className="h-12 w-12 text-green-500 mx-auto" />
            ) : (
              <X className="h-12 w-12 text-red-500 mx-auto" />
            )}
          </div>
          <p className="mt-4 text-gray-600">
            {loading ? 'Please wait while we verify your email...' : success ? 
              'Your email has been successfully verified. Redirecting to homepage...' :
              'Sorry, email verification failed. Please try registering again.'}
          </p>
        </div>
      </div>
    </div>
  );
}
