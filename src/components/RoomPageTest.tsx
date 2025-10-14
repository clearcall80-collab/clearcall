import React from 'react';
import { RoomPage } from './RoomPage';

export function RoomPageTest() {
  const mockUser = 'TestUser';

  const handleLeaveRoom = () => {
    console.log('Left room');
  };

  const noop = () => {};

  return (
    <RoomPage
      currentUser={mockUser}
      onLeaveRoom={handleLeaveRoom}
      isDarkMode={false}
      isLargeText={false}
      language="en"
      onToggleDarkMode={noop}
      onToggleLargeText={noop}
      onToggleLanguage={noop}
    />
  );
}
