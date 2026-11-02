import { CloudflareError, type Request, type Response } from "@paperback/types";

const IMAGE_OR_MEDIA = /^(image|video|audio|font|application\/octet-stream)\b/i;
const CF_HTML_RE =
  /cdn-cgi\/challenge-platform|cf-browser-verification|cf-challenge|just a moment|attention required!\s*\|\s*cloudflare|enable javascript and cookies to continue|cf-error-details/i;

function headerValue(headers: Record<string, string> | undefined, name: string): string {
  if (!headers) return "";
  const needle = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === needle) return String(value);
  }
  return "";
}

function decodePrefix(data: ArrayBuffer, maxBytes = 8192): string {
  const slice = data.byteLength > maxBytes ? data.slice(0, maxBytes) : data;
  return new TextDecoder("utf-8", { fatal: false }).decode(slice);
}

export function isCloudflareHtml(body: string): boolean {
  if (!body) return false;
  return CF_HTML_RE.test(body);
}

export function isCloudflareChallenge(
  response: Pick<Response, "status" | "headers">,
  data: ArrayBuffer,
): boolean {
  if (headerValue(response.headers, "cf-mitigated").toLowerCase() === "challenge") {
    return true;
  }

  const contentType = headerValue(response.headers, "content-type");
  if (IMAGE_OR_MEDIA.test(contentType)) {
    return false;
  }

  const body = decodePrefix(data);
  if (response.status === 403 && /recaptcha/i.test(body)) {
    return true;
  }
  return isCloudflareHtml(body);
}

export function cloudflareBypassError(
  bypassUrl: string,
  userAgent?: string,
  message?: string,
): CloudflareError {
  const origin = bypassUrl.replace(/\/+$/, "");
  return new CloudflareError(
    {
      url: origin,
      method: "GET",
      headers: {
        referer: `${origin}/`,
        origin,
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
    },
    message ?? "Cloudflare verification required. Use the cloud button in Discover.",
  );
}

export function parseJsonOrCloudflare<T>(
  response: Pick<Response, "status" | "headers">,
  data: ArrayBuffer,
  bypassUrl: string,
): T {
  if (isCloudflareChallenge(response, data)) {
    throw cloudflareBypassError(bypassUrl);
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(data).trim();
  if (!text || text.startsWith("<")) {
    throw new Error(
      "Source returned HTML instead of JSON. If a Cloudflare page appeared, use the cloud button in Discover.",
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Source returned invalid JSON.");
  }
}

export async function throwIfCloudflare(
  request: Request,
  response: Response,
  data: ArrayBuffer,
  bypassUrl?: string,
): Promise<void> {
  if (!isCloudflareChallenge(response, data)) return;
  throw cloudflareBypassError(bypassUrl ?? request.url, await Application.getDefaultUserAgent());
}
