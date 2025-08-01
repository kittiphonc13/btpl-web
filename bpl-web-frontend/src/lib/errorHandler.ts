/**
 * Safe Error Handling Library
 * Provides secure error handling that prevents information disclosure
 */

export class SafeError extends Error {
  public readonly userMessage: string;
  public readonly code: string;

  constructor(userMessage: string, code: string, originalError?: Error) {
    super(originalError?.message || userMessage);
    this.userMessage = userMessage;
    this.code = code;
    
    // Log original error for debugging (server-side only)
    if (typeof window === 'undefined' && originalError) {
      console.error(`[${code}]`, originalError);
    }
  }
}

/**
 * Handle authentication errors safely
 */
export function handleAuthError(error: any): SafeError {
  // Map Supabase errors to safe user messages
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please check your email and confirm your account',
    'Too many requests': 'Too many attempts. Please try again later',
    'User already registered': 'An account with this email already exists',
    'Signup disabled': 'Registration is currently disabled',
    'Email rate limit exceeded': 'Too many emails sent. Please try again later',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long',
    'Unable to validate email address: invalid format': 'Please enter a valid email address',
    'Database error saving new user': 'Registration failed. Please try again',
    'User not found': 'Invalid email or password',
    'Invalid email': 'Please enter a valid email address',
    'Weak password': 'Password is too weak. Please choose a stronger password',
  };

  const userMessage = errorMap[error.message] || 'Authentication failed. Please try again.';
  return new SafeError(userMessage, 'AUTH_ERROR', error);
}

/**
 * Handle validation errors safely
 */
export function handleValidationError(error: any): SafeError {
  if (error.name === 'ZodError') {
    const firstError = error.issues[0];
    return new SafeError(firstError.message, 'VALIDATION_ERROR', error);
  }
  
  return new SafeError('Invalid input. Please check your data.', 'VALIDATION_ERROR', error);
}

/**
 * Handle network errors safely
 */
export function handleNetworkError(error: any): SafeError {
  const networkErrors = [
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    'TypeError: Failed to fetch',
  ];

  const isNetworkError = networkErrors.some(msg => 
    error.message?.includes(msg) || error.name?.includes('Network')
  );

  if (isNetworkError) {
    return new SafeError(
      'Connection failed. Please check your internet connection and try again.',
      'NETWORK_ERROR',
      error
    );
  }

  return new SafeError('An unexpected error occurred. Please try again.', 'UNKNOWN_ERROR', error);
}

/**
 * Handle database/API errors safely
 */
export function handleDatabaseError(error: any): SafeError {
  const databaseErrors = [
    'duplicate key value',
    'foreign key constraint',
    'check constraint',
    'not null constraint',
    'unique constraint',
  ];

  const isDatabaseError = databaseErrors.some(msg => 
    error.message?.toLowerCase().includes(msg)
  );

  if (isDatabaseError) {
    return new SafeError(
      'Data operation failed. Please check your input and try again.',
      'DATABASE_ERROR',
      error
    );
  }

  return new SafeError('Server error occurred. Please try again later.', 'SERVER_ERROR', error);
}

/**
 * Generic error handler that routes to appropriate specific handlers
 */
export function handleError(error: any, context: 'auth' | 'validation' | 'network' | 'database' | 'general' = 'general'): SafeError {
  // If it's already a SafeError, return as-is
  if (error instanceof SafeError) {
    return error;
  }

  // Route to specific handlers based on context
  switch (context) {
    case 'auth':
      return handleAuthError(error);
    case 'validation':
      return handleValidationError(error);
    case 'network':
      return handleNetworkError(error);
    case 'database':
      return handleDatabaseError(error);
    default:
      return new SafeError(
        'An unexpected error occurred. Please try again.',
        'GENERAL_ERROR',
        error
      );
  }
}

/**
 * Log errors securely (for monitoring purposes)
 */
export function logError(error: SafeError, context?: Record<string, any>) {
  // Only log on server-side
  if (typeof window === 'undefined') {
    console.error(`[${error.code}] ${error.userMessage}`, {
      originalMessage: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Create user-friendly error messages for UI display
 */
export function formatErrorForUI(error: SafeError): {
  message: string;
  type: 'error' | 'warning' | 'info';
  code: string;
} {
  const severityMap: Record<string, 'error' | 'warning' | 'info'> = {
    'AUTH_ERROR': 'error',
    'VALIDATION_ERROR': 'warning',
    'NETWORK_ERROR': 'error',
    'DATABASE_ERROR': 'error',
    'SERVER_ERROR': 'error',
    'GENERAL_ERROR': 'error',
  };

  return {
    message: error.userMessage,
    type: severityMap[error.code] || 'error',
    code: error.code,
  };
}
