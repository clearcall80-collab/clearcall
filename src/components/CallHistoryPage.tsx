import React, { useState, useEffect } from 'react';
import { History, Phone, Video, Clock, Users, Filter, Search, Calendar, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { authService } from '../services/AuthService';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CallRecord {
  id: string;
  type: 'incoming' | 'outgoing' | 'missed';
  participants: string[];
  duration: number;
  quality: 'good' | 'fair' | 'poor';
  timestamp: string;
  room_id?: string;
  features_used: string[];
}

interface CallHistoryPageProps {
  language: 'en' | 'te';
}

export function CallHistoryPage({ language }: CallHistoryPageProps) {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  const translations = {
    en: {
      callHistory: "Call History",
      search: "Search call history...",
      filterBy: "Filter by",
      allTypes: "All Types",
      incoming: "Incoming",
      outgoing: "Outgoing",
      missed: "Missed",
      allTime: "All Time",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      duration: "Duration",
      participants: "participants",
      quality: "Quality",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      features: "Features Used",
      voiceToText: "Voice-to-Text",
      signToText: "Sign-to-Text",
      recording: "Recording",
      chat: "Chat",
      noHistory: "No call history",
      startCalling: "Start making calls to see your history here",
      export: "Export",
      minutes: "min",
      seconds: "sec"
    },
    te: {
      callHistory: "కాల్ చరిత్ర",
      search: "కాల్ చరిత్రను వెతకండి...",
      filterBy: "ఫిల్టర్ చేయండి",
      allTypes: "అన్ని రకాలు",
      incoming: "వచ్చిన కాల్స్",
      outgoing: "వెళ్ళిన కాల్స్",
      missed: "మిస్డ్ కాల్స్",
      allTime: "అన్ని సమయాలు",
      today: "ఈ రోజు",
      thisWeek: "ఈ వారం",
      thisMonth: "ఈ నెల",
      duration: "వ్యవధి",
      participants: "పాల్గొనేవారు",
      quality: "నాణ్యత",
      good: "మంచిది",
      fair: "సరైనది",
      poor: "చెత్తది",
      features: "ఉపయోగించిన ఫీచర్లు",
      voiceToText: "వాయిస్-టు-టెక్స్ట్",
      signToText: "సైన్-టు-టెక్స్ట్",
      recording: "రికార్డింగ్",
      chat: "చాట్",
      noHistory: "కాల్ చరిత్ర లేదు",
      startCalling: "మీ చరిత్రను ఇక్కడ చూడటానికి కాల్స్ చేయడం ప్రారంభించండి",
      export: "ఎగుమతి",
      minutes: "నిమి",
      seconds: "సెకె"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      const accessToken = authService.getAccessToken();
      console.log('Fetching call history with token:', accessToken ? 'Token exists' : 'No token');
      
      if (!accessToken) {
        console.log('No access token - using mock call history data');
        // Use mock data when no token is available
        setCallHistory([
          {
            id: '1',
            type: 'outgoing',
            participants: ['Alice Johnson'],
            duration: 1920,
            quality: 'good',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            features_used: ['Voice-to-Text', 'Chat']
          },
          {
            id: '2',
            type: 'incoming',
            participants: ['Bob Smith', 'Carol Davis'],
            duration: 2700,
            quality: 'good',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            features_used: ['Sign-to-Text', 'Recording']
          },
          {
            id: '3',
            type: 'missed',
            participants: ['David Wilson'],
            duration: 0,
            quality: 'poor',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            features_used: []
          },
          {
            id: '4',
            type: 'outgoing',
            participants: ['Eva Martinez'],
            duration: 1560,
            quality: 'fair',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            features_used: ['Chat']
          },
          {
            id: '5',
            type: 'incoming',
            participants: ['Frank Brown', 'Grace Lee', 'Henry Taylor'],
            duration: 3600,
            quality: 'good',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            features_used: ['Voice-to-Text', 'Sign-to-Text', 'Recording', 'Chat']
          }
        ]);
        setLoading(false);
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/user/call-history`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setCallHistory(data.callHistory || []);
      } else {
        console.log('API unavailable - using mock call history data');
        // Use mock data as fallback
        setCallHistory([
          {
            id: '1',
            type: 'outgoing',
            participants: ['Alice Johnson'],
            duration: 1920,
            quality: 'good',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            features_used: ['Voice-to-Text']
          },
          {
            id: '2',
            type: 'incoming',
            participants: ['Bob Smith'],
            duration: 2700,
            quality: 'good',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            features_used: ['Sign-to-Text']
          }
        ]);
      }
    } catch (error) {
      console.log('Network unavailable - using mock call history data');
      // Use mock data as fallback
      setCallHistory([
        {
          id: '1',
          type: 'outgoing',
          participants: ['Alice Johnson'],
          duration: 1920,
          quality: 'good',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          features_used: ['Voice-to-Text', 'Chat']
        },
        {
          id: '2',
          type: 'incoming',
          participants: ['Bob Smith', 'Carol Davis'],
          duration: 2700,
          quality: 'good',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          features_used: ['Sign-to-Text']
        },
        {
          id: '3',
          type: 'missed',
          participants: ['David Wilson'],
          duration: 0,
          quality: 'poor',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          features_used: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} ${t.seconds}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes} ${t.minutes} ${remainingSeconds} ${t.seconds}` : `${minutes} ${t.minutes}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <Phone className="h-4 w-4 text-green-600 transform rotate-135" />;
      case 'outgoing':
        return <Phone className="h-4 w-4 text-blue-600 transform -rotate-45" />;
      case 'missed':
        return <Phone className="h-4 w-4 text-red-600" />;
      default:
        return <Video className="h-4 w-4 text-gray-600" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = callHistory
    .filter(call => {
      if (filterType !== 'all' && call.type !== filterType) return false;
      if (searchTerm && !call.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
      
      if (filterPeriod !== 'all') {
        const callDate = new Date(call.timestamp);
        const now = new Date();
        
        switch (filterPeriod) {
          case 'today':
            return callDate.toDateString() === now.toDateString();
          case 'thisWeek':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            return callDate >= weekStart;
          case 'thisMonth':
            return callDate.getMonth() === now.getMonth() && callDate.getFullYear() === now.getFullYear();
        }
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t.callHistory}</h2>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t.export}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="pl-10"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allTypes}</SelectItem>
            <SelectItem value="incoming">{t.incoming}</SelectItem>
            <SelectItem value="outgoing">{t.outgoing}</SelectItem>
            <SelectItem value="missed">{t.missed}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allTime}</SelectItem>
            <SelectItem value="today">{t.today}</SelectItem>
            <SelectItem value="thisWeek">{t.thisWeek}</SelectItem>
            <SelectItem value="thisMonth">{t.thisMonth}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t.noHistory}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {t.startCalling}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((call) => (
            <Card key={call.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getCallTypeIcon(call.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {call.participants.join(', ')} 
                          {call.participants.length > 1 && ` (${call.participants.length} ${t.participants})`}
                        </h4>
                        <Badge className={getQualityColor(call.quality)}>
                          {t[call.quality as keyof typeof t] || call.quality}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(call.duration)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(call.timestamp)}
                        </div>
                      </div>
                      {call.features_used && call.features_used.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">{t.features}:</span>
                          <div className="flex gap-1">
                            {call.features_used.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}