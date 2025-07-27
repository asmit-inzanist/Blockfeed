import { Button } from "@/components/ui/button";
import { Cpu, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 pixel-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="pixel-border bg-gradient-primary p-2 rounded-sm">
              <Cpu className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="font-bold font-mono">
              <span className="gradient-text text-xl tracking-wide">NEURAL</span>
              <span className="text-neon-cyan text-xl">NEWS</span>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-neon-cyan transition-colors font-mono">
              Features
            </a>
            <a href="#about" className="text-muted-foreground hover:text-neon-cyan transition-colors font-mono">
              About
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-neon-cyan transition-colors font-mono">
              Pricing
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-neon-cyan transition-colors font-mono">
              Contact
            </a>
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" className="font-mono">
              Sign In
            </Button>
            <Button variant="cyber" size="sm" className="font-mono">
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;