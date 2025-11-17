import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { authService } from '../services/AuthService';
import { config } from '../utils/config';

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  hostName: string;
  participants: Array<{
    name: string;
    email: string;
    status: 'pending' | 'accepted' | 'declined';
  }>;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  roomId?: string;
}

interface CalendarPageProps {
  onJoinMeeting?: (roomId: string) => void;
  language?: 'en' | 'te';
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onJoinMeeting }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for creating events
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 60,
    participants: [] as string[]
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = authService.getAccessToken();
      if (!token) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/calendar/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      toast.error('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      if (!eventForm.title || !eventForm.startTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      const token = authService.getAccessToken();
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime || new Date(new Date(eventForm.startTime).getTime() + eventForm.duration * 60 * 1000).toISOString(),
          duration: eventForm.duration,
          participants: eventForm.participants
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create event');
        return;
      }

      const data = await response.json();
      setEvents(prev => [...prev, data.event]);

      setEventForm({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        duration: 60,
        participants: []
      });
      setIsCreateDialogOpen(false);
      toast.success('Event created successfully');
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleJoinMeeting = (event: CalendarEvent) => {
    if (event.roomId && onJoinMeeting) {
      onJoinMeeting(event.roomId);
    } else {
      toast.info('Meeting room not available yet');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const upcomingEvents = events.filter(event =>
    new Date(event.startTime) > new Date() && event.status === 'scheduled'
  );

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">Schedule and manage your meetings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter meeting title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Meeting description (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={eventForm.duration.toString()}
                  onValueChange={(value: string) => setEventForm(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="participants">Participants (emails, comma-separated)</Label>
                <Input
                  id="participants"
                  value={eventForm.participants.join(', ')}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    participants: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  }))}
                  placeholder="john@example.com, jane@example.com"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>
                  Create Meeting
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading events...</div>
              ) : todayEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No meetings scheduled for today
                </div>
              ) : (
                <div className="space-y-4">
                  {todayEvents.map((event) => (
                    <div
                      key={event._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          {event.description && (
                            <p className="text-gray-600 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.participants.length} participants
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                            {new Date(event.startTime) > new Date() && (
                              <Badge variant="outline">
                                Starts in {Math.floor((new Date(event.startTime).getTime() - Date.now()) / (1000 * 60))} min
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {event.roomId && new Date(event.startTime) <= new Date() && (
                            <Button
                              size="sm"
                              onClick={() => handleJoinMeeting(event)}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No upcoming meetings
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <div
                      key={event._id}
                      className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(event.startTime)} at {formatTime(event.startTime)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        <span className="text-xs text-gray-500">
                          {event.participants.length}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
