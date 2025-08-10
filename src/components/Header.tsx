import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Menu, Github, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import blockfeedLogo from "@/assets/blockfeed-logo.png";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
        },
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });

      setContactForm({ name: '', email: '', message: '' });
      setContactOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              className="font-bold font-mono text-xl uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.location.href = '/'}
            >
              BLOCKFEED
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/features" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              Features
            </a>
            <a href="https://www.linkedin.com/in/asmit-goswami-22b924278/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              Connect
            </a>
            <a href="/todays-feeds" className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
              Feed
            </a>
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wide">
                  Contact
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-mono uppercase tracking-wide">Contact Us</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Your message..."
                      required
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full font-mono uppercase tracking-wide">
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" className="font-mono uppercase tracking-wide" onClick={() => window.open('https://github.com/asmit-inzanist/pixel-synth-feed', '_blank')}>
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

          {/* Mobile nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="mt-6 flex flex-col gap-3">
                  <SheetClose asChild>
                    <a href="/features" className="text-foreground font-mono uppercase tracking-wide py-2">Features</a>
                  </SheetClose>
                  <SheetClose asChild>
                    <a href="/todays-feeds" className="text-foreground font-mono uppercase tracking-wide py-2">Feed</a>
                  </SheetClose>
                  <SheetClose asChild>
                    <a href="https://www.linkedin.com/in/asmit-goswami-22b924278/" target="_blank" rel="noreferrer" className="text-foreground font-mono uppercase tracking-wide py-2">Connect</a>
                  </SheetClose>
                  <SheetClose asChild>
                    <button className="text-foreground text-left font-mono uppercase tracking-wide py-2" onClick={() => setContactOpen(true)}>Contact</button>
                  </SheetClose>
                  <SheetClose asChild>
                    <button className="text-foreground text-left font-mono uppercase tracking-wide py-2" onClick={() => window.open('https://github.com/asmit-inzanist/pixel-synth-feed', '_blank')}>GitHub</button>
                  </SheetClose>
                  {user ? (
                    <SheetClose asChild>
                      <button className="text-foreground text-left font-mono uppercase tracking-wide py-2" onClick={() => (window.location.href = '/account')}>Account</button>
                    </SheetClose>
                  ) : (
                    <SheetClose asChild>
                      <button className="text-foreground text-left font-mono uppercase tracking-wide py-2" onClick={() => (window.location.href = '/auth')}>Get Started</button>
                    </SheetClose>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;