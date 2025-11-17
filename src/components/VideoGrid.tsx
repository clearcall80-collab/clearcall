import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { VideoOff, MicOff, Hand } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
}

interface VideoGridProps {
  participants: Participant[];
  localUserId: string;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRefs: React.MutableRefObject<Map<string, HTMLVideoElement>>;
  remoteStreams: Map<string, MediaStream>;
  isLargeText?: boolean;
  style?: React.CSSProperties;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  localUserId,
  localVideoRef,
  remoteVideoRefs,
  remoteStreams,
  isLargeText = false
}) => {
  // Attach remote streams to video elements when they change
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
        videoElement.play().catch(err => {
          console.warn(`⚠️ Could not auto-play remote video for ${userId}:`, err);
        });
      }
    });
  }, [remoteStreams, remoteVideoRefs]);

  const getGridLayout = (count: number) => {
    if (count <= 1) return 'grid-cols-1 grid-rows-1';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4 grid-rows-3';
  };

  return (
    <div className={`grid gap-4 h-full p-2 ${getGridLayout(participants.length)}`}>
      {participants.map((participant, index) => (
        <motion.div
          key={participant.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative bg-gray-800 rounded-xl overflow-hidden group shadow-lg border border-gray-700"
        >
          {/* Video Feed */}
          <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
            {participant.id === localUserId ? (
              // Local video (your camera)
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!participant.isVideoOn ? 'hidden' : ''}`}
                onPlay={() => console.log('▶️ Local video playing')}
                onPause={() => console.log('⏸️ Local video paused')}
                onError={(e) => console.error('❌ Local video error', e)}
              />
            ) : (
              // Remote video (other participants)
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current.set(participant.id, el);
                    // If we already have the stream, attach it
                    const stream = remoteStreams.get(participant.id);
                    if (stream) {
                      console.log(`📹 Attaching remote stream to video element for user ${participant.id}`, stream);
                      el.srcObject = stream;
                    }
                  }
                }}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${!participant.isVideoOn ? 'hidden' : ''}`}
                onPlay={() => console.log(`▶️ Remote video playing for user ${participant.id}`)}
                onPause={() => console.log(`⏸️ Remote video paused for user ${participant.id}`)}
                onError={(e) => console.error(`❌ Remote video error for user ${participant.id}`, e)}
              />
            )}

            {/* Avatar fallback when video is off */}
            {!participant.isVideoOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-gray-600 text-white text-2xl">
                    {participant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <VideoOff className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Participant Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium text-white ${isLargeText ? 'text-lg' : ''}`}>
                  {participant.name} {participant.id === localUserId && '(You)'}
                </span>
                {participant.isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                )}
              </div>

              <div className="flex items-center gap-1">
                {!participant.isAudioOn && (
                  <MicOff className="h-4 w-4 text-red-400" />
                )}
                {participant.isHandRaised && (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Hand className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Speaking Indicator */}
          {participant.isSpeaking && (
            <div className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none" />
          )}
        </motion.div>
      ))}
    </div>
  );
};
