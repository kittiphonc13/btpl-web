import { useState } from 'react';
import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Custom hook for forms with Zod validation
 * Provides type-safe form handling with automatic validation
 */
export function useValidatedForm<T extends z.ZodType>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first validation
    ...options,
  });
}

/**
 * Hook for handling form submission with error handling
 */
export function useFormSubmission<T>() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleSubmit = async (
    submitFn: (data: T) => Promise<void>,
    data: T
  ) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await submitFn(data);
      setSubmitSuccess('Operation completed successfully');
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessages = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    handleSubmit,
    clearMessages,
  };
}


