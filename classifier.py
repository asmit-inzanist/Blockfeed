"""
classifier.py — Lightweight topic classification using TF-IDF + cosine similarity.

HOW IT WORKS (interview-explainable version):
==============================================

1. TF-IDF (Term Frequency–Inverse Document Frequency):
   - TF = how often a word appears in THIS document.
   - IDF = how rare a word is ACROSS ALL documents.
   - TF-IDF = TF × IDF. Words that are frequent in one document but rare
     overall get a high score — these are the "distinguishing" words.
   - TfidfVectorizer turns text into a vector of these scores, one per word.

2. Cosine Similarity:
   - Measures how similar two vectors are by looking at the angle between them.
   - Value ranges from 0 (completely different) to 1 (identical direction).
   - We don't care about document length, only direction — that's why cosine
     similarity works better than raw dot product for text comparison.

3. Our approach:
   - We define a set of reference texts — one per category — made of keywords
     that are representative of that topic.
   - We combine the article text AND all reference texts into one "corpus"
     so the TfidfVectorizer learns the vocabulary from everything together.
   - We compute the TF-IDF vector for the article and for each category reference.
   - We pick the category whose reference vector has the highest cosine similarity
     to the article's vector.
   - Because article text (15-30 words) is much shorter than category keyword lists (50+ words),
     cosine similarity scores naturally fall between ~0.02 and ~0.10.
     If the best score is 0.00 (no matching keywords at all), we label it "general".
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ─── Minimum similarity threshold ─────────────────────────────────────────────
# Cosine similarity between a short article (headline + snippet) and a longer
# list of category keywords typically ranges from 0.02 to 0.10.
# A threshold of 0.01 ensures that any meaningful keyword match triggers a category,
# while completely unmatched articles (0.00 score) fall back to "general".
MIN_SIMILARITY_THRESHOLD = 0.01

# ─── Category reference texts ──────────────────────────────────────────────────
# Each category has a paragraph of representative keywords and phrases.
# These act as "prototypes" — the classifier compares each article against
# these references and picks the closest one.

CATEGORY_REFERENCES = {
    "technology": (
        "technology software programming artificial intelligence AI machine learning "
        "computer science data startup silicon valley app smartphone cloud computing "
        "cybersecurity hacking blockchain crypto bitcoin internet tech gadget robot "
        "automation digital innovation semiconductor chip processor GPU hardware "
        "algorithm code developer engineer platform operating system update Windows "
        "Apple Google Microsoft Amazon Meta iPhone Android SteamOS Valve Linux"
    ),
    "sports": (
        "sports football soccer basketball baseball tennis cricket golf Olympics "
        "athlete championship tournament match game score team player coach stadium "
        "league FIFA NBA NFL MLB World Cup racing swimming medal win loss "
        "season playoff draft roster injury transfer club cup final Cowboys Dodgers"
    ),
    "politics": (
        "politics government election president congress senate parliament vote "
        "democrat republican policy law legislation regulation campaign debate "
        "diplomacy foreign affairs treaty sanctions geopolitics liberal conservative "
        "Supreme Court White House political party governor mayor minister prime "
        "cabinet federal state executive judicial border immigration tariff "
        "war military conflict ceasefire negotiation diplomat ambassador nation"
    ),
    "business": (
        "business economy stock market finance investment banking trade revenue "
        "profit loss earnings GDP inflation interest rate Wall Street CEO company "
        "startup acquisition merger IPO venture capital quarterly shareholder "
        "corporate industry manufacturing supply chain retail consumer spending "
        "unemployment jobs hiring layoffs recession growth export import Nvidia Intel"
    ),
    "health": (
        "health medicine doctor hospital vaccine virus disease pandemic treatment "
        "pharmaceutical drug therapy clinical trial patient surgery mental health "
        "nutrition diet fitness exercise wellness public health WHO CDC cancer "
        "infection bacteria outbreak symptoms diagnosis medical healthcare "
        "epidemic illness death toll mortality injury FDA approval research study Ebola"
    ),
    "science": (
        "science research study discovery experiment space NASA planet star "
        "galaxy universe astronomy physics chemistry biology geology climate "
        "environment fossil species evolution laboratory scientific journal "
        "telescope satellite orbit comet meteor asteroid solar lunar eclipse"
    ),
    "entertainment": (
        "entertainment movie film actor actress director Hollywood box office "
        "music album song concert singer band television TV show series streaming "
        "Netflix Disney celebrity award Grammy Oscar Emmy star fame concert tour "
        "theater performance dance comedy drama animation sequel Brad Pitt"
    ),
}


def classify_article(title: str, description: str) -> str:
    """
    Classify a single article into one of the predefined categories.

    Args:
        title: the article's headline
        description: the article's short summary/snippet

    Returns:
        The category name with the highest cosine similarity score,
        or "general" if no category exceeds the minimum threshold.
    """

    # Step 1: Combine title and description into a single text
    article_text = f"{title} {description or ''}"

    # Step 2: Build the corpus — article first, then one reference per category
    categories = list(CATEGORY_REFERENCES.keys())
    reference_texts = [CATEGORY_REFERENCES[cat] for cat in categories]
    corpus = [article_text] + reference_texts

    # Step 3: Fit the TF-IDF vectorizer on the entire corpus
    vectorizer = TfidfVectorizer(stop_words="english", lowercase=True)
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Step 4: Compute cosine similarity between article (row 0) and references (rows 1..N)
    article_vector = tfidf_matrix[0:1]           # shape: (1, num_words)
    reference_vectors = tfidf_matrix[1:]          # shape: (num_categories, num_words)
    similarities = cosine_similarity(article_vector, reference_vectors)[0]

    # Step 5: Find the category with the highest similarity score
    best_index = similarities.argmax()
    best_score = similarities[best_index]

    # Step 6: If score is 0.00 (no matching keywords at all), classify as "general"
    if best_score < MIN_SIMILARITY_THRESHOLD:
        return "general"

    return categories[best_index]


def classify_batch(articles: list[dict]) -> list[dict]:
    """Classify a list of articles and add a 'category' key to each."""
    for article in articles:
        article["category"] = classify_article(
            article.get("title", ""),
            article.get("description", ""),
        )
    return articles
