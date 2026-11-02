/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { basePbConfig } from "../_themes/mangastream/config";

let pbConfig = basePbConfig;

pbConfig.name = "Hentai20";
pbConfig.description = "Extension that pulls content from hentai20.io.";
pbConfig.icon = "icon.jpg";
pbConfig.contentRating = ContentRating.ADULT;

export default pbConfig;
