import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailyBriefingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

const INTEREST_CATEGORIES = [
  "Technology",
  "Finance", 
  "Sports",
  "Politics",
  "Health",
  "Entertainment",
  "Science",
  "World News"
];

const DailyBriefingModal = ({ open, onOpenChange, userEmail }: DailyBriefingModalProps) => {
  const [email, setEmail] = useState(userEmail || "");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const { toast } = useToast();

  // Load existing preferences when modal opens
  useEffect(() => {
    if (open && userEmail) {
      loadExistingPreferences();
    }
  }, [open, userEmail]);

  const loadExistingPreferences = async () => {
    setLoadingPreferences(true);
    try {
      const { data, error } = await supabase
        .from('briefing_preferences')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSelectedInterests(data.interests || []);
        setEmail(data.email);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (selectedInterests.length === 0) {
      toast({
        title: "Select Interests",
        description: "Please select at least one interest category.",
        variant: "destructive"
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to set up your daily briefing.",
          variant: "destructive"
        });
        return;
      }

      // Check if preferences already exist
      const { data: existing } = await supabase
        .from('briefing_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing preferences
        const { error } = await supabase
          .from('briefing_preferences')
          .update({
            email: email.trim(),
            interests: selectedInterests,
            is_active: true
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await supabase
          .from('briefing_preferences')
          .insert({
            user_id: user.id,
            email: email.trim(),
            interests: selectedInterests,
            is_active: true
          });

        if (error) throw error;
      }

      toast({
        title: "Daily Briefing Setup Complete!",
        description: "You'll receive your personalized news briefing daily at 9:00 AM.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error setting up briefing:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to set up your daily briefing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestBriefing = async () => {
    if (selectedInterests.length === 0) {
      toast({
        title: "Select Interests",
        description: "Please select at least one interest category to test.",
        variant: "destructive"
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to test.",
        variant: "destructive"
      });
      return;
    }

    setTestLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to test your daily briefing.",
          variant: "destructive"
        });
        return;
      }

      // Call the send-daily-briefing function directly for testing
      const { data, error } = await supabase.functions.invoke('send-daily-briefing', {
        body: {
          email: email.trim(),
          interests: selectedInterests,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test Briefing Sent!",
        description: `Your test briefing with ${data.articlesCount} articles has been sent to ${email}.`,
      });

    } catch (error) {
      console.error('Error sending test briefing:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test briefing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Daily News Briefing Setup
          </DialogTitle>
        </DialogHeader>

        {loadingPreferences ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading preferences...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Interest Categories */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Select Your Interests
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {INTEREST_CATEGORIES.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={selectedInterests.includes(interest)}
                      onCheckedChange={() => handleInterestToggle(interest)}
                    />
                    <Label 
                      htmlFor={interest} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <Label htmlFor="email" className="text-base font-semibold mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleSubmit}
                disabled={loading || testLoading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting Up...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Get My Daily Update
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleTestBriefing}
                disabled={loading || testLoading}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {testLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending Test...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Briefing Now
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              You'll receive your personalized news briefing every day at 9:00 AM
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DailyBriefingModal;