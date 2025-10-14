const Message = require('../models/Message');
const CallHistory = require('../models/CallHistory');
const User = require('../models/User');

const rooms = new Map(); // roomId -> Set of userIds
const userSockets = new Map(); // userId -> socketId

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    socket.on('join-room', async (data) => {
      const { roomId, userId } = data;
      console.log(`🚪 User ${userId} joining room ${roomId}`);

      // Leave previous room if any
      if (socket.roomId) {
        socket.leave(socket.roomId);
        const prevRoom = rooms.get(socket.roomId);
        if (prevRoom) {
          prevRoom.delete(socket.userId);
          if (prevRoom.size === 0) {
            rooms.delete(socket.roomId);
          }
        }
      }

      // Join new room
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;

      // Track user in room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(userId);
      userSockets.set(userId, socket.id);

      // Notify others in room
      socket.to(roomId).emit('user-joined', { userId, roomId });

      // Send existing participants to new user
      const roomUsers = Array.from(rooms.get(roomId) || []);
      socket.emit('room-users', { users: roomUsers.filter(u => u !== userId) });

      console.log(`✅ User ${userId} joined room ${roomId}. Room now has ${rooms.get(roomId).size} users`);
    });

    socket.on('leave-room', (data) => {
      const { roomId, userId } = data || { roomId: socket.roomId, userId: socket.userId };
      console.log(`🚪 User ${userId} leaving room ${roomId}`);

      socket.leave(roomId);

      const room = rooms.get(roomId);
      if (room) {
        room.delete(userId);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }

      userSockets.delete(userId);

      // Notify others
      socket.to(roomId).emit('user-left', { userId });

      socket.roomId = null;
      socket.userId = null;
    });

    // WebRTC Signaling
    socket.on('offer', (data) => {
      const { offer, to, from, roomId } = data;
      console.log(`📞 Offer from ${from} to ${to} in room ${roomId}`);

      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('offer', { offer, from });
      }
    });

    socket.on('answer', (data) => {
      const { answer, to, from, roomId } = data;
      console.log(`✅ Answer from ${from} to ${to} in room ${roomId}`);

      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('answer', { answer, from });
      }
    });

    socket.on('ice-candidate', (data) => {
      const { candidate, to, from, roomId } = data;
      console.log(`🧊 ICE candidate from ${from} to ${to} in room ${roomId}`);

      const targetSocketId = userSockets.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice-candidate', { candidate, from });
      }
    });

    // Chat messages
    socket.on('chat-message', async (data) => {
      const { roomId, userId, message, timestamp } = data;
      console.log(`💬 Chat message from ${userId} in room ${roomId}: ${message}`);

      try {
        // Get user name
        const user = await User.findById(userId).select('name');
        if (!user) return;

        // Save message to database
        const chatMessage = new Message({
          roomId,
          sender: userId,
          senderName: user.name,
          message,
          timestamp: new Date(timestamp)
        });
        await chatMessage.save();

        // Broadcast to room
        io.to(roomId).emit('chat-message', {
          id: chatMessage._id,
          userId,
          userName: user.name,
          message,
          timestamp: chatMessage.timestamp
        });
      } catch (error) {
        console.error('❌ Error saving chat message:', error);
      }
    });

    // Media toggle notifications
    socket.on('media-toggle', (data) => {
      const { roomId, userId, type, enabled } = data;
      console.log(`📺 Media toggle: ${userId} ${type} ${enabled ? 'on' : 'off'} in ${roomId}`);

      socket.to(roomId).emit('media-toggle', { userId, type, enabled });
    });

    // Call history updates
    socket.on('call-started', async (data) => {
      const { roomId, userId, participants } = data;
      console.log(`📞 Call started in room ${roomId} by ${userId}`);

      // This could be used to track active calls
    });

    socket.on('call-ended', async (data) => {
      const { roomId, userId, duration } = data;
      console.log(`📞 Call ended in room ${roomId} by ${userId}, duration: ${duration}`);

      // Update call history if needed
    });

    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);

      // Clean up
      if (socket.roomId && socket.userId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          room.delete(socket.userId);
          if (room.size === 0) {
            rooms.delete(socket.roomId);
          }
        }

        socket.to(socket.roomId).emit('user-left', { userId: socket.userId });
      }

      userSockets.delete(socket.userId);
    });
  });
};
