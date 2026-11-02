# Release and rollback

1. Land changes on `0.9/dev`.
2. CI must pass unit tests, ID validation, and bundle.
3. Run `npm run health` (rate-limited). Do not promote sources that fail live checks as "verified working".
4. Merge to `0.9/stable` only after review.
5. GitHub Pages publishes `bundles/` to `0.9/dev` or `0.9/stable` with `keep_files: true` so previous artifacts remain.
6. Record the git commit SHA in `reports/releases/` with the toolchain version.

Rollback: restore the previous commit on `0.9/stable` and re-run deploy, or copy the retained previous Pages directory back to `0.9/stable`. Do not force-push unless the repository owner explicitly requests it.
