import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useInteractionTracking } from '@/hooks/useInteractionTracking';
import { useClaraChat } from '@/contexts/ClaraChatContext';

interface NavigationProps {
  onJoinNowClick?: () => void;
}

const Navigation = ({ onJoinNowClick }: NavigationProps = {}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { trackButtonClick, trackLinkClick } = useInteractionTracking();
  const { openClaraChat } = useClaraChat();

  const handleSignInClick = () => {
    trackButtonClick('navigation', 'Sign In', { location: 'header' });
  };

  const handleGetProtectedClick = () => {
    trackButtonClick('navigation', 'Get Protected', { location: 'header' });
  };

  const handleLogoClick = () => {
    trackLinkClick('navigation', '/', 'Logo');
  };

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded">
        Skip to main content
      </a>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm font-poppins">LS</span>
            </div>
            <span className="text-xl font-bold font-poppins text-foreground">
              LifeLink <span className="text-primary">Sync</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#features" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#family" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Family
            </a>
            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <div className="border-l border-border/30 pl-6 ml-2">
              <LanguageCurrencySelector compact />
            </div>
            <div className="flex items-center space-x-3">
              {/* Clara AI Button with Avatar */}
              <button
                onClick={() => {
                  trackButtonClick('navigation', 'Clara AI', { location: 'header' });
                  openClaraChat();
                }}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 hover:border-primary/40 transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src="/clara-avatar.png"
                    alt="Clara AI"
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all duration-300"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Clara</span>
                  <span className="text-[10px] text-muted-foreground block leading-none">AI Assistant</span>
                </div>
              </button>

              <Button asChild variant="outline" size="sm" className="font-medium hover:bg-primary/5 hover:border-primary/30 transition-all duration-200" onClick={handleSignInClick}>
                <Link to="/auth">{t('nav.signIn', 'Sign In')}</Link>
              </Button>
              <Button asChild
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                onClick={handleGetProtectedClick}
              >
                <Link to="/ai-register">Get Protected</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Clara Button */}
            <button
              onClick={() => {
                trackButtonClick('navigation', 'Clara AI', { location: 'header_mobile' });
                openClaraChat();
              }}
              className="relative flex items-center justify-center"
            >
              <img
                src="/clara-avatar.png"
                alt="Clara AI"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            </button>

            <button
              className="p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col space-y-3 py-4">
              <div className="mb-4 px-4">
                <LanguageCurrencySelector />
              </div>
              <a href="#how-it-works" className="text-sm font-medium text-foreground hover:text-primary px-4 py-2" onClick={() => setIsMenuOpen(false)}>
                How It Works
              </a>
              <a href="#features" className="text-sm font-medium text-foreground hover:text-primary px-4 py-2" onClick={() => setIsMenuOpen(false)}>
                Features
              </a>
              <a href="#family" className="text-sm font-medium text-foreground hover:text-primary px-4 py-2" onClick={() => setIsMenuOpen(false)}>
                Family
              </a>
              <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary px-4 py-2" onClick={() => setIsMenuOpen(false)}>
                Pricing
              </a>
              <div className="flex flex-col space-y-3 pt-6 mt-4 border-t border-border mx-4">
                {/* Mobile Clara Chat Button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openClaraChat();
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-200"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src="/clara-avatar.png"
                      alt="Clara AI"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-foreground">Chat with Clara AI</span>
                    <span className="text-xs text-muted-foreground block">Available 24/7 to help</span>
                  </div>
                </button>

                <Button asChild variant="outline" size="sm" className="font-medium hover:bg-primary/5 hover:border-primary/30 transition-all duration-200">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>{t('nav.signIn', 'Sign In')}</Link>
                </Button>
                <Button asChild
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90 font-medium transition-all duration-200 shadow-lg"
                >
                  <Link to="/ai-register" onClick={() => setIsMenuOpen(false)}>
                    Get Protected
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
};

export default Navigation;
