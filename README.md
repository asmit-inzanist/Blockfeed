# BlockFeed

A lightweight news aggregation API with NLP-based topic classification.

## What it does

1. **Ingests** real news articles from [NewsAPI.org](https://newsapi.org/)
2. **Classifies** each article into topics (`technology`, `sports`, `politics`, `business`, `health`, `science`, `entertainment`, or `general`) using TF-IDF + Cosine Similarity
3. **Serves** a personalized feed via a FastAPI REST API

## How the classifier works

The topic classification uses two core NLP concepts — no deep learning, no pretrained models, fully explainable:

### TF-IDF (Term Frequency–Inverse Document Frequency)
- **TF** = how often a word appears in a given document
- **IDF** = how rare a word is across all documents in the corpus
- **TF-IDF = TF × IDF** — words that appear frequently in one document but rarely elsewhere get high scores. These are the "distinguishing" words
- We use scikit-learn's `TfidfVectorizer` to turn each article's text into a numeric vector of these scores

### Cosine Similarity & Thresholding
- Measures the angle between two vectors (not their magnitude):
  $$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\|A\| \times \|B\|}$$
- Because category keyword reference vectors are longer than short article headlines/snippets, cosine similarity values naturally land between **0.02 and 0.10**.
- We set a minimum threshold of `0.01`:
  - Articles with keyword overlap score $> 0.01$ and match their top category.
  - Articles with $0.00$ keyword overlap (e.g. local accidents or natural disasters) fall back to `"general"` instead of forcing a bad match.

### The classification approach
1. We define **reference keyword lists** for each topic category
2. For each article, we build a small corpus containing the article text and all reference texts
3. We fit TF-IDF on this corpus and compute cosine similarity between the article vector and each reference vector
4. The category with the highest similarity score wins (falling back to `"general"` if score $< 0.01$)

## Setup

### 1. Get a NewsAPI key
Sign up at [newsapi.org](https://newsapi.org/) (free tier is fine).

### 2. Configure environment
```bash
# Create .env and add your API key:
NEWSAPI_KEY=your_actual_key_here
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the API
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ingest` | Fetch new articles from NewsAPI and classify them |
| `GET` | `/articles?limit=20&offset=0` | List all articles (paginated) |
| `GET` | `/feed?interests=technology,sports` | Personalized feed by interest categories |
| `GET` | `/categories` | List categories with article counts |

### Examples

```bash
# Ingest articles
curl -X POST "http://localhost:8000/ingest?page_size=30"

# Get all articles
curl "http://localhost:8000/articles?limit=10"

# Get personalized feed (supports comma-separated categories)
curl "http://localhost:8000/feed?interests=technology,health"

# See category breakdown
curl "http://localhost:8000/categories"
```

## Project Structure

```
blockfeed/
├── main.py           # FastAPI app + routes
├── ingest.py         # Fetches and stores news articles
├── classifier.py     # TF-IDF + cosine similarity topic classification
├── db.py             # SQLite setup/connection helper
├── requirements.txt  # Python dependencies
├── .env.example      # Environment variable template
└── README.md         # This file
```

## What a more advanced version would look like

This project intentionally stays simple. A production-grade version could use:

- **Supervised classification**: Train a Naive Bayes, SVM, or logistic regression model on a labeled dataset of articles. This would learn category boundaries from real data instead of hand-written keyword lists
- **Pretrained embeddings**: Use word2vec, GloVe, or sentence-transformers to represent articles as dense vectors. These capture semantic meaning (e.g., "automobile" ≈ "car") rather than just exact word matches
- **Transformer models**: Fine-tune a model like BERT or DistilBERT on a topic classification dataset for state-of-the-art accuracy
- **Database upgrade**: PostgreSQL with full-text search, connection pooling, and proper migrations
- **User accounts & auth**: JWT-based authentication with saved user preferences
- **Caching**: Redis for frequently-accessed feeds and rate-limited API calls
- **Automated Refreshes**: APScheduler or Celery background workers to run ingestion on a periodic cron schedule
