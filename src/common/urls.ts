export function normalizeHttpUrl(input: string): string {
  const url = new URL(input)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("unsupported-url-protocol")
  }
  url.hash = ""
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "")
  }
  return url.toString()
}

export function hostOf(input: string): string {
  const host = new URL(input).hostname.toLowerCase()
  return host.startsWith("www.") ? host.slice(4) : host
}

export function sameSite(a: string, b: string): boolean {
  return hostOf(a) === hostOf(b)
}
