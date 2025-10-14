import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface MediaDevices {
  video: boolean;
  audio: boolean;
}

class WebRTCService {
  private socket: any = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private roomId: string | null = null;
  private userId: string | null = null;
  private isConnected: boolean = false;

  // ICE servers configuration (using public STUN servers)
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Event callbacks
  private onUserJoinedCallback?: (userId: string, stream?: MediaStream) => void;
  private onUserLeftCallback?: (userId: string) => void;
  private onLocalStreamCallback?: (stream: MediaStream) => void;
  private onRemoteStreamCallback?: (userId: string, stream: MediaStream) => void;
  private onConnectionStateCallback?: (state: string) => void;
  private onErrorCallback?: (error: any) => void;
  private onChatMessageCallback?: (message: any) => void;

  constructor() {
    this.setupSocketConnection();
  }

  private setupSocketConnection() {
    // Connect to the Socket.io server
    this.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.onConnectionStateCallback?.('connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.onConnectionStateCallback?.('disconnected');
    });

    this.socket.on('user-joined', async ({ userId }: { userId: string }) => {
      await this.handleUserJoined(userId);
    });

    this.socket.on('user-left', ({ userId }: { userId: string }) => {
      this.handleUserLeft(userId);
    });

    this.socket.on('offer', async (data: { offer: RTCSessionDescriptionInit, from: string }) => {
      await this.handleOffer(data.offer, data.from);
    });

    this.socket.on('answer', async (data: { answer: RTCSessionDescriptionInit, from: string }) => {
      await this.handleAnswer(data.answer, data.from);
    });

    this.socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit, from: string }) => {
      await this.handleIceCandidate(data.candidate, data.from);
    });

    this.socket.on('chat-message', (data: any) => {
      this.onChatMessageCallback?.(data);
    });

    this.socket.on('media-toggle', (_data: { userId: string, type: 'video' | 'audio', enabled: boolean }) => {
      // Handle remote user media toggle
    });

    this.socket.on('error', (error: any) => {
      this.onErrorCallback?.(error);
    });
  }

  // Initialize local media stream
  async initializeLocalStream(mediaDevices: MediaDevices = { video: true, audio: true }): Promise<MediaStream | null> {
    try {
      const constraints = {
        video: mediaDevices.video ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } : false,
        audio: mediaDevices.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      console.log('🎥 Requesting local media stream with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('🎥 Local media stream obtained:', this.localStream);

      this.onLocalStreamCallback?.(this.localStream);
      return this.localStream;
    } catch (error: any) {
      console.error('❌ Error obtaining local media stream:', error);
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.onErrorCallback?.({ 
          type: 'permission', 
          message: 'Camera and microphone access denied. Please grant permissions in your browser settings and refresh the page.',
          originalError: error 
        });
      } else if (error.name === 'NotFoundError') {
        this.onErrorCallback?.({ 
          type: 'device', 
          message: 'No camera or microphone found on this device.',
          originalError: error 
        });
      } else if (error.name === 'NotReadableError') {
        this.onErrorCallback?.({ 
          type: 'device', 
          message: 'Camera or microphone is already in use by another application.',
          originalError: error 
        });
      } else {
        this.onErrorCallback?.({
          type: 'unknown',
          message: error.message || 'Failed to access camera and microphone',
          originalError: error
        });
      }
      return null;
    }
  }

  // Check media permissions status
  async checkMediaPermissions(): Promise<{ camera: boolean; microphone: boolean }> {
    const permissions = { camera: false, microphone: false };
    
    try {
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        permissions.camera = cameraPermission.state === 'granted';
        permissions.microphone = microphonePermission.state === 'granted';
      } else {
        // Fallback for browsers that don't support permissions API
        permissions.camera = true; // Assume we can request
        permissions.microphone = true;
      }
    } catch (error) {
      // Assume we can try to request permissions
      permissions.camera = true;
      permissions.microphone = true;
    }
    
    return permissions;
  }

  // Request permissions explicitly
  async requestMediaPermissions(options: { video?: boolean; audio?: boolean } = { video: true, audio: true }): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      const constraints: MediaStreamConstraints = {};

      if (options.video) {
        constraints.video = {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        };
      }

      if (options.audio) {
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      return { success: true, stream };
    } catch (error: any) {
      let errorMessage = 'Failed to access camera and microphone';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied. Please allow camera and microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found on this device.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera or microphone constraints cannot be satisfied.';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Join a room
  async joinRoom(roomId: string, userId: string): Promise<boolean> {
    this.roomId = roomId;
    this.userId = userId;

    // Initialize local stream first with timeout
    if (!this.localStream) {
      try {
        await Promise.race([
          this.initializeLocalStream(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Stream init timeout')), 5000)
          )
        ]);
      } catch (error) {
      }
    }

    // Join the room via socket only if connected
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', { roomId, userId });
    }
    
    return true;
  }

  // Leave the current room
  leaveRoom() {
    if (this.socket && this.roomId && this.userId) {
      this.socket.emit('leave-room', { roomId: this.roomId, userId: this.userId });
    }

    // Clean up peer connections
    this.peerConnections.forEach((peer) => {
      peer.connection.close();
    });
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.roomId = null;
    this.userId = null;
  }

  // Create peer connection for a user
  private createPeerConnection(userId: string): RTCPeerConnection {
    console.log(`🔗 Creating peer connection for user: ${userId}`);
    const peerConnection = new RTCPeerConnection(this.iceServers);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      console.log(`📹 Received remote stream from user: ${userId}`, remoteStream);
      this.onRemoteStreamCallback?.(userId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: userId,
          from: this.userId,
          roomId: this.roomId
        });
      }
    };

  // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔄 Connection state for user ${userId}: ${peerConnection.connectionState}`);

      // Enhanced connection state handling
      switch (peerConnection.connectionState) {
        case 'connecting':
          console.log(`🔗 Connecting to user ${userId}...`);
          break;
        case 'connected':
          console.log(`✅ Connected to user ${userId}`);
          break;
        case 'disconnected':
          console.log(`⚠️ Disconnected from user ${userId}, attempting reconnection...`);
          // Attempt ICE restart for reconnection
          setTimeout(() => {
            if (peerConnection.connectionState === 'disconnected') {
              peerConnection.restartIce();
            }
          }, 1000);
          break;
        case 'failed':
          console.error(`❌ Connection to user ${userId} failed`);
          // Notify about connection failure
          this.onErrorCallback?.({
            type: 'connection',
            message: `Connection to participant failed`,
            userId: userId
          });
          // Attempt to restart ICE
          peerConnection.restartIce();
          break;
        case 'closed':
          console.log(`🔚 Connection to user ${userId} closed`);
          break;
      }
    };

    return peerConnection;
  }

  // Handle when a new user joins
  private async handleUserJoined(userId: string) {
    console.log(`👤 User joined: ${userId}`);
    if (userId === this.userId) return; // Don't connect to ourselves

    const peerConnection = this.createPeerConnection(userId);
    this.peerConnections.set(userId, { id: userId, connection: peerConnection });

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit('offer', {
          offer,
          to: userId,
          from: this.userId,
          roomId: this.roomId
        });
      }
    } catch (error) {
      console.error('❌ Error creating or sending offer:', error);
    }

    this.onUserJoinedCallback?.(userId);
  }

  // Handle when a user leaves
  private handleUserLeft(userId: string) {
    console.log(`👋 User left: ${userId}`);
    const peerData = this.peerConnections.get(userId);
    if (peerData) {
      peerData.connection.close();
      this.peerConnections.delete(userId);
    }
    this.onUserLeftCallback?.(userId);
  }

  // Handle incoming offer
  private async handleOffer(offer: RTCSessionDescriptionInit, fromUserId: string) {
    const peerConnection = this.createPeerConnection(fromUserId);
    this.peerConnections.set(fromUserId, { id: fromUserId, connection: peerConnection });

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('answer', {
          answer,
          to: fromUserId,
          from: this.userId,
          roomId: this.roomId
        });
      }
    } catch (error) {
    }
  }

  // Handle incoming answer
  private async handleAnswer(answer: RTCSessionDescriptionInit, fromUserId: string) {
    const peerData = this.peerConnections.get(fromUserId);
    if (peerData) {
      try {
        await peerData.connection.setRemoteDescription(answer);
      } catch (error) {
      }
    }
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(candidate: RTCIceCandidateInit, fromUserId: string) {
    const peerData = this.peerConnections.get(fromUserId);
    if (peerData) {
      try {
        await peerData.connection.addIceCandidate(candidate);
      } catch (error) {
      }
    }
  }

  // Toggle local media
  toggleVideo(enabled: boolean) {
    console.log(`📺 Toggling video: ${enabled}`);
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        
        // Notify other participants
        if (this.socket && this.roomId && this.userId) {
          this.socket.emit('media-toggle', {
            roomId: this.roomId,
            userId: this.userId,
            type: 'video',
            enabled
          });
        }
      }
    }
  }

  toggleAudio(enabled: boolean) {
    console.log(`🎙️ Toggling audio: ${enabled}`);
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        
        // Notify other participants
        if (this.socket && this.roomId && this.userId) {
          this.socket.emit('media-toggle', {
            roomId: this.roomId,
            userId: this.userId,
            type: 'audio',
            enabled
          });
        }
      }
    }
  }

  // Screen sharing
  async startScreenShare(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      this.peerConnections.forEach((peerData) => {
        const sender = peerData.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      return null;
    }
  }

  stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Replace screen share with camera
        this.peerConnections.forEach((peerData) => {
          const sender = peerData.connection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }

  // Send chat message
  sendChatMessage(message: string) {
    if (this.socket && this.roomId && this.userId) {
      this.socket.emit('chat-message', {
        roomId: this.roomId,
        userId: this.userId,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Event listeners
  onUserJoined(callback: (userId: string, stream?: MediaStream) => void) {
    this.onUserJoinedCallback = callback;
  }

  onUserLeft(callback: (userId: string) => void) {
    this.onUserLeftCallback = callback;
  }

  onLocalStream(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  onRemoteStream(callback: (userId: string, stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onConnectionState(callback: (state: string) => void) {
    this.onConnectionStateCallback = callback;
  }

  onError(callback: (error: any) => void) {
    this.onErrorCallback = callback;
  }

  onChatMessage(callback: (message: any) => void) {
    this.onChatMessageCallback = callback;
  }

  // Get connection stats
  async getConnectionStats(): Promise<Map<string, RTCStatsReport>> {
    const stats = new Map<string, RTCStatsReport>();
    
    for (const [userId, peerData] of this.peerConnections) {
      try {
        const report = await peerData.connection.getStats();
        stats.set(userId, report);
      } catch (error) {
        console.error(`❌ Error getting stats for ${userId}:`, error);
      }
    }
    
    return stats;
  }

  // Cleanup
  cleanup() {
    this.leaveRoom();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Getters
  get isSocketConnected(): boolean {
    return this.isConnected;
  }

  get localMediaStream(): MediaStream | null {
    return this.localStream;
  }

  get connectedPeers(): string[] {
    return Array.from(this.peerConnections.keys());
  }
}

export const webRTCService = new WebRTCService();
export type { PeerConnection, MediaDevices };