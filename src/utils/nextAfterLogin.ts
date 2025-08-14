// src/utils/nextAfterLogin.ts
export function rememberNext(url?: string) {
  try {
    const target =
      url ??
      (typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/");
    sessionStorage.setItem("nextAfterLogin", target);
  } catch {}
}

export function popNext(): string | null {
  try {
    const v = sessionStorage.getItem("nextAfterLogin");
    if (v) sessionStorage.removeItem("nextAfterLogin");
    return v || null;
  } catch {
    return null;
  }
}