/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ContentRating } from "@paperback/types";
import { type BasicAcceptedElems, type CheerioAPI } from "cheerio";
import { type AnyNode } from "domhandler";

import { MangaStreamGeneric } from "../_themes/mangastream/main";
import pbconfig from "./pbconfig";

const DOMAIN_NAME = "https://en-thunderscans.com";

class ThunderscansExt extends MangaStreamGeneric {
  name: string = pbconfig.name;
  domain: string = DOMAIN_NAME;
  contentRating: ContentRating = pbconfig.contentRating;

  override directoryPath: string = "comics";

  override configureSections() {
    this.latestUpdatesSection.selectorFunc = ($: CheerioAPI) =>
      $("div.bsx", $("h2:contains(Latest Update)").parent().next());
    this.latestUpdatesSection.subtitleSelectorFunc = (
      $: CheerioAPI,
      element: BasicAcceptedElems<AnyNode>,
    ): string => $(element).find("a.maincl").first().text().trim();
  }
}

export const Thunderscans = new ThunderscansExt();
