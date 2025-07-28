import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap, Gamepad2, Shield, Sparkles, Cpu } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Personalization",
    description: "Advanced algorithms learn your interests and curate news that matters to you.",
    color: "text-neon-purple"
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Get the latest news instantly with our lightning-fast delivery system.",
    color: "text-neon-cyan"
  },
  {
    icon: Gamepad2,
    title: "Retro Interface",
    description: "Enjoy a unique pixel-art experience that combines nostalgia with modern tech.",
    color: "text-retro-orange"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with cutting-edge encryption and privacy controls.",
    color: "text-neon-green"
  },
  {
    icon: Sparkles,
    title: "Smart Summaries",
    description: "AI-generated summaries help you digest news faster and more effectively.",
    color: "text-neon-pink"
  },
  {
    icon: Cpu,
    title: "Web3 Ready",
    description: "Built for the future with decentralized principles and modern architecture.",
    color: "text-pixel-blue"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 font-mono uppercase tracking-wider">
            <span className="text-foreground">Features Built for</span><br />
            <span className="text-foreground">Tomorrow</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-mono">
            Discover the cutting-edge features that make our AI news platform 
            the ultimate destination for personalized information.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="border border-border bg-card p-8 hover:bg-secondary transition-colors">
              <div className="mb-6">
                <feature.icon className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-xl font-bold font-mono uppercase tracking-wide mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-mono">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;