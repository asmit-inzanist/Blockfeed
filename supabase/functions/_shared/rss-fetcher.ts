import { Parser } from 'npm:rss-parser'
import { z } from 'npm:zod'

const feedItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  description: z.string().optional(),
  pubDate: z.string().optional(),
  source: z.string().optional(),
  category: z.string().optional(),
})

type FeedItem = z.infer<typeof feedItemSchema>

const RSS_SOURCES = {
  'Technology': [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
  ],
  'Finance': [
    'https://www.cnbc.com/id/10000664/device/rss/rss.html',
    'https://www.forbes.com/money/feed/',
    'https://www.ft.com/rss/markets',
  ],
  'Sports': [
    'https://www.espn.com/espn/rss/news',
    'https://sports.yahoo.com/rss/',
    'https://www.skysports.com/rss/12040',
  ],
  'Politics': [
    'https://rss.politico.com/politics-news.xml',
    'https://thehill.com/news/feed/',
    'https://www.npr.org/rss/rss.php?id=1014',
  ],
  'Health': [
    'https://www.who.int/rss-feeds/news-english.xml',
    'https://www.healthline.com/rss/news',
    'https://www.medicalnewstoday.com/rss',
  ],
  'Entertainment': [
    'https://variety.com/feed/',
    'https://www.rollingstone.com/feed/',
    'https://deadline.com/feed/',
  ],
  'Science': [
    'https://www.sciencedaily.com/rss/all.xml',
    'https://www.nature.com/nature.rss',
    'https://www.newscientist.com/feed/home/',
  ],
  'World News': [
    'https://www.bbc.co.uk/news/world/rss.xml',
    'https://www.reuters.com/rss/world',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  ],
}

export async function fetchRSSFeeds(category: string) {
  const parser = new Parser()
  const feedUrls = RSS_SOURCES[category] || []
  
  try {
    const feedPromises = feedUrls.map(async (url) => {
      try {
        const feed = await parser.parseURL(url)
        return feed.items.map(item => ({
          title: item.title,
          description: item.contentSnippet || item.content,
          link: item.link,
          source: feed.title || new URL(url).hostname,
          publishedAt: item.pubDate,
          category: category,
          ai_score: Math.floor(Math.random() * 26) + 75 // 75-100 score for demo
        }))
      } catch (error) {
        console.error(`Error fetching RSS from ${url}:`, error)
        return []
      }
    })

    const allFeeds = await Promise.all(feedPromises)
    return allFeeds.flat()

  } catch (error) {
    console.error('Error in fetchRSSFeeds:', error)
    return []
  }
}
