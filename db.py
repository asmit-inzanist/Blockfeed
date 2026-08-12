"""
db.py — SQLite setup and connection helper.

Creates a single 'articles' table and provides helper functions
for inserting and querying articles.
"""

import sqlite3
from pathlib import Path

# Database file lives next to this script
DB_PATH = Path(__file__).parent / "blockfeed.db"


def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database.
    
    row_factory=sqlite3.Row lets us access columns by name
    instead of by index (e.g. row["title"] instead of row[0]).
    """
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the articles table if it doesn't exist yet.
    
    Fields:
      - id: auto-incrementing primary key
      - title: article headline
      - description: short summary/snippet
      - url: link to the full article (UNIQUE to avoid duplicates)
      - source: name of the news source (e.g. "BBC News")
      - published_at: ISO-format publication timestamp
      - category: topic label assigned by our classifier
    """
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            url TEXT UNIQUE NOT NULL,
            source TEXT,
            published_at TEXT,
            category TEXT
        )
    """)
    conn.commit()
    conn.close()


def insert_article(title: str, description: str, url: str,
                   source: str, published_at: str, category: str) -> bool:
    """Insert a single article into the database, or update category if URL exists.

    Uses INSERT ... ON CONFLICT(url) DO UPDATE SET category = excluded.category
    so duplicate URLs update their assigned category if re-ingested.
    """
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO articles
            (title, description, url, source, published_at, category)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(url) DO UPDATE SET
            category = excluded.category,
            title = excluded.title,
            description = excluded.description
        """,
        (title, description, url, source, published_at, category),
    )
    inserted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return inserted


def get_articles(limit: int = 20, offset: int = 0) -> list[dict]:
    """Fetch all articles, ordered newest first, with pagination."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM articles ORDER BY published_at DESC LIMIT ? OFFSET ?",
        (limit, offset),
    ).fetchall()
    conn.close()
    # Convert sqlite3.Row objects to plain dicts for JSON serialization
    return [dict(row) for row in rows]


def get_articles_by_categories(categories: list[str],
                               limit: int = 20, offset: int = 0) -> list[dict]:
    """Fetch articles matching any of the given categories, newest first."""
    if not categories:
        return []
    # Build "WHERE category IN (?, ?, ?)" with the right number of placeholders
    placeholders = ",".join("?" for _ in categories)
    query = f"""
        SELECT * FROM articles
        WHERE category IN ({placeholders})
        ORDER BY published_at DESC
        LIMIT ? OFFSET ?
    """
    conn = get_connection()
    rows = conn.execute(query, (*categories, limit, offset)).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_category_counts() -> list[dict]:
    """Return each category and how many articles belong to it."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT category, COUNT(*) as count
        FROM articles
        GROUP BY category
        ORDER BY count DESC
        """
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
