# Legacy library, history, and downloads

Extensions cannot read or rewrite Paperback's private library database. 0.9 (209) improved loading of titles that are missing details; that is an **app** fix.

## What this repository can do

- Keep upstream folder names as source IDs so existing Inkdex / PaperbackExt / Netsky library entries continue to resolve when the same ID is reused.
- Record unavoidable ID changes in `src/migration/compatibility-map.json`.
- Refresh title metadata (cover, description, chapters) through the normal extension APIs when the user opens the title or uses Reload Metadata.
- Surface classified errors instead of empty fake data.

## What this repository cannot do

- Relink a title whose source ID was removed and never mapped.
- Restore downloads whose files were already deleted by the app or iOS.
- Edit iCloud sync data.
- Merge two series because their names look similar.
- Recover a library by downgrading (208 forbids it).

## Safe relinking workflow

1. Do not delete the app, history, downloads, or iCloud data.
2. Install this repository **in addition to** the previous one if you still need the old IDs.
3. Open a broken title. If Reload Metadata works, keep the record.
4. If the source ID changed, check `src/migration/compatibility-map.json`. Install the listed current extension and add the title again from that source. Reading progress for the new ID is a new library row unless the app provides an official migrate action.
5. If the website is gone, keep local downloads and treat the remote as discontinued.

## Upstream limitation

A scoped feature request for official library migration belongs on [Paperback-iOS/app](https://github.com/Paperback-iOS/app/issues). Extensions cannot implement that themselves.
