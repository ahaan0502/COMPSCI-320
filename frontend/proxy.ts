import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        }),
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/classes/:path*', '/dashboard/:path*'],
};