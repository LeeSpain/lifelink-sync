import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mqroziggaalltuzoyyao.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcm96aWdnYWFsbHR1em95eWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTIwOTIsImV4cCI6MjA2OTQ2ODA5Mn0.B8RH5FtncIduK9XTRNnsMn1PeScam2MFIvqjdOKO6Ds";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
