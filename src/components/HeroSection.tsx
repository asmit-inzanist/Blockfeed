import { Button } from "@/components/ui/button";
import { Sparkles, Brain } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 py-20">
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
            <Button variant="default" size="xl" className="font-mono uppercase tracking-wider">
              <Sparkles className="h-5 w-5" />
              Start Your Journey
            </Button>
            
            <Button variant="outline" size="xl" className="font-mono uppercase tracking-wider">
              <Brain className="h-5 w-5" />
              Learn More
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
    </section>
  );
};

export default HeroSection;