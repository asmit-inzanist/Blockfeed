import { Button } from "@/components/ui/button";
import { Sparkles, Brain } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Geometric background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 border border-foreground/10 rotate-45"></div>
        <div className="absolute top-40 right-32 w-24 h-24 rounded-full border border-foreground/10"></div>
        <div className="absolute bottom-32 left-32 w-20 h-20 border border-foreground/10 rotate-12"></div>
        <div className="absolute bottom-20 right-20 w-16 h-32 border border-foreground/10 rotate-45"></div>
        <div className="absolute top-1/2 left-10 w-6 h-6 bg-foreground/5 rotate-45"></div>
        <div className="absolute top-1/3 right-10 w-8 h-8 rounded-full bg-foreground/5"></div>
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