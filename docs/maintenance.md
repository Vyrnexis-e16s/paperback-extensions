# Maintenance

When a new Paperback beta ships:

1. Read the official changelog.
2. Diff `@paperback/types` against 1.0.0-alpha.92.
3. If a webtoon field is added, use that field and retire the genre-tag helper only where the new API is verified.
4. Run `npm ci`, `npm test`, `npm run tsc`, `npm run bundle`.
5. Run permitted live health checks.
6. Device-test on the new build before calling it compatible.
7. Update `docs/compatibility.md`.

When a website breaks:

1. Source-health opens a `broken-source` issue.
2. Verify against saved fixtures first, then a single live title.
3. Fix selectors or mark the source temporarily unavailable.
4. Do not drop it from the registry silently.
5. Bump only that extension's `pbconfig` version.

Do not auto-declare future app versions compatible.
