/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Liliana } from "../_themes/liliana/main";
import pbconfig from "./pbconfig";

const RAW1001_DOMAIN = "https://raw1001.net";

export class Raw1001Extension extends Liliana {
  constructor() {
    super({
      domain: RAW1001_DOMAIN,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
    });
  }
}

export const Raw1001 = new Raw1001Extension();
