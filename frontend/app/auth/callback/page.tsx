'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      console.log('Session:', session);
      console.log('User:', session?.user);

      if (session?.user) {
        const user = session.user;

        const { data, error } = await supabase.from('Users').upsert({
          uuid: user.id,
          email: user.email,
          name: user.user_metadata?.full_name,
          created_at: new Date().toISOString(),
        }, { onConflict: 'uuid' });

        console.log('Upsert data:', data);
        console.log('Upsert error:', error);
      }
    });
  }, []);

  return <p>Check the console — not redirecting yet</p>;
}