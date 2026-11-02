/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { basePbConfig, customVersion } from "../_themes/mangastream/config";

let pbConfig = basePbConfig;

pbConfig.name = "Rage Scans";
pbConfig.description = "Extension that pulls content from ragescans.com.";
pbConfig.version = customVersion({ increasePrerelease: -4 });

export default pbConfig;
