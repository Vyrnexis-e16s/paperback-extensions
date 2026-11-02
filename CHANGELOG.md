# Changelog

## Unreleased — 0.9 (209) primary / 0.9 (208) regression

- Cloudflare challenge pages are detected from HTML body, not only the `cf-mitigated` header, so the Discover cloud button appears instead of a JSON parse crash.
- `ReadBlackCloverMangaOnline` now uses live `readblackclover.com` (`ww10.readblackclover.com` is NXDOMAIN). Other dead hosts are unchanged until a replacement URL is verified.

- Assembled **417** unique 0.9 adapters (34 same-site duplicates skipped; one ID rename: `ManhuaPlus_liliana` for manhuaplus.org). Bundled with `@paperback/toolchain` 1.0.0-alpha.92.
- Preserved upstream folder names as source IDs except documented collisions.
- Added cookie, webtoon-helper, error-classification, and migration unit tests.
- Added registry validation, rate-limited source-health checks, and GitHub Actions for CI / Pages / broken-source issues.
- Documented that `@paperback/types` 1.0.0-alpha.92 has no webtoon field and that library recovery cannot edit the app database.
