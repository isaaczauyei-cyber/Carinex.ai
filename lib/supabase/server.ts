// lib/supabase/server.ts
// Use this in Server Components, Route Handlers (app/api/.../route.ts), and
// Server Actions — anything running on the server that needs the signed-in
// user's session (e.g. reading their nurse_profiles row).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
            // setAll called from a Server Component — safe to ignore if
            // middleware is refreshing sessions (see middleware.ts note below)
          }
        },
      },
    }
  );
}
