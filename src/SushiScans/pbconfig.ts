/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { basePbConfig, customVersion } from "../_themes/mangastream/config";

let pbConfig = basePbConfig;

pbConfig.name = "SushiScans";
pbConfig.description = "Extension that pulls content from sushiscan.net.";
pbConfig.version = customVersion({ increasePrerelease: 1 });

export default pbConfig;
