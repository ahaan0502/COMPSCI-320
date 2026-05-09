import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isHomePage = request.nextUrl.pathname === "/";

  const redirectWithCookies = (location: string) => {
    const redirectResponse = NextResponse.redirect(
      new URL(location, request.url),
    );
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return redirectResponse;
  };

  if (user && isHomePage) {
    return redirectWithCookies("/classes");
  }

  if (!user && !isHomePage) {
    return redirectWithCookies("/");
  }

  return response;
}

export const config = {
  matcher: ["/", "/classes/:path*", "/notes/:path*", "/catalogue/:path*"],
};
