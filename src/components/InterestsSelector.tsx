import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

  const handleAddInterest = (interest: string) => {
    if (!selectedInterests.includes(interest)) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setSelectedInterests(selectedInterests.filter(i => i !== interest));
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

          {/* Suggestion Message */}
          <div className="border rounded-md p-4 bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Want to suggest a topic?</h4>
            <p className="text-sm text-muted-foreground">
              If you'd like to suggest a new topic or interest to be added to our feed, please email your suggestions to{' '}
              <a 
                href="mailto:asmitgoswami27@gmail.com" 
                className="text-primary hover:underline"
              >
                asmitgoswami27@gmail.com
              </a>
            </p>
          </div>

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