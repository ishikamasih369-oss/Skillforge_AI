/**
 * Token Storage & Security Isolation Layer
 *
 * ARCHITECTURAL CONTEXT & SECURITY ANALYSIS:
 * -------------------------------------------
 * 1. Backend Contract:
 *    The existing FastAPI backend expects an `Authorization: Bearer <token>` header
 *    verified via FastAPI's `HTTPBearer` dependency.
 *
 * 2. Why HttpOnly Cookies would require backend changes:
 *    To implement fully secure HttpOnly cookies, the FastAPI backend must either:
 *    - Emit a `Set-Cookie: access_token=...; HttpOnly; SameSite=Lax; Path=/` response header upon login
 *    - Extract the token via `fastapi.Cookie(None)` rather than `HTTPBearer` in endpoints
 *    Alternatively, Next.js route handlers would have to act as a Backend-For-Frontend (BFF) proxy
 *    layer that receives HttpOnly cookies from the browser and forwards them as `Bearer` headers to FastAPI.
 *
 * 3. Security Trade-off (localStorage vs HttpOnly Cookies):
 *    - Trade-off: Storing tokens in client-accessible storage (localStorage / document.cookie) is
 *      vulnerable to Cross-Site Scripting (XSS). If malicious scripts are injected into the DOM,
 *      they can read the access token.
 *    - Mitigation in this phase: We isolate all token handling into this dedicated module.
 *      No components directly access storage. When the backend is updated with cookie support or a BFF
 *      proxy is deployed, only this adapter needs to be swapped.
 *    - In addition to localStorage, we mirror the token into a SameSite=Lax cookie (`sf_token`) to
 *      allow synchronous route checks if needed.
 */

const TOKEN_KEY = "skillforge_access_token";
const COOKIE_KEY = "sf_token";

let inMemoryToken: string | null = null;

export const tokenStorage = {
  /**
   * Retrieve the active JWT token.
   */
  getToken(): string | null {
    if (typeof window === "undefined") {
      return inMemoryToken;
    }

    try {
      const stored = window.localStorage.getItem(TOKEN_KEY);
      if (stored) return stored;
    } catch {
      // Fallback for sandboxed or private browsing environments
    }

    return inMemoryToken;
  },

  /**
   * Persist the active JWT token.
   */
  setToken(token: string): void {
    inMemoryToken = token;

    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      // Mirror to cookie for potential synchronous middleware inspection
      // 1-hour expiration matches the backend ACCESS_TOKEN_EXPIRE_MINUTES
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(token)}; path=/; max-age=3600; SameSite=Lax`;
    } catch {
      // Storage unavailable; keep in memory
    }
  },

  /**
   * Remove the active token on logout or session expiration.
   */
  removeToken(): void {
    inMemoryToken = null;

    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(TOKEN_KEY);
      document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    } catch {
      // Ignore cleanup error
    }
  },

  /**
   * Quick check for presence of token.
   */
  hasToken(): boolean {
    return Boolean(this.getToken());
  },
};
