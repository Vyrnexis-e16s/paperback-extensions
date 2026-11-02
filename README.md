# Paperback Extensions (0.9)

A maintained Paperback 0.9 source repository for manga, manhwa, manhua, webtoons, novels, and age-restricted titles. The build uses the public Paperback toolchain (`@paperback/toolchain` and `@paperback/types` 1.0.0-alpha.92), which is the same stack currently used by Inkdex and related 0.9 registries.

The intended client is TestFlight **0.9 (209)**. **0.9 (208)** remains a regression target. Later 0.9 builds are untested until the types package is checked again. Paperback 0.8 cannot install these bundles. Build 208 states that downgrading is unsupported.

## Installation

Once GitHub Pages is publishing this repository, open the following URL on the device and choose **Add Repository to Paperback**:

```
https://0xM44k.github.io/paperback-extensions/0.9/stable/
```

That path is the registry root: it must contain `versioning.json` and `index.html`. A `github.com/...` source URL will not be accepted by the app.

Until Pages is live, serve the local bundle on the same network as the phone:

```bash
npm ci
npm run bundle
npm run serve
```

Open the printed address and add the repository from that page. Details are in [docs/installation](docs/installation/README.md).

## Scope and status

417 unique sources are present after deduplication. 184 are classified for a general audience, 217 as mature / 18+, and 16 still lack a verified rating. Source identifiers follow upstream folder names so existing library rows continue to resolve when the original extension used the same ID. One documented collision is `ManhuaPlus_liliana` (`manhuaplus.org` versus `manhuaplus.com`).

Compilation, typechecking, identifier validation, and unit tests have passed. Live checks so far are limited to a small reachability sample. In-app verification on a TestFlight device is still pending. A successful compile is not treated as a successful read test.

Published types 1.0.0-alpha.92 expose `MangaInfo.contentType` as `'comic' | 'novel'` only. There is no documented webtoon field. Long-strip titles remain `comic`. Reader layout, Chapter Settings, and related 208/209 UI changes are handled by the app.

## Licence

The combined work is GPL-3.0-or-later because it includes Inkdex sources. MIT-licensed files remain MIT. Attribution is recorded in [NOTICE](NOTICE) and [LICENSES](LICENSES).
