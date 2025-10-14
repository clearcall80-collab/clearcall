import React from 'react';
import { motion } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MessageSquare,
  Share2,
  Captions,
  PhoneOff,
  Volume2,
  Type
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface ControlBarProps {
  isAudioOn: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  areCaptionsOn: boolean;
  isVoiceToTextOn: boolean;
  isSignToTextOn: boolean;
  isSidebarOpen: boolean;
  onAudioToggle: () => void;
  onVideoToggle: () => void;
  onHandRaiseToggle: () => void;
  onScreenShareToggle: () => void;
  onCaptionsToggle: () => void;
  onVoiceToTextToggle: () => void;
  onSignToTextToggle: () => void;
  onSidebarToggle: () => void;
  onLeaveRoom: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isAudioOn,
  isVideoOn,
  isHandRaised,
  isScreenSharing,
  areCaptionsOn,
  isVoiceToTextOn,
  isSignToTextOn,
  isSidebarOpen,
  onAudioToggle,
  onVideoToggle,
  onHandRaiseToggle,
  onScreenShareToggle,
  onCaptionsToggle,
  onVoiceToTextToggle,
  onSignToTextToggle,
  onSidebarToggle,
  onLeaveRoom
}) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
    >
      <div className="flex items-center gap-2 bg-gray-800/95 backdrop-blur-sm rounded-full px-4 py-3 border border-gray-600">
        {/* Mic Control */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAudioOn ? "default" : "destructive"}
              size="sm"
              onClick={onAudioToggle}
              className="w-12 h-12 rounded-full"
            >
              {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Microphone</TooltipContent>
        </Tooltip>

        {/* Camera Control */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isVideoOn ? "default" : "destructive"}
              size="sm"
              onClick={onVideoToggle}
              className="w-12 h-12 rounded-full"
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Camera</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8 bg-gray-600" />

        {/* Raise Hand */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isHandRaised ? "secondary" : "ghost"}
              size="sm"
              onClick={onHandRaiseToggle}
              className="w-12 h-12 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Hand className={`h-5 w-5 ${isHandRaised ? 'text-yellow-400' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Raise Hand</TooltipContent>
        </Tooltip>

        {/* Chat */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isSidebarOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={onSidebarToggle}
              className="w-12 h-12 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chat</TooltipContent>
        </Tooltip>

        {/* Share Screen */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? "secondary" : "ghost"}
              size="sm"
              onClick={onScreenShareToggle}
              className="w-12 h-12 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Share2 className={`h-5 w-5 ${isScreenSharing ? 'text-blue-400' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share Screen</TooltipContent>
        </Tooltip>

        {/* Captions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={areCaptionsOn ? "secondary" : "ghost"}
              size="sm"
              onClick={onCaptionsToggle}
              className="w-12 h-12 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Captions className={`h-5 w-5 ${areCaptionsOn ? 'text-green-400' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Captions</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8 bg-gray-600" />

        {/* Voice-to-Text */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isVoiceToTextOn ? "secondary" : "ghost"}
              size="sm"
              onClick={onVoiceToTextToggle}
              className="w-12 h-12 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <div className="flex flex-col items-center">
                <Volume2 className={`h-3 w-3 ${isVoiceToTextOn ? 'text-blue-400' : ''}`} />
                <Type className={`h-3 w-3 ${isVoiceToTextOn ? 'text-blue-400' : ''}`} />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Voice to Text</TooltipContent>
        </Tooltip>

        {/* Sign-to-Text */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isSignToTextOn ? "secondary" : "ghost"}
              size="sm"
              onClick={onSignToTextToggle}
              className="w-12 h-12 rounded-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <div className="flex flex-col items-center">
                <Hand className={`h-3 w-3 ${isSignToTextOn ? 'text-purple-400' : ''}`} />
                <Type className={`h-3 w-3 ${isSignToTextOn ? 'text-purple-400' : ''}`} />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sign to Text</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8 bg-gray-600" />

        {/* End Call */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={onLeaveRoom}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>End Call</TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
};
