// (Previous imports remain the same)

function filterNewsByInterests(newsItems: Article[], userInterests: string[]): Article[] {
  if (!userInterests || userInterests.length === 0) {
    return removeDuplicateArticles(newsItems);
  }

  // First remove duplicates
  const uniqueArticles = removeDuplicateArticles(newsItems);
  
  console.log('Original interests:', userInterests);
  console.log('Processing articles for interests:', userInterests);

  const processedInterests = userInterests.map(interest => {
    const mappedCategory = mapCustomInterestToMainCategory(interest);
    console.log(`Interest "${interest}" mapped to category:`, mappedCategory || 'none');
    return mappedCategory || interest;
  });

  // Get all relevant keywords for the selected interests
  const keywordSets = processedInterests.map(interest => {
    // For predefined interests, use their keyword lists
    const predefinedKeywords = INTEREST_KEYWORDS[interest as keyof typeof INTEREST_KEYWORDS];
    if (predefinedKeywords) {
      console.log(`Predefined keywords for ${interest}:`, predefinedKeywords);
      return new Set(predefinedKeywords.map(k => k.toLowerCase()));
    }
    
    // For custom interests, create keywords from the interest itself
    const customKeywords = new Set([
      interest.toLowerCase(),
      ...interest.toLowerCase().split(/[\s-]+/),
    ]);
    console.log(`Custom keywords for ${interest}:`, Array.from(customKeywords));
    return customKeywords;
  });

  // Filter articles based on keyword matches
  const filteredArticles = uniqueArticles.filter(article => {
    const content = (article.title + " " + article.description).toLowerCase();
    const articleCategory = article.category.toLowerCase();
    
    console.log(`\nProcessing article: "${article.title}"`);
    console.log(`Article category: ${articleCategory}`);
    
    let hasMatch = false;
    
    // For each interest, try to map it to a main category if it's custom
    for (const interest of processedInterests) {
      // First check direct category match
      if (articleCategory === interest.toLowerCase()) {
        console.log(`Direct category match found: ${articleCategory} matches interest ${interest}`);
        hasMatch = true;
        break;
      }
      
      // Try mapping custom interest to main category
      const mappedCategory = mapCustomInterestToMainCategory(interest);
      if (mappedCategory) {
        console.log(`Mapped custom interest "${interest}" to category "${mappedCategory}"`);
        if (articleCategory === mappedCategory.toLowerCase()) {
          console.log(`Mapped category match found: ${articleCategory} matches mapped interest ${mappedCategory}`);
          hasMatch = true;
          break;
        }
      }
    }
    
    // If we already found a category match, return early
    if (hasMatch) return true;
    
    // Check keyword matches
    const keywordMatch = keywordSets.some(keywords => {
      const matchingKeywords = Array.from(keywords).filter(keyword => 
        content.includes(keyword) || articleCategory.includes(keyword)
      );
      if (matchingKeywords.length > 0) {
        console.log(`Keyword matches found:`, matchingKeywords);
        return true;
      }
      return false;
    });
    
    if (!hasMatch && !keywordMatch) {
      console.log('No matches found for this article');
    }
    
    return hasMatch || keywordMatch;
  });

  console.log('\nFiltering summary:', {
    totalArticles: uniqueArticles.length,
    matchedArticles: filteredArticles.length,
    matchRate: `${Math.round((filteredArticles.length / uniqueArticles.length) * 100)}%`
  });

  return filteredArticles;
}

// (Rest of the file remains the same)
