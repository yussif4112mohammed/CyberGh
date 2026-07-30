'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in URL.');
      return;
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success || data.message === 'Email is already verified') {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error occurred during verification.');
      });
  }, [searchParams, router]);

  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-6">
        <div className="card p-10 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-navy-700 animate-spin mx-auto mb-6" />
              <h1 className="font-display font-bold text-2xl text-navy-950 mb-3">Verifying Email</h1>
              <p className="text-gray-500">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="font-display font-bold text-2xl text-navy-950 mb-3">Verification Successful!</h1>
              <p className="text-gray-500 mb-6">{message}</p>
              <p className="text-sm text-gray-400">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="font-display font-bold text-2xl text-navy-950 mb-3">Verification Failed</h1>
              <p className="text-gray-500 mb-6">{message}</p>
              <button onClick={() => router.push('/login')} className="btn-primary w-full justify-center">
                Return to Login
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
