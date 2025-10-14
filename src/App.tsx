import React, { useState, useEffect, Suspense, lazy } from 'react';
import { WelcomePage } from './components/WelcomePage';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { authService } from './services/AuthService';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { JoinRoomPage } from './components/JoinRoomPage';

// Lazy load RoomPage to improve initial load time
const RoomPage = lazy(() => import('./components/RoomPage').then(module => ({ default: module.RoomPage })));

export default function App() {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'login' | 'home' | 'room' | 'joinRoom'>('welcome'); // Added joinRoom page
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [language, setLanguage] = useState<'en' | 'te'>('en');
  const [currentUser, setCurrentUser] = useState<string>(''); // Clear mock user
  const [isLoading, setIsLoading] = useState(true); // Enable loading for session check
  const [currentRoomId, setCurrentRoomId] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (session.user && session.profile) {
        setCurrentUser(session.profile.name);
        setCurrentPage('home');
        
        // Load user preferences
        if (session.profile.preferences) {
          setIsDarkMode(session.profile.preferences.darkMode || false);
          setIsLargeText(session.profile.preferences.largeText || false);
          setLanguage(session.profile.preferences.language as 'en' | 'te' || 'en');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    setCurrentPage('login');
  };

  const navigateToWelcome = async () => {
    await authService.signout();
    setCurrentUser('');
    setCurrentPage('welcome');
  };

  const navigateToHome = (username: string = 'User') => {
    setCurrentUser(username);
    setCurrentPage('home');
  };

  const navigateToRoom = (roomId?: string) => {
    console.log('Navigating to room with ID:', roomId);
    setCurrentRoomId(roomId);
    setCurrentPage('room');
  };

  const navigateBackToHome = () => {
    setCurrentRoomId(undefined);
    setCurrentPage('home');
  };

  const navigateToJoinRoom = () => {
    setCurrentPage('joinRoom');
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save preference to backend
    try {
      const profile = authService.getCurrentProfile();
      if (profile) {
        await authService.updateProfile({
          preferences: {
            ...profile.preferences,
            darkMode: newDarkMode
          }
        });
      }
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  const toggleLargeText = async () => {
    const newLargeText = !isLargeText;
    setIsLargeText(newLargeText);
    
    // Save preference to backend
    try {
      const profile = authService.getCurrentProfile();
      if (profile) {
        await authService.updateProfile({
          preferences: {
            ...profile.preferences,
            largeText: newLargeText
          }
        });
      }
    } catch (error) {
      console.error('Error saving large text preference:', error);
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = language === 'en' ? 'te' : 'en';
    setLanguage(newLanguage);
    
    // Save preference to backend
    try {
      const profile = authService.getCurrentProfile();
      if (profile) {
        await authService.updateProfile({
          preferences: {
            ...profile.preferences,
            language: newLanguage
          }
        });
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Clear Call...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} ${isLargeText ? 'text-lg' : ''}`}>
        <Toaster position="top-center" richColors />
        <div className="transition-opacity duration-500 ease-in-out">
          {currentPage === 'welcome' ? (
          <WelcomePage
            onGetStarted={navigateToLogin}
            isDarkMode={isDarkMode}
            isLargeText={isLargeText}
            language={language}
            onToggleDarkMode={toggleDarkMode}
            onToggleLargeText={toggleLargeText}
            onToggleLanguage={toggleLanguage}
          />
        ) : currentPage === 'login' ? (
          <LoginPage
            onBackToWelcome={navigateToWelcome}
            onLoginSuccess={navigateToHome}
            isDarkMode={isDarkMode}
            isLargeText={isLargeText}
            language={language}
            onToggleDarkMode={toggleDarkMode}
            onToggleLargeText={toggleLargeText}
            onToggleLanguage={toggleLanguage}
          />
        ) : currentPage === 'home' ? (
          <HomePage
            currentUser={currentUser}
            onSignOut={navigateToWelcome}
            onStartCall={navigateToRoom}
            onJoinCall={navigateToJoinRoom}
            isDarkMode={isDarkMode}
            isLargeText={isLargeText}
            language={language}
            onToggleDarkMode={toggleDarkMode}
            onToggleLargeText={toggleLargeText}
            onToggleLanguage={toggleLanguage}
          />
        ) : currentPage === 'joinRoom' ? (
          <JoinRoomPage
            onJoinRoom={(roomId) => {
              navigateToRoom(roomId);
            }}
            onBack={navigateToHome}
          />
        ) : currentPage === 'room' ? (
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-white">Loading video call...</p>
                <p className="text-sm text-gray-400 mt-2">This should only take a moment</p>
              </div>
            </div>
          }>
            <RoomPage
              currentUser={currentUser}
              onLeaveRoom={navigateBackToHome}
              roomId={currentRoomId}
              isDarkMode={isDarkMode}
              isLargeText={isLargeText}
              language={language}
              onToggleDarkMode={toggleDarkMode}
              onToggleLargeText={toggleLargeText}
              onToggleLanguage={toggleLanguage}
            />
          </Suspense>
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );
}
