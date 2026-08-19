import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://apizqnknnmjqpqovlkux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaXpxbmtubm1qcXBxb3Zsa3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDk1OTAsImV4cCI6MjA4Mzg4NTU5MH0.6vCTm7Jb8c-FHxZRq06HseZBwecKLhBvRZ7bGFYK7a4";

// The totem kiosk is not a Supabase auth user. It proves its identity with a
// server-issued session token, sent on every request as `x-totem-token`.
// Row level security uses this header to authorise the kiosk, so the totem
// tables are no longer readable by anonymous visitors.
export const TOTEM_TOKEN_STORAGE_KEY = 'totem_session_token';

const readTotemToken = (): string => {
  try {
    return localStorage.getItem(TOTEM_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const totemToken = readTotemToken();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: totemToken ? { 'x-totem-token': totemToken } : {},
  },
});