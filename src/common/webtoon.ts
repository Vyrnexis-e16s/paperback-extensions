/**
 * Webtoon classification against the published Paperback types.
 *
 * Inspected: @paperback/types 1.0.0-alpha.92
 * (Paperback-iOS/paperback-toolchain 0.9 @ ff7972326d673446bfac8c568c0f6b29df7e6928)
 *
 * MangaInfo.contentType is only `'comic' | 'novel'`. There is no documented
 * `isWebtoon` / `webtoon` field in that release. The 0.9 (208) changelog says
 * the app can respect extension-provided webtoon marks; until that field is
 * published in types, this helper only:
 *   - keeps contentType as `comic` for long-strip titles
 *   - attaches a `Webtoon` genre tag, matching MangaPlus in inkdex/general-extensions
 *
 * Do not invent additional MangaInfo properties.
 */

export type TitleContentType = "comic" | "novel";

export type WebtoonTag = { id: string; title: string };

export function contentTypeForTitle(
  kind: "paginated-manga" | "webtoon" | "novel",
): TitleContentType {
  return kind === "novel" ? "novel" : "comic";
}

export function webtoonGenreTag(): WebtoonTag {
  return { id: "webtoon", title: "Webtoon" };
}

export function shouldMarkWebtoon(kind: "paginated-manga" | "webtoon" | "novel"): boolean {
  return kind === "webtoon";
}
