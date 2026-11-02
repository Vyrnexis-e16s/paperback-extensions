# Summary

<!-- What changed and why. 1-3 sentences. -->

## Checklist

### Making changes

- [ ] Source IDs (folder names) are unchanged unless a collision is documented in `src/migration/compatibility-map.json`.
- [ ] Bumped the `version` value in `pbconfig.ts` for each modified extension.

### Testing changes

- [ ] `npm run conformance` passes.
- [ ] `npm test` passes.
- [ ] Bundled with `npm run bundle` and installed via the 0.9 homepage (`Add Repository to Paperback`) or `npm run serve`.

### Committing changes

- [ ] Commit messages follow `type(Scope): summary` (e.g. `fix(Toonily): ...`).
