'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const redirectTo = (path: string) => {
  window.location.replace(path);
};

export default function AuthCallback() {
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const syncUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        redirectTo('/');
        return;
      }

      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User';

      const { error } = await supabase.from('Users').upsert({
        author_id: user.id,
        email: user.email,
        name,
        created_at: new Date().toISOString(),
      }, { onConflict: 'author_id' });

      if (error) {
        console.error('Failed to upsert user profile:', error);
      }

      redirectTo('/classes');
    };

    const handleAuth = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const hash = window.location.hash ? new URLSearchParams(window.location.hash.substring(1)) : null;
      const accessToken = hash?.get('access_token');
      const refreshToken = hash?.get('refresh_token');

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          await syncUserProfile();
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          await syncUserProfile();
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await syncUserProfile();
          return;
        }

        redirectTo('/');
      } catch (error) {
        console.error('Authentication callback failed:', error);
        setMessage('Sign-in failed. Redirecting...');
        redirectTo('/');
      }
    };

    handleAuth();
  }, []);

  return <p>{message}</p>;
}
