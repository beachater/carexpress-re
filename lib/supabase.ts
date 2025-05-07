// ✅ Updated supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdudalmvhmcindbmmwox.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkdWRhbG12aG1jaW5kYm1td294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTQ0NDUsImV4cCI6MjA1ODczMDQ0NX0.9AdeB7quF8hh0s61JB0aqQz8YfsZvn-HlBPi-Rl7xLw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Updated Sign Up function to remove email from profiles
export async function signUpWithEmail(email: string, password: string, role: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) return { error };

  const userId = data.user.id;

  // Insert minimal profile
  const { error: insertError } = await supabase.from('profiles').insert([
    { id: userId, role } // Full details to be updated after onboarding
  ]);
  if (insertError) return { error: insertError };

  return { error: null };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}