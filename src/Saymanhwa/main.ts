/* SPDX-License-Identifier: GPL-3.0-or-later */

import {
  AdvancedSearchForm,
  BasicRateLimiter,
  Chapter,
  ChapterDetails,
  ChapterProviding,
  CloudflareBypassRequestProviding,
  ContentRating,
  Cookie,
  CookieStorageInterceptor,
  DiscoverSection,
  DiscoverSectionItem,
  DiscoverSectionProviding,
  DiscoverSectionType,
  Extension,
  MangaProviding,
  Metadata,
  PagedResults,
  PaperbackInterceptor,
  Request,
  Response,
  SearchQuery,
  SearchResultItem,
  SearchResultsProviding,
  SourceManga,
} from "@paperback/types";
import { throwIfCloudflare } from "../common/cloudflare";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import { SaymanhwaSearchForm, SaymanhwaSearchMeta } from "./forms";

const BASE_URL = "https://saymanhwa.net";
const LANG = "en";

interface SaymanhwaMetadata {
  page?: number;
}

class SaymanhwaInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      ...request.headers,
      referer: `${BASE_URL}/`,
      origin: BASE_URL,
      "user-agent": await Application.getDefaultUserAgent(),
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.5",
    };
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    await throwIfCloudflare(request, response, data, BASE_URL);
    return data;
  }
}

type SaymanhwaImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  CloudflareBypassRequestProviding &
  DiscoverSectionProviding;

export class SaymanhwaExtension implements SaymanhwaImplementation {
  requestManager = new SaymanhwaInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 2,
    bufferInterval: 1,
    ignoreImages: true,
  });

  async initialise(): Promise<void> {
    this.requestManager.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.globalRateLimiter.registerInterceptor();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "popular",
        title: "Popular",
        type: DiscoverSectionType.featured,
      },
      {
        id: "latest",
        title: "Latest Updates",
        type: DiscoverSectionType.simpleCarousel,
      },
    ];
  }

  async getAdvancedSearchForm(
    query: SearchQuery<Metadata>,
  ): Promise<AdvancedSearchForm> {
    const meta = query.metadata as
      | { searchMeta?: SaymanhwaSearchMeta }
      | undefined;
    return new SaymanhwaSearchForm(meta?.searchMeta);
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = (metadata as SaymanhwaMetadata | undefined)?.page ?? 1;
    const path = section.id === "latest" ? "latest" : "popular";
    const { items: listItems, hasNextPage } = await this.fetchList(
      `${BASE_URL}/${LANG}/${path}?page=${page}`,
    );

    const itemType =
      section.id === "latest" ? "simpleCarouselItem" : "featuredCarouselItem";
    const items: DiscoverSectionItem[] = listItems.map((it) => ({
      type: itemType,
      mangaId: it.mangaId,
      imageUrl: it.imageUrl,
      title: it.title,
      metadata: undefined,
    }));
    return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
  }

  async getSearchResults(
    query: SearchQuery<Metadata>,
    metadata: Metadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = (metadata as SaymanhwaMetadata | undefined)?.page ?? 1;
    const titleQuery = (query.title || "").trim();
    const searchMeta = (
      query.metadata as { searchMeta?: SaymanhwaSearchMeta } | undefined
    )?.searchMeta;

    const params: string[] = [`q=${encodeURIComponent(titleQuery)}`];
    const genre = searchMeta?.genre?.[0];
    if (genre) params.push(`genre=${encodeURIComponent(genre)}`);
    const chapters = searchMeta?.chapters?.[0];
    if (chapters) params.push(`chapters=${encodeURIComponent(chapters)}`);
    if (page > 1) params.push(`page=${page}`);

    const url = `${BASE_URL}/${LANG}/series?${params.join("&")}`;
    const $ = await this.fetchCheerio({ url, method: "GET" });

    if ($(".series-v72-layout").length > 0 || $("aside.series-left").length > 0) {
      const title = $("h1").first().text().trim();
      const imageUrl = this.absoluteUrl(
        $(".series-v72-cover img").first().attr("src") ||
          $("aside.series-left .cover-card img").first().attr("src") ||
          "",
      );
      return {
        items: [
          {
            mangaId: this.parsePath(url),
            imageUrl,
            title,
            subtitle: undefined,
            metadata: undefined,
          },
        ],
        metadata: undefined,
      };
    }

    const { items: listItems, hasNextPage } = this.parseList($);
    const items: SearchResultItem[] = listItems.map((it) => ({
      mangaId: it.mangaId,
      imageUrl: it.imageUrl,
      title: it.title,
      subtitle: undefined,
      metadata: undefined,
    }));
    return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
  }

  private async fetchList(url: string): Promise<{
    items: { mangaId: string; title: string; imageUrl: string }[];
    hasNextPage: boolean;
  }> {
    const $ = await this.fetchCheerio({ url, method: "GET" });
    return this.parseList($);
  }

  private parseList($: CheerioAPI): {
    items: { mangaId: string; title: string; imageUrl: string }[];
    hasNextPage: boolean;
  } {
    const items: { mangaId: string; title: string; imageUrl: string }[] = [];
    const seen = new Set<string>();

    $("article.series-card").each((_, element) => {
      const el = $(element);
      const coverLink = el.find("a.series-card-cover").first();
      const href =
        coverLink.attr("href") ||
        el.find("div.series-card-body h2 a").first().attr("href") ||
        "";
      const title = this.removeTitleRank(
        el.find("div.series-card-body h2 a").first().text().trim(),
      );
      if (!href || !title) return;
      const mangaId = this.parseMangaPath(href);
      if (seen.has(mangaId)) return;
      const img = coverLink.find("img").first();
      seen.add(mangaId);
      items.push({
        mangaId,
        title,
        imageUrl: this.absoluteUrl(
          img.attr("data-src") || img.attr("src") || "",
        ),
      });
    });

    if (items.length === 0) {
      $("article.popular-v73-card").each((_, element) => {
        const el = $(element);
        const href =
          el.find("a.popular-v73-cover").first().attr("href") ||
          el.find("a.popular-v73-title").first().attr("href") ||
          "";
        const title = this.removeTitleRank(
          el.find("a.popular-v73-title").first().text().trim(),
        );
        if (!href || !title) return;
        const img = el.find("a.popular-v73-cover img").first();
        const mangaId = this.parseMangaPath(href);
        if (seen.has(mangaId)) return;
        seen.add(mangaId);
        items.push({
          mangaId,
          title,
          imageUrl: this.absoluteUrl(
            img.attr("data-src") || img.attr("src") || "",
          ),
        });
      });
    }

    const hasNextPage =
      $("nav.pagination a[href*='page=']")
        .toArray()
        .some((el) => /next/i.test($(el).text())) ||
      $("a:contains(Next):not(.disabled)").length > 0;
    return { items, hasNextPage };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const url = this.mangaUrl(mangaId);
    const $ = await this.fetchCheerio({ url, method: "GET" });

    const title = $("h1").first().text().trim() || this.safeDecode(mangaId);
    const synopsis = $("div.series-v72-description").first().text().trim();
    const statusText = this.metaValue($, "Status");
    const typeText = this.metaValue($, "Type");
    const categoryText = this.metaValue($, "Category");
    const thumbnailUrl = this.absoluteUrl(
      $(".series-v72-cover img").first().attr("src") || "",
    );

    const altTitles = $("div.series-v72-alt")
      .first()
      .text()
      .split(/\s*\/\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.toLowerCase() !== title.toLowerCase());

    const tagTitles = [
      ...$("div.series-v72-genres a")
        .toArray()
        .map((el) => $(el).text().trim()),
      typeText,
      categoryText,
    ].filter((g, i, arr) => g.length > 0 && arr.indexOf(g) === i);

    const tagGroups =
      tagTitles.length > 0
        ? [
            {
              id: "genres",
              title: "Genres",
              tags: tagTitles.map((g) => ({
                id: g.toLowerCase().replace(/\s+/g, "-"),
                title: g,
              })),
            },
          ]
        : [];

    return {
      mangaId,
      mangaInfo: {
        primaryTitle: title,
        secondaryTitles: altTitles,
        thumbnailUrl,
        author: undefined,
        artist: undefined,
        synopsis,
        contentRating: ContentRating.ADULT,
        status: this.parseStatus(statusText),
        tagGroups,
        shareUrl: url,
      },
    };
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const url = this.mangaUrl(sourceManga.mangaId);
    const $ = await this.fetchCheerio({ url, method: "GET" });

    const chapters: Chapter[] = [];
    const seen = new Set<string>();
    $("a.series-v72-chapter-row").each((_, element) => {
      const el = $(element);
      const href = el.attr("href") || "";
      if (!href) return;
      const chapterId = this.parsePath(href);
      if (seen.has(chapterId)) return;
      seen.add(chapterId);
      const name =
        el.find(".series-chapter-number-text").first().text().trim() ||
        el.attr("data-chapter-number") ||
        "";
      const dateText =
        el.find("time.series-chapter-date").first().attr("datetime") ||
        el.find(".series-chapter-date").first().text().trim();

      chapters.push({
        chapterId,
        sourceManga,
        title: name,
        volume: 0,
        chapNum: this.parseChapterNumber(name),
        publishDate: this.parseDate(dateText),
        langCode: "🇬🇧",
      });
    });

    return chapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const url = this.chapterUrl(chapter.chapterId);
    const $ = await this.fetchCheerio({ url, method: "GET" });

    const pages: string[] = [];
    $("div.reader-pages > img").each((_, element) => {
      const el = $(element);
      const src = (el.attr("data-src") || el.attr("src") || "").trim();
      if (!src || src.startsWith("data:")) return;
      pages.push(this.absoluteUrl(src));
    });

    if (pages.length === 0) {
      throw new Error(
        "No readable pages. This chapter may require a Saymanhwa login or VIP subscription.",
      );
    }

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages,
    };
  }

  getMangaShareUrl(mangaId: string): string {
    return this.mangaUrl(mangaId);
  }

  private metaValue($: CheerioAPI, label: string): string {
    let value = "";
    $(".series-v72-meta span").each((_, el) => {
      if (value) return;
      const span = $(el);
      if (span.text().trim() !== label) return;
      const strong = span.parent().find("strong").first();
      if (strong.length > 0) value = strong.text().replace(/\s+/g, " ").trim();
    });
    return value;
  }

  private removeTitleRank(title: string): string {
    return title.replace(/^#\d+\s+/, "").trim();
  }

  private mangaUrl(mangaId: string): string {
    const slug = this.normalizeMangaPath(mangaId);
    if (slug.startsWith("http")) return slug;
    return `${BASE_URL}/${slug}`;
  }

  private chapterUrl(chapterId: string): string {
    const slug = this.safeDecode(chapterId).replace(/^\/+/, "");
    if (slug.startsWith("http")) return slug;
    if (slug.includes("/chapter-") || /\/chapter\/\d+/i.test(slug)) {
      return `${BASE_URL}/${slug.replace(/^en\//, `${LANG}/`)}`;
    }
    return `${this.mangaUrl(chapterId)}`;
  }

  private parseMangaPath(href: string): string {
    const path = this.parsePath(href).replace(/\/chapter-[^/]+$/i, "");
    return this.normalizeMangaPath(path);
  }

  private normalizeMangaPath(id: string): string {
    let slug = this.safeDecode(id).replace(/^\/+/, "").replace(/\/+$/, "");
    if (slug.startsWith("http")) {
      slug = slug.replace(/^https?:\/\/[^/]+\//, "");
    }
    slug = slug.replace(/^en\//, "");
    if (slug.startsWith("series/")) return `${LANG}/${slug}`;
    if (slug.startsWith(`${LANG}/series/`)) return slug;
    return `${LANG}/series/${slug}`;
  }

  private parsePath(href: string): string {
    const decoded = this.safeDecode(href);
    const cleaned = decoded.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/+$/, "");
    const slug = cleaned.startsWith("http")
      ? cleaned.replace(/^https?:\/\/[^/]+\//, "")
      : cleaned.replace(/^\/+/, "");
    return this.toSafeId(slug);
  }

  private toSafeId(slug: string): string {
    return slug.replace(/[^A-Za-z0-9._\-@()[\]%?#+=/&:]/g, (c) => {
      const enc = encodeURIComponent(c);
      if (enc !== c) return enc;
      return "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
    });
  }

  private safeDecode(id: string): string {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }

  private parseChapterNumber(name: string): number {
    const match = name.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : -1;
  }

  private absoluteUrl(src: string): string {
    const s = (src || "").trim();
    if (!s) return "";
    if (s.startsWith("http")) return s;
    if (s.startsWith("//")) return `https:${s}`;
    return s.startsWith("/") ? `${BASE_URL}${s}` : `${BASE_URL}/${s}`;
  }

  private parseStatus(status: string): string {
    const s = (status || "").toLowerCase();
    if (s.includes("ongoing")) return "Ongoing";
    if (s.includes("completed")) return "Completed";
    if (s.includes("hiatus")) return "Hiatus";
    return "Unknown";
  }

  private parseDate(dateText: string | undefined): Date {
    if (!dateText) return new Date(0);
    const d = new Date(dateText);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of this.cookieStorageInterceptor.cookies) {
      this.cookieStorageInterceptor.deleteCookie(cookie);
    }
    for (const cookie of cookies) {
      if (cookie.expires && cookie.expires.getTime() <= Date.now()) continue;
      this.cookieStorageInterceptor.setCookie(cookie);
    }
  }

  async fetchCheerio(request: Request): Promise<CheerioAPI> {
    const [response, data] = await Application.scheduleRequest(request);
    if (response.status === 404) {
      throw new Error("Content not found");
    }
    const htmlStr = Application.arrayBufferToUTF8String(data);
    return cheerio.load(htmlStr);
  }
}

export const Saymanhwa = new SaymanhwaExtension();
