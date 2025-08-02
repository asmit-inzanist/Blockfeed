import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Github } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import blockfeedLogo from "@/assets/blockfeed-logo.png";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              Contact
            </a>
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" className="font-mono uppercase tracking-wide">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            {user ? (
              <Avatar 
                className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.location.href = '/account'}
              >
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs font-mono">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                className="font-mono uppercase tracking-wide"
                onClick={() => window.location.href = '/auth'}
              >
                Get Started
              </Button>
            )}
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