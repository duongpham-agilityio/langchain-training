import { isAuthApiError } from '@supabase/supabase-js';

const INVALID_CREDENTIALS_MESSAGE =
  "That email and password don't match. Try again, or reset your password.";

export const getSignInErrorMessage = (error: unknown): string => {
  if (isAuthApiError(error) && error.code === 'invalid_credentials') {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
};
