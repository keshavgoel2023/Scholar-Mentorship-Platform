import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg transition-all duration-300 ${
      scrolled ? "py-3 shadow-lg" : "py-4"
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Scholar
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/mentors" className="text-foreground/80 hover:text-foreground transition-colors">
              Find Mentors
            </Link>
            <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">
              Pricing
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Link to="/auth/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-primary">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
