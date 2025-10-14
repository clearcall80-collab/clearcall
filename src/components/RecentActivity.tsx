import React from 'react';
import { Video, Calendar, UserPlus, Phone, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface RecentActivityProps {
  language: 'en' | 'te';
  onStartCall?: (roomId?: string) => void;
  onViewContacts?: () => void;
  onViewHistory?: () => void;
}

interface Activity {
  id: string;
  type: 'call' | 'meeting' | 'contact' | 'schedule';
  title: string;
  description: string;
  timestamp: Date;
  icon: any;
  color: string;
}

export function RecentActivity({ language, onStartCall, onViewContacts, onViewHistory }: RecentActivityProps) {
  const translations = {
    en: {
      recentActivity: "Recent Activity",
      viewAll: "View All",
      justNow: "Just now",
      minutesAgo: "min ago",
      hoursAgo: "h ago",
      daysAgo: "d ago"
    },
    te: {
      recentActivity: "ఇటీవలి కార్యకలాపం",
      viewAll: "అన్నీ చూడండి",
      justNow: "ఇప్పుడే",
      minutesAgo: "నిమి క్రితం",
      hoursAgo: "గం క్రితం",
      daysAgo: "రో క్రితం"
    }
  };

  const t = translations[language];

  const activities: Activity[] = [
    {
      id: '1',
      type: 'call',
      title: 'Video call with Alice Johnson',
      description: 'Duration: 32 minutes',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      icon: Video,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: '2',
      type: 'schedule',
      title: 'Scheduled: Team Meeting',
      description: 'Tomorrow at 10:00 AM',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: Calendar,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    },
    {
      id: '3',
      type: 'contact',
      title: 'Added Bob Smith to contacts',
      description: 'bob@example.com',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      icon: UserPlus,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    },
    {
      id: '4',
      type: 'call',
      title: 'Missed call from Carol Davis',
      description: 'Tap to call back',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      icon: Phone,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20'
    },
    {
      id: '5',
      type: 'meeting',
      title: 'Project Review completed',
      description: 'Duration: 45 minutes',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      icon: Video,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    }
  ];

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return t.justNow;
    if (diffMinutes < 60) return `${diffMinutes} ${t.minutesAgo}`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${t.daysAgo}`;
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.type === 'call' && activity.title.includes('Missed')) {
      onStartCall?.();
    } else if (activity.type === 'contact') {
      onViewContacts?.();
    } else if (activity.type === 'schedule') {
      // Could navigate to calendar
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{t.recentActivity}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewHistory}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-3 -mx-2 rounded-lg transition-all hover:shadow-sm"
              onClick={() => handleActivityClick(activity)}
            >
              <div className={`p-2 rounded-lg ${activity.color} flex-shrink-0`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {activity.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                  {formatTimeAgo(activity.timestamp)}
                </span>
                {activity.type === 'call' && activity.title.includes('Missed') && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartCall?.();
                    }}
                  >
                    {t.callBack}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}