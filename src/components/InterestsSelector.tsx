import React, { useState } from 'react';
import { X, Plus, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface InterestsSelectorProps {
  interests: string[];
  onInterestsChange: (interests: string[]) => void;
}

const PREDEFINED_INTERESTS = [
  // Core Categories
  'Technology', 'Finance', 'Sports', 'Politics', 'Health', 'Entertainment', 'Science', 'World News',
  
  // Tech & Business
  'AI & ML', 'Startups', 'Gaming', 'Cybersecurity', 'Business Tech', 'Business & Economy',
  
  // Culture & Transportation
  'Arts & Culture', 'Automobiles & Mobility',
  
  // Career
  'Classifieds/Jobs',
  
  // Entertainment
  'Horoscopes & Astrology'
];

const InterestsSelector: React.FC<InterestsSelectorProps> = ({ interests, onInterestsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(interests);
  const [suggestionForm, setSuggestionForm] = useState({
    name: '',
    email: '',
    suggestion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const { toast } = useToast();

  const handleAddInterest = (interest: string) => {
    if (!selectedInterests.includes(interest)) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setSelectedInterests(selectedInterests.filter(i => i !== interest));
  };

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-topic-suggestion', {
        body: {
          name: suggestionForm.name,
          email: suggestionForm.email,
          suggestion: suggestionForm.suggestion,
        },
      });

      if (error) throw error;

      toast({
        title: "Thank you for your suggestion!",
        description: "We've received your topic suggestion and will review it soon.",
      });

      setSuggestionForm({ name: '', email: '', suggestion: '' });
      setIsSuggestionOpen(false);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    onInterestsChange(selectedInterests);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedInterests(interests);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    setSelectedInterests([...PREDEFINED_INTERESTS]);
  };

  const handleClearAll = () => {
    setSelectedInterests([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Edit Interests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Your Interests</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Selected Interests */}
          <div>
            <h4 className="text-sm font-medium mb-3">Selected Interests</h4>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/30">
              {selectedInterests.length === 0 ? (
                <span className="text-sm text-muted-foreground">No interests selected</span>
              ) : (
                selectedInterests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="bg-accent text-accent-foreground">
                    {interest}
                    <button
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* All Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Popular Categories</h4>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs">
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs">
                  Clear All
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_INTERESTS.map((interest) => (
                <Button
                  key={interest}
                  variant={selectedInterests.includes(interest) ? "default" : "outline"}
                  size="sm"
                  onClick={() => 
                    selectedInterests.includes(interest) 
                      ? handleRemoveInterest(interest)
                      : handleAddInterest(interest)
                  }
                  className="text-xs"
                >
                  {interest}
                </Button>
              ))}
            </div>
          </div>

          {/* Topic Suggestion Button */}
          <Dialog open={isSuggestionOpen} onOpenChange={setIsSuggestionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-3 h-3 mr-2" />
                Want to suggest a topic?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suggest a Topic</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSendSuggestion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={suggestionForm.name}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={suggestionForm.email}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion">Topic Suggestion</Label>
                  <Textarea
                    id="suggestion"
                    value={suggestionForm.suggestion}
                    onChange={(e) => setSuggestionForm(prev => ({ ...prev, suggestion: e.target.value }))}
                    placeholder="What topics would you like to see in your feed?"
                    required
                    className="resize-none"
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Suggestion
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterestsSelector;
