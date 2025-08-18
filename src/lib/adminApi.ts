// src/lib/adminApi.ts
type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  json?: any;
  formData?: FormData;
  headers?: Record<string, string>;
};

function getBearer(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Fetch do naszego Next API (proxy). */
async function frontendFetch<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = path.startsWith("/") ? path : `/${path}`;
  const headers: Record<string, string> = { Accept: "application/json", ...(opts.headers || {}) };

  // Dodaj Authorization: Bearer <token> z localStorage, jeśli jest.
  const token = getBearer();
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = {
    method: opts.method || "GET",
    headers,
    credentials: "include", // wyśle nasze cookies do /api/*
  };

  if (opts.formData) {
    init.body = opts.formData;
  } else if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.json);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) msg += `: ${j.message}`;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const adminApi = {
  // BRANDING – via proxy
  getBrand: () => frontendFetch("/api/admin/brand", { method: "GET" }),
  saveBrand: (payload: any) => frontendFetch("/api/admin/brand", { method: "POST", json: payload }),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    return frontendFetch("/api/admin/brand/logo", { method: "POST", formData: fd });
  },

  // (opcjonalnie zostaw to, co masz dla innych zasobów… ale dla brand używaj proxy)
};
