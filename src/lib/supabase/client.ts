import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Shared singleton for client components -- mirrors the old src/lib/supabase.ts
// import shape (`import { supabase } from "@/lib/supabase/client"`), but now
// persists the session in cookies instead of localStorage so middleware.ts
// can read it server-side.
export const supabase = createClient();
