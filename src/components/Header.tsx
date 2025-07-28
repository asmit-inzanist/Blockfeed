import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import blockfeedLogo from "@/assets/blockfeed-logo.png";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="font-bold font-mono text-xl uppercase tracking-wider">
              BLOCKFEED
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              Features
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              About
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              Pricing
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              Contact
            </a>
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" className="font-mono uppercase tracking-wide">
              Sign In
            </Button>
            <Button variant="default" size="sm" className="font-mono uppercase tracking-wide">
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