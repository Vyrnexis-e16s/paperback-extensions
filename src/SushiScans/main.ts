/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type TagSection,
  type Chapter,
  type ChapterDetails,
  type ContentRating,
} from "@paperback/types";
import { type CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";

import { getUsePostIds } from "../_themes/mangastream/forms";
import { MangaStreamGeneric } from "../_themes/mangastream/main";
import pbconfig from "./pbconfig";

const DOMAIN_NAME = "https://sushiscan.net";

const normalizeChapterId = (id: string) => id.replace(/[-\s]/g, "").toLowerCase();

class SushiScansExt extends MangaStreamGeneric {
  name: string = pbconfig.name;
  domain: string = DOMAIN_NAME;
  contentRating: ContentRating = pbconfig.contentRating;

  override directoryPath = "catalogue";
  override language = "fr";
  override mangaTagSelectorBox = "div.seriestugenre";
  override mangaSelectorArtist = "Dessinateur";
  override mangaSelectorAuthor = "Auteur";
  override mangaSelectorStatus = "Statut";

  override mangaStatusTypes = {
    ONGOING: "En Cours",
    COMPLETED: "Terminé",
  };

  override dateMonths = {
    january: "janvier",
    february: "février",
    march: "mars",
    april: "avril",
    may: "mai",
    june: "juin",
    july: "juillet",
    august: "août",
    september: "septembre",
    october: "octobre",
    november: "novembre",
    december: "décembre",
  };

  override async getSearchTags(): Promise<TagSection[]> {
    const tags = await super.getSearchTags();
    return tags.map((section) => ({
      ...section,
      tags: section.tags.map((tag) => ({
        ...tag,
        id: tag.id.replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
      })),
    }));
  }

  override async getChapterDetails(chap: Chapter): Promise<ChapterDetails> {
    const [_, buffer] = await Application.scheduleRequest({
      url: getUsePostIds()
        ? `${this.domain}/?p=${chap.sourceManga.mangaId}/`
        : `${this.domain}/${this.directoryPath}/${chap.sourceManga.mangaId}/`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    const chapter = $("div#chapterlist li")
      .toArray()
      .find(
        (x) =>
          normalizeChapterId($(x).attr("data-num") ?? "") === normalizeChapterId(chap.chapterId),
      );

    if (!chapter) throw new Error(`Chapter not found: ${chap.chapterId}`);

    const url = $("a", chapter).attr("href");
    if (!url) throw new Error(`No URL for chapter: ${chap.chapterId}`);

    const [_r, _b] = await Application.scheduleRequest({ url, method: "GET" });
    return this.parser.parseChapterDetails(
      cheerio.load(Application.arrayBufferToUTF8String(_b)),
      chap,
    );
  }

  override configureSections() {
    this.featuredSection.selectorFunc = ($: CheerioAPI) => $("div.bsx", $("div.popularslider"));
    this.latestUpdatesSection.selectorFunc = ($: CheerioAPI) =>
      $("div.bsx", $("h2:contains(Dernières Sorties)")?.parent()?.next());
  }
}

export const SushiScans = new SushiScansExt();
