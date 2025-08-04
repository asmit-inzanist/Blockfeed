import { Button } from "@/components/ui/button";
import { Sparkles, Brain } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DailyBriefingModal from "./DailyBriefingModal";

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Check if we should open briefing modal from URL
    if (searchParams.get('openBriefing') === 'true') {
      setBriefingModalOpen(true);
      // Clear the URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('openBriefing');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleStartJourney = () => {
    navigate('/todays-feeds');
  };

  const handleDailyBriefing = () => {
    if (user) {
      setBriefingModalOpen(true);
    } else {
      navigate('/auth?openBriefing=true');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Geometric wireframe elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large geometric fox/wolf wireframe - top left */}
        <div className="absolute top-10 left-10 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full stroke-current text-foreground" fill="none" strokeWidth="1">
            {/* Geometric fox head outline */}
            <polygon points="100,20 140,60 140,100 120,120 100,110 80,120 60,100 60,60" />
            <polygon points="70,70 90,90 110,90 130,70" />
            <polygon points="85,95 100,105 115,95" />
            <line x1="100" y1="20" x2="100" y2="40" />
            <line x1="80" y1="40" x2="120" y2="40" />
            <line x1="75" y1="85" x2="85" y2="75" />
            <line x1="125" y1="85" x2="115" y2="75" />
          </svg>
        </div>
        
        {/* Small geometric elements */}
        <div className="absolute top-32 right-20 w-16 h-16 opacity-10">
          <svg viewBox="0 0 50 50" className="w-full h-full stroke-current text-foreground" fill="none" strokeWidth="1">
            <circle cx="25" cy="25" r="20" />
            <circle cx="25" cy="25" r="10" />
            <circle cx="25" cy="25" r="5" />
          </svg>
        </div>
        
        {/* Bottom right geometric pattern */}
        <div className="absolute bottom-20 right-32 w-32 h-32 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-current text-foreground" fill="none" strokeWidth="1">
            <polygon points="50,10 80,40 50,70 20,40" />
            <polygon points="50,25 65,40 50,55 35,40" />
            <line x1="50" y1="10" x2="50" y2="70" />
            <line x1="20" y1="40" x2="80" y2="40" />
          </svg>
        </div>
        
        {/* Small accent shapes */}
        <div className="absolute bottom-40 left-20 w-8 h-8 border border-foreground/10 rotate-45"></div>
        <div className="absolute top-1/2 right-10 w-6 h-12 border border-foreground/10"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main headline */}
          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-bold leading-tight tracking-wider uppercase">
              <span className="text-foreground">News That</span><br />
              <span className="text-foreground">Learns You</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-mono">
              Experience the future of personalized news with AI curation. 
              Your interests, amplified.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="default" 
              size="xl" 
              className="font-mono uppercase tracking-wider"
              onClick={handleStartJourney}
            >
              <Sparkles className="h-5 w-5" />
              Start Your Journey
            </Button>
            
            <Button 
              variant="outline" 
              size="xl" 
              className="font-mono uppercase tracking-wider"
              onClick={handleDailyBriefing}
            >
              <Brain className="h-5 w-5" />
              Get your daily briefing here
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-16 pt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground font-mono">∞</div>
              <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">AI Powered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground font-mono">24/7</div>
              <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">Real-time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground font-mono">100%</div>
              <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">Personalized</div>
            </div>
          </div>
        </div>
      </div>
      
      <DailyBriefingModal
        open={briefingModalOpen}
        onOpenChange={setBriefingModalOpen}
        userEmail={user?.email}
      />
    </section>
  );
};

export default HeroSection;