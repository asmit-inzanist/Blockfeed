import { Github, Twitter, MessageCircle } from "lucide-react";
import blockfeedLogo from "@/assets/blockfeed-logo.png";
const Footer = () => {
  return <footer className="pixel-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              
              <div className="font-bold font-mono">
                <span className="gradient-text text-xl tracking-wide">BLOCK</span>
                <span className="text-neon-cyan text-xl">FEED</span>
              </div>
            </div>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              A personal project exploring AI-powered news curation with a retro-futuristic twist.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-bold font-mono uppercase tracking-wide text-neon-cyan">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/todays-feeds" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Today's Feeds</a></li>
              <li><a href="/auth" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Get Started</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Features</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">About</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm font-mono">
            © 2024 BlockFeed. All rights reserved. Built with 💜 for the future.
          </p>
          
          {/* Social links */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-neon-cyan transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-neon-cyan transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-neon-cyan transition-colors">
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;