#!/usr/bin/env node
/**
 * Rate-limited source website reachability check.
 * Does not scrape chapter images. Does not bypass access controls.
 * Writes reports/testing/health.json. When HEALTH_GITHUB_TOKEN and
 * HEALTH_REPO are set, opens or updates a broken-source issue.
 */
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const inventoryPath = path.join(root, "reports", "sources", "inventory.json")
if (!fs.existsSync(inventoryPath)) {
  console.error("missing reports/sources/inventory.json — run npm run assemble first")
  process.exit(1)
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"))
const delayMs = Number(process.env.HEALTH_DELAY_MS ?? 1500)
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 12000)
const limit = Number(process.env.HEALTH_LIMIT ?? inventory.sources.length)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function probe(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "paperback-extensions-health-check/0.9" },
    })
    return { ok: response.ok, status: response.status, errorClass: response.ok ? null : "http-" + response.status }
  } catch (error) {
    const name = error?.name ?? "Error"
    const message = String(error?.message ?? error)
    let errorClass = "network-unavailable"
    if (name === "AbortError" || message.includes("abort")) errorClass = "timeout"
    if (message.includes("ENOTFOUND")) errorClass = "dns-failure"
    if (message.includes("CERT") || message.includes("SSL")) errorClass = "tls-error"
    return { ok: false, status: null, errorClass, message }
  } finally {
    clearTimeout(timer)
  }
}

const results = []
const targets = inventory.sources.filter((source) => source.websiteUrl).slice(0, limit)

for (const source of targets) {
  const result = await probe(source.websiteUrl)
  results.push({
    extensionId: source.extensionId,
    websiteUrl: source.websiteUrl,
    ...result,
    testedAt: new Date().toISOString(),
  })
  console.log(`${source.extensionId}\t${result.ok ? "ok" : result.errorClass}\t${source.websiteUrl}`)
  await sleep(delayMs)
}

const report = {
  generatedAt: new Date().toISOString(),
  tested: results.length,
  passed: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length,
  results,
}

const outDir = path.join(root, "reports", "testing")
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, "health.json"), JSON.stringify(report, null, 2) + "\n")

const token = process.env.HEALTH_GITHUB_TOKEN
const repo = process.env.HEALTH_REPO
if (token && repo) {
  const failed = results.filter((item) => !item.ok)
  for (const item of failed) {
    const title = `broken-source: ${item.extensionId}`
    const body = [
      `Source \`${item.extensionId}\` failed a permitted reachability check.`,
      "",
      `- URL: ${item.websiteUrl}`,
      `- Error class: ${item.errorClass}`,
      `- Status: ${item.status ?? "n/a"}`,
      `- Tested at: ${item.testedAt}`,
      "",
      "This issue is opened by the source-health workflow. Do not silently drop the source from the registry.",
    ].join("\n")
    const search = await fetch(
      `https://api.github.com/search/issues?q=repo:${repo}+state:open+${encodeURIComponent(title)}`,
      { headers: { authorization: `Bearer ${token}`, "user-agent": "paperback-extensions-health-check/0.9" } },
    )
    const found = await search.json()
    if (found.total_count > 0) continue
    await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "user-agent": "paperback-extensions-health-check/0.9",
        "content-type": "application/json",
      },
      body: JSON.stringify({ title, body, labels: ["broken-source"] }),
    })
  }
}

if (report.failed && process.env.HEALTH_FAIL_ON_ERROR === "1") {
  process.exit(1)
}
console.log(`health check complete: ${report.passed} passed, ${report.failed} failed`)
