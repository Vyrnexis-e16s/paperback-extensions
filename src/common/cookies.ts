/**
 * Cookie helpers aligned with Paperback 0.9 (209) behaviour.
 *
 * Build 209 stopped dropping cookie values that contain `=`. Extensions must
 * not truncate, rewrite, or drop those values. The app owns header
 * serialisation; this module only validates and classifies cookies for tests.
 */

export type CookieLike = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
};

export function assertCookiePreserved(cookie: CookieLike): CookieLike {
  if (!cookie.name) {
    throw new Error("cookie-name-missing");
  }
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
  };
}

export function serializeCookiePair(cookie: CookieLike): string {
  const preserved = assertCookiePreserved(cookie);
  return `${preserved.name}=${preserved.value}`;
}

export function serializeCookieHeader(cookies: CookieLike[]): string {
  return cookies.map(serializeCookiePair).join("; ");
}

export function parseCookieHeader(header: string): CookieLike[] {
  if (!header.trim()) return [];
  return header.split(";").map((part) => {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      return { name: trimmed, value: "" };
    }
    return {
      name: trimmed.slice(0, eq),
      value: trimmed.slice(eq + 1),
    };
  });
}
