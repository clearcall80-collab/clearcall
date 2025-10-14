import React, { useState, useEffect } from 'react';
import { Video, Copy, Check, Loader2, Users, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { roomService } from '../services/RoomService';
import { toast } from 'sonner@2.0.3';

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinRoom: (roomId: string) => void;
  language: 'en' | 'te';
}

interface ActiveRoom {
  id: string;
  name: string;
  hostName: string;
  participantCount: number;
  created_at: string;
}

export function JoinRoomDialog({ open, onOpenChange, onJoinRoom, language }: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [activeTab, setActiveTab] = useState<'join' | 'create' | 'active'>('join');

  const translations = {
    en: {
      joinRoom: "Join a Room",
      createRoom: "Create New Room",
      activeRooms: "Active Rooms",
      enterCode: "Enter room code to join an existing meeting",
      createNew: "Create a new meeting room and invite others",
      browseActive: "Browse and join active public rooms",
      roomCode: "Room Code",
      enterRoomCode: "Enter 6-digit room code",
      roomName: "Room Name (Optional)",
      enterRoomName: "My Meeting Room",
      join: "Join Room",
      create: "Create Room",
      roomCreated: "Room Created!",
      shareCode: "Share this code with participants:",
      copyCode: "Copy Code",
      copied: "Copied!",
      startMeeting: "Start Meeting",
      cancel: "Cancel",
      noActiveRooms: "No active rooms available",
      participants: "participants",
      created: "Created",
      invalidCode: "Please enter a valid 6-digit room code",
      joiningRoom: "Joining room...",
      creatingRoom: "Creating room...",
      refresh: "Refresh"
    },
    te: {
      joinRoom: "గదిలో చేరండి",
      createRoom: "కొత్త గది సృష్టించండి",
      activeRooms: "క్రియాశీల గదులు",
      enterCode: "ఇప్పటికే ఉన్న మీటింగ్‌లో చేరడానికి రూమ్ కోడ్ నమోదు చేయండి",
      createNew: "కొత్త మీటింగ్ రూమ్ సృష్టించండి మరియు ఇతరులను ఆహ్వానించండి",
      browseActive: "క్రియాశీల పబ్లిక్ రూమ్‌లను బ్రౌజ్ చేయండి మరియు చేరండి",
      roomCode: "రూమ్ కోడ్",
      enterRoomCode: "6-అంకెల రూమ్ కోడ్ నమోదు చేయండి",
      roomName: "రూమ్ పేరు (ఐచ్ఛికం)",
      enterRoomName: "నా మీటింగ్ రూమ్",
      join: "చేరండి",
      create: "సృష్టించండి",
      roomCreated: "రూమ్ సృష్టించబడింది!",
      shareCode: "పాల్గొనేవారితో ఈ కోడ్‌ను భాగస్వామ్యం చేయండి:",
      copyCode: "కోడ్ కాపీ చేయండి",
      copied: "కాపీ చేయబడింది!",
      startMeeting: "మీటింగ్ ప్రారంభించండి",
      cancel: "రద్దు చేయండి",
      noActiveRooms: "క్రియాశీల గదులు అందుబాటులో లేవు",
      participants: "పాల్గొనేవారు",
      created: "సృష్టించబడింది",
      invalidCode: "దయచేసి చెల్లుబాటు అయ్యే 6-అంకెల రూమ్ కోడ్ నమోదు చేయండి",
      joiningRoom: "గదిలో చేరుతోంది...",
      creatingRoom: "గది సృష్టిస్తోంది...",
      refresh: "రిఫ్రెష్"
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (open && activeTab === 'active') {
      fetchActiveRooms();
    }
  }, [open, activeTab]);

  const fetchActiveRooms = async () => {
    setLoadingRooms(true);
    try {
      const result = await roomService.getActiveRooms();
      if (result.rooms) {
        setActiveRooms(result.rooms);
      } else {
        // Use mock data for demo
        setActiveRooms([
          {
            id: 'demo_room_1',
            name: 'Team Standup',
            hostName: 'Alice Johnson',
            participantCount: 3,
            created_at: new Date(Date.now() - 600000).toISOString()
          },
          {
            id: 'demo_room_2',
            name: 'Project Discussion',
            hostName: 'Bob Smith',
            participantCount: 5,
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      // Use mock data as fallback
      setActiveRooms([
        {
          id: 'demo_room_1',
          name: 'Team Standup',
          hostName: 'Alice Johnson',
          participantCount: 3,
          created_at: new Date(Date.now() - 600000).toISOString()
        }
      ]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.length !== 6) {
      toast.error(t.invalidCode);
      return;
    }

    setIsJoining(true);
    try {
      // In a real app, this would validate the room exists
      // For demo, we'll just join with the code
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onJoinRoom(roomCode);
      onOpenChange(false);
      setRoomCode('');
      toast.success(`Joining room ${roomCode}...`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const result = await roomService.createRoom(roomName || undefined);
      if (result.room) {
        const roomId = result.room.id;
        // Extract last 6 characters as room code
        const code = roomId.slice(-6).toUpperCase();
        setCreatedRoomId(code);
        toast.success(t.roomCreated);
      } else {
        // Fallback: create local room
        const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setCreatedRoomId(generatedCode);
        toast.success(t.roomCreated);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      // Fallback: create local room
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setCreatedRoomId(generatedCode);
      toast.success(t.roomCreated);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdRoomId);
      setCopiedCode(true);
      toast.success(t.copied);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleStartMeeting = () => {
    onJoinRoom(createdRoomId);
    onOpenChange(false);
    setCreatedRoomId('');
    setRoomName('');
  };

  const handleJoinActiveRoom = (roomId: string) => {
    onJoinRoom(roomId);
    onOpenChange(false);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return created.toLocaleDateString();
  };

  const handleClose = () => {
    onOpenChange(false);
    setRoomCode('');
    setRoomName('');
    setCreatedRoomId('');
    setActiveTab('join');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {createdRoomId ? t.roomCreated : 'Join or Create a Meeting'}
          </DialogTitle>
          <DialogDescription>
            {createdRoomId ? t.shareCode : 'Join an existing room or create a new one'}
          </DialogDescription>
        </DialogHeader>

        {createdRoomId ? (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t.roomCode}
              </div>
              <div className="text-4xl font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-4">
                {createdRoomId}
              </div>
              <Button
                variant="outline"
                onClick={handleCopyCode}
                className="gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t.copied}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t.copyCode}
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleStartMeeting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Video className="h-4 w-4 mr-2" />
                {t.startMeeting}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="join">{t.join}</TabsTrigger>
              <TabsTrigger value="create">{t.create}</TabsTrigger>
              <TabsTrigger value="active">{t.activeRooms}</TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.enterCode}
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomCode">{t.roomCode}</Label>
                  <Input
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder={t.enterRoomCode}
                    className="text-center text-2xl tracking-wider font-mono"
                    maxLength={6}
                  />
                </div>
                <Button
                  onClick={handleJoinRoom}
                  disabled={roomCode.length !== 6 || isJoining}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.joiningRoom}
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      {t.join}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.createNew}
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">{t.roomName}</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={t.enterRoomName}
                  />
                </div>
                <Button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.creatingRoom}
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      {t.create}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.browseActive}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchActiveRooms}
                  disabled={loadingRooms}
                >
                  {loadingRooms ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.refresh
                  )}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {loadingRooms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : activeRooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t.noActiveRooms}
                  </div>
                ) : (
                  activeRooms.map((room) => (
                    <Card key={room.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{room.name}</h4>
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {room.participantCount}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span>Host: {room.hostName}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(room.created_at)}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleJoinActiveRoom(room.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            {t.join}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}