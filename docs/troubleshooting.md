# Troubleshooting

| Symptom                              | Likely cause                                                      | What to do                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Repository does not appear           | Wrong base URL, 0.8 app, Pages not deployed                       | Confirm 0.9 (208/209) and the hosted `.../0.9/stable` URL                                                                   |
| Blank cover                          | Stale image URL or source down                                    | Reload Metadata. Do not replace with unrelated artwork                                                                      |
| Empty chapter list                   | Site changed, Cloudflare, or title removed                        | Retry later; if persistent, open a `broken-source` issue                                                                    |
| History row missing details          | App-side missing-details path (fixed in 209) or missing extension | Keep the row; reinstall the original source ID; do not reset iCloud                                                         |
| Adult source missing                 | App adult filter                                                  | Enable mature sources in Paperback settings. This repo does not hide ratings                                                |
| Cookie / login loop                  | Session required by the site                                      | Complete the site's own login or Cloudflare challenge. Do not bypass age gates                                              |
| JSON parse error on a source         | Cloudflare returned HTML, or the site API is down                 | Open Discover and tap the cloud button, then retry that source. This is not a broken `versioning.json`                      |
| Hostname could not be found          | DNS NXDOMAIN, a content filter, or a stale host                   | Adult DNS filters hide some hosts that still exist. Dead hosts are updated only when a replacement URL is verified          |
| Tracker / AniList / MAL not updating | This repository ships sources, not tracker extensions             | Install a Paperback 0.9 tracker repository separately. MangaDex still lists AniList / MAL / MangaUpdates IDs on title pages |
| Webtoon opens paginated              | No public webtoon field in types 1.0.0-alpha.92                   | Use reader layout settings in the app. Genre tag `Webtoon` is informational                                                 |

Never recommend deleting downloads or reinstalling Paperback as a first step.
