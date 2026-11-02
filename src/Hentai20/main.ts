/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ContentRating } from "@paperback/types";

import { MangaStreamGeneric } from "../_themes/mangastream/main";
import pbconfig from "./pbconfig";

const DOMAIN_NAME: string = "https://hentai20.io";

class Hentai20Extension extends MangaStreamGeneric {
  domain = DOMAIN_NAME;
  name = pbconfig.name;

  contentRating: ContentRating = pbconfig.contentRating;
}

export const Hentai20 = new Hentai20Extension();
