import { Cpu, Github, Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="pixel-border bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="pixel-border bg-gradient-primary p-2 rounded-sm">
                <Cpu className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="font-bold font-mono">
                <span className="gradient-text text-xl tracking-wide">NEURAL</span>
                <span className="text-neon-cyan text-xl">NEWS</span>
              </div>
            </div>
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              The future of personalized AI news, delivered with retro style and cutting-edge technology.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-bold font-mono uppercase tracking-wide text-neon-cyan">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Features</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Pricing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">API</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Roadmap</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-bold font-mono uppercase tracking-wide text-neon-purple">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-bold font-mono uppercase tracking-wide text-neon-pink">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Privacy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Terms</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-mono">Status</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm font-mono">
            © 2024 NeuralNews. All rights reserved. Built with 💜 for the future.
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
    </footer>
  );
};

export default Footer;