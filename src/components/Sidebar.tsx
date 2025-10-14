import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Volume2, VolumeX, Video, VideoOff } from 'lucide-react';
import { Button } from './ui/button';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
}

interface SidebarProps {
  activeTab: 'chat' | 'participants';
  setActiveTab: (tab: 'chat' | 'participants') => void;
  chatMessages: ChatMessage[];
  participants: Participant[];
  currentUser: string;
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  sendMessage: () => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  chatMessages,
  participants,
  currentUser,
  chatMessage,
  setChatMessage,
  sendMessage,
  onClose
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="chat" className="data-[state=active]:bg-gray-600">
              Chat
            </TabsTrigger>
            <TabsTrigger value="participants" className="data-[state=active]:bg-gray-600">
              Participants ({participants.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-white"
        >
          &times;
        </Button>
      </div>

      <Tabs value={activeTab} className="flex-1 flex flex-col">
        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Gesture Information Note */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="text-xs font-medium text-blue-300 mb-2">🤟 Gesture Recognition</div>
                <div className="text-xs text-gray-300">
                  <div className="mb-1">Supported gestures include:</div>
                  <div className="text-xs text-gray-400">
                    Hello, Thank You, Yes, No, Please, Sorry, Good, Bad, Help, Stop, Love, Congratulations, Welcome, I Love You, Good Morning, How Are You, Fine Thank You, What Time Is It, I Don't Understand, Can You Repeat, Nice To Meet You, Excuse Me, Where Is, Bathroom, Hungry, Thirsty, Tired, Sleep, Eat, Drink, Friend, Family, Home, School, Work, Money, Phone, Computer, Car, Bus, Train, Plane, Hot, Cold, Rain, Sun, Moon, Happy, Sad, Angry, Surprised, Scared, Pain, Sick, Doctor, Medicine, Food, Water, Coffee, Tea, Bread, Meat, Vegetables, Fruit, Milk, Juice, Breakfast, Lunch, Dinner, Red, Blue, Green, Yellow, Black, White, Big, Small, Fast, Slow, New, Old, Clean, Dirty, Open, Close, Up, Down, Left, Right, Inside, Outside, Before, After, Now, Later, Yesterday, Tomorrow, Today, Week, Month, Year, One, Two, Three, Four, Five, Ten, Twenty, Hundred, Thousand, First, Second, Third, Last, More, Less, Enough, All, Some, Many, Few, Question, Answer, Yes Please, No Thanks, Maybe, Sure, Okay, Perfect, Great, Wonderful, Amazing, Terrible, Awful, Beautiful, Ugly, Easy, Difficult, Important, Urgent, Emergency, Danger, Safe, Careful.
                  </div>
                </div>
              </div>

              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium">
                      {msg.sender === currentUser ? 'You' : msg.sender}
                    </span>
                    <span>{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="text-sm text-gray-200">{msg.message}</div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded px-3 py-2 flex-1"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button
                onClick={sendMessage}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="participants" className="flex-1 p-4 m-0">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {participant.name} {participant.id === '1' && '(You)'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {participant.isSpeaking && <span className="text-green-400">Speaking</span>}
                      {participant.isHandRaised && <span className="text-yellow-400">Hand Raised</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {participant.isAudioOn ? (
                      <Volume2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-red-400" />
                    )}
                    {participant.isVideoOn ? (
                      <Video className="h-4 w-4 text-green-400" />
                    ) : (
                      <VideoOff className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
