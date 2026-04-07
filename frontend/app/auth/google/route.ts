import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🔴 /auth/google route hit');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  console.log('🔴 OAuth data.url:', data?.url);
  console.log('🔴 OAuth error:', error);
  console.log('🔴 SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);

  if (error || !data.url) {
    return NextResponse.redirect(new URL('/?error=oauth-failed', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'));
  }

  return NextResponse.redirect(data.url);
}
