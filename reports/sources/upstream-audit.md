# Upstream audit

Inspection date: 2026-11-02. SHAs from `git ls-remote` / cloned `HEAD`.

## Source-code repositories copied

| Repository | Branch | HEAD | License | Role |
| --- | --- | --- | --- | --- |
| inkdex/template-extensions | 0.9/stable | `e9f09c86b42702ee574316d0a552c2a595409452` | GPL-3.0 | Scaffold |
| inkdex/general-extensions | 0.9/stable | `97bc477134e489804652e619933c5d6f1903744c` | GPL-3.0 | Unique-site adapters |
| inkdex/madara-extensions | 0.9/stable | `3b123d33ee4fba9c53d752caae5bee6953b18f7b` | GPL-3.0 | Madara family |
| inkdex/mangastream-extensions | 0.9/stable | `056b68fbf0a465eca24b6a71e8ba0de290f34f48` | GPL-3.0 | MangaStream/MangaReader family |
| inkdex/mangabox-extensions | 0.9/stable | `cdfd2518f9f5b0497f445ac99ee32fa6c515475f` | GPL-3.0 | MangaBox family |
| inkdex/mangaworld-extensions | 0.9/stable | `d83d9890bac3baf43dbcaa10f9ab6d14446c2795` | GPL-3.0 | MangaWorld family |
| inkdex/liliana-extensions | 0.9/stable | `06e6ec6e3de8d68d9521a90361bfab74b33db6b7` | GPL-3.0 | Liliana family |
| TheNetsky/netskys-extensions | 0.9 | `4a370e1c91681d10fce8f53d52308e0d88c33486` | MIT | 0.9 source is Mitaku only |
| Nicartjay/PaperbackExt | 0.9/stable | `a6ef7b8f4f96b37327ab27429fdea7f9e5d8a658` | MIT | Keiyoushi conversions; unique IDs kept |

## Toolchain and types

| Repository | Branch | HEAD | Notes |
| --- | --- | --- | --- |
| Paperback-iOS/paperback-toolchain | 0.9 | `ff7972326d673446bfac8c568c0f6b29df7e6928` | `@paperback/types` and `@paperback/toolchain` **1.0.0-alpha.92** |
| inkdex/paperback-toolchain | 0.9 | `555872cee0d32e4ac90b9c2e4cc8e981063a082c` | Inkdex fork; not used as the pinned dependency |

`MangaInfo.contentType` is `'comic' \| 'novel'`. No `webtoon` field in this types release.

## Registry / documentation (not copied as source)

| Repository | Default branch | HEAD | Kind |
| --- | --- | --- | --- |
| ThomasQTruong/inkdex-extensions | master | `94d84a98cc724ed07c6f1f9bed7e7b288c299aa5` | Compiled registry |
| inkdex/extensions | master | `287471c937dd173b1d29ce50e8f376f00e4cea95` | Compiled registry |
| inkdex.github.io/installation | n/a | live 2026-11-02 | Docs. Install URL `https://inkdex.github.io/extensions/0.9/stable` is upstream-only |
| Paperback-iOS/app | master | `0cf96f8658c25a01605175859c5c68e4e46e46f1` | Issues/releases, not the closed-source app |
| Paperback-iOS/website | master | `5a7117bc91f041a6a70bb9cd9d751226bed1c0de` | Official site |
| PaperbackExtensionRepo/Paperback-Extension-Repo-Compilation-List | main | `62c64acd8c5a7ed3431a6e7393678c18be4c4de4` | Directory of third-party repos |

Netsky 0.8 generic/community repos exist but are 0.8-only and were not ported in this pass.

Other 0.9 repos listed by the compilation list (Kakarot, pirate.vodka, Nyzzik, etc.) were identified, not copied, and remain unverified until independently audited.
