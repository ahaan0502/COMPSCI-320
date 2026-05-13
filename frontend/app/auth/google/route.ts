import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from '@/app/lib/siteUrl';

export async function GET(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          }),
      },
    },
  );

  const siteUrl = getSiteUrl(request);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      skipBrowserRedirect: false,
    },
  });

  if (error || !data.url) {
    console.error('Google sign-in failed to start:', error);
    return NextResponse.redirect(new URL('/?error=oauth-failed', siteUrl));
  }

  const redirectResponse = NextResponse.redirect(data.url);
  response.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirectResponse.cookies.set(name, value, options);
  });
  return redirectResponse;
}
