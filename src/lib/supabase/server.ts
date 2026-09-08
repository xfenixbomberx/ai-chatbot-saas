import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// For use in Route Handlers and Server Components -- reads/writes the
// session from the request's cookies so auth.uid() resolves correctly
// under RLS for server-side queries made on a logged-in user's behalf.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component -- ignore, middleware
            // refreshes the session cookie on every request instead.
          }
        },
      },
    }
  );
}

// For routes that need to bypass RLS entirely (training ingestion, chat
// message logging, lead capture) -- always requires the real service-role
// key now; the old `|| ANON_KEY` fallback is gone because degrading to the
// anon key under RLS doesn't error, it just silently returns/writes nothing.
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Required now that RLS is enabled -- " +
        "get it from Supabase dashboard > Project Settings > API and add it to .env.local."
    );
  }

  // Service-role client doesn't need cookie/session wiring -- it authenticates
  // via the key itself and bypasses RLS.
  return createSupabaseJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}
