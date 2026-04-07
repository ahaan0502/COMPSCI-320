'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

function isUmassEmail(email: string) {
  return email.trim().toLowerCase().endsWith('@umass.edu');
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleUser = async (user: User) => {
  const email = user.email || '';
  console.log('1. handleUser called with:', email);
  if (!isUmassEmail(email)) {
    console.log('2. NOT a UMass email, signing out...');
    await supabase.auth.signOut();
    router.replace('/?error=not-umass');
    return;
  }

  console.log('3. IS a UMass email, upserting...');

  const { error } = await supabase.from('Users').upsert(
    {
      uuid: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'uuid' }
  );

  if (error) {
    console.error('4. Upsert error:', error);
    router.replace('/?error=db-error');
    return;
  }

  console.log('5. Upsert successful, redirecting to /classes...');
  router.replace('/classes');
};

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await handleUser(session.user);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await handleUser(session.user);
        }
      });

      cleanup = () => subscription.unsubscribe();
    };

    init();

    return () => cleanup?.();
  }, [router]);

  return <p>Signing you in...</p>;
}