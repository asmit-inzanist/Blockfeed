"""
ingest.py — Fetch articles from NewsAPI and store them in the database.

Can be run as a standalone script:
    python ingest.py

Or triggered via the POST /ingest API endpoint (see main.py).
"""

import os
from pathlib import Path
import requests
from dotenv import load_dotenv
from db import init_db, insert_article
from classifier import classify_article

# Load .env file so we can read NEWSAPI_KEY
# Using explicit path so it works regardless of the working directory
load_dotenv(Path(__file__).parent / ".env")

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"


def fetch_and_store(query: str = None, country: str = "us",
                    page_size: int = 30) -> dict:
    """
    Fetch articles from NewsAPI, classify each one, and store in SQLite.

    Args:
        query: optional search keyword (e.g. "technology")
        country: country code for top headlines (default "us")
        page_size: how many articles to fetch (max 100 for free tier)

    Returns:
        A summary dict with counts of fetched, new, and skipped articles.
    """
    if not NEWSAPI_KEY:
        return {"error": "NEWSAPI_KEY not set. Add it to your .env file."}

    # Build request parameters for the NewsAPI top-headlines endpoint
    params = {
        "apiKey": NEWSAPI_KEY,
        "country": country,
        "pageSize": page_size,
    }
    if query:
        params["q"] = query

    # Make the API call
    response = requests.get(NEWSAPI_URL, params=params, timeout=10)
    data = response.json()

    if data.get("status") != "ok":
        return {"error": data.get("message", "Unknown NewsAPI error")}

    # Make sure the articles table exists
    init_db()

    articles = data.get("articles", [])
    new_count = 0
    skipped_count = 0

    for article in articles:
        title = article.get("title") or ""
        description = article.get("description") or ""
        url = article.get("url") or ""

        # Skip articles with no real content (e.g. "[Removed]" placeholders)
        if not title or not url or title == "[Removed]":
            skipped_count += 1
            continue

        # Classify the article using TF-IDF + cosine similarity
        category = classify_article(title, description)

        # Extract source name from the nested "source" object
        source = article.get("source", {}).get("name", "Unknown")
        published_at = article.get("publishedAt", "")

        # Insert into database (duplicates are silently skipped via UNIQUE url)
        was_inserted = insert_article(
            title=title,
            description=description,
            url=url,
            source=source,
            published_at=published_at,
            category=category,
        )

        if was_inserted:
            new_count += 1
        else:
            skipped_count += 1

    return {
        "fetched": len(articles),
        "new": new_count,
        "skipped": skipped_count,
    }


# ─── Run as standalone script ──────────────────────────────────────────────────
if __name__ == "__main__":
    print("Fetching articles from NewsAPI...")
    result = fetch_and_store()
    print(f"Done! {result}")
