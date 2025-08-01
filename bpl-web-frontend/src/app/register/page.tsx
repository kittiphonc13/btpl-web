'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { registerSchema, type RegisterFormData } from '@/lib/validation';
import { useValidatedForm, useFormSubmission } from '@/hooks/useValidatedForm';
import { handleAuthError } from '@/lib/errorHandler';
import { authRateLimiter, delay, formatTimeRemaining } from '@/lib/rateLimiter';
import { useState } from 'react';

export default function Register() {
  const router = useRouter();
  
  // Use validated form with Zod schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useValidatedForm(registerSchema);

  // Use form submission hook for error handling
  const { submitError, submitSuccess, handleSubmit: handleFormSubmit, clearMessages } = useFormSubmission<RegisterFormData>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>('');

  const onSubmit = async (data: RegisterFormData) => {
    clearMessages();
    
    await handleFormSubmit(async (formData) => {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          throw handleAuthError(error);
        }
        
        if (authData.user) {
          // Show success message and redirect to login after a delay
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error: any) {
        if (error instanceof SafeError) {
          throw error;
        }
        throw handleAuthError(error);
      }
    }, data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
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
          
          <div className="mb-4">
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
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs italic mt-1">{errors.password.message}</p>
            )}
            
            {/* Password strength indicator */}
            {watch('password') && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Password strength:</div>
                <div className="flex space-x-1">
                  <div className={`h-1 w-1/4 rounded ${
                    watch('password').length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-1 w-1/4 rounded ${
                    /[A-Z]/.test(watch('password')) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-1 w-1/4 rounded ${
                    /[a-z]/.test(watch('password')) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`h-1 w-1/4 rounded ${
                    /\d/.test(watch('password')) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Must contain: 8+ chars, uppercase, lowercase, number
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirmPassword"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.confirmPassword ? 'border-red-500' : ''
              }`}
              {...register('confirmPassword')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs italic mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          {/* Display form submission errors */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {submitError}
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
          
          {/* Display success messages */}
          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Registration successful! Please check your email for verification.
              <br />
              <span className="text-sm">Redirecting to login page in 3 seconds...</span>
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
              {isSubmitting ? 'Creating Account...' : 'Register'}
            </button>
            
            <a
              href="/login"
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            >
              Already have an account? Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
