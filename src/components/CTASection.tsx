import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
const CTASection = () => {
  return <section className="py-20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      <div className="absolute inset-0 retro-grid opacity-20" />
      
      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-neon-cyan animate-pulse opacity-60"></div>
      <div className="absolute top-20 right-20 w-3 h-3 bg-neon-pink animate-bounce opacity-60"></div>
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-retro-orange animate-ping opacity-60"></div>
      <div className="absolute bottom-10 right-10 w-5 h-5 bg-neon-purple animate-pulse opacity-60"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 pixel-border bg-gradient-card rounded-sm">
            <Sparkles className="h-4 w-4 text-neon-cyan animate-pulse" />
            <span className="text-sm font-mono text-neon-cyan uppercase tracking-wide">
              Ready to Experience the Future?
            </span>
          </div>

          {/* Main CTA */}
          <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
            <span className="gradient-text">Join the</span>{" "}
            <span className="text-foreground">Revolution</span><br />
            <span className="text-neon-cyan">Today</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-mono leading-relaxed">
            Start your journey into personalized AI news. 
            Experience the perfect blend of cutting-edge technology and retro aesthetics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Button variant="cyber" size="xl" className="group min-w-[200px]">
              <Zap className="h-5 w-5 group-hover:animate-pulse" />
              Get Started Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            
          </div>

          {/* Trust indicators */}
          <div className="pt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span>100% Free to Start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></div>
              <span>Setup in 2 Minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default CTASection;