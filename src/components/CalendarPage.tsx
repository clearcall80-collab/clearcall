import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Users, Video, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { authService } from '../services/AuthService';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
  created_at: string;
  room_id: string;
}

interface CalendarPageProps {
  onStartCall: (roomId?: string) => void;
  language: 'en' | 'te';
}

export function CalendarPage({ onStartCall, language }: CalendarPageProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    duration: 60,
    participants: []
  });

  const translations = {
    en: {
      calendar: "Calendar",
      scheduleCall: "Schedule Call",
      title: "Meeting Title",
      date: "Date",
      time: "Time",
      duration: "Duration (minutes)",
      participants: "Participants",
      schedule: "Schedule",
      cancel: "Cancel",
      join: "Join",
      edit: "Edit",
      delete: "Delete",
      noEvents: "No scheduled events",
      scheduleFirst: "Schedule your first meeting to get started",
      upcoming: "Upcoming Events",
      today: "Today",
      tomorrow: "Tomorrow",
      minutes: "min"
    },
    te: {
      calendar: "క్యాలెండర్",
      scheduleCall: "కాల్ షెడ్యూల్ చేయండి",
      title: "మీటింగ్ శీర్షిక",
      date: "తేదీ",
      time: "సమయం",
      duration: "వ్యవధి (నిమిషాలు)",
      participants: "పాల్గొనేవారు",
      schedule: "షెడ్యూల్",
      cancel: "రద్దు చేయండి",
      join: "చేరండి",
      edit: "సవరించండి",
      delete: "తొలగించండి",
      noEvents: "షెడ్యూల్ చేసిన ఈవెంట్లు లేవు",
      scheduleFirst: "ప్రారంభించడానికి మీ మొదటి మీటింగ్‌ను షెడ్యూల్ చేయండి",
      upcoming: "రాబోయే ఈవెంట్లు",
      today: "ఈ రోజు",
      tomorrow: "రేపు",
      minutes: "నిమి"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const accessToken = authService.getAccessToken();
      console.log('Fetching calendar events with token:', accessToken ? 'Token exists' : 'No token');
      
      if (!accessToken) {
        console.log('No access token - using mock calendar data');
        // Use mock data when no token is available
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        setEvents([
          {
            id: '1',
            title: 'Weekly Team Meeting',
            date: tomorrow.toISOString().split('T')[0],
            time: '10:00',
            duration: 60,
            participants: ['alice@example.com', 'bob@example.com'],
            created_at: new Date().toISOString(),
            room_id: 'room_weekly_team'
          },
          {
            id: '2',
            title: 'Project Review',
            date: nextWeek.toISOString().split('T')[0],
            time: '14:30',
            duration: 90,
            participants: ['carol@example.com'],
            created_at: new Date().toISOString(),
            room_id: 'room_project_review'
          }
        ]);
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-b2516160/calendar/events`;
      console.log('Fetching calendar events from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Calendar response status:', response.status);
      const data = await response.json();
      console.log('Calendar response data:', data);
      
      if (response.ok) {
        setEvents(data.events || []);
      } else {
        console.log('API unavailable - using mock calendar data');
        // Use mock data as fallback
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setEvents([
          {
            id: '1',
            title: 'Weekly Team Meeting',
            date: tomorrow.toISOString().split('T')[0],
            time: '10:00',
            duration: 60,
            participants: ['alice@example.com'],
            created_at: new Date().toISOString(),
            room_id: 'room_weekly_team'
          }
        ]);
      }
    } catch (error) {
      console.log('Network unavailable - using mock calendar data');
      // Use mock data as fallback
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setEvents([
        {
          id: '1',
          title: 'Weekly Team Meeting',
          date: tomorrow.toISOString().split('T')[0],
          time: '10:00',
          duration: 60,
          participants: ['alice@example.com'],
          created_at: new Date().toISOString(),
          room_id: 'room_weekly_team'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scheduleEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;

    try {
      const accessToken = authService.getAccessToken();
      if (!accessToken) {
        // Add to local state when no token
        const mockEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          duration: newEvent.duration,
          participants: newEvent.participants,
          created_at: new Date().toISOString(),
          room_id: `room_${Date.now()}`
        };
        setEvents([...events, mockEvent]);
        setNewEvent({ title: '', date: '', time: '', duration: 60, participants: [] });
        setIsAddDialogOpen(false);
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(newEvent)
      });

      const data = await response.json();
      
      if (response.ok) {
        setEvents([...events, data.event]);
        setNewEvent({ title: '', date: '', time: '', duration: 60, participants: [] });
        setIsAddDialogOpen(false);
      } else {
        console.log('API unavailable - scheduling event locally');
        // Add to local state as fallback
        const mockEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          duration: newEvent.duration,
          participants: newEvent.participants,
          created_at: new Date().toISOString(),
          room_id: `room_${Date.now()}`
        };
        setEvents([...events, mockEvent]);
        setNewEvent({ title: '', date: '', time: '', duration: 60, participants: [] });
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.log('Network unavailable - scheduling event locally');
      // Add to local state as fallback
      const mockEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        duration: newEvent.duration,
        participants: newEvent.participants,
        created_at: new Date().toISOString(),
        room_id: `room_${Date.now()}`
      };
      setEvents([...events, mockEvent]);
      setNewEvent({ title: '', date: '', time: '', duration: 60, participants: [] });
      setIsAddDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t.today;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t.tomorrow;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isEventSoon = (date: string, time: string) => {
    const eventDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffMinutes = (eventDateTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes <= 15 && diffMinutes >= 0;
  };

  const sortedEvents = events.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

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
        <h2 className="text-2xl font-semibold">{t.calendar}</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {t.scheduleCall}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.scheduleCall}</DialogTitle>
              <DialogDescription>
                Create a new scheduled meeting with date, time and participants.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t.title}</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder={t.title}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">{t.date}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">{t.time}</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duration">{t.duration}</Label>
                <Select
                  value={newEvent.duration.toString()}
                  onValueChange={(value) => setNewEvent({ ...newEvent, duration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 {t.minutes}</SelectItem>
                    <SelectItem value="60">60 {t.minutes}</SelectItem>
                    <SelectItem value="90">90 {t.minutes}</SelectItem>
                    <SelectItem value="120">120 {t.minutes}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={scheduleEvent} disabled={!newEvent.title || !newEvent.date || !newEvent.time}>
                  {t.schedule}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t.noEvents}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {t.scheduleFirst}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t.upcoming}</h3>
          <div className="grid gap-4">
            {sortedEvents.map((event) => (
              <Card key={event.id} className={`hover:shadow-md transition-shadow ${
                isEventSoon(event.date, event.time) ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </h4>
                        {isEventSoon(event.date, event.time) && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Starting Soon
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(event.time)} ({event.duration} {t.minutes})
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {event.participants.length} participants
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => onStartCall(event.room_id)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!isEventSoon(event.date, event.time)}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        {t.join}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}