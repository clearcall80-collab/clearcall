import React from 'react';
import { Info } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface RoomHeaderProps {
  roomTitle: string;
  connectionState: string;
  callDuration: string;
  roomId: string;
  onShowRoomInfo: () => void;
  translations: {
    meetingInfo: string;
  };
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomTitle,
  connectionState,
  callDuration,
  roomId,
  onShowRoomInfo,
  translations
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium">{roomTitle}</h1>
        <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
          {connectionState === 'connected' ? 'Live' : 'Connecting...'}
        </Badge>
        {roomId && (
          <span className="text-xs text-gray-400">{callDuration}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={onShowRoomInfo}
        >
          <Info className="h-4 w-4 mr-2" />
          {translations.meetingInfo}
        </Button>
      </div>
    </header>
  );
};
