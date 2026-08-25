#!/usr/bin/env python3
"""Optional Crawl4AI structure-enrichment adapter.

This adapter writes sidecar evidence only. It never replaces article.json and
never becomes the source of truth for the article package.
"""

from __future__ import annotations

import argparse
import asyncio
import ipaddress
import json
import re
import socket
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
)
CHALLENGE_RE = re.compile(
    r"(环境异常|访问过于频繁|请在微信客户端打开|验证码|captcha|access denied)",
    re.IGNORECASE,
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def safe_id(value: str, fallback: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-._")
    return (cleaned or fallback)[:100]


def assert_public_url(value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError(f"Only public HTTP(S) URLs are allowed: {value}")
    if parsed.username or parsed.password:
        raise ValueError("Credentials in URLs are not allowed")
    host = parsed.hostname.lower()
    if host != "mp.weixin.qq.com":
        raise ValueError(f"Online capture only supports public WeChat article hosts: {host}")
    if host == "localhost" or host.endswith(".local"):
        raise ValueError(f"Local host is not allowed: {host}")
    records = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80))
    for record in records:
        address = ipaddress.ip_address(record[4][0])
        if not address.is_global:
            raise ValueError(f"Non-public address is not allowed: {address}")


def read_articles(path: Path) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        articles = payload
    elif isinstance(payload, dict):
        articles = payload.get("articles") or payload.get("sources") or []
    else:
        articles = []
    if not isinstance(articles, list):
        raise ValueError("Input must contain an articles or sources array")
    return [item for item in articles if isinstance(item, dict)]


async def run(args: argparse.Namespace) -> int:
    try:
        from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
    except ImportError:
        print(
            "Crawl4AI is not installed. Install scripts/requirements-crawl4ai.txt "
            "in an isolated Python environment.",
            file=sys.stderr,
        )
        return 2

    articles = read_articles(Path(args.input).resolve())[: args.limit]
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    browser = BrowserConfig(browser_type="chromium", headless=True, user_agent=USER_AGENT, verbose=False)
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        page_timeout=60_000,
        wait_until="domcontentloaded",
        delay_before_return_html=1.2,
        scan_full_page=True,
        verbose=False,
    )
    report: list[dict] = []
    async with AsyncWebCrawler(config=browser) as crawler:
        for index, article in enumerate(articles, start=1):
            url = str(article.get("article_url") or article.get("url") or "").strip()
            item_id = safe_id(str(article.get("id") or ""), f"article-{index:03d}")
            record = {"id": item_id, "url": url, "captured_at": now_iso(), "success": False}
            try:
                assert_public_url(url)
                result = await crawler.arun(url=url, config=run_config)
                html = str(getattr(result, "html", "") or "")
                markdown_value = getattr(result, "markdown", "") or ""
                markdown = str(getattr(markdown_value, "raw_markdown", markdown_value) or "")
                challenge = bool(CHALLENGE_RE.search(f"{html[:100000]}\n{markdown[:50000]}"))
                success = bool(getattr(result, "success", False)) and not challenge
                record.update(
                    success=success,
                    challenge_detected=challenge,
                    markdown_chars=len(markdown),
                    html_chars=len(html),
                    native_table_count=len(re.findall(r"<table\b", html, re.IGNORECASE)),
                    error_message=str(getattr(result, "error_message", "") or ""),
                )
                (output / f"{item_id}.html").write_text(html, encoding="utf-8")
                (output / f"{item_id}.md").write_text(markdown, encoding="utf-8")
                write_json(output / f"{item_id}.json", record)
                if challenge:
                    record["error_message"] = "challenge_or_environment_error"
            except Exception as error:  # one URL must not abort the batch
                record["error_message"] = f"{type(error).__name__}: {error}"
            report.append(record)
            if index < len(articles):
                await asyncio.sleep(args.delay_seconds)

    summary = {
        "schema_version": 1,
        "generated_at": now_iso(),
        "role": "optional-structure-enrichment",
        "source_of_truth": False,
        "requested": len(articles),
        "successful": sum(1 for item in report if item["success"]),
        "items": report,
    }
    write_json(output / "crawl4ai-report.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary["successful"] == summary["requested"] else 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create Crawl4AI Markdown/HTML sidecar evidence")
    parser.add_argument("--input", required=True, help="JSON file containing articles or sources")
    parser.add_argument("--output", required=True, help="Output directory for sidecar evidence")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--delay-seconds", type=float, default=1.5)
    values = parser.parse_args()
    if values.limit < 1 or values.limit > 200:
        parser.error("--limit must be between 1 and 200")
    if values.delay_seconds < 0.5:
        parser.error("--delay-seconds must be at least 0.5")
    return values


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run(parse_args())))
