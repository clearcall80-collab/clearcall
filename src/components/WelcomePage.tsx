import React from 'react';
import { ArrowRight, Eye, Type } from 'lucide-react';
import { Button } from './ui/button';
import { TeluguPattern } from './TeluguPattern';
import clearCallLogo from 'figma:asset/f9194e66d972da18a073c4190f2912c9bf5d6601.png';

interface WelcomePageProps {
  onGetStarted: () => void;
  isDarkMode: boolean;
  isLargeText: boolean;
  language: 'en' | 'te';
  onToggleDarkMode: () => void;
  onToggleLargeText: () => void;
  onToggleLanguage: () => void;
}

export function WelcomePage({
  onGetStarted,
  isDarkMode,
  isLargeText,
  language,
  onToggleDarkMode,
  onToggleLargeText,
  onToggleLanguage
}: WelcomePageProps) {
  const translations = {
    en: {
      welcome: "WELCOME TO CLEAR CALL",
      tagline: "Not just hearing, but understanding.",
      getStarted: "GET STARTED",
      darkMode: "Toggle Dark Mode",
      largeText: "Toggle Large Text",
      language: "తెలుగు"
    },
    te: {
      welcome: "క్లియర్ కాల్‌కు స్వాగతం",
      tagline: "కేవలం వినడం మాత్రమే కాదు, అర్థం చేసుకోవడం.",
      getStarted: "��్రారంభించండి",
      darkMode: "డార్క్ మోడ్",
      largeText: "పెద్ద వచనం",
      language: "English"
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Accessibility Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDarkMode}
          className="bg-white/80 hover:bg-white/90 dark:bg-gray-800/80 dark:hover:bg-gray-700/90"
          title={t.darkMode}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLargeText}
          className="bg-white/80 hover:bg-white/90 dark:bg-gray-800/80 dark:hover:bg-gray-700/90"
          title={t.largeText}
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLanguage}
          className="bg-white/80 hover:bg-white/90 dark:bg-gray-800/80 dark:hover:bg-gray-700/90"
        >
          {t.language}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Logo */}
        <div className="mb-12">
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300 bg-teal-500">
            <img
              src={clearCallLogo}
              alt="Clear Call Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title and Tagline */}
        <div className="text-center mb-16 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-gray-900 dark:text-white mb-6 tracking-wide">
            {t.welcome}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 uppercase tracking-wide font-light">
            {t.tagline}
          </p>
        </div>

        {/* Get Started Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-xl md:text-2xl text-gray-900 dark:text-white tracking-wide uppercase">
            {t.getStarted}
          </div>
          <Button
            onClick={onGetStarted}
            className="w-16 h-16 md:w-20 md:h-20 bg-blue-500 hover:bg-blue-600 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center p-0"
          >
            <ArrowRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </Button>
        </div>
      </div>

      {/* Footer with Telugu Pattern */}
      <div className="relative mt-auto">
        <TeluguPattern />
        <div className="bg-gradient-to-r from-blue-600/10 to-teal-600/10 dark:from-blue-400/10 dark:to-teal-400/10 p-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Clear Call - Inclusive Communication Platform
          </div>
        </div>
      </div>
    </div>
  );
}