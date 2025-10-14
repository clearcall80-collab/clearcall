import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, TrendingUp, Video, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { authService } from '../services/AuthService';

interface DashboardStatsProps {
  language: 'en' | 'te';
}

export function DashboardStats({ language }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalContacts: 0,
    upcomingMeetings: 0,
    totalMinutes: 0
  });
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      totalCalls: "Total Calls",
      contacts: "Contacts",
      upcomingMeetings: "Upcoming",
      totalMinutes: "Total Minutes",
      thisMonth: "this month",
      saved: "saved",
      scheduled: "scheduled",
      communicated: "communicated"
    },
    te: {
      totalCalls: "మొత్తం కాల్స్",
      contacts: "పరిచయాలు",
      upcomingMeetings: "రాబోయేవి",
      totalMinutes: "మొత్తం నిమిషాలు",
      thisMonth: "ఈ నెల",
      saved: "సేవ్ చేయబడింది",
      scheduled: "షెడ్యూల్ చేయబడింది",
      communicated: "కమ్యూనికేట్ చేయబడింది"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real app, fetch from API
      // For demo, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStats({
        totalCalls: 47,
        totalContacts: 23,
        upcomingMeetings: 5,
        totalMinutes: 1847
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t.totalCalls,
      value: stats.totalCalls,
      subtitle: t.thisMonth,
      icon: Phone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: t.contacts,
      value: stats.totalContacts,
      subtitle: t.saved,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: t.upcomingMeetings,
      value: stats.upcomingMeetings,
      subtitle: t.scheduled,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: t.totalMinutes,
      value: stats.totalMinutes,
      subtitle: t.communicated,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {stat.subtitle}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}