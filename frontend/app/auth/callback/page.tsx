'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleAuth = async () => {
      const hash = window.location.hash;

      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          console.log('Set session data:', data);
          console.log('Set session error:', error);

          if (data.user) {
            await supabase.from('Users').upsert({
              uuid: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name,
              created_at: new Date().toISOString(),
              UMass_verified: false,
            }, { onConflict: 'uuid' });

            router.push('/classes');
            return;
          }
        }
      }

      router.push('/landing');
    };

    handleAuth();
  }, [router]);

  return <p>Signing you in...</p>;
}