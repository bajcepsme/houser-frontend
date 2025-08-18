import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "");

function buildAuthHeaders(req: NextRequest): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };

  const auth = req.headers.get("authorization");
  if (auth) h.Authorization = auth;

  const tokenCookie = req.cookies.get("token")?.value;
  if (!auth && tokenCookie) h.Authorization = `Bearer ${tokenCookie}`;

  const xsrf = req.cookies.get("XSRF-TOKEN")?.value;
  if (xsrf) h["X-XSRF-TOKEN"] = decodeURIComponent(xsrf);

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

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const url = `${API_BASE}/api/v1/admin/settings/logo`;
  const res = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(req),
    body: form, // UWAGA: bez Content-Type (boundary doda fetch)
  });
  return pipe(res);
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
