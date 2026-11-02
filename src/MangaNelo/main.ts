/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Mangabox } from "../_themes/mangabox/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://www.nelomanga.net";

class MangaNeloExtension extends Mangabox {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
    });
  }
}

export const MangaNelo = new MangaNeloExtension();
