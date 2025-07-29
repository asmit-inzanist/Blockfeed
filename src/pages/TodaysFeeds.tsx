import React, { useState, useEffect } from 'react';
import { Clock, Heart, Bookmark, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Article {
  title: string;
  description: string;
  link: string;
  source: string;
  category: string;
  ai_score?: number;
  publishedAt?: string;
}

const TodaysFeeds = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>(['Technology', 'AI']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedsData();
  }, []);

  const fetchFeedsData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-rss-feeds', {
        body: { categories: ['Technology', 'Sports', 'Finance'] }
      });

      if (error) throw error;

      setArticles(data.articles || []);
      setUserInterests(data.interests || ['Technology', 'AI']);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      // Fallback mock data matching the design
      setArticles([
        {
          title: "AI-Curated News Coming Soon",
          description: "We're working on bringing you personalized AI-curated news. In the meantime, enjoy this placeholder content.",
          link: "#",
          source: "AI",
          category: "AI",
          ai_score: 95
        },
        {
          title: "The Future of Decentralized Information",
          description: "Exploring how blockchain technology is revolutionizing the way we consume and verify news content in the digital age.",
          link: "#",
          source: "AI",
          category: "Blockchain",
          ai_score: 87
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (publishedAt?: string) => {
    if (!publishedAt) return 'now';
    
    const date = new Date(publishedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours === 0) return 'now';
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const handleEditInterests = () => {
    // Placeholder for edit interests functionality
    console.log('Edit interests clicked');
  };

  const handleReadMore = (link: string) => {
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="text-xl font-bold text-foreground">BLOCKFEED</div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">FEATURES</a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">ABOUT</a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">PRICING</a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">CONTACT</a>
              <Button variant="ghost" size="sm">SIGN IN</Button>
              <Button size="sm">GET STARTED</Button>
            </nav>
          </div>
        </header>
        
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-pulse">Loading your personalized feed...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="text-xl font-bold text-foreground">BLOCKFEED</div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">FEATURES</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">ABOUT</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">PRICING</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">CONTACT</a>
            <Button variant="ghost" size="sm">SIGN IN</Button>
            <Button size="sm">GET STARTED</Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            YOUR PERSONALIZED FEED
          </h1>
          <p className="text-muted-foreground">
            AI-curated stories tailored to your interests • {articles.length} articles • Ready to read
          </p>
        </div>

        {/* Your Interests Section */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">Your Interests</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditInterests}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Edit Interests
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your personalized feed is curated based on these interests:
          </p>
          <div className="flex flex-wrap gap-2">
            {userInterests.map((interest, index) => (
              <Badge key={index} variant="secondary" className="bg-accent text-accent-foreground">
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        {/* Articles */}
        <div className="space-y-6">
          {articles.map((article, index) => (
            <article key={index} className="bg-card border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    {article.category}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTimeAgo(article.publishedAt)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  AI: {article.ai_score || 75}%
                </div>
              </div>

              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                {article.title}
              </h3>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {article.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleReadMore(article.link)}
                >
                  Read More
                </Button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TodaysFeeds;