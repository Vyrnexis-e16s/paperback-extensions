/* SPDX-License-Identifier: GPL-3.0-or-later */

import {
  AdvancedSearchForm,
  Section,
  SelectRow,
  type JSONObject,
} from "@paperback/types";

export interface SaymanhwaSearchMeta extends JSONObject {
  genre: string[];
  chapters: string[];
}

const GENRE_OPTIONS = [
  { id: "", title: "All" },
  { id: "action", title: "Action" },
  { id: "adult", title: "Adult" },
  { id: "adventure", title: "Adventure" },
  { id: "comedy", title: "Comedy" },
  { id: "drama", title: "Drama" },
  { id: "ecchi", title: "Ecchi" },
  { id: "fantasy", title: "Fantasy" },
  { id: "harem", title: "Harem" },
  { id: "historical", title: "Historical" },
  { id: "horror", title: "Horror" },
  { id: "isekai", title: "Isekai" },
  { id: "josei", title: "Josei" },
  { id: "martial-arts", title: "Martial Arts" },
  { id: "mature", title: "Mature" },
  { id: "milf", title: "Milf" },
  { id: "mystery", title: "Mystery" },
  { id: "ntr", title: "NTR" },
  { id: "psychological", title: "Psychological" },
  { id: "romance", title: "Romance" },
  { id: "school-life", title: "School Life" },
  { id: "sci-fi", title: "Sci-Fi" },
  { id: "seinen", title: "Seinen" },
  { id: "slice-of-life", title: "Slice of Life" },
  { id: "smut", title: "Smut" },
  { id: "supernatural", title: "Supernatural" },
  { id: "thriller", title: "Thriller" },
  { id: "tragedy", title: "Tragedy" },
  { id: "webtoon", title: "Webtoon" },
  { id: "yuri", title: "Yuri" },
];

const CHAPTER_OPTIONS = [
  { id: "", title: "All" },
  { id: "under50", title: "Under 50 chapters" },
  { id: "50-100", title: "50–100 chapters" },
  { id: "over100", title: "Over 100 chapters" },
];

export class SaymanhwaSearchForm extends AdvancedSearchForm {
  private genre: string[];
  private chapters: string[];

  constructor(initialMeta?: SaymanhwaSearchMeta) {
    super();
    this.genre = initialMeta?.genre ?? [];
    this.chapters = initialMeta?.chapters ?? [];
  }

  async updateGenre(value: string[]): Promise<void> {
    this.genre = value;
    this.reloadForm();
  }

  async updateChapters(value: string[]): Promise<void> {
    this.chapters = value;
    this.reloadForm();
  }

  getSearchQueryMetadata(): JSONObject {
    return {
      searchMeta: {
        genre: this.genre,
        chapters: this.chapters,
      } satisfies SaymanhwaSearchMeta,
    };
  }

  override getSections() {
    return [
      Section("filters", [
        SelectRow("genre", {
          title: "Genre",
          value: this.genre,
          options: GENRE_OPTIONS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as SaymanhwaSearchForm,
            "updateGenre",
          ),
        }),
        SelectRow("chapters", {
          title: "Chapters",
          value: this.chapters,
          options: CHAPTER_OPTIONS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as SaymanhwaSearchForm,
            "updateChapters",
          ),
        }),
      ]),
    ];
  }
}
