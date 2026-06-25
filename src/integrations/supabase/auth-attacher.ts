// src/integrations/supabase/auth-attacher.ts
import { createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'

export function attachAuth(event: any) {
  // Simple implementation
  console.log('Auth attached to event:', event)
  return {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null })
  }
}

// Also export as default if needed
export default attachAuth
