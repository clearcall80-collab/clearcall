import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface JoinRoomPageProps {
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
}

export function JoinRoomPage({ onJoinRoom, onBack }: JoinRoomPageProps) {
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoinRoom(roomId.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900 dark:text-white">Join a Room</h2>
        <div className="mb-4">
          <Label htmlFor="roomId" className="block mb-1 text-gray-700 dark:text-gray-300">Room ID</Label>
          <Input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
            className="w-full"
          />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={handleJoin} disabled={!roomId.trim()}>Join</Button>
        </div>
      </div>
    </div>
  );
}
