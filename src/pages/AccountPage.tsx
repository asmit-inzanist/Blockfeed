import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { Heart, Bookmark, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface LikedArticle {
  id: string;
  article_title: string;
  article_link: string;
  article_source: string;
  article_category: string;
  created_at: string;
}

interface SavedArticle {
  id: string;
  article_title: string;
  article_link: string;
  article_source: string;
  article_category: string;
  created_at: string;
}

interface ActivityData {
  date: string;
  count: number;
}

const ContributionGraph = ({ activityData }: { activityData: ActivityData[] }) => {
  // Detect mobile to render only current month
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  const now = new Date();
  const currentYear = now.getFullYear();
  // Range: full year on desktop, current month on mobile
  const startDate = isMobile ? new Date(currentYear, now.getMonth(), 1) : new Date(currentYear, 0, 1);
  const endDate = isMobile ? new Date(currentYear, now.getMonth() + 1, 0) : new Date(currentYear, 11, 31);
  // Align weeks to Sunday start and Saturday end to match GitHub-like layout
  const startOfFirstWeek = new Date(startDate);
  startOfFirstWeek.setDate(startOfFirstWeek.getDate() - startOfFirstWeek.getDay()); // back to prior Sunday
  const endOfLastWeek = new Date(endDate);
  endOfLastWeek.setDate(endOfLastWeek.getDate() + (6 - endOfLastWeek.getDay())); // forward to Saturday
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Render 7 rows (Sun..Sat) but only show labels for Mon, Wed, Fri like GitHub
  const dayLabelForIndex = (i: number) => (i === 1 ? 'Mon' : i === 3 ? 'Wed' : i === 5 ? 'Fri' : '');
  
  // Create activity map for quick lookup
  const activityMap = new Map();
  activityData.forEach(activity => {
    activityMap.set(activity.date, activity.count);
  });

  // Helper to format yyyy-mm-dd
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];
  // Number of weeks to render
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const numWeeks = Math.round((endOfLastWeek.getTime() - startOfFirstWeek.getTime()) / weekMs) + 1;

  const getColorClass = (count: number) => {
    // Dark gray for visited, muted for not visited
    return count > 0 ? 'bg-gray-700' : 'bg-muted';
  };

  const totalDays = activityData.filter(d => d.count > 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {totalDays} days visited
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Scrollable graph container */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Month labels aligned by week start, with left spacer for day labels */}
              <div className="flex items-start">
                <div className="w-6 md:w-8 mr-2" />
                <div className="flex gap-1 text-xs text-muted-foreground">
                  {Array.from({ length: numWeeks }, (_, weekIndex) => {
                    const weekStart = new Date(startOfFirstWeek.getTime() + weekIndex * weekMs);
                    const label = (weekStart >= startDate && weekStart <= endDate && weekStart.getDate() <= 7)
                      ? months[weekStart.getMonth()] : '';
                    return (
                      <div key={`m-${weekIndex}`} className="w-2 md:w-3 flex-shrink-0 text-center">
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>
          
          {/* Contribution grid */}
          <div className="flex gap-1">
            {/* Day labels (Mon, Wed, Fri only) */}
            <div className="flex flex-col gap-1 mr-2 w-6 md:w-8">
              <div className="h-2 md:h-3"></div> {/* Spacer for month labels */}
              {Array.from({ length: 7 }, (_, i) => (
                <div key={`lbl-${i}`} className="h-2 md:h-3 text-[10px] md:text-xs text-muted-foreground flex items-center">
                  {dayLabelForIndex(i)}
                </div>
              ))}
            </div>
            
            {/* Weeks */}
            {Array.from({ length: numWeeks }, (_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const date = new Date(startOfFirstWeek.getTime() + weekIndex * weekMs + dayIndex * 24 * 60 * 60 * 1000);
                  const inYear = date >= startDate && date <= endDate;
                  const dateStr = toDateStr(date);
                  const count = activityMap.get(dateStr) || 0;
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${inYear ? getColorClass(count) : 'opacity-0'}`}
                      title={inYear && count > 0 ? `${dateStr}: visited` : ''}
                    />
                  );
                })}
              </div>
            ))}
            </div>
          </div>
          </div>
          
          
        </div>
      </CardContent>
    </Card>
  );
};

const AccountPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'liked' | 'saved'>('liked');
  const [likedArticles, setLikedArticles] = useState<LikedArticle[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await Promise.all([
          loadLikedArticles(user.id),
          loadSavedArticles(user.id),
          loadActivityData(user.id)
        ]);
      }
      setLoading(false);
    };

    getUser();
  }, []);

  const loadLikedArticles = async (userId: string) => {
    const { data, error } = await supabase
      .from('liked_articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setLikedArticles(data);
    }
  };

  const loadSavedArticles = async (userId: string) => {
    const { data, error } = await supabase
      .from('saved_articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSavedArticles(data);
    }
  };

  const loadActivityData = async (userId: string) => {
    // Get activity data from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const { data, error } = await supabase
      .from('user_activity')
      .select('activity_date')
      .eq('user_id', userId)
      .gte('activity_date', oneYearAgo.toISOString().split('T')[0]);
    
    if (!error && data) {
      // Count activities per date
      const activityMap = new Map();
      data.forEach(activity => {
        const date = activity.activity_date;
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });
      
      const formattedData = Array.from(activityMap.entries()).map(([date, count]) => ({
        date,
        count
      }));
      
      setActivityData(formattedData);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const removeLikedArticle = async (articleId: string) => {
    await supabase
      .from('liked_articles')
      .delete()
      .eq('id', articleId);
    
    setLikedArticles(prev => prev.filter(article => article.id !== articleId));
  };

  const removeSavedArticle = async (articleId: string) => {
    await supabase
      .from('saved_articles')
      .delete()
      .eq('id', articleId);
    
    setSavedArticles(prev => prev.filter(article => article.id !== articleId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-7xl mx-auto px-4 py-12 pt-24">
          <div className="text-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  const currentArticles = activeSection === 'liked' ? likedArticles : savedArticles;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
          <div className="container max-w-7xl mx-auto px-4 py-12 pt-24">
        <div className="flex gap-6 md:gap-8 flex-col md:flex-row">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-sm font-mono">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              {/* Desktop actions (always visible) */}
              <CardContent className="space-y-2 hidden md:block">
                <Button
                  variant={activeSection === 'liked' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection('liked')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Liked ({likedArticles.length})
                </Button>
                <Button
                  variant={activeSection === 'saved' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection('saved')}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Saved ({savedArticles.length})
                </Button>
                <Separator className="my-4" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>

              {/* Mobile actions inside card as collapsible */}
              <CardContent className="md:hidden">
                <details>
                  <summary className="cursor-pointer px-2 py-2 bg-muted/50 rounded text-sm font-medium">Account Menu</summary>
                  <div className="mt-2 space-y-2">
                    <Button
                      variant={activeSection === 'liked' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveSection('liked')}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Liked ({likedArticles.length})
                    </Button>
                    <Button
                      variant={activeSection === 'saved' ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveSection('saved')}
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Saved ({savedArticles.length})
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </details>
              </CardContent>
            </Card>

            {/* (Removed separate mobile menu; actions now live inside the card) */}
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Activity Graph */}
            <ContributionGraph activityData={activityData} />

            {/* Articles Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {activeSection === 'liked' ? <Heart className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  {activeSection === 'liked' ? 'Liked Articles' : 'Saved Articles'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentArticles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No {activeSection} articles yet.</p>
                    <p className="text-sm mt-2">
                      Start {activeSection === 'liked' ? 'liking' : 'saving'} articles from your feed to see them here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                      {currentArticles.map((article) => (
                        <div key={article.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors h-full flex flex-col">
                          <h3 className="font-medium mb-2">
                            <a 
                              href={article.article_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                            >
                              {article.article_title}
                            </a>
                          </h3>
                          <div className="mt-auto flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="truncate max-w-[40%]">{article.article_source}</span>
                              <span>•</span>
                              <span className="truncate max-w-[40%]">{article.article_category}</span>
                              <span>•</span>
                              <span className="whitespace-nowrap">{new Date(article.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => 
                                  activeSection === 'liked' 
                                    ? removeLikedArticle(article.id)
                                    : removeSavedArticle(article.id)
                                }
                                className="text-destructive hover:text-destructive"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop list (unchanged) */}
                    <div className="hidden md:block">
                      <div className="space-y-4">
                        {currentArticles.map((article) => (
                          <div key={article.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium mb-2">
                                  <a 
                                    href={article.article_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors"
                                  >
                                    {article.article_title}
                                  </a>
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{article.article_source}</span>
                                  <span>•</span>
                                  <span>{article.article_category}</span>
                                  <span>•</span>
                                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => 
                                  activeSection === 'liked' 
                                    ? removeLikedArticle(article.id)
                                    : removeSavedArticle(article.id)
                                }
                                className="text-destructive hover:text-destructive"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;