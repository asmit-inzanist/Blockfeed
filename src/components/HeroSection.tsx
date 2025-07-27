import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Brain, Gamepad2 } from "lucide-react";
import heroImage from "@/assets/hero-pixel.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Retro grid background */}
      <div className="absolute inset-0 retro-grid opacity-20" />
      
      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="space-y-8">
            {/* Pixel art badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 pixel-border rounded-sm bg-gradient-card">
              <Gamepad2 className="h-4 w-4 text-neon-cyan" />
              <span className="text-sm font-mono text-neon-cyan uppercase tracking-wide">
                AI-Powered • Retro-Style
              </span>
            </div>

            {/* Main headline */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="gradient-text">News</span>{" "}
                <span className="text-foreground">That</span><br />
                <span className="text-neon-cyan">Learns</span>{" "}
                <span className="gradient-text">You</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg font-mono">
                Experience the future of personalized news with AI curation, 
                pixel-perfect design, and Web3 vibes. Your interests, amplified.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="cyber" size="xl" className="group">
                <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                Start Your Journey
              </Button>
              
              <Button variant="pixel" size="xl">
                <Brain className="h-5 w-5" />
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-purple">∞</div>
                <div className="text-sm text-muted-foreground font-mono">AI Powered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-cyan">24/7</div>
                <div className="text-sm text-muted-foreground font-mono">Real-time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-pink">100%</div>
                <div className="text-sm text-muted-foreground font-mono">Personalized</div>
              </div>
            </div>
          </div>

          {/* Right column - Hero image */}
          <div className="relative">
            <div className="relative pixel-border p-4 bg-gradient-card neon-glow">
              <img 
                src={heroImage} 
                alt="AI News Dashboard" 
                className="w-full h-auto rounded-sm"
                style={{ imageRendering: 'pixelated' }}
              />
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 pixel-border bg-card p-3 rounded-sm animate-bounce">
                <Zap className="h-6 w-6 text-retro-orange" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 pixel-border bg-card p-3 rounded-sm animate-pulse">
                <Brain className="h-6 w-6 text-neon-green" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-neon-cyan animate-ping"></div>
      <div className="absolute top-40 right-20 w-3 h-3 bg-neon-pink animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-neon-purple animate-bounce"></div>
      <div className="absolute bottom-40 right-10 w-3 h-3 bg-retro-orange animate-ping"></div>
    </section>
  );
};

export default HeroSection;