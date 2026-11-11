import { NextResponse, type NextRequest } from "next/server";
import { gate, SESSION_FLAG } from "./lib/admin-gate";

export function proxy(req: NextRequest) {
  const to = gate(req.nextUrl.pathname, req.cookies.has(SESSION_FLAG));
  return to ? NextResponse.redirect(new URL(to, req.url)) : NextResponse.next();
}

// Pages only: /admin/api/* is forwarded to the backend (next.config.ts rewrites) and answers 401 on its own.
export const config = { matcher: ["/admin", "/admin/((?!api/).*)"] };
