import { NextRequest } from "next/server";

function getForwardedOrigin(headers: Headers) {
  const forwardedHost = headers.get("x-forwarded-host");

  if (!forwardedHost) {
    return null;
  }

  const forwardedProto = headers.get("x-forwarded-proto") || "https";

  return `${forwardedProto}://${forwardedHost}`;
}

export function getSiteUrl(request: Request | NextRequest) {
  return (
    getForwardedOrigin(request.headers) ||
    ("nextUrl" in request ? request.nextUrl.origin : null) ||
    new URL(request.url).origin
  );
}
