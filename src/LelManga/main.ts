/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ContentRating } from "@paperback/types";
import { type CheerioAPI } from "cheerio";

import { MangaStreamGeneric } from "../_themes/mangastream/main";
import pbconfig from "./pbconfig";

const DOMAIN_NAME: string = "https://www.lelmanga.com";

class LelMangaExtension extends MangaStreamGeneric {
  domain = DOMAIN_NAME;
  name = pbconfig.name;
  contentRating: ContentRating = pbconfig.contentRating;

  override language = "🇫🇷";

  override mangaSelectorAuthor = "Autheur";
  override mangaSelectorArtist = "Artiste";

  override configureSections() {
    this.latestUpdatesSection.selectorFunc = ($: CheerioAPI) =>
      $("div.uta", $("h2:contains(Dernières Sorties)")?.parent()?.next());
    this.featuredSection.selectorFunc = ($: CheerioAPI) =>
      $("div.bsx", $("h2:contains(Top Managa Aujourd'hui)")?.parent()?.next());
  }
}

export const LelManga = new LelMangaExtension();
