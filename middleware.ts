import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Fire-and-forget — never block the page on tracking writes.
    recordVisit(user.id, request.nextUrl.pathname).catch(() => {});
  }

  return response;
}

async function recordVisit(userId: string, path: string) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("nurse_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return;

  const today = new Date().toISOString().slice(0, 10);

  await Promise.all([
    admin
      .from("nurse_activity_log")
      .upsert({ nurse_id: profile.id, activity_date: today }, { onConflict: "nurse_id,activity_date" }),
    admin.from("nurse_page_views").insert({ nurse_id: profile.id, path }),
  ]);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pathways/:path*",
    "/assessment",
    "/onboarding",
  ],
};
