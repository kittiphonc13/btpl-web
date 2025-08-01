'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useValidatedForm, useFormSubmission } from '@/hooks/useValidatedForm';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { handleAuthError } from '@/lib/errorHandler';
import { authRateLimiter, delay, formatTimeRemaining } from '@/lib/rateLimiter';
import { useState } from 'react';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>('');

  // Use validated form with Zod schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useValidatedForm(loginSchema);

  // Use form submission hook for error handling
  const { submitError, submitSuccess, handleSubmit: handleFormSubmit, clearMessages } = useFormSubmission<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    // Check rate limiting before attempting login
    const rateLimitCheck = authRateLimiter.isRateLimited();
    if (rateLimitCheck.limited) {
      setIsRateLimited(true);
      setRateLimitMessage(`กรุณารอ ${formatTimeRemaining(rateLimitCheck.retryAfter!)} ก่อนลองใหม่`);
      return;
    }

    clearMessages();

    await handleFormSubmit(async () => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Record failed attempt
        const rateLimitResult = authRateLimiter.recordFailedAttempt();

        if (rateLimitResult.lockedOut) {
          setIsRateLimited(true);
          setRateLimitMessage('บัญชีถูกล็อกชั่วคราว 15 นาที เนื่องจากพยายาม login ผิดหลายครั้ง');
        } else if (rateLimitResult.shouldDelay) {
          setRateLimitMessage(`เหลือโอกาส ${rateLimitResult.attemptsRemaining} ครั้ง`);
          await delay(rateLimitResult.delayMs);
        }

        throw error;
      }

      // Record successful attempt (clears failed attempts)
      authRateLimiter.recordSuccessfulAttempt();
      setIsRateLimited(false);
      setRateLimitMessage('');

      if (authData.user) {
        router.push('/');
      }
    });
  };

  return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.email ? 'border-red-500' : ''
              }`}
              {...register('email')}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs italic mt-1">{errors.email.message}</p>
            )}
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.password ? 'border-red-500' : ''
              }`}
              {...register('password')}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs italic mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Display form submission errors */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {submitError}
            </div>
          )}

          {/* Display success messages */}
          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {submitSuccess}
            </div>
          )}

          {isRateLimited && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              {rateLimitMessage}
            </div>
          )}

          {rateLimitMessage && !isRateLimited && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              {rateLimitMessage}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting || isRateLimited}
              className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-blue-500 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>

            <a
              href="/register"
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            >
              New user? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
