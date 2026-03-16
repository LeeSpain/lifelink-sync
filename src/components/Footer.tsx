import React from "react";
import { Mail, Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import { useInteractionTracking } from "@/hooks/useInteractionTracking";

const Footer = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { trackLinkClick } = useInteractionTracking();

  const handleFooterLinkClick = (linkType: string, destination: string, text: string) => {
    trackLinkClick('footer', destination, text);
  };

  return (
    <footer className="bg-[hsl(215,28%,17%)] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm font-poppins">LS</span>
              </div>
              <span className="text-lg font-bold font-poppins text-white">
                LifeLink <span className="text-primary">Sync</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {t('footer.description', 'Complete emergency protection for individuals and families. One-touch SOS, Clara AI, live location sharing, and coordinated family response.')}
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a href="https://twitter.com/lifelinksync" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://facebook.com/lifelinksync" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/lifelinksync" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com/company/lifelink-sync" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t('footer.quickLinks', 'Quick Links')}</h3>
            <div className="space-y-2">
              <Link to="/blog" className="block text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('content', '/blog', 'Blog')}>
                {t('footer.blog', 'Blog')}
              </Link>
              <Link to="/privacy" className="block text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('legal', '/privacy', 'Privacy Policy')}>
                {t('footer.privacy', 'Privacy Policy')}
              </Link>
              <Link to="/terms" className="block text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('legal', '/terms', 'Terms of Service')}>
                {t('footer.terms', 'Terms of Service')}
              </Link>
              <Link to="/contact" className="block text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('contact', '/contact', 'Contact')}>
                {t('footer.contactUs', 'Contact')}
              </Link>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t('footer.account', 'Account')}</h3>
            <div className="space-y-2">
              {!user ? (
                <>
                  <Link to="/auth" className="block text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('auth', '/auth', 'Sign In')}>
                    {t('footer.signIn', 'Sign In')}
                  </Link>
                  <Link to="/register" className="block text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('auth', '/register', 'Get Protected')}>
                    {t('footer.getProtected', 'Get Protected')}
                  </Link>
                </>
              ) : (
                <Link to="/auth" className="block text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('auth', '/auth', 'Sign Out')}>
                  {t('footer.signOut', 'Sign Out')}
                </Link>
              )}
              <Link to="/contact" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors" onClick={() => handleFooterLinkClick('contact', '/contact', 'Contact Us')}>
                <Mail className="h-4 w-4" />
                {t('footer.contactUs', 'Contact Us')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-10 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              &copy; 2026 LifeLink Sync. {t('footer.allRightsReserved', 'All rights reserved.')}
            </p>
            <p className="text-xs text-gray-500">
              A Vision-Sync platform
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
