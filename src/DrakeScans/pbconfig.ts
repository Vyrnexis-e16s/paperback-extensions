/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { basePbConfig, customVersion } from "../_themes/mangastream/config";

let pbConfig = basePbConfig;

pbConfig.name = "Drake Scans";
pbConfig.description = "Extension that pulls content from drakecomic.org.";
pbConfig.version = customVersion({ increasePrerelease: 1 });

export default pbConfig;
