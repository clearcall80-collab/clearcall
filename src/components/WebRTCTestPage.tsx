import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Mic, 
  Video,
  Volume2,
  Hand,
  Info
} from 'lucide-react';
import { webRTCService } from '../services/WebRTCService';
import { voiceToTextService } from '../services/VoiceToTextService';
import { signToTextService } from '../services/SignToTextService';
import { PermissionManager } from './PermissionManager';

export function WebRTCTestPage() {
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  
  // Permission states
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  
  // Voice and sign detection states
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [signSupported, setSignSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [signDetection, setSignDetection] = useState('');

  // Test states
  const [testResults, setTestResults] = useState<{
    webrtc: 'pending' | 'success' | 'error';
    voice: 'pending' | 'success' | 'error';
    sign: 'pending' | 'success' | 'error';
    socket: 'pending' | 'success' | 'error';
  }>({
    webrtc: 'pending',
    voice: 'pending',
    sign: 'pending',
    socket: 'pending'
  });

  useEffect(() => {
    // Check browser capabilities first
    checkBrowserSupport();
    
    // Test Socket.io connection
    testSocket();
    
    // Test Voice-to-Text
    testVoiceToText();
    
    return () => {
      cleanup();
    };
  }, []);

  const checkBrowserSupport = () => {
    console.log('🔍 Checking browser support...');
    
    // Check WebRTC support
    if (typeof RTCPeerConnection !== 'undefined' && !!navigator.mediaDevices?.getUserMedia) {
      console.log('✅ WebRTC supported');
      setTestResults(prev => ({ ...prev, webrtc: 'success' }));
    } else {
      console.log('❌ WebRTC not supported');
      setTestResults(prev => ({ ...prev, webrtc: 'error' }));
    }
    
    // Check camera support for sign detection
    if (!!navigator.mediaDevices?.getUserMedia) {
      setSignSupported(true);
      setTestResults(prev => ({ ...prev, sign: 'success' }));
    } else {
      setSignSupported(false);
      setTestResults(prev => ({ ...prev, sign: 'error' }));
    }
  };

  const handlePermissionsGranted = async (permissions: { camera: boolean; microphone: boolean }) => {
    console.log('✅ Permissions granted:', permissions);
    setPermissionsGranted(true);
    setShowPermissionManager(false);
    
    // Now we can test WebRTC with actual media access
    if (permissions.camera || permissions.microphone) {
      await testWebRTCWithMedia();
    }
  };

  const testSocket = () => {
    console.log('🔌 Testing Socket.io connection...');
    
    webRTCService.onConnectionState((state) => {
      console.log('Socket state:', state);
      setSocketConnected(state === 'connected');

      if (state === 'connected') {
        setTestResults(prev => ({ ...prev, socket: 'success' }));
      } else if (state === 'disconnected') {
        setTestResults(prev => ({ ...prev, socket: 'error' }));
      }
    });

    webRTCService.onError((error) => {
      console.error('Socket error:', error);
      if (error.type === 'permission') {
        // Don't mark socket as error for permission issues
        console.log('Permission issue, not socket issue');
      } else {
        setTestResults(prev => ({ ...prev, socket: 'error' }));
      }
    });
  };

  const testWebRTCWithMedia = async () => {
    console.log('📹 Testing WebRTC with media access...');
    
    try {
      // Request permissions through WebRTC service
      const result = await webRTCService.requestMediaPermissions({ video: true, audio: true });
      
      if (result.success && result.stream) {
        console.log('✅ WebRTC media access successful');
        setLocalStream(result.stream);
        setTestResults(prev => ({ ...prev, webrtc: 'success' }));
      } else {
        console.log('❌ WebRTC media access failed:', result.error);
        setTestResults(prev => ({ ...prev, webrtc: 'error' }));
      }
    } catch (error) {
      console.error('❌ WebRTC test failed:', error);
      setTestResults(prev => ({ ...prev, webrtc: 'error' }));
    }
  };

  const testVoiceToText = () => {
    console.log('🎤 Testing Voice-to-Text capabilities...');
    
    const supported = voiceToTextService.supported;
    setVoiceSupported(supported);
    
    if (supported) {
      console.log('✅ Voice-to-Text supported');
      setTestResults(prev => ({ ...prev, voice: 'success' }));
      
      // Set up voice detection
      voiceToTextService.onResult((transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          console.log('Voice transcript:', transcript);
        }
      });
      
      voiceToTextService.onError((error) => {
        console.error('Voice-to-text error:', error);
      });
      
    } else {
      console.log('❌ Voice-to-Text not supported');
      setTestResults(prev => ({ ...prev, voice: 'error' }));
    }
  };

  // const requestPermissions = () => {
  //   setShowPermissionManager(true);
  // };

  const joinTestRoom = async () => {
    if (!permissionsGranted) {
      setShowPermissionManager(true);
      return;
    }

    console.log('🚪 Joining test room...');
    
    try {
      const roomId = 'test-room-' + Date.now();
      const userId = 'test-user-' + Date.now();
      
      webRTCService.onUserJoined((joinedUserId) => {
        console.log('User joined:', joinedUserId);
        setConnectedPeers(prev => [...prev, joinedUserId]);
      });

      webRTCService.onUserLeft((leftUserId) => {
        console.log('User left:', leftUserId);
        setConnectedPeers(prev => prev.filter(id => id !== leftUserId));
      });

      webRTCService.onLocalStream((stream) => {
        console.log('Local stream received:', stream);
        setLocalStream(stream);
      });

      // webRTCService.onRemoteStream((userId, stream) => {
      //   console.log('Remote stream received from:', userId);
      // });
      
      const success = await webRTCService.joinRoom(roomId, userId);
      if (success) {
        setRoomJoined(true);
        console.log('✅ Successfully joined test room');
      } else {
        console.error('❌ Failed to join test room');
      }
    } catch (error) {
      console.error('❌ Error joining test room:', error);
    }
  };

  const leaveTestRoom = () => {
    console.log('🚪 Leaving test room...');
    webRTCService.leaveRoom();
    setRoomJoined(false);
    setConnectedPeers([]);
  };

  const startVoiceTest = () => {
    if (voiceSupported && !isListening) {
      console.log('🎤 Starting voice detection...');
      voiceToTextService.startListening();
      setIsListening(true);
    }
  };

  const stopVoiceTest = () => {
    if (isListening) {
      console.log('🎤 Stopping voice detection...');
      voiceToTextService.stopListening();
      setIsListening(false);
      setLiveTranscript('');
    }
  };

  const startSignTest = async () => {
    if (!permissionsGranted) {
      setShowPermissionManager(true);
      return;
    }

    if (signSupported && !isTracking) {
      console.log('👋 Starting sign detection...');
      
      // Set up sign detection callbacks
      signToTextService.onSignDetected((prediction) => {
        setSignDetection(prediction.sign);
        console.log('Sign detected:', prediction.sign, 'confidence:', prediction.confidence);
      });
      
      signToTextService.onError((error) => {
        console.error('Sign-to-text error:', error);
        if (error.type === 'permission') {
          setShowPermissionManager(true);
        }
      });
      
      const success = await signToTextService.startTracking();
      if (success) {
        setIsTracking(true);
      }
    }
  };

  const stopSignTest = () => {
    if (isTracking) {
      console.log('👋 Stopping sign detection...');
      signToTextService.stopTracking();
      setIsTracking(false);
      setSignDetection('');
    }
  };

  const cleanup = () => {
    webRTCService.cleanup();
    voiceToTextService.cleanup();
    signToTextService.cleanup();
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ready</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Testing</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clear Call - Real-Time Features Test</h1>
          <p className="text-gray-600">Testing WebRTC, Voice-to-Text, and Sign-to-Text capabilities</p>
        </div>

        {/* Feature Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Socket.io</CardTitle>
                {getStatusIcon(testResults.socket)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Real-time signaling</span>
                {getStatusBadge(testResults.socket)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">WebRTC</CardTitle>
                {getStatusIcon(testResults.webrtc)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Video calling</span>
                {getStatusBadge(testResults.webrtc)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Voice-to-Text</CardTitle>
                {getStatusIcon(testResults.voice)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Speech recognition</span>
                {getStatusBadge(testResults.voice)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Sign-to-Text</CardTitle>
                {getStatusIcon(testResults.sign)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Hand gesture detection</span>
                {getStatusBadge(testResults.sign)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Test Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* WebRTC Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                WebRTC Video Calling Test
              </CardTitle>
              <CardDescription>
                Test real-time video and audio communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span>Socket Connection:</span>
                  <Badge variant={socketConnected ? "default" : "destructive"}>
                    {socketConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Room Status:</span>
                  <Badge variant={roomJoined ? "default" : "secondary"}>
                    {roomJoined ? 'Joined' : 'Not joined'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Connected Peers:</span>
                  <span className="text-sm font-medium">{connectedPeers.length}</span>
                </div>
              </div>

              {localStream && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    ref={(video) => {
                      if (video && localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {!roomJoined ? (
                  <Button 
                    onClick={joinTestRoom}
                    disabled={!socketConnected}
                    className="flex-1"
                  >
                    Join Test Room
                  </Button>
                ) : (
                  <Button 
                    onClick={leaveTestRoom}
                    variant="destructive"
                    className="flex-1"
                  >
                    Leave Room
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice and Sign Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Accessibility Features Test
              </CardTitle>
              <CardDescription>
                Test voice-to-text and sign-to-text recognition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice-to-Text Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Voice-to-Text
                  </h4>
                  <Badge variant={voiceSupported ? "default" : "destructive"}>
                    {voiceSupported ? 'Supported' : 'Not supported'}
                  </Badge>
                </div>
                
                {liveTranscript && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Live Transcript:</strong> {liveTranscript}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={startVoiceTest}
                    disabled={!voiceSupported || isListening}
                    size="sm"
                    variant={isListening ? "secondary" : "default"}
                  >
                    {isListening ? 'Listening...' : 'Start Voice Test'}
                  </Button>
                  <Button
                    onClick={stopVoiceTest}
                    disabled={!isListening}
                    size="sm"
                    variant="outline"
                  >
                    Stop
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Sign-to-Text Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    Sign-to-Text
                  </h4>
                  <Badge variant={signSupported ? "default" : "destructive"}>
                    {signSupported ? 'Camera available' : 'No camera'}
                  </Badge>
                </div>

                {signDetection && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sign Detected:</strong> {signDetection}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={startSignTest}
                    disabled={!signSupported || isTracking}
                    size="sm"
                    variant={isTracking ? "secondary" : "default"}
                  >
                    {isTracking ? 'Tracking...' : 'Start Sign Test'}
                  </Button>
                  <Button
                    onClick={stopSignTest}
                    disabled={!isTracking}
                    size="sm"
                    variant="outline"
                  >
                    Stop
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>WebRTC Support:</strong>
                <br />
                {typeof RTCPeerConnection !== 'undefined' ? '✅ Available' : '❌ Not available'}
              </div>
              <div>
                <strong>getUserMedia Support:</strong>
                <br />
                {!!navigator.mediaDevices?.getUserMedia ? '✅ Available' : '❌ Not available'}
              </div>
              <div>
                <strong>Speech Recognition:</strong>
                <br />
                {voiceToTextService.supported ? '✅ Available' : '❌ Not available'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert className="mt-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Instructions:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Click "Join Test Room" to test WebRTC peer connections</li>
              <li>Click "Start Voice Test" and speak to test voice-to-text recognition</li>
              <li>Click "Start Sign Test" to test hand gesture recognition (camera required)</li>
              <li>Open this page in multiple browser tabs to test peer-to-peer connections</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Permission Manager Modal */}
        {showPermissionManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <PermissionManager
                onPermissionsGranted={handlePermissionsGranted}
                requestedPermissions={{ camera: true, microphone: true }}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setShowPermissionManager(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}