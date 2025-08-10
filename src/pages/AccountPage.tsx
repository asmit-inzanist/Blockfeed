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
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Mon', 'Wed', 'Fri'];
  
  // Create activity map for quick lookup
  const activityMap = new Map();
  activityData.forEach(activity => {
    activityMap.set(activity.date, activity.count);
  });

  // Generate all days of the year
  const allDays = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const count = activityMap.get(dateStr) || 0;
    allDays.push({
      date: dateStr,
      count,
      dayOfWeek: current.getDay(),
      weekOfYear: Math.ceil((current.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    });
    current.setDate(current.getDate() + 1);
  }

  const getColorClass = (count: number) => {
    // Black for visited, muted for not visited
    return count > 0 ? 'bg-black' : 'bg-muted';
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
          {/* Month labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {months.map(month => (
              <span key={month}>{month}</span>
            ))}
          </div>
          
          {/* Contribution grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              <div className="h-3"></div> {/* Spacer for month labels */}
              {days.map((day, index) => (
                <div key={day} className="h-3 text-xs text-muted-foreground flex items-center">
                  {index < 7 && day}
                </div>
              ))}
            </div>
            
            {/* Weeks */}
            {Array.from({ length: 53 }, (_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayData = allDays.find(d => 
                    d.weekOfYear === weekIndex + 1 && d.dayOfWeek === dayIndex
                  );
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-full ${
                        dayData ? getColorClass(dayData.count) : 'bg-transparent'
                      }`}
                      title={dayData ? `${dayData.date}: ${dayData.count} contributions` : ''}
                    />
                  );
                })}
              </div>
            ))}
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
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
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
              <CardContent className="space-y-2">
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
            </Card>
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