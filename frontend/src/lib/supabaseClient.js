import { createClient } from '@supabase/supabase-js'

// The publishable key is safe to expose in frontend code - it has no
// special privileges by itself. Row Level Security (set up in Phase 2's
// SQL migration) is what actually restricts each user to their own rows.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
