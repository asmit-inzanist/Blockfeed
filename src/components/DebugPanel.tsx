import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DebugPanelProps {
  totalArticles: number;
  filteredArticles: number;
  userInterests: string[];
  sampleTitles: string[];
  loading: boolean;
  customInterestTerms?: {
    interest: string;
    terms: string[];
    categories: string[];
  }[];
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  totalArticles,
  filteredArticles,
  userInterests,
  sampleTitles,
  loading,
  customInterestTerms = []
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getKeywordsForCategory = (category: string): string[] => {
    const keywordMap: Record<string, string[]> = {
      'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'computer'],
      'finance': ['finance', 'business', 'economy', 'stock', 'market'],
      'sports': ['football', 'soccer', 'basketball', 'tennis', 'cricket'],
      'politics': ['politics', 'election', 'government', 'parliament', 'minister'],
      'health': ['health', 'medical', 'hospital', 'doctor', 'medicine'],
      'entertainment': ['entertainment', 'movie', 'film', 'music', 'celebrity'],
      'science': ['science', 'research', 'study', 'discovery', 'climate'],
      'world news': ['international', 'global', 'world', 'country', 'nation']
    };
    return keywordMap[category.toLowerCase()] || [];
  };

  return (
    <Card className="mb-6 border-dashed border-orange-200 bg-orange-50/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Debug Information
              </CardTitle>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{totalArticles}</div>
                <div className="text-xs text-muted-foreground">Total Fetched</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{filteredArticles}</div>
                <div className="text-xs text-muted-foreground">After Filtering</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{userInterests.length}</div>
                <div className="text-xs text-muted-foreground">Interests</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">
                  {totalArticles > 0 ? Math.round((filteredArticles / totalArticles) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Match Rate</div>
              </div>
            </div>

            {/* Current Interests */}
            <div>
              <h4 className="text-sm font-medium mb-2">Active Interests:</h4>
              <div className="flex flex-wrap gap-1">
                {userInterests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <h4 className="text-sm font-medium mb-2">Filtering Keywords:</h4>
              <div className="space-y-2">
                {/* Show keywords for predefined interests */}
                {userInterests
                  .filter(interest => !customInterestTerms?.some(c => c.interest === interest))
                  .map((interest) => {
                    const keywords = getKeywordsForCategory(interest);
                    return keywords.length > 0 ? (
                      <div key={interest} className="text-xs">
                        <span className="font-medium text-muted-foreground">{interest}:</span>
                        <span className="ml-2 text-muted-foreground">
                          {keywords.slice(0, 5).join(', ')}
                          {keywords.length > 5 && '...'}
                        </span>
                      </div>
                    ) : null;
                  })}
                
                {/* Show AI-generated terms for custom interests */}
                {customInterestTerms?.map(({ interest, terms, categories }) => (
                  <div key={interest} className="space-y-1">
                    <div className="text-xs">
                      <span className="font-medium text-purple-600">{interest} (Custom):</span>
                    </div>
                    <div className="text-xs pl-4">
                      <span className="font-medium text-muted-foreground">Search Terms: </span>
                      <span className="text-muted-foreground">
                        {terms.slice(0, 5).join(', ')}
                        {terms.length > 5 && '...'}
                      </span>
                    </div>
                    <div className="text-xs pl-4">
                      <span className="font-medium text-muted-foreground">Categories: </span>
                      <span className="text-muted-foreground">
                        {categories.slice(0, 3).join(', ')}
                        {categories.length > 3 && '...'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Filtered Titles */}
            {sampleTitles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Sample Filtered Articles:</h4>
                <div className="space-y-1">
                  {sampleTitles.map((title, index) => (
                    <div key={index} className="text-xs text-muted-foreground truncate">
                      • {title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="text-xs text-muted-foreground">
              Status: {loading ? 'Loading...' : 'Ready'} | 
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DebugPanel;