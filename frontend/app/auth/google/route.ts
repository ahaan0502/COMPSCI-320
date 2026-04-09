import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    console.error('Google sign-in failed to start:', error);
    redirect('/');
  }

  if (data.url) redirect(data.url);

  redirect('/');
}
