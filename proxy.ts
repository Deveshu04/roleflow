import { NextResponse, type NextRequest } from "next/server";
import { rejectRequest } from "@/lib/request-guard";

export function proxy(req: NextRequest) {
  const reason = rejectRequest(req.method, req.headers.get("host"), req.headers.get("origin"), req.headers.get("sec-fetch-site"));
  return reason ? NextResponse.json({ error: reason }, { status: 403 }) : NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
