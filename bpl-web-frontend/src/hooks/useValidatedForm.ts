import { useState } from 'react';
import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodType } from 'zod';

/**
 * Custom hook for forms with Zod validation
 * Provides type-safe form handling with automatic validation
 */
export function useValidatedForm<T extends ZodType>(
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
export function useFormSubmission<T extends FieldValues>() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    submitFn: (data: T) => Promise<void>,
    data: T
  ) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await submitFn(data);
      setSubmitSuccess(true);
    } catch (error: any) {
      setSubmitError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessages = () => {
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  return { submitError, submitSuccess, handleSubmit, clearMessages, isSubmitting };
}
