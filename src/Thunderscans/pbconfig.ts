/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { basePbConfig, customVersion } from "../_themes/mangastream/config";

let pbConfig = basePbConfig;

pbConfig.name = "Thunderscans";
pbConfig.description = "Extension that pulls content from en-thunderscans.com.";
pbConfig.version = customVersion({ increasePrerelease: 5 });

export default pbConfig;
