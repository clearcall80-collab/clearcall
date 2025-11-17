import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Volume2, VolumeX, Video, VideoOff, Send, Smile, Paperclip, MoreVertical, Reply, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle typing indicator
  useEffect(() => {
    if (chatMessage.trim()) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [chatMessage]);

  const handleEmojiClick = (emoji: string) => {
    setChatMessage(chatMessage + emoji);
    setShowEmojiPicker(false);
  };

  const handleMessageAction = (action: string, messageId: string) => {
    // Placeholder for message actions
    console.log(`${action} message ${messageId}`);
  };

  const emojis = ['😀', '😂', '❤️', '👍', '👎', '👋', '🙏', '🎉', '🔥', '💯'];

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="chat" className="data-[state=active]:bg-gray-600">
              Chat ({chatMessages.length})
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
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {/* Gesture Information Note */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="text-xs font-medium text-blue-300 mb-2">🤟 Gesture Recognition</div>
                <div className="text-xs text-gray-300">
                  <div className="mb-1">Supported gestures include:</div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Hello, Thank You, Yes, No, Please, Sorry, Good, Bad, Help, Stop, Love, Congratulations, Welcome, I Love You, Good Morning, How Are You, Fine Thank You, What Time Is It, I Don't Understand, Can You Repeat, Nice To Meet You, Excuse Me, Where Is, Bathroom, Hungry, Thirsty, Tired, Sleep, Eat, Drink, Friend, Family, Home, School, Work, Money, Phone, Computer, Car, Bus, Train, Plane, Hot, Cold, Rain, Sun, Moon, Happy, Sad, Angry, Surprised, Scared, Pain, Sick, Doctor, Medicine, Food, Water, Coffee, Tea, Bread, Meat, Vegetables, Fruit, Milk, Juice, Breakfast, Lunch, Dinner, Red, Blue, Green, Yellow, Black, White, Big, Small, Fast, Slow, New, Old, Clean, Dirty, Open, Close, Up, Down, Left, Right, Inside, Outside, Before, After, Now, Later, Yesterday, Tomorrow, Today, Week, Month, Year, One, Two, Three, Four, Five, Ten, Twenty, Hundred, Thousand, First, Second, Third, Last, More, Less, Enough, All, Some, Many, Few, Question, Answer, Yes Please, No Thanks, Maybe, Sure, Okay, Perfect, Great, Wonderful, Amazing, Terrible, Awful, Beautiful, Ugly, Easy, Difficult, Important, Urgent, Emergency, Danger, Safe, Careful.</div>
                  </div>
                </div>
              </div>

              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-lg mb-2">💬</p>
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {chatMessages.map((msg, index) => {
                    const isCurrentUser = msg.sender === currentUser;
                    const showAvatar = index === 0 || chatMessages[index - 1].sender !== msg.sender;

                    return (
                      <div key={msg.id} className={`group ${isCurrentUser ? 'place-self-end' : 'place-self-start'}`}>
                        <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                          {showAvatar && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className={`text-xs ${isCurrentUser ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                {msg.sender.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!showAvatar && <div className="w-8" />}

                          <div className={`flex-1 max-w-[240px] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            {showAvatar && (
                              <div className={`flex items-center gap-2 mb-1 text-xs text-gray-400 ${isCurrentUser ? 'justify-end' : ''}`}>
                                <span className="font-medium">
                                  {isCurrentUser ? 'You' : msg.sender}
                                </span>
                                <span>{formatMessageTime(msg.timestamp)}</span>
                              </div>
                            )}

                            <div className={`relative group ${isCurrentUser ? 'ml-auto' : ''}`}>
                              <div className={`rounded-2xl px-4 py-2 break-words shadow-lg ${
                                isCurrentUser
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : 'bg-gray-700 text-gray-100 rounded-bl-md'
                              }`}>
                                <p className="text-sm leading-relaxed">{msg.message}</p>
                              </div>

                              {/* Message actions menu */}
                              <div className={`absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 bg-gray-800 hover:bg-gray-700 border border-gray-600"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={isCurrentUser ? "end" : "start"} className="bg-gray-800 border-gray-600">
                                    <DropdownMenuItem
                                      onClick={() => handleMessageAction('reply', msg.id)}
                                      className="text-gray-200 hover:bg-gray-700"
                                    >
                                      <Reply className="h-4 w-4 mr-2" />
                                      Reply
                                    </DropdownMenuItem>
                                    {isCurrentUser && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => handleMessageAction('edit', msg.id)}
                                          className="text-gray-200 hover:bg-gray-700"
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleMessageAction('delete', msg.id)}
                                          className="text-red-400 hover:bg-red-900/20"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-600 text-xs">
                      {currentUser.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Enhanced Input Area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mb-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-lg hover:bg-gray-600 rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setShowEmojiPicker(false)}
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs text-gray-400 hover:text-white"
                >
                  Close
                </Button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] max-h-32"
                  rows={1}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  style={{ height: 'auto', minHeight: '44px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />

                {/* Input Actions */}
                <div className="absolute right-2 bottom-2 flex gap-1">
                  <Button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    disabled
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={sendMessage}
                disabled={!chatMessage.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Message formatting hint */}
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>•</span>
              <span>Emoji picker available</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="participants" className="flex-1 p-4 m-0">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {participants.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>No participants yet</p>
                </div>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {participant.name} {participant.id === '1' && '(You)'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {participant.isSpeaking && (
                          <span className="text-green-400 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            Speaking
                          </span>
                        )}
                        {participant.isHandRaised && (
                          <span className="text-yellow-400">✋ Hand Raised</span>
                        )}
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
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
