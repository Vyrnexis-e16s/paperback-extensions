#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import re
import socket
import subprocess
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "src"
OUT = pathlib.Path(__file__).with_name("dns-complete.json")
SKIP = {"tests", "generic", "utils", "_themes", "common", "migration"}

URL_RE = re.compile(
    r"""(?:baseUrl|apiUrl|websiteBaseURL|websiteBaseUrl|DOMAIN(?:_NAME)?|domain|API_URL|BASE_URL|WEBSITE_URL|MANGADEX_API|MANGADEX_DOMAIN|COVER_BASE_URL)\s*(?::\s*\w+)?\s*[:=]\s*["'](https?://[^"']+)["']""",
    re.I,
)
BARE_RE = re.compile(
    r"""(?:baseUrl|apiUrl|DOMAIN(?:_NAME)?|domain|API_URL|BASE_URL)\s*(?::\s*\w+)?\s*[:=]\s*["']((?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,})["']""",
    re.I,
)
HTTPS_RE = re.compile(r"""["'](https://[A-Za-z0-9.-]+\.[A-Za-z0-9.-]+)""")
IGNORE = (
    "github.com",
    "github.io",
    "githubusercontent.com",
    "w3.org",
    "schema.org",
    "localhost",
    "127.0.0.1",
    "jsdelivr.net",
    "unpkg.com",
)


def extract(folder: pathlib.Path) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for f in folder.rglob("*.ts"):
        text = f.read_text(encoding="utf-8", errors="replace")
        for u in URL_RE.findall(text):
            if u not in seen:
                seen.add(u)
                urls.append(u)
        for host in BARE_RE.findall(text):
            if "://" in host:
                continue
            u = "https://" + host
            if u not in seen:
                seen.add(u)
                urls.append(u)
        if not urls:
            for u in HTTPS_RE.findall(text):
                if any(x in u for x in IGNORE):
                    continue
                if u not in seen:
                    seen.add(u)
                    urls.append(u)
    return urls


def host_of(url: str) -> str | None:
    try:
        h = urllib.parse.urlparse(url).hostname
        return h.lower() if h else None
    except Exception:
        return None


def system_dns(host: str) -> tuple[bool, str | None]:
    try:
        socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        return True, None
    except socket.gaierror as e:
        return False, str(e)
    except Exception as e:
        return False, type(e).__name__ + ": " + str(e)


def google_dns(host: str) -> dict:
    out = {"google": "unknown", "detail": None}
    try:
        proc = subprocess.run(
            ["nslookup", host, "8.8.8.8"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        text = (proc.stdout or "") + "\n" + (proc.stderr or "")
        low = text.lower()
        if "non-existent domain" in low or "nxdomain" in low:
            out["google"] = "nxdomain"
            out["detail"] = "NXDOMAIN"
        elif "can't find" in low or "can not find" in low:
            out["google"] = "nxdomain"
            out["detail"] = "can't find"
        elif re.search(r"(?im)^name:\s+\S+", text) or "addresses:" in low:
            out["google"] = "resolves"
        elif re.search(r"(?im)^address:\s+(?!8\.8\.8\.8)\S+", text):
            out["google"] = "resolves"
        else:
            out["google"] = "no-answer"
            out["detail"] = text.strip()[:200]
    except Exception as e:
        out["google"] = "error"
        out["detail"] = str(e)
    return out


def main() -> None:
    no_url = []
    invalid = []
    hosts: dict[str, list[str]] = {}
    for p in sorted(SRC.iterdir()):
        if not p.is_dir() or p.name in SKIP or p.name.startswith("."):
            continue
        if not (p / "pbconfig.ts").exists():
            continue
        urls = extract(p)
        if not urls:
            no_url.append(p.name)
            continue
        for u in urls:
            h = host_of(u)
            if not h:
                invalid.append({"id": p.name, "url": u})
                continue
            if any(x in h for x in IGNORE):
                continue
            hosts.setdefault(h, []).append(p.name)

    sys = {}
    with ThreadPoolExecutor(max_workers=32) as pool:
        futs = {pool.submit(system_dns, h): h for h in hosts}
        for f in as_completed(futs):
            sys[futs[f]] = f.result()

    failed = [h for h, (ok, _) in sys.items() if not ok]
    gmap = {}
    with ThreadPoolExecutor(max_workers=10) as pool:
        futs = {pool.submit(google_dns, h): h for h in failed}
        for f in as_completed(futs):
            gmap[futs[f]] = f.result()

    nx, noans, local_only, other = [], [], [], []
    for h in sorted(failed):
        ok, err = sys[h]
        g = gmap.get(h, {})
        row = {
            "host": h,
            "sources": sorted(set(hosts[h])),
            "systemError": err,
            "google": g.get("google"),
            "detail": g.get("detail"),
        }
        if g.get("google") == "nxdomain":
            nx.append(row)
        elif g.get("google") == "resolves":
            local_only.append(row)
        elif g.get("google") == "no-answer":
            noans.append(row)
        else:
            other.append(row)

    report = {
        "sourceFolders": sum(1 for p in SRC.iterdir() if p.is_dir() and (p / "pbconfig.ts").exists()),
        "hostsChecked": len(hosts),
        "systemOk": sum(1 for ok, _ in sys.values() if ok),
        "systemFail": len(failed),
        "noExplicitUrl": no_url,
        "invalidUrls": invalid,
        "nxdomain": nx,
        "googleResolvesSystemFails": local_only,
        "noAnswer": noans,
        "other": other,
    }
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({
        "hostsChecked": report["hostsChecked"],
        "systemOk": report["systemOk"],
        "systemFail": report["systemFail"],
        "noExplicitUrl": no_url,
        "invalidUrls": invalid,
        "nxdomain": nx,
        "googleResolvesSystemFails": local_only,
        "noAnswerCount": len(noans),
        "noAnswer": noans,
        "other": other,
    }, indent=2))


if __name__ == "__main__":
    main()
