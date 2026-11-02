/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Liliana } from "../_themes/liliana/main";
import pbconfig from "./pbconfig";

const MANGAKOMA_DOMAIN = "https://mangakoma.net";

export class MangaKomaExtension extends Liliana {
  constructor() {
    super({
      domain: MANGAKOMA_DOMAIN,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
    });
  }
}

export const MangaKoma = new MangaKomaExtension();
