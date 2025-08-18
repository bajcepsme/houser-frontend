import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "");

function buildAuthHeaders(req: NextRequest): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };

  // 1) Przekaż Authorization z przeglądarki (jeśli jest)
  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;

  // 2) Jeśli masz token w ciastku 'token', przełóż go na Authorization Bearer
  const tokenCookie = req.cookies.get("token")?.value;
  if (!auth && tokenCookie) h.Authorization = `Bearer ${tokenCookie}`;

  // 3) XSRF (np. Sanctum): przekaż nagłówek z cookie XSRF-TOKEN
  const xsrf = req.cookies.get("XSRF-TOKEN")?.value;
  if (xsrf) h["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);

  // 4) Przekaż WSZYSTKIE cookies klienta do backendu (sesja, itp.)
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) h["Cookie"] = cookieHeader;

  return h;
}

async function pipe(upstream: Response) {
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
    },
  });
}

export async function GET(req: NextRequest) {
  const url = `${API_BASE}/api/v1/admin/settings/brand`;
  const res = await fetch(url, { method: "GET", headers: buildAuthHeaders(req) });
  return pipe(res);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = `${API_BASE}/api/v1/admin/settings/brand`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...buildAuthHeaders(req), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return pipe(res);
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
