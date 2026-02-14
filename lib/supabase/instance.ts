import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/types/supabase';

let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'draftdeckai',
        'x-application-version': '2.0.0'
      }
    }
  });
}

export function getSupabaseAdmin(forceNew = false): ReturnType<typeof createClient<Database>> {
  if (forceNew || !supabaseAdminInstance) {
    supabaseAdminInstance = createSupabaseClient();
  }
  return supabaseAdminInstance;
}

export function resetSupabaseAdmin() {
  supabaseAdminInstance = null;
}
