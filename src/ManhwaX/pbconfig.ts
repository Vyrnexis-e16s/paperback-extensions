/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { basePbConfig, customVersion } from "../_themes/mangastream/config";

let pbConfig = basePbConfig;

pbConfig.name = "ManhwaX";
pbConfig.description = "Extension that pulls content from manhwax.top.";
pbConfig.version = customVersion({ increasePrerelease: 3 });
pbConfig.icon = "icon.jpg";
pbConfig.contentRating = ContentRating.ADULT;

export default pbConfig;
