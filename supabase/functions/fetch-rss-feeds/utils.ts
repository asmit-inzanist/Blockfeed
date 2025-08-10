import { Article } from './types'

export function removeDuplicateArticles(articles: Article[]): Article[] {
  const seen = new Map<string, Article>();
  
  for (const article of articles) {
    // Create a normalized version of the title for comparison
    const normalizedTitle = normalizeString(article.title);
    
    // If we haven't seen this title before, or if this article has a better source/higher score
    if (!seen.has(normalizedTitle) || 
        (article.ai_score || 0) > (seen.get(normalizedTitle)?.ai_score || 0)) {
      seen.set(normalizedTitle, article);
    }
  }
  
  return Array.from(seen.values());
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    // Remove special characters, keeping only letters, numbers and spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateArticleSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeString(title1);
  const norm2 = normalizeString(title2);
  
  // Use Levenshtein distance for similarity
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  
  // Convert distance to similarity score (0-1)
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  // Initialize the matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str1.length][str2.length];
}
