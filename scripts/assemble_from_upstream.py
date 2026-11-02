#!/usr/bin/env python3
"""Assemble a unified 0.9 source tree from audited upstream clones.

Does not invent sources. Copies only folders that already contain pbconfig.ts
and main.ts. Inkdex IDs win on collisions; different websites that share a
folder name are renamed and recorded in the compatibility map.
"""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = ROOT / "_upstream"
SRC = ROOT / "src"
REPORTS = ROOT / "reports" / "sources"
MIGRATION = ROOT / "src" / "migration"

INSPECTION_DATE = datetime.now(timezone.utc).strftime("%Y-%m-%d")

# Highest priority first. Later copies are skipped on ID collision unless the
# website is clearly different, in which case the later ID is suffixed.
FAMILIES: list[dict] = [
    {
        "id": "inkdex-general",
        "dir": "general-extensions",
        "license": "GPL-3.0-or-later",
        "origin": "https://github.com/inkdex/general-extensions",
        "theme_rewrite": None,
        "copy_generic_as": None,
    },
    {
        "id": "inkdex-madara",
        "dir": "madara-extensions",
        "license": "GPL-3.0-or-later",
        "origin": "https://github.com/inkdex/madara-extensions",
        "theme_rewrite": ("../generic/", "../_themes/madara/"),
        "copy_generic_as": "_themes/madara",
    },
    {
        "id": "inkdex-mangastream",
        "dir": "mangastream-extensions",
        "license": "GPL-3.0-or-later",
        "origin": "https://github.com/inkdex/mangastream-extensions",
        "theme_rewrite": ("../generic/", "../_themes/mangastream/"),
        "copy_generic_as": "_themes/mangastream",
    },
    {
        "id": "inkdex-mangabox",
        "dir": "mangabox-extensions",
        "license": "GPL-3.0-or-later",
        "origin": "https://github.com/inkdex/mangabox-extensions",
        "theme_rewrite": ("../generic/", "../_themes/mangabox/"),
        "copy_generic_as": "_themes/mangabox",
    },
    {
        "id": "inkdex-mangaworld",
        "dir": "mangaworld-extensions",
        "license": "GPL-3.0-or-later",
        "origin": "https://github.com/inkdex/mangaworld-extensions",
        "theme_rewrite": ("../generic/", "../_themes/mangaworld/"),
        "copy_generic_as": "_themes/mangaworld",
    },
    {
        "id": "inkdex-liliana",
        "dir": "liliana-extensions",
        "license": "GPL-3.0-or-later",
        "origin": "https://github.com/inkdex/liliana-extensions",
        "theme_rewrite": ("../generic/", "../_themes/liliana/"),
        "copy_generic_as": "_themes/liliana",
    },
    {
        "id": "netsky-0.9",
        "dir": "netskys-extensions",
        "license": "MIT",
        "origin": "https://github.com/TheNetsky/netskys-extensions",
        "theme_rewrite": None,
        "copy_generic_as": None,
    },
    {
        "id": "paperbackext",
        "dir": "PaperbackExt",
        "license": "MIT",
        "origin": "https://github.com/Nicartjay/PaperbackExt",
        "theme_rewrite": None,
        "copy_generic_as": None,
        "copy_utils": True,
    },
]

SKIP_DIRS = {"tests", "generic", "utils", "_themes", "common", "migration"}

URL_RE = re.compile(r"https?://[^\s\"'`]+", re.I)
DOMAIN_ASSIGN_RE = re.compile(
    r"""(?:DOMAIN|BASE_URL|baseUrl|base_url)(?:\s*:\s*[\w.]+)?\s*=\s*["'`](https?://[^"'`]+)["'`]""",
    re.I,
)
FROM_HOST_RE = re.compile(r"from\s+((?:https?://)?[a-z0-9.-]+\.[a-z]{2,})", re.I)
NAME_RE = re.compile(r"""name\s*[:=]\s*["'`]([^"'`]+)["'`]""")
VERSION_RE = re.compile(r"""version\s*[:=]\s*["'`]([^"'`]+)["'`]""")
RATING_RE = re.compile(r"""contentRating\s*[:=]\s*ContentRating\.([A-Z]+)""")
LANG_RE = re.compile(r"""language\s*[:=]\s*["'`]([^"'`]+)["'`]""")
DESC_RE = re.compile(r"""description\s*[:=]\s*(?:["'`]([^"'`]*)["'`]|`([^`]*)`)""")


def git_sha(repo: Path) -> str:
    head = repo / ".git" / "HEAD"
    if not head.exists():
        return "unknown"
    ref = head.read_text(encoding="utf-8").strip()
    if ref.startswith("ref:"):
        ref_path = repo / ".git" / ref.split(" ", 1)[1].strip()
        if ref_path.exists():
            return ref_path.read_text(encoding="utf-8").strip()
    return ref


def copytree(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest, dirs_exist_ok=True)


def rewrite_generic_imports(folder: Path, old: str, new: str) -> None:
    for path in folder.rglob("*.ts"):
        text = path.read_text(encoding="utf-8")
        if old in text:
            path.write_text(text.replace(old, new), encoding="utf-8")


def extract_urls(folder: Path) -> list[str]:
    urls: list[str] = []
    for path in folder.rglob("*.ts"):
        text = path.read_text(encoding="utf-8", errors="replace")
        urls.extend(DOMAIN_ASSIGN_RE.findall(text))
        if path.name == "pbconfig.ts":
            urls.extend(URL_RE.findall(text))
            for host in FROM_HOST_RE.findall(text):
                urls.append(host if host.lower().startswith("http") else f"https://{host}")
    seen: set[str] = set()
    out: list[str] = []
    for url in urls:
        url = url.rstrip(").,;]")
        if url not in seen and "github.com" not in url and "spdx" not in url:
            seen.add(url)
            out.append(url)
    return out


def parse_pbconfig(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    name_m = NAME_RE.search(text)
    version_m = VERSION_RE.search(text)
    rating_m = RATING_RE.search(text)
    lang_m = LANG_RE.search(text)
    desc_m = DESC_RE.search(text)
    description = ""
    if desc_m:
        description = desc_m.group(1) or desc_m.group(2) or ""
    rating = rating_m.group(1) if rating_m else "UNKNOWN"
    classification = {
        "EVERYONE": "Everyone",
        "MATURE": "Mature 18+",
        "ADULT": "Mature 18+",
    }.get(rating, "Unverified")
    return {
        "displayName": name_m.group(1) if name_m else path.parent.name,
        "version": version_m.group(1) if version_m else "unknown",
        "language": lang_m.group(1) if lang_m else "unknown",
        "contentRatingEnum": rating,
        "adultClassification": classification,
        "description": description.strip(),
    }


def host_key(url: str) -> str:
    try:
        from urllib.parse import urlparse

        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return url.lower()


def main() -> None:
    preserve = {"common", "migration", "tests"}
    if SRC.exists():
        for child in SRC.iterdir():
            if child.name in preserve:
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    SRC.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    MIGRATION.mkdir(parents=True, exist_ok=True)

    fallback_icon = (
        UPSTREAM / "template-extensions" / "src" / "ContentTemplate" / "static"
    )

    taken: dict[str, dict] = {}
    taken_lower: dict[str, str] = {}
    inventory: list[dict] = []
    skipped: list[dict] = []
    renamed: list[dict] = []
    upstream_audit: list[dict] = []

    for family in FAMILIES:
        repo = UPSTREAM / family["dir"]
        if not repo.exists():
            upstream_audit.append(
                {
                    "id": family["id"],
                    "status": "clone-missing",
                    "origin": family["origin"],
                }
            )
            continue
        sha = git_sha(repo)
        upstream_audit.append(
            {
                "id": family["id"],
                "origin": family["origin"],
                "localPath": str(repo.relative_to(ROOT)).replace("\\", "/"),
                "headSha": sha,
                "license": family["license"],
                "inspectionDate": INSPECTION_DATE,
                "kind": "source-code",
            }
        )

        src_root = repo / "src"
        if family.get("copy_generic_as") and (src_root / "generic").exists():
            copytree(src_root / "generic", SRC / family["copy_generic_as"])
        if family.get("copy_utils") and (src_root / "utils").exists():
            copytree(src_root / "utils", SRC / "utils")
        inkdex_state = UPSTREAM / "general-extensions" / "src" / "utils" / "state.ts"
        if inkdex_state.exists():
            dest_state = SRC / "utils" / "state.ts"
            dest_state.parent.mkdir(parents=True, exist_ok=True)
            if not dest_state.exists():
                shutil.copy2(inkdex_state, dest_state)

        for child in sorted(src_root.iterdir()):
            if not child.is_dir() or child.name in SKIP_DIRS:
                continue
            if not (child / "pbconfig.ts").exists() or not (child / "main.ts").exists():
                continue

            dest_id = child.name
            urls = extract_urls(child)
            meta = parse_pbconfig(child / "pbconfig.ts")
            primary = urls[0] if urls else ""

            collision_id = taken_lower.get(dest_id.lower())
            if collision_id:
                existing = taken[collision_id]
                existing_host = host_key(existing.get("websiteUrl") or "")
                new_host = host_key(primary)
                same_site = (not existing_host) or (not new_host) or existing_host == new_host
                if same_site:
                    skipped.append(
                        {
                            "id": dest_id,
                            "reason": "duplicate-id-same-or-unknown-site",
                            "keptFrom": existing["originRepo"],
                            "skippedFrom": family["origin"],
                            "websiteUrl": primary,
                            "keptId": collision_id,
                        }
                    )
                    continue
                dest_id = f"{child.name}_{family['id'].split('-')[-1]}"
                renamed.append(
                    {
                        "previousExtensionId": child.name,
                        "currentExtensionId": dest_id,
                        "previousSourceDomain": primary,
                        "currentCanonicalDomain": primary,
                        "reason": "id-collision-different-website",
                        "mappingConfidence": "high",
                        "evidence": f"{child.name} already used by {existing['originRepo']} for {existing.get('websiteUrl')}",
                    }
                )

            dest = SRC / dest_id
            copytree(child, dest)
            rewrite = family.get("theme_rewrite")
            if rewrite:
                rewrite_generic_imports(dest, rewrite[0], rewrite[1])
            static_dir = dest / "static"
            if not (static_dir / "icon.png").exists() and fallback_icon.exists():
                static_dir.mkdir(exist_ok=True)
                for item in fallback_icon.iterdir():
                    target = static_dir / item.name
                    if not target.exists():
                        shutil.copy2(item, target)

            record = {
                "extensionId": dest_id,
                "originalFolderName": child.name,
                "displayName": meta["displayName"],
                "websiteUrl": primary,
                "additionalUrls": urls[1:],
                "originRepo": family["origin"],
                "originPath": f"src/{child.name}",
                "upstreamCommit": sha,
                "license": family["license"],
                "language": meta["language"],
                "extensionVersion": meta["version"],
                "contentRatingEnum": meta["contentRatingEnum"],
                "adultClassification": meta["adultClassification"],
                "description": meta["description"],
                "compatibilityTarget": "Paperback 0.9 (209) primary, 0.9 (208) regression",
                "status": "unverified",
                "websiteStatus": "unverified",
                "searchStatus": "unverified",
                "metadataStatus": "unverified",
                "coverStatus": "unverified",
                "chapterStatus": "unverified",
                "pageStatus": "unverified",
                "lastSuccessfulLiveTest": None,
                "deviceTestStatus": "pending",
                "knownLimitations": [],
                "family": family["id"],
                "inspectionDate": INSPECTION_DATE,
            }
            taken[dest_id] = record
            taken_lower[dest_id.lower()] = dest_id
            inventory.append(record)

    REPORTS.mkdir(parents=True, exist_ok=True)
    (REPORTS / "inventory.json").write_text(
        json.dumps(
            {
                "generatedAt": INSPECTION_DATE,
                "count": len(inventory),
                "skippedDuplicates": skipped,
                "sources": inventory,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    (REPORTS / "upstream-audit.json").write_text(
        json.dumps({"generatedAt": INSPECTION_DATE, "repositories": upstream_audit}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    (MIGRATION / "compatibility-map.json").write_text(
        json.dumps(
            {
                "version": 1,
                "generatedAt": INSPECTION_DATE,
                "policy": "Preserve upstream folder names as Paperback source IDs. Rename only on true website collision inside this unified registry.",
                "entries": renamed,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    by_rating: dict[str, int] = {}
    for item in inventory:
        by_rating[item["adultClassification"]] = by_rating.get(item["adultClassification"], 0) + 1

    lines = [
        f"# Source inventory ({INSPECTION_DATE})",
        "",
        f"Assembled **{len(inventory)}** extensions. Skipped **{len(skipped)}** duplicates. Renamed **{len(renamed)}** colliding IDs.",
        "",
        "## Classification counts",
        "",
    ]
    for key, value in sorted(by_rating.items()):
        lines.append(f"- {key}: {value}")
    lines += ["", "## Sources", "", "| ID | Name | Rating | Origin | Website | Status |", "| --- | --- | --- | --- | --- | --- |"]
    for item in inventory:
        lines.append(
            f"| `{item['extensionId']}` | {item['displayName']} | {item['adultClassification']} | {item['family']} | {item['websiteUrl'] or ''} | {item['status']} |"
        )
    (REPORTS / "inventory.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"assembled {len(inventory)} sources, skipped {len(skipped)}, renamed {len(renamed)}")


if __name__ == "__main__":
    main()
