#!/usr/bin/env python3
"""Audit live Pages JSON/schema and source hostnames (system DNS + 8.8.8.8)."""
from __future__ import annotations

import json
import pathlib
import re
import socket
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "src"
OUT = pathlib.Path(__file__).with_name("audit-registry.json")
SKIP = {"tests", "generic", "utils", "_themes", "common", "migration"}

LIVE_BASE = "https://vyrnexis-e16s.github.io/paperback-extensions/0.9/stable"
INKDEX_CANDIDATES = [
    "https://inkdex.github.io/extensions/0.9/stable/versioning.json",
    "https://inkdex.github.io/0.9/stable/versioning.json",
    "https://thenetsky.github.io/extensions-generic/0.9/stable/versioning.json",
    "https://thenetsky.github.io/extensions-0.9/0.9/stable/versioning.json",
    "https://paperback-community.github.io/extensions/0.9/stable/versioning.json",
    "https://nicartjay.github.io/paperbackext/0.9/stable/versioning.json",
]

URL_RE = re.compile(
    r"""(?:baseUrl|apiUrl|websiteBaseURL|websiteBaseUrl|DOMAIN(?:_NAME)?|domain|API_URL|BASE_URL|WEBSITE_URL)\s*[:=]\s*["'](https?://[^"']+)["']""",
    re.I,
)
BARE_HOST_RE = re.compile(
    r"""(?:baseUrl|apiUrl|DOMAIN(?:_NAME)?|domain|API_URL|BASE_URL)\s*[:=]\s*["']((?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,})["']""",
    re.I,
)
GENERIC_HTTPS = re.compile(r"""["'](https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^"']*)["']""")
IGNORE_HOST_SUBSTR = (
    "github.com",
    "github.io",
    "githubusercontent.com",
    "jsdelivr",
    "unpkg.com",
    "w3.org",
    "schema.org",
    "paperback",
    "localhost",
    "127.0.0.1",
)


def fetch(url: str, timeout: int = 25) -> tuple[int, bytes, str]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "paperback-extensions-audit/1.0", "Accept": "*/*"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(), resp.headers.get("Content-Type", "")
    except urllib.error.HTTPError as e:
        return e.code, e.read() if e.fp else b"", e.headers.get("Content-Type", "") if e.headers else ""


def extract_urls(folder: pathlib.Path) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    files = list(folder.glob("*.ts"))
    for f in files:
        text = f.read_text(encoding="utf-8", errors="replace")
        for u in URL_RE.findall(text):
            if u not in seen:
                seen.add(u)
                urls.append(u)
        for host in BARE_HOST_RE.findall(text):
            if "://" in host:
                continue
            u = "https://" + host
            if u not in seen:
                seen.add(u)
                urls.append(u)
    return urls


def host_of(url: str) -> str | None:
    try:
        host = urllib.parse.urlparse(url).hostname
        return host.lower() if host else None
    except Exception:
        return None


def dns_system(host: str) -> dict:
    out = {"host": host, "systemDns": False, "systemError": None, "ips": []}
    try:
        infos = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        ips = sorted({item[4][0] for item in infos})
        out["systemDns"] = True
        out["ips"] = ips[:4]
    except socket.gaierror as e:
        out["systemError"] = str(e)
    except Exception as e:
        out["systemError"] = type(e).__name__ + ": " + str(e)
    return out


def dns_google(host: str) -> dict:
    """Windows nslookup against 8.8.8.8 to distinguish ISP block vs NXDOMAIN."""
    result = {"googleDns": False, "googleError": None, "nxdomain": False}
    try:
        proc = subprocess.run(
            ["nslookup", host, "8.8.8.8"],
            capture_output=True,
            text=True,
            timeout=12,
        )
        text = (proc.stdout or "") + "\n" + (proc.stderr or "")
        low = text.lower()
        if "non-existent domain" in low or "nxdomain" in low or "can't find" in low:
            result["nxdomain"] = True
            result["googleError"] = "NXDOMAIN"
        elif re.search(r"address:\s*\S+", text, re.I) and "8.8.8.8" in text:
            # first Address is the DNS server; subsequent are answers
            addrs = re.findall(r"(?im)^Address:\s*(\S+)", text)
            answers = [a for a in addrs if a != "8.8.8.8"]
            if answers:
                result["googleDns"] = True
            else:
                result["googleError"] = "no A/AAAA besides resolver"
        else:
            result["googleError"] = text.strip()[:240] or f"exit {proc.returncode}"
    except Exception as e:
        result["googleError"] = type(e).__name__ + ": " + str(e)
    return result


def validate_versioning(obj: dict) -> list[str]:
    issues = []
    if set(obj.keys()) - {"buildTime", "builtWith", "repository", "sources"}:
        extra = sorted(set(obj.keys()) - {"buildTime", "builtWith", "repository", "sources"})
        issues.append("unexpected top-level keys: " + ", ".join(extra))
    for req in ("buildTime", "builtWith", "repository", "sources"):
        if req not in obj:
            issues.append(f"missing top-level {req}")
    repo = obj.get("repository") or {}
    if not isinstance(repo, dict):
        issues.append("repository is not an object")
    else:
        extra = sorted(set(repo.keys()) - {"name", "description"})
        if extra:
            issues.append("repository extra keys: " + ", ".join(extra))
        if not repo.get("name"):
            issues.append("repository.name missing")
        if "description" not in repo:
            issues.append("repository.description missing")
        if "id" in repo:
            issues.append("repository.id present (Inkdex/official omit this)")
    bw = obj.get("builtWith") or {}
    if not isinstance(bw, dict) or "toolchain" not in bw or "types" not in bw:
        issues.append("builtWith missing toolchain/types")
    sources = obj.get("sources")
    if not isinstance(sources, list) or not sources:
        issues.append("sources missing/empty")
        return issues
    allowed = {
        "name",
        "description",
        "version",
        "icon",
        "language",
        "contentRating",
        "capabilities",
        "badges",
        "developers",
        "id",
    }
    ratings = {"SAFE", "MATURE", "ADULT"}
    ids = []
    for i, src in enumerate(sources):
        if not isinstance(src, dict):
            issues.append(f"source[{i}] not object")
            continue
        extra = sorted(set(src.keys()) - allowed)
        if extra:
            issues.append(f"{src.get('id', i)} extra keys: {extra}")
        for k in ("name", "version", "icon", "language", "contentRating", "id"):
            if not src.get(k):
                issues.append(f"source[{i}] missing {k}")
        if src.get("contentRating") not in ratings:
            issues.append(f"{src.get('id')} rating {src.get('contentRating')}")
        caps = src.get("capabilities")
        if not isinstance(caps, list) or not all(isinstance(c, int) for c in caps):
            issues.append(f"{src.get('id')} capabilities not int array")
        if src.get("id"):
            ids.append(src["id"])
    if len(ids) != len(set(ids)):
        issues.append("duplicate source ids")
    return issues


def main() -> None:
    report: dict = {"live": {}, "inkdex": {}, "schemaIssues": [], "hosts": {}}

    status, body, ctype = fetch(f"{LIVE_BASE}/versioning.json")
    report["live"]["versioningStatus"] = status
    report["live"]["versioningContentType"] = ctype
    report["live"]["versioningBytes"] = len(body)
    try:
        live = json.loads(body.decode("utf-8"))
        report["live"]["strictJson"] = True
        report["live"]["sourceCount"] = len(live.get("sources") or [])
        report["live"]["repository"] = live.get("repository")
        report["live"]["builtWith"] = live.get("builtWith")
        report["live"]["buildTime"] = live.get("buildTime")
        report["schemaIssues"] = validate_versioning(live)
    except json.JSONDecodeError as e:
        report["live"]["strictJson"] = False
        report["live"]["jsonError"] = str(e)
        live = None

    st, html, _ = fetch(f"{LIVE_BASE}/")
    report["live"]["indexStatus"] = st
    text = html.decode("utf-8", "replace")
    report["live"]["indexLooksOfficial"] = "addToPaperback" in text and "versioning.json" in text
    report["live"]["addRepoSnippet"] = "paperback://addRepo?displayName=" in text
    report["live"]["hasAlpineInit"] = "initialize()" in text

    # sample source bundle
    sample_id = (live["sources"][0]["id"] if live and live.get("sources") else "MangaDex")
    for path in (f"{sample_id}/index.js", f"{sample_id}/info.json", f"{sample_id}/static/icon.png"):
        s, b, c = fetch(f"{LIVE_BASE}/{path}")
        report["live"][path] = {"status": s, "bytes": len(b), "contentType": c}
        if path.endswith(".json") and s == 200:
            try:
                json.loads(b.decode("utf-8"))
                report["live"][path]["strictJson"] = True
            except json.JSONDecodeError as e:
                report["live"][path]["strictJson"] = False
                report["live"][path]["jsonError"] = str(e)

    inkdex = None
    for url in INKDEX_CANDIDATES:
        s, b, c = fetch(url)
        report["inkdex"][url] = {"status": s, "bytes": len(b)}
        if s == 200:
            try:
                inkdex = json.loads(b.decode("utf-8"))
                report["inkdex"]["used"] = url
                report["inkdex"]["keys"] = sorted(inkdex.keys())
                report["inkdex"]["repositoryKeys"] = sorted((inkdex.get("repository") or {}).keys())
                report["inkdex"]["sourceCount"] = len(inkdex.get("sources") or [])
                src0 = (inkdex.get("sources") or [{}])[0]
                report["inkdex"]["sampleSourceKeys"] = sorted(src0.keys())
                report["inkdex"]["sampleRating"] = src0.get("contentRating")
                report["inkdex"]["sampleCapabilitiesType"] = type(src0.get("capabilities")).__name__
                break
            except json.JSONDecodeError:
                continue

    sources = []
    empty = []
    invalid = []
    hosts: dict[str, list[str]] = {}
    for p in sorted(SRC.iterdir()):
        if not p.is_dir() or p.name in SKIP or p.name.startswith("."):
            continue
        if not (p / "pbconfig.ts").exists() or not (p / "main.ts").exists():
            continue
        urls = extract_urls(p)
        sources.append(p.name)
        if not urls:
            empty.append(p.name)
            continue
        for u in urls:
            parsed = urllib.parse.urlparse(u)
            if not parsed.scheme or not parsed.netloc:
                invalid.append({"id": p.name, "url": u})
                continue
            h = host_of(u)
            if not h:
                invalid.append({"id": p.name, "url": u})
                continue
            if any(x in h for x in IGNORE_HOST_SUBSTR):
                continue
            hosts.setdefault(h, []).append(p.name)

    report["extract"] = {
        "sourceCount": len(sources),
        "hostsChecked": len(hosts),
        "noExplicitUrl": empty,
        "invalidUrls": invalid,
    }

    dns_rows = []
    with ThreadPoolExecutor(max_workers=24) as pool:
        futs = {pool.submit(dns_system, h): h for h in hosts}
        sys = {futs[f]: f.result() for f in as_completed(futs)}

    failed_hosts = [h for h, r in sys.items() if not r["systemDns"]]
    google = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futs = {pool.submit(dns_google, h): h for h in failed_hosts}
        google = {futs[f]: f.result() for f in as_completed(futs)}

    nx = []
    blocked_local_only = []
    ok_count = 0
    for host, info in sorted(sys.items()):
        row = {
            "host": host,
            "sources": sorted(set(hosts[host])),
            "systemDns": info["systemDns"],
            "systemError": info["systemError"],
        }
        if host in google:
            row.update(google[host])
        if info["systemDns"]:
            ok_count += 1
        else:
            if row.get("googleDns"):
                blocked_local_only.append(row)
            else:
                nx.append(row)
        dns_rows.append(row)

    report["dns"] = {
        "ok": ok_count,
        "failSystem": len(failed_hosts),
        "trueNxdomainOrDead": nx,
        "systemFailGoogleOk": blocked_local_only,
    }
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({
        "live": report["live"],
        "schemaIssues": report["schemaIssues"],
        "inkdexUsed": report["inkdex"].get("used"),
        "inkdexKeys": report["inkdex"].get("keys"),
        "extract": {
            "sourceCount": report["extract"]["sourceCount"],
            "hostsChecked": report["extract"]["hostsChecked"],
            "noExplicitUrlCount": len(report["extract"]["noExplicitUrl"]),
            "noExplicitUrl": report["extract"]["noExplicitUrl"],
            "invalidUrls": report["extract"]["invalidUrls"],
        },
        "dnsOk": ok_count,
        "dnsFailSystem": len(failed_hosts),
        "trueNx": nx,
        "localBlockOnly": blocked_local_only,
    }, indent=2))


if __name__ == "__main__":
    main()
