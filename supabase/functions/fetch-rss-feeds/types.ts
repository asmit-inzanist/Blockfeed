declare global {
  var Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

export interface Article {
  title: string;
  description: string;
  link: string;
  source: string;
  category: string;
  publishedAt?: string;
  ai_score?: number;
}

export interface CustomInterestTerm {
  interest: string;
  terms: string[];
  categories: string[];
}
