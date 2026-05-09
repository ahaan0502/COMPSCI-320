import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/app/lib/siteUrl';

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

  return NextResponse.redirect(data.url);
}
