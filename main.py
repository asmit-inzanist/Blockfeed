"""
main.py — FastAPI application for BlockFeed.

Run with:
    uvicorn main:app --reload

Endpoints:
    POST /ingest             — fetch new articles from NewsAPI and store them
    GET  /articles           — list all articles (paginated)
    GET  /feed?interests=... — personalized feed filtered by interest categories
    GET  /categories         — list all categories with article counts
"""

from fastapi import FastAPI, Query
from db import init_db, get_articles, get_articles_by_categories, get_category_counts
from ingest import fetch_and_store

# Create the FastAPI app
app = FastAPI(
    title="BlockFeed",
    description="News aggregation API with TF-IDF topic classification",
    version="1.0.0",
)

# Make sure the database table exists on startup
init_db()


# ─── POST /ingest ──────────────────────────────────────────────────────────────

@app.post("/ingest")
def ingest_articles(query: str = None, page_size: int = 30):
    """
    Trigger fetching new articles from NewsAPI.

    Optional query params:
        - query: keyword to search for (e.g. "climate")
        - page_size: number of articles to fetch (default 30, max 100)
    """
    result = fetch_and_store(query=query, page_size=page_size)
    return result


# ─── GET /articles ─────────────────────────────────────────────────────────────

@app.get("/articles")
def list_articles(limit: int = Query(20, ge=1, le=100),
                  offset: int = Query(0, ge=0)):
    """
    Return all stored articles, ordered by most recent, with pagination.

    Query params:
        - limit: max articles to return (1–100, default 20)
        - offset: number of articles to skip (default 0)
    """
    articles = get_articles(limit=limit, offset=offset)
    return {"count": len(articles), "articles": articles}


# ─── GET /feed ─────────────────────────────────────────────────────────────────

@app.get("/feed")
def personalized_feed(
    interests: str = Query(
        ...,
        description="Comma-separated list of interest categories, "
                    "e.g. 'technology,sports'"
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Return a personalized feed of articles matching the given interest categories.

    Example: GET /feed?interests=technology,sports&limit=10
    """
    # Split the comma-separated string into a list, strip whitespace and stray quotes
    category_list = [
        c.strip().strip("'\"[]").lower()
        for c in interests.split(",")
        if c.strip()
    ]
    articles = get_articles_by_categories(category_list, limit=limit, offset=offset)
    return {
        "interests": category_list,
        "count": len(articles),
        "articles": articles,
    }


# ─── GET /categories ──────────────────────────────────────────────────────────

@app.get("/categories")
def list_categories():
    """Return all categories and how many articles belong to each."""
    counts = get_category_counts()
    return {"categories": counts}
