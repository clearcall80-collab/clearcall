import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { TooltipProvider } from './ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { webRTCService } from '../services/WebRTCService';
import { signToTextService, SignToTextService } from '../services/SignToTextService';
import { PermissionManager } from './PermissionManager';
import { RoomInfo } from './RoomInfo';
import { VideoGrid } from './VideoGrid';
import { ControlBar } from './ControlBar';
import { Sidebar } from './Sidebar';
import { RoomHeader } from './RoomHeader';
import { toast, Toaster } from 'sonner';

import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { FaceMesh, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';

interface RoomPageProps {
  currentUser: string;
  onLeaveRoom: () => void;
  roomId?: string;
  isDarkMode?: boolean;
  isLargeText?: boolean;
  language?: 'en' | 'te';
  onToggleDarkMode?: () => void;
  onToggleLargeText?: () => void;
  onToggleLanguage?: () => void;
}

interface Participant {
  id: string;
  name: string;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

export function RoomPage({
  currentUser,
  onLeaveRoom
}: RoomPageProps) {
  // Control states
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [areCaptionsOn, setAreCaptionsOn] = useState<boolean>(false);
  const [isVoiceToTextOn, setIsVoiceToTextOn] = useState<boolean>(false);
  const [isSignToTextOn, setIsSignToTextOn] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [showRoomInfo, setShowRoomInfo] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<string>('00:00');

  // Real participants data - start empty, populated by WebRTC events
  const [participants, setParticipants] = useState<Participant[]>([]);

  // WebRTC and real-time state
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [roomId, setRoomId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [localUserId, setLocalUserId] = useState<string>('');

  // Permission management
  const [showPermissionManager, setShowPermissionManager] = useState<boolean>(false);
  const [permissionsGranted, setPermissionsGranted] = useState<{ camera: boolean; microphone: boolean }>({ camera: false, microphone: false });

  // Video element refs
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Canvas ref for pose and face mesh overlay
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Real-time chat messages - start empty
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Fix: Attach local stream to video element on stream change
  useEffect(() => {
    if (localVideoRef.current && localVideoStream) {
      if (localVideoRef.current.srcObject !== localVideoStream) {
        localVideoRef.current.srcObject = localVideoStream;
        localVideoRef.current.play().catch(err => {
          console.warn('⚠️ Could not auto-play local video on stream update:', err);
          if (localVideoRef.current) {
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(err2 => {
              console.error('❌ Failed to play local video after muting:', err2);
            });
          }
        });
      }
    }
  }, [localVideoStream]);

  // Fix: Attach remote streams to video elements when they change
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
  }, [remoteStreams]);

  // MediaPipe pose and face mesh initialization and drawing
  useEffect(() => {
    if (!localVideoRef.current || !overlayCanvasRef.current || !localVideoStream) return;

    const video = localVideoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#FF0000', lineWidth: 1 });
      }
    });

    faceMesh.onResults((results) => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, { color: '#FFFFFF', lineWidth: 1 });
        }
      }
    });

    const camera = new Camera(video, {
      onFrame: async () => {
        await pose.send({ image: video });
        await faceMesh.send({ image: video });
      },
      width: video.videoWidth,
      height: video.videoHeight
    });
    camera.start();

    return () => {
      camera.stop();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [localVideoStream]);

  // Adjust video grid container style to add margin bottom for separation from control bar
  const videoGridContainerStyle = {
    marginBottom: '80px' // Adjust as needed for visual separation
  };

  // Live captions (mock)
  const [liveCaption, setLiveCaption] = useState<string>('');
  const [signToTextCaption, setSignToTextCaption] = useState<string>('');

  const translations = {
    en: {
      roomTitle: "Clear Call Meeting Room",
      meetingInfo: "Meeting Info",
      participants: "Participants",
      chat: "Chat",
      mic: "Microphone",
      camera: "Camera",
      raiseHand: "Raise Hand",
      shareScreen: "Share Screen",
      captions: "Captions",
      endCall: "End Call",
      voiceToText: "Voice to Text",
      signToText: "Sign to Text",
      typeMessage: "Type a message...",
      send: "Send",
      you: "You",
      speaking: "Speaking",
      handRaised: "Hand Raised",
      joinedCall: "joined the call",
      darkMode: "Toggle Dark Mode",
      largeText: "Toggle Large Text",
      language: "తెలుగు",
      liveCaptions: "Live Captions",
      signLanguage: "Sign Language Recognition"
    },
    te: {
      roomTitle: "క్లియర్ కాల్ మీటింగ్ రూమ్",
      meetingInfo: "మీటింగ్ సమాచారం",
      participants: "పాల్గొనేవారు",
      chat: "చాట్",
      mic: "మైక్రోఫోన్",
      camera: "కెమెరా",
      raiseHand: "చేయి ఎత్తండి",
      shareScreen: "స్క్రీన్ షేర్ చేయండి",
      captions: "శీర్షికలు",
      endCall: "కాల్ ముగించండి",
      voiceToText: "వాయిస్ టు టెక్స్ట్",
      signToText: "సంకేత భాష టు టెక్స్ట్",
      typeMessage: "సందేశం టైప్ చేయండి...",
      send: "పంపండి",
      you: "మీరు",
      speaking: "మాట్లాడుతున్నారు",
      handRaised: "చేయి ఎత్తారు",
      joinedCall: "కాల్‌లో చేరారు",
      darkMode: "డార్క్ మోడ్",
      largeText: "పెద్ద వచనం",
      language: "English",
      liveCaptions: "లైవ్ క్యాప్షన్స్",
      signLanguage: "సంకేత భాష గుర్తింపు"
    }
  };

  const isLargeText: boolean = false; // Default to normal text
  const t = translations.en; // Default to English

  // Handle audio toggle
  const handleAudioToggle = () => {
    const newState = !isAudioOn;
    setIsAudioOn(newState);
    webRTCService.toggleAudio(newState);
    
    if (newState) {
      toast.success('Microphone On', { description: 'Your microphone is now unmuted' });
    } else {
      toast.info('Microphone Off', { description: 'Your microphone is now muted' });
    }
  };

  // Handle video toggle
  const handleVideoToggle = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    webRTCService.toggleVideo(newState);

    if (newState) {
      // Check if localVideoRef has stream and play
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.play().catch(err => {
          console.warn('⚠️ Could not auto-play local video on toggle:', err);
          if (localVideoRef.current) {
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(err2 => {
              console.error('❌ Failed to play local video after muting on toggle:', err2);
            });
          }
        });
      }
      
      toast.success('Camera On', { description: 'Your camera is now on' });
    } else {
      toast.info('Camera Off', { description: 'Your camera is now off' });
    }
  };

  // Setup room function - extracted to avoid duplication
  const setupRoom = async () => {
    setIsConnecting(true);
    const generatedRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    setRoomId(generatedRoomId);

    try {
      // Setup WebRTC event handlers with timeout protection
      const setupTimeout = setTimeout(() => {
        console.warn('⏱️ Setup timeout reached');
        setIsConnecting(false);
        toast.warning('Slow Connection', {
          description: 'Connection is taking longer than expected'
        });
      }, 10000);

      // Setup WebRTC event handlers
      webRTCService.onLocalStream((stream) => {
        console.log('📹 Local stream received:', stream);
        setLocalVideoStream(stream);
      // Ensure video element gets the stream and plays
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Force play to ensure video starts
        localVideoRef.current.play().catch(err => {
          console.warn('⚠️ Could not auto-play local video:', err);
          // Try to unmute and play again
          if (localVideoRef.current) {
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(err2 => {
              console.error('❌ Failed to play local video after muting:', err2);
            });
          }
        });
      }
        // Update local participant video state
        setParticipants(prev => prev.map(p =>
          p.id === localUserId ? { ...p, isVideoOn: true } : p
        ));
      });

      webRTCService.onRemoteStream((userId, stream) => {
        console.log('📹 Remote stream received from:', userId);
        setRemoteStreams(prev => new Map(prev).set(userId, stream));

        // Set stream to video element and ensure it plays
        const videoElement = remoteVideoRefs.current.get(userId);
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play().catch(err => {
            console.warn(`⚠️ Could not auto-play remote video for ${userId}:`, err);
          });
        }
      });

      webRTCService.onUserJoined((userId) => {
        console.log('👤 User joined:', userId);
        setParticipants(prev => [
          ...prev.filter(p => p.id !== userId),
          {
            id: userId,
            name: `User ${userId.substring(0, 8)}`,
            isAudioOn: true,
            isVideoOn: true,
            isHandRaised: false,
            isSpeaking: false
          }
        ]);
      });

      webRTCService.onUserLeft((userId) => {
        console.log('👋 User left:', userId);
        setParticipants(prev => prev.filter(p => p.id !== userId));
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        // Clean up video ref
        remoteVideoRefs.current.delete(userId);
      });

      webRTCService.onConnectionState((state) => {
        console.log('🔄 Connection state:', state);
        setConnectionState(state);
      });

      webRTCService.onChatMessage((message) => {
        const newMessage: ChatMessage = {
          id: message.id,
          sender: message.userName,
          message: message.message,
          timestamp: new Date(message.timestamp)
        };
        setChatMessages(prev => [...prev, newMessage]);
      });

      webRTCService.onError((error) => {
        console.error('❌ WebRTC error:', error);
        if (error.type === 'permission') {
          toast.error('Permission Error', {
            description: error.message || 'Camera and microphone access required'
          });
        }
      });

      // Join the room with timeout
      const userId = `user_${Date.now()}`;
      setLocalUserId(userId);

      try {
        await Promise.race([
          webRTCService.joinRoom(generatedRoomId, userId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Join timeout')), 8000)
          )
        ]);
      } catch (joinError) {
        console.warn('⚠️ Join room timeout, continuing anyway');
      }

      // Add local participant to the list with correct initial state
      setParticipants([{
        id: userId,
        name: currentUser,
        isAudioOn: permissionsGranted.microphone,
        isVideoOn: permissionsGranted.camera,
        isHandRaised: false,
        isSpeaking: false
      }]);

      clearTimeout(setupTimeout);
      setIsConnecting(false);
      console.log('✅ Room initialized successfully');
      toast.success('Connected', {
        description: 'You have joined the meeting room'
      });
    } catch (error) {
      console.error('❌ Error initializing room:', error);
      setIsConnecting(false);
      toast.error('Connection Error', {
        description: 'Failed to join the meeting room. Please try again.'
      });
    }
  };

  // Initialize WebRTC and real-time services
  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeRoom = async () => {
      if (!isMounted) return;
      
      // Set a timeout to prevent infinite hanging
      initTimeout = setTimeout(() => {
        if (isMounted && isConnecting) {
          console.warn('⏱️ Initialization timeout - showing permission manager');
          setIsConnecting(false);
          setShowPermissionManager(true);
        }
      }, 5000);

      console.log('🔐 Checking media permissions...');
      
      try {
        // Try to check current permission status
        if (navigator.permissions) {
          try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            
            if (cameraPermission.state === 'granted' && micPermission.state === 'granted') {
              console.log('✅ Permissions already granted');
              if (isMounted) {
                setPermissionsGranted({ camera: true, microphone: true });
                clearTimeout(initTimeout);
                await setupRoom();
              }
              return;
            }
          } catch (error) {
            // Some browsers don't support querying camera/microphone permissions
            console.log('⚠️ Cannot query permissions, will request directly');
          }
        }
        
        // If permissions not granted or cannot be queried, show permission manager
        console.log('📋 Showing permission manager');
        if (isMounted) {
          clearTimeout(initTimeout);
          setShowPermissionManager(true);
        }
        
      } catch (error: any) {
        console.log('📋 Permission check failed - showing permission manager');
        if (isMounted) {
          clearTimeout(initTimeout);
          setShowPermissionManager(true);
        }
      }
    };

    initializeRoom();

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      webRTCService.cleanup();
    };
  }, []);

  // Permission granted callback
  const handlePermissionsGranted = async (permissions: { camera: boolean; microphone: boolean }) => {
    console.log('✅ Permissions granted:', permissions);
    setPermissionsGranted(permissions);
    setShowPermissionManager(false);

    if (!permissions.camera) {
      setIsVideoOn(false);
    }
    if (!permissions.microphone) {
      setIsAudioOn(false);
    }
    
    // Now initialize the room with granted permissions
    await setupRoom();
  };

  // Skip permissions callback (view-only mode)
  const handleSkipPermissions = () => {
    console.log('⚠️ User skipped permissions - entering view-only mode');
    setPermissionsGranted({ camera: false, microphone: false });
    setShowPermissionManager(false);
    setIsVideoOn(false);
    setIsAudioOn(false);
    
    toast.info('View-Only Mode', {
      description: 'You can view the call but others cannot see or hear you'
    });
    
    // Initialize room without media
    setupRoom();
  };

  // Real voice-to-text effect using Web Speech API
  useEffect(() => {
    let recognition: SpeechRecognition | null = null;
    let isMounted = true;

    if (isVoiceToTextOn && 'webkitSpeechRecognition' in window) {
      recognition = new (window as any).webkitSpeechRecognition() as SpeechRecognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!isMounted) return;
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setLiveCaption(finalTranscript);
          // Add recognized text as chat message
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: currentUser,
            message: finalTranscript,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, newMessage]);
          // Clear caption after 5 seconds
          setTimeout(() => setLiveCaption(''), 5000);
        } else {
          setLiveCaption(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Voice-to-text error:', event.error);
        setIsVoiceToTextOn(false);
        toast.error('Voice-to-Text Error', {
          description: 'Failed to initialize voice recognition'
        });
      };

      recognition.onend = () => {
        if (isVoiceToTextOn && isMounted) {
          recognition?.start();
        }
      };

      recognition.start();
    } else {
      setIsVoiceToTextOn(false);
      setLiveCaption('');
    }

    return () => {
      isMounted = false;
      recognition?.stop();
    };
  }, [isVoiceToTextOn]);

  // Real sign-to-text effect
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initSignToText = async () => {
      if (isSignToTextOn) {
        try {
          if (!SignToTextService.isSupported) {
            console.warn('❌ Camera not supported for sign-to-text');
            setIsSignToTextOn(false);
            toast.warning('Not Supported', {
              description: 'Sign language detection requires camera access'
            });
            return;
          }

          signToTextService.onSignDetected((prediction) => {
            setSignToTextCaption(prediction.sign);
            // Add detected gesture text as chat message
            const newMessage: ChatMessage = {
              id: Date.now().toString(),
              sender: currentUser,
              message: `Gesture detected: ${prediction.sign}`,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, newMessage]);
            // Clear caption after 3 seconds
            setTimeout(() => setSignToTextCaption(''), 3000);
          });

          signToTextService.onError((error) => {
            console.error('❌ Sign-to-text error:', error);
            setIsSignToTextOn(false);
            toast.error('Sign Detection Error', {
              description: 'Failed to initialize sign language detection'
            });
          });

          // Use local video stream if available, otherwise fallback to camera
          const videoStream = localVideoStream || undefined;
          const started = await signToTextService.startTracking(videoStream);

          if (!started) {
            setIsSignToTextOn(false);
            toast.error('Sign Detection Error', {
              description: 'Failed to start sign language detection'
            });
            return;
          }

          cleanup = () => {
            signToTextService.stopTracking();
          };
        } catch (error) {
          console.error('❌ Sign-to-text initialization error:', error);
          setIsSignToTextOn(false);
        }
      } else {
        signToTextService.stopTracking();
        setSignToTextCaption('');
      }
    };

    initSignToText();

    return () => {
      if (cleanup) cleanup();
    };
  }, [isSignToTextOn, localVideoStream]);

  // Track call duration
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update local participant state when audio/video toggles
  useEffect(() => {
    setParticipants((prev: Participant[]) => prev.map((p: Participant) => 
      p.id === localUserId ? { ...p, isAudioOn, isVideoOn } : p
    ));
  }, [isAudioOn, isVideoOn]);

  const sendMessage = () => {
    if (chatMessage.trim()) {
      // Send via WebRTC service for real-time delivery
      webRTCService.sendChatMessage(chatMessage);
      
      // Add to local chat immediately
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: currentUser,
        message: chatMessage,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };



  // Show loading state while connecting
  if (isConnecting && !showPermissionManager) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Setting up your video call...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
        <Toaster position="top-center" richColors />
        
        {/* Room Info Dialog */}
        {showRoomInfo && (
          <RoomInfo
            roomId={roomId}
            participantCount={participants.length}
            duration={callDuration}
            open={showRoomInfo}
            onOpenChange={setShowRoomInfo}
            language={'en'}
          />
        )}

        {/* Permission Manager Modal */}
        {showPermissionManager && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <PermissionManager
                onPermissionsGranted={handlePermissionsGranted}
                requestedPermissions={{ camera: true, microphone: true }}
                allowSkip={true}
                onSkip={handleSkipPermissions}
              />
            </div>
          </div>
        )}

        {/* Top Navigation Bar */}
        <RoomHeader
          roomTitle={t.roomTitle}
          connectionState={connectionState}
          callDuration={callDuration}
          roomId={roomId}
          onShowRoomInfo={() => setShowRoomInfo(true)}
          translations={{
            meetingInfo: t.meetingInfo
          }}
        />

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Video Grid Area - Takes available space */}
            <div className="flex-1 relative p-4">
              {/* Video Grid */}
              <VideoGrid
                participants={participants}
                localUserId={localUserId}
                localVideoRef={localVideoRef}
                remoteVideoRefs={remoteVideoRefs}
                remoteStreams={remoteStreams}
                isLargeText={isLargeText}
                style={videoGridContainerStyle}
              />

              {/* Canvas overlay for pose and face mesh */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{ width: '100%', height: '100%', zIndex: 10 }}
              />

              {/* Live Captions Overlay */}
              <AnimatePresence>
                {(isVoiceToTextOn && liveCaption) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl"
                  >
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-600">
                      <div className="text-xs text-gray-400 mb-1">{t.liveCaptions}</div>
                      <div className="text-white">{liveCaption}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign-to-Text Overlay */}
              <AnimatePresence>
                {(isSignToTextOn && signToTextCaption) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-20 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="bg-purple-900/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-600">
                      <div className="text-xs text-purple-300 mb-1">{t.signLanguage}</div>
                      <div className="text-white font-medium">{signToTextCaption}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar - Fixed width when open */}
            {isSidebarOpen && (
              <div className="w-80">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  chatMessages={chatMessages}
                  participants={participants}
                  currentUser={currentUser}
                  chatMessage={chatMessage}
                  setChatMessage={setChatMessage}
                  sendMessage={sendMessage}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            )}

          {/* Sidebar Toggle Button */}
          {!isSidebarOpen && (
            <Button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 border border-gray-600"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Bottom Control Bar */}
        <ControlBar
          isAudioOn={isAudioOn}
          isVideoOn={isVideoOn}
          isHandRaised={isHandRaised}
          isScreenSharing={isScreenSharing}
          areCaptionsOn={areCaptionsOn}
          isVoiceToTextOn={isVoiceToTextOn}
          isSignToTextOn={isSignToTextOn}
          isSidebarOpen={isSidebarOpen}
          onAudioToggle={handleAudioToggle}
          onVideoToggle={handleVideoToggle}
          onHandRaiseToggle={() => setIsHandRaised(!isHandRaised)}
          onScreenShareToggle={() => setIsScreenSharing(!isScreenSharing)}
          onCaptionsToggle={() => setAreCaptionsOn(!areCaptionsOn)}
          onVoiceToTextToggle={() => setIsVoiceToTextOn(!isVoiceToTextOn)}
          onSignToTextToggle={() => setIsSignToTextOn(!isSignToTextOn)}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onLeaveRoom={onLeaveRoom}
        />
      </div>
    </TooltipProvider>
  );
}
