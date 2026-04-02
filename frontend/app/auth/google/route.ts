import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      skipBrowserRedirect: false,
    },
  });

  if (data.url) redirect(data.url);
}