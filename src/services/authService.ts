import { supabase } from "../lib/supabaseClient";

/**
 * Send a magic link to the user's email
 */
export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
}

/**
 * Sign out the current user
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser() {
  return supabase.auth.getUser();
}
