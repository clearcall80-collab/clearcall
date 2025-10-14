import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from 'npm:@supabase/supabase-js';
import { Server } from "npm:socket.io";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b2516160/health", (c) => {
  return c.json({ status: "ok" });
});

// Test endpoint to verify authentication
app.get("/make-server-b2516160/test-auth", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error, authenticated: false }, 401);
    }

    return c.json({ 
      authenticated: true, 
      userId: auth.userId,
      message: "Authentication successful"
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return c.json({ error: "Internal server error during auth test" }, 500);
  }
});

// Debug endpoint to check stored sessions
app.get("/make-server-b2516160/debug-sessions", async (c) => {
  try {
    // This is a debug endpoint - in production, remove this
    const sessionData = await kv.getByPrefix('session:');
    console.log('Found sessions:', sessionData);
    
    return c.json({ 
      sessionCount: sessionData ? sessionData.length : 0,
      sessions: sessionData || []
    });
  } catch (error) {
    console.error('Debug sessions error:', error);
    return c.json({ error: "Internal server error during debug" }, 500);
  }
});

// Utility function to generate random room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Add sample data for demo purposes
async function addSampleDataIfNeeded(userId: string) {
  const profile = await kv.get(`profile:${userId}`);
  
  if (profile && (!profile.call_history || profile.call_history.length === 0)) {
    // Add sample call history
    const sampleCallHistory = [
      {
        id: 'call_1',
        type: 'outgoing',
        participants: ['Alice Johnson', 'Bob Smith'],
        duration: 1247, // 20 minutes 47 seconds
        quality: 'good',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        features_used: ['Voice-to-Text', 'Chat']
      },
      {
        id: 'call_2',
        type: 'incoming',
        participants: ['Sarah Wilson'],
        duration: 892, // 14 minutes 52 seconds
        quality: 'fair',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        features_used: ['Sign-to-Text', 'Recording']
      },
      {
        id: 'call_3',
        type: 'missed',
        participants: ['David Brown'],
        duration: 0,
        quality: 'poor',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        features_used: []
      },
      {
        id: 'call_4',
        type: 'outgoing',
        participants: ['Team Meeting', 'Alice', 'Bob', 'Carol'],
        duration: 3456, // 57 minutes 36 seconds
        quality: 'good',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        features_used: ['Voice-to-Text', 'Sign-to-Text', 'Chat', 'Recording']
      }
    ];

    profile.call_history = sampleCallHistory;
  }

  if (profile && (!profile.contacts || profile.contacts.length === 0)) {
    // Add sample contacts
    const sampleContacts = [
      {
        id: 'contact_1',
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        phone: '+1 (555) 123-4567',
        added_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'contact_2',
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
        phone: '+1 (555) 234-5678',
        added_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'contact_3',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        phone: '+1 (555) 345-6789',
        added_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'contact_4',
        name: 'David Brown',
        email: 'david.brown@example.com',
        phone: '',
        added_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    profile.contacts = sampleContacts;
  }

  // Add sample calendar events
  const calendarKey = `calendar:${userId}`;
  const existingEvents = await kv.get(calendarKey);
  
  if (!existingEvents || existingEvents.length === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sampleEvents = [
      {
        id: 'event_1',
        title: 'Team Standup',
        date: tomorrow.toISOString().split('T')[0],
        time: '09:00',
        duration: 30,
        participants: ['alice.johnson@example.com', 'bob.smith@example.com'],
        created_at: new Date().toISOString(),
        room_id: generateRoomId()
      },
      {
        id: 'event_2',
        title: 'Client Demo',
        date: nextWeek.toISOString().split('T')[0],
        time: '14:00',
        duration: 60,
        participants: ['sarah.wilson@example.com'],
        created_at: new Date().toISOString(),
        room_id: generateRoomId()
      }
    ];

    await kv.set(calendarKey, sampleEvents);
  }

  // Save updated profile
  if (profile) {
    await kv.set(`profile:${userId}`, profile);
  }
}

// Auth Routes
app.post("/make-server-b2516160/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    // Check if user already exists
    const userKey = `user:${email}`;
    const existingUser = await kv.get(userKey);
    
    if (existingUser) {
      return c.json({ error: "User with this email already exists" }, 400);
    }

    // Generate a unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Create user data (in production, hash the password)
    const userData = {
      id: userId,
      email,
      name,
      password, // In production, use proper password hashing
      created_at: new Date().toISOString()
    };

    // Store user credentials
    await kv.set(userKey, userData);

    // Create user profile
    const profile = {
      id: userId,
      email,
      name,
      created_at: new Date().toISOString(),
      call_history: [],
      contacts: [],
      preferences: {
        darkMode: false,
        largeText: false,
        language: 'en'
      }
    };

    await kv.set(`profile:${userId}`, profile);

    return c.json({ 
      user: { id: userId, email, name },
      message: "User created successfully" 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

app.post("/make-server-b2516160/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // First check if user exists in our KV store (simple auth system)
    const userKey = `user:${email}`;
    const userData = await kv.get(userKey);
    
    if (!userData) {
      return c.json({ error: "Invalid email or password" }, 400);
    }

    // Simple password check (in production, use proper hashing)
    if (userData.password !== password) {
      return c.json({ error: "Invalid email or password" }, 400);
    }

    // Get user profile
    const profile = await kv.get(`profile:${userData.id}`);
    
    if (!profile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Create a simple session token - make it shorter and simpler
    const sessionToken = `${userData.id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    const session = {
      access_token: sessionToken,
      user: userData,
      expires_at: expiresAt,
      token_type: 'bearer'
    };

    // Store session in KV
    const sessionData = {
      userId: userData.id,
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    };
    
    console.log('Creating session token:', sessionToken);
    console.log('Session data to store:', sessionData);
    
    const sessionKey = `session:${sessionToken}`;
    console.log('Session key:', sessionKey);
    
    try {
      await kv.set(sessionKey, sessionData);
      console.log('Session stored successfully');
      
      // Verify storage
      const storedData = await kv.get(sessionKey);
      console.log('Verification - stored data:', storedData);
    } catch (error) {
      console.error('Error storing session:', error);
      return c.json({ error: 'Failed to create session' }, 500);
    }

    // Add some sample data for demo purposes if it's a first time login
    await addSampleDataIfNeeded(userData.id);

    return c.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      },
      session,
      profile
    });
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({ error: "Internal server error during signin" }, 500);
  }
});

// Helper function to authenticate user
async function authenticateUser(c: any) {
  const authHeader = c.req.header('Authorization');
  console.log('Auth header:', authHeader);
  
  const accessToken = authHeader?.split(' ')[1];
  console.log('Access token:', accessToken);
  
  if (!accessToken) {
    console.log('No authorization token provided');
    return { error: 'No authorization token provided' };
  }

  const sessionKey = `session:${accessToken}`;
  console.log('Looking for session key:', sessionKey);
  
  const sessionData = await kv.get(sessionKey);
  console.log('Session data found:', sessionData);
  
  if (!sessionData) {
    console.log('No session data found for token:', accessToken);
    return { error: 'Invalid or expired session' };
  }

  // Check if session is expired
  if (new Date(sessionData.expires_at) < new Date()) {
    console.log('Session expired:', sessionData.expires_at);
    await kv.del(sessionKey);
    return { error: 'Session expired' };
  }

  console.log('Authentication successful for user:', sessionData.userId);
  return { userId: sessionData.userId };
}

// User Profile Routes
app.get("/make-server-b2516160/user/profile", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: "Internal server error while getting profile" }, 500);
  }
});

app.put("/make-server-b2516160/user/profile", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const updates = await c.req.json();
    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = { ...profile, ...updates };
    await kv.set(`profile:${auth.userId}`, updatedProfile);

    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: "Internal server error while updating profile" }, 500);
  }
});

// Call History Routes
app.get("/make-server-b2516160/user/call-history", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ callHistory: profile.call_history || [] });
  } catch (error) {
    console.error('Get call history error:', error);
    return c.json({ error: "Internal server error while getting call history" }, 500);
  }
});

app.post("/make-server-b2516160/user/call-history", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const callRecord = await c.req.json();
    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const newCallRecord = {
      id: Math.random().toString(36).substring(2),
      ...callRecord,
      timestamp: new Date().toISOString()
    };

    profile.call_history = profile.call_history || [];
    profile.call_history.unshift(newCallRecord);

    // Keep only last 100 call records
    if (profile.call_history.length > 100) {
      profile.call_history = profile.call_history.slice(0, 100);
    }

    await kv.set(`profile:${auth.userId}`, profile);

    return c.json({ message: "Call record added successfully" });
  } catch (error) {
    console.error('Add call history error:', error);
    return c.json({ error: "Internal server error while adding call history" }, 500);
  }
});

// Contacts Routes
app.get("/make-server-b2516160/contacts", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ contacts: profile.contacts || [] });
  } catch (error) {
    console.error('Get contacts error:', error);
    return c.json({ error: "Internal server error while getting contacts" }, 500);
  }
});

app.post("/make-server-b2516160/contacts", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const { name, email, phone } = await c.req.json();
    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const newContact = {
      id: Math.random().toString(36).substring(2),
      name,
      email,
      phone,
      added_at: new Date().toISOString()
    };

    profile.contacts = profile.contacts || [];
    profile.contacts.push(newContact);

    await kv.set(`profile:${auth.userId}`, profile);

    return c.json({ contact: newContact });
  } catch (error) {
    console.error('Add contact error:', error);
    return c.json({ error: "Internal server error while adding contact" }, 500);
  }
});

// Room Management Routes
app.post("/make-server-b2516160/rooms/create", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const { roomName, isPrivate = false } = await c.req.json();
    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const roomId = generateRoomId();
    const room = {
      id: roomId,
      name: roomName || `${profile.name}'s Room`,
      hostId: auth.userId,
      hostName: profile.name,
      isPrivate,
      participants: [{
        id: auth.userId,
        name: profile.name,
        email: profile.email,
        joined_at: new Date().toISOString(),
        isVideoOn: true,
        isAudioOn: true
      }],
      created_at: new Date().toISOString(),
      status: 'active',
      chat_messages: []
    };

    await kv.set(`room:${roomId}`, room);

    // Add to active rooms list
    const activeRooms = await kv.get('active_rooms') || [];
    activeRooms.push({
      id: roomId,
      name: room.name,
      hostName: profile.name,
      participantCount: 1,
      created_at: room.created_at
    });
    await kv.set('active_rooms', activeRooms);

    return c.json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    return c.json({ error: "Internal server error while creating room" }, 500);
  }
});

app.get("/make-server-b2516160/rooms/active", async (c) => {
  try {
    const activeRooms = await kv.get('active_rooms') || [];
    return c.json({ rooms: activeRooms });
  } catch (error) {
    console.error('Get active rooms error:', error);
    return c.json({ error: "Internal server error while getting active rooms" }, 500);
  }
});

app.get("/make-server-b2516160/rooms/:roomId", async (c) => {
  try {
    const { roomId } = c.req.param();
    const room = await kv.get(`room:${roomId}`);
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    return c.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    return c.json({ error: "Internal server error while getting room" }, 500);
  }
});

app.post("/make-server-b2516160/rooms/:roomId/join", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const { roomId } = c.req.param();
    const room = await kv.get(`room:${roomId}`);
    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Check if user is already in the room
    const existingParticipant = room.participants.find(p => p.id === auth.userId);
    if (existingParticipant) {
      return c.json({ room, participant: existingParticipant });
    }

    const participant = {
      id: auth.userId,
      name: profile.name,
      email: profile.email,
      joined_at: new Date().toISOString(),
      isVideoOn: true,
      isAudioOn: true
    };

    room.participants.push(participant);
    await kv.set(`room:${roomId}`, room);

    // Update active rooms count
    const activeRooms = await kv.get('active_rooms') || [];
    const roomIndex = activeRooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
      activeRooms[roomIndex].participantCount = room.participants.length;
      await kv.set('active_rooms', activeRooms);
    }

    return c.json({ room, participant });
  } catch (error) {
    console.error('Join room error:', error);
    return c.json({ error: "Internal server error while joining room" }, 500);
  }
});

app.post("/make-server-b2516160/rooms/:roomId/leave", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const { roomId } = c.req.param();
    const room = await kv.get(`room:${roomId}`);
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // Remove participant from room
    room.participants = room.participants.filter(p => p.id !== auth.userId);

    if (room.participants.length === 0) {
      // Delete room if empty
      await kv.del(`room:${roomId}`);
      
      // Remove from active rooms
      const activeRooms = await kv.get('active_rooms') || [];
      const updatedActiveRooms = activeRooms.filter(r => r.id !== roomId);
      await kv.set('active_rooms', updatedActiveRooms);
    } else {
      await kv.set(`room:${roomId}`, room);
      
      // Update active rooms count
      const activeRooms = await kv.get('active_rooms') || [];
      const roomIndex = activeRooms.findIndex(r => r.id === roomId);
      if (roomIndex !== -1) {
        activeRooms[roomIndex].participantCount = room.participants.length;
        await kv.set('active_rooms', activeRooms);
      }
    }

    return c.json({ message: "Left room successfully" });
  } catch (error) {
    console.error('Leave room error:', error);
    return c.json({ error: "Internal server error while leaving room" }, 500);
  }
});

// Chat Messages Routes
app.get("/make-server-b2516160/rooms/:roomId/messages", async (c) => {
  try {
    const { roomId } = c.req.param();
    const room = await kv.get(`room:${roomId}`);
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    return c.json({ messages: room.chat_messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json({ error: "Internal server error while getting messages" }, 500);
  }
});

app.post("/make-server-b2516160/rooms/:roomId/messages", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const { roomId } = c.req.param();
    const { message } = await c.req.json();
    const room = await kv.get(`room:${roomId}`);
    const profile = await kv.get(`profile:${auth.userId}`);
    
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const chatMessage = {
      id: Math.random().toString(36).substring(2),
      userId: auth.userId,
      userName: profile.name,
      message,
      timestamp: new Date().toISOString()
    };

    room.chat_messages = room.chat_messages || [];
    room.chat_messages.push(chatMessage);

    // Keep only last 100 messages
    if (room.chat_messages.length > 100) {
      room.chat_messages = room.chat_messages.slice(-100);
    }

    await kv.set(`room:${roomId}`, room);

    return c.json({ message: chatMessage });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: "Internal server error while sending message" }, 500);
  }
});

// Calendar/Scheduling Routes
app.get("/make-server-b2516160/calendar/events", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const events = await kv.get(`calendar:${auth.userId}`) || [];
    return c.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    return c.json({ error: "Internal server error while getting calendar events" }, 500);
  }
});

app.post("/make-server-b2516160/calendar/events", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, 401);
    }

    const { title, date, time, duration, participants } = await c.req.json();
    
    const event = {
      id: Math.random().toString(36).substring(2),
      title,
      date,
      time,
      duration,
      participants: participants || [],
      created_at: new Date().toISOString(),
      room_id: generateRoomId()
    };

    const events = await kv.get(`calendar:${auth.userId}`) || [];
    events.push(event);
    await kv.set(`calendar:${auth.userId}`, events);

    return c.json({ event });
  } catch (error) {
    console.error('Create calendar event error:', error);
    return c.json({ error: "Internal server error while creating calendar event" }, 500);
  }
});

// Socket.io setup for real-time WebRTC signaling
let io: Server;

// Initialize Socket.io server
function initializeSocketIO(server: any) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  console.log('🚀 Socket.io server initialized');

  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    // Join room event
    socket.on('join-room', async (data: { roomId: string, userId: string }) => {
      console.log(`🚪 User ${data.userId} joining room ${data.roomId}`);
      
      try {
        // Join the socket room
        await socket.join(data.roomId);
        
        // Update room in database
        const room = await kv.get(`room:${data.roomId}`);
        if (room) {
          // Notify other users in the room
          socket.to(data.roomId).emit('user-joined', {
            userId: data.userId,
            roomId: data.roomId
          });
          
          console.log(`✅ User ${data.userId} joined room ${data.roomId}`);
        } else {
          console.error(`❌ Room ${data.roomId} not found`);
          socket.emit('error', { message: 'Room not found' });
        }
      } catch (error) {
        console.error('❌ Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room event
    socket.on('leave-room', (data: { roomId: string, userId: string }) => {
      console.log(`🚪 User ${data.userId} leaving room ${data.roomId}`);
      
      socket.leave(data.roomId);
      socket.to(data.roomId).emit('user-left', {
        userId: data.userId
      });
      
      console.log(`✅ User ${data.userId} left room ${data.roomId}`);
    });

    // WebRTC signaling events
    socket.on('offer', (data: { offer: RTCSessionDescriptionInit, to: string, from: string, roomId: string }) => {
      console.log(`📞 Relaying offer from ${data.from} to ${data.to} in room ${data.roomId}`);
      socket.to(data.roomId).emit('offer', {
        offer: data.offer,
        from: data.from
      });
    });

    socket.on('answer', (data: { answer: RTCSessionDescriptionInit, to: string, from: string, roomId: string }) => {
      console.log(`✅ Relaying answer from ${data.from} to ${data.to} in room ${data.roomId}`);
      socket.to(data.roomId).emit('answer', {
        answer: data.answer,
        from: data.from
      });
    });

    socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit, to: string, from: string, roomId: string }) => {
      console.log(`🧊 Relaying ICE candidate from ${data.from} to ${data.to} in room ${data.roomId}`);
      socket.to(data.roomId).emit('ice-candidate', {
        candidate: data.candidate,
        from: data.from
      });
    });

    // Real-time chat messages
    socket.on('chat-message', async (data: { roomId: string, userId: string, message: string, timestamp: string }) => {
      console.log(`💬 Chat message in room ${data.roomId} from user ${data.userId}`);
      
      try {
        // Get user profile for name
        const profile = await kv.get(`profile:${data.userId}`);
        const messageData = {
          id: Math.random().toString(36).substring(2),
          userId: data.userId,
          userName: profile?.name || 'Unknown User',
          message: data.message,
          timestamp: data.timestamp
        };
        
        // Broadcast to all users in the room
        io.to(data.roomId).emit('chat-message', messageData);
        
        // Store in database
        const room = await kv.get(`room:${data.roomId}`);
        if (room) {
          room.chat_messages = room.chat_messages || [];
          room.chat_messages.push(messageData);
          
          // Keep only last 100 messages
          if (room.chat_messages.length > 100) {
            room.chat_messages = room.chat_messages.slice(-100);
          }
          
          await kv.set(`room:${data.roomId}`, room);
        }
      } catch (error) {
        console.error('❌ Error handling chat message:', error);
      }
    });

    // Media toggle events (video/audio on/off)
    socket.on('media-toggle', (data: { roomId: string, userId: string, type: 'video' | 'audio', enabled: boolean }) => {
      console.log(`📺 Media toggle in room ${data.roomId}: ${data.type} ${data.enabled ? 'enabled' : 'disabled'} by ${data.userId}`);
      
      socket.to(data.roomId).emit('media-toggle', {
        userId: data.userId,
        type: data.type,
        enabled: data.enabled
      });
    });

    // Screen sharing events
    socket.on('screen-share-start', (data: { roomId: string, userId: string }) => {
      console.log(`🖥️ Screen share started in room ${data.roomId} by ${data.userId}`);
      socket.to(data.roomId).emit('screen-share-start', {
        userId: data.userId
      });
    });

    socket.on('screen-share-stop', (data: { roomId: string, userId: string }) => {
      console.log(`🖥️ Screen share stopped in room ${data.roomId} by ${data.userId}`);
      socket.to(data.roomId).emit('screen-share-stop', {
        userId: data.userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  return io;
}

// Start the server with Socket.io support
const server = Deno.serve({
  port: 8000,
  handler: async (req) => {
    // Handle Socket.io upgrade requests
    if (req.headers.get("upgrade") === "websocket") {
      // Let Socket.io handle WebSocket upgrades
      return new Response(null, { status: 501 });
    }
    
    // Handle regular HTTP requests with Hono
    return app.fetch(req);
  },
});

// Initialize Socket.io with the server
initializeSocketIO(server);