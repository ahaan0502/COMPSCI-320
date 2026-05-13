import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isUmassEmail } from "@/app/lib/authUtils";
import { getSiteUrl } from "@/app/lib/siteUrl";

export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrl(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/", siteUrl));
  }

  const response = NextResponse.redirect(new URL("/classes", siteUrl));
  const redirectWithCookies = (location: string) => {
    const redirectResponse = NextResponse.redirect(
      new URL(location, siteUrl),
    );
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return redirectResponse;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          }),
      },
    },
  );

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
    );

    if (exchangeError) {
      console.error("Auth callback exchange failed:", exchangeError);
      return redirectWithCookies("/?error=oauth-failed");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirectWithCookies("/");
    }

    const email = user.email || "";

    if (!isUmassEmail(email)) {
      await supabase.auth.signOut();
      return redirectWithCookies("/?error=not-umass");
    }

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split("@")[0] ||
      "User";

    const { error: profileError } = await supabase.from("Users").upsert(
      {
        author_id: user.id,
        email,
        name,
        created_at: new Date().toISOString(),
      },
      { onConflict: "author_id" },
    );

    if (profileError) {
      console.error("Failed to upsert user profile:", profileError);
      return redirectWithCookies("/?error=db-error");
    }

    return redirectWithCookies("/classes");
  } catch (error) {
    console.error("Authentication callback failed:", error);
    return redirectWithCookies("/?error=oauth-failed");
  }
}
