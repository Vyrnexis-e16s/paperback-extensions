/* SPDX-License-Identifier: GPL-3.0-or-later */

import { ContentRating, ExtensionInfo, SourceIntents } from "@paperback/types";

export default {
  name: "Saymanhwa",
  description: "Adult pornhwa source for saymanhwa.net.",
  version: "1.0.0",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.ADULT,
  capabilities: [
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  ],
  badges: [
    { label: "Adult", textColor: "#FFFFFF", backgroundColor: "#B71C1C" },
  ],
  developers: [{ name: "Vyrnexis-e16s" }],
} satisfies ExtensionInfo;
