import React, { useState } from 'react';
import {
  Menu,
  Eye,
  Type,
  Calendar,
  Users,
  MessageSquare,
  History,
  UserCircle,
  Settings,
  LogOut,
  Phone,
  UserPlus,
  Clock,
  Video,
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { TeluguPattern } from './TeluguPattern';
import { ContactsPage } from './ContactsPage';
import { CalendarPage } from './CalendarPage';
import { CallHistoryPage } from './CallHistoryPage';
import { ProfilePage } from './ProfilePage';
import { JoinRoomDialog } from './JoinRoomDialog';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { QuickStartGuide } from './QuickStartGuide';
import { toast, Toaster } from 'sonner';
import clearCallLogo from '../assets/cc.png';

interface HomePageProps {
  currentUser: string;
  onSignOut: () => void;
  onStartCall: (roomId?: string) => void;
  onJoinCall: () => void;
  isDarkMode: boolean;
  isLargeText: boolean;
  language: 'en' | 'te';
  onToggleDarkMode: () => void;
  onToggleLargeText: () => void;
  onToggleLanguage: () => void;
}

export function HomePage({
  currentUser,
  onSignOut,
  onStartCall,
  isDarkMode,
  isLargeText,
  language,
  onToggleDarkMode,
  onToggleLargeText,
  onToggleLanguage
}: HomePageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'calendar' | 'contacts' | 'chats' | 'history' | 'profile' | 'settings'>('dashboard');
  const [isJoinRoomDialogOpen, setIsJoinRoomDialogOpen] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(() => {
    // Show quick start guide for first-time users
    return !localStorage.getItem('clearCallQuickStartDismissed');
  });

  const translations = {
    en: {
      hello: "Hello",
      readyToConnect: "ready to connect?",
      startNewCall: "Start a New Call",
      joinRoom: "Join a Room",
      scheduleCall: "Schedule a Call",
      calendar: "Calendar",
      contacts: "Contacts",
      chats: "Chats",
      historyLogs: "History Logs",
      profile: "Profile",
      settings: "Settings",
      signOut: "Sign Out",
      tagline: "Not just hearing, but understanding",
      darkMode: "Toggle Dark Mode",
      largeText: "Toggle Large Text",
      language: "తెలుగు"
    },
    te: {
      hello: "హలో",
      readyToConnect: "కనెక్ట్ అవ్వడానికి సిద్దమా?",
      startNewCall: "కొత్త కాల్ ప్రారంభించండి",
      joinRoom: "గదిలో చేరండి",
      scheduleCall: "కాల్ షెడ్యూల్ చేయండి",
      calendar: "క్యాలెండర్",
      contacts: "పరిచయాలు",
      chats: "చాట్‌లు",
      historyLogs: "చరిత్ర లాగ్‌లు",
      profile: "ప్రొఫైల్",
      settings: "సెట్టింగ్‌లు",
      signOut: "సైన్ అవుట్",
      tagline: "కేవలం వినడం మాత్రమే కాదు, అర్థం చేసుకోవడం",
      darkMode: "డార్క్ మోడ్",
      largeText: "పెద్ద వచనం",
      language: "English"
    }
  };

  const t = translations[language];

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard' },
    { icon: Calendar, label: t.calendar, id: 'calendar' },
    { icon: Users, label: t.contacts, id: 'contacts' },
    { icon: MessageSquare, label: t.chats, id: 'chats' },
    { icon: History, label: t.historyLogs, id: 'history' },
    { icon: UserCircle, label: t.profile, id: 'profile' },
    { icon: Settings, label: t.settings, id: 'settings' },
  ];

  const handleMenuItemClick = (id: string) => {
    setCurrentView(id as any);
    setSidebarOpen(false);
  };

  const handleCallAction = (action: string) => {
    console.log(`Call action: ${action}`);
    if (action === 'start') {
      onStartCall();
    } else if (action === 'join') {
      setIsJoinRoomDialogOpen(true);
    } else if (action === 'schedule') {
      setCurrentView('calendar');
    }
  };

  const handleJoinRoom = (roomId: string) => {
    console.log('Joining room:', roomId);
    toast.success(`Joining room ${roomId}...`);
    onStartCall(roomId);
  };

  const handleDismissQuickStart = () => {
    setShowQuickStart(false);
    localStorage.setItem('clearCallQuickStartDismissed', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-blue-900 dark:to-teal-900 flex flex-col">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>
                    Access main features and settings for Clear Call
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden">
                        <img
                          src={clearCallLogo}
                          alt="Clear Call"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h2 className="font-semibold">Clear Call</h2>
                        <p className="text-sm text-muted-foreground">Inclusive Communication</p>
                      </div>
                    </div>
                  </div>
                  
                  <nav className="flex-1 p-4">
                    <div className="space-y-2">
                      {menuItems.map((item) => (
                        <Button
                          key={item.id}
                          variant={currentView === item.id ? "default" : "ghost"}
                          className={`w-full justify-start gap-3 text-left ${
                            currentView === item.id 
                              ? "bg-blue-600 text-white hover:bg-blue-700" 
                              : "hover:bg-blue-50 dark:hover:bg-blue-900/50"
                          }`}
                          onClick={() => handleMenuItemClick(item.id)}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </nav>

                  <div className="p-4 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={onSignOut}
                    >
                      <LogOut className="h-5 w-5" />
                      {t.signOut}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img
                  src={clearCallLogo}
                  alt="Clear Call"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white hidden sm:block">
                Clear Call
              </span>
            </div>
          </div>

          {/* Right side - User Profile and Controls */}
          <div className="flex items-center gap-3">
            {/* Accessibility Controls */}
            <div className="hidden md:flex gap-2">
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

            {/* User Profile */}
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/50 px-3 py-2 rounded-full">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  {currentUser.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-900 dark:text-white hidden sm:block">
                {currentUser}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Join Room Dialog */}
      <JoinRoomDialog
        open={isJoinRoomDialogOpen}
        onOpenChange={setIsJoinRoomDialogOpen}
        onJoinRoom={handleJoinRoom}
        language={language}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <div>
              {/* Welcome Message */}
              <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl text-gray-900 dark:text-white mb-4">
                  {t.hello} {currentUser},
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light">
                  {t.readyToConnect}
                </p>
              </div>

              {/* Quick Start Guide - Show for first-time users */}
              {showQuickStart && (
                <div className="mb-8">
                  <QuickStartGuide 
                    language={language}
                    onDismiss={handleDismissQuickStart}
                  />
                </div>
              )}

              {/* Dashboard Stats */}
              <DashboardStats language={language} />

              {/* Action Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" onClick={() => handleCallAction('start')}>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                      {t.startNewCall}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Begin an instant video call with full accessibility features
                    </p>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleCallAction('start');
                      }}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Start Call
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" onClick={() => handleCallAction('join')}>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center group-hover:bg-teal-200 dark:group-hover:bg-teal-800 transition-colors">
                      <UserPlus className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                      {t.joinRoom}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Enter a room code to join an ongoing conversation
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/50"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleCallAction('join');
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Join Room
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" onClick={() => handleCallAction('schedule')}>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                      <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                      {t.scheduleCall}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Plan your meetings with calendar integration
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleCallAction('schedule');
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <RecentActivity 
                language={language} 
                onStartCall={onStartCall}
                onViewContacts={() => setCurrentView('contacts')}
                onViewHistory={() => setCurrentView('history')}
              />
            </div>
          )}

          {currentView === 'calendar' && (
            <CalendarPage onStartCall={onStartCall} language={language} />
          )}

          {currentView === 'contacts' && (
            <ContactsPage onStartCall={onStartCall} language={language} />
          )}

          {currentView === 'history' && (
            <CallHistoryPage language={language} />
          )}

          {currentView === 'profile' && (
            <ProfilePage 
              language={language}
              isDarkMode={isDarkMode}
              isLargeText={isLargeText}
              onToggleDarkMode={onToggleDarkMode}
              onToggleLargeText={onToggleLargeText}
              onToggleLanguage={onToggleLanguage}
            />
          )}

          {currentView === 'chats' && (
            <div className="text-center py-20">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Chat Feature Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Direct messaging and group chats will be available in the next update
              </p>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="text-center py-20">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Advanced Settings
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Additional settings and preferences will be available here
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Telugu Pattern */}
      <div className="relative mt-auto">
        <TeluguPattern />
        <div className="bg-gradient-to-r from-blue-600/10 to-teal-600/10 dark:from-blue-400/10 dark:to-teal-400/10 p-6">
          <div className="text-center">
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-medium mb-2">
              Clear Call – {t.tagline}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 Clear Call - Inclusive Communication Platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}