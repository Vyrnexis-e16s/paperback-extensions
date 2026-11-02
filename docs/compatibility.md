# Compatibility matrix

Inspected 2026-11-02.

| App build | Toolchain / types | Extension status |
| --- | --- | --- |
| Paperback 0.9 (209) TestFlight | `@paperback/types` and `@paperback/toolchain` **1.0.0-alpha.92** | Primary target. Device tests pending until a hosted registry is installed on a device. |
| Paperback 0.9 (208) TestFlight | 1.0.0-alpha.92 | Regression target. Same public extension API as 209 in the published types. |
| Paperback 0.8 App Store | 0.8 toolchain | Unsupported. 0.9 bundles will not install. |
| Later 0.9 betas | unreleased types | Unverified. A types bump must pass compile + unit + live + device tests before promotion. |

## App-managed 208/209 changes (no extension API)

These were checked against `paperback-toolchain` 0.9 @ `ff7972326d673446bfac8c568c0f6b29df7e6928` and are **not** implemented in extension code:

- Legacy reader removal
- Reader settings tabs and row-level change handling
- Comic / Novel reader settings, OLED theme, indent / max-width / two-column novel options
- Chapter Settings hierarchy (global / per-extension / per-title)
- Chapter list menu icons, iPhone Duo controls
- Photos WebP → HEIC/PNG export
- History / Downloads / New Chapters missing-details and crash fixes
- Cookie values containing `=` no longer dropped **by the app**

Extension obligations for those fixes: stable source/title/chapter IDs, accurate errors on metadata reload, do not truncate cookies, do not fabricate empty chapter lists.

## Webtoon metadata

`MangaInfo.contentType` is `'comic' | 'novel'` only. There is no published `isWebtoon` property in 1.0.0-alpha.92. See `src/common/webtoon.ts`.
