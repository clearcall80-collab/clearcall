import { authService } from './AuthService'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Room {
  id: string
  name: string
  hostId: string
  hostName: string
  isPrivate: boolean
  participants: Participant[]
  created_at: string
  status: string
  chat_messages: ChatMessage[]
}

interface Participant {
  id: string
  name: string
  email: string
  joined_at: string
  isVideoOn: boolean
  isAudioOn: boolean
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: string
}

interface ActiveRoom {
  id: string
  name: string
  hostName: string
  participantCount: number
  created_at: string
}

class RoomService {
  async createRoom(roomName?: string, isPrivate = false): Promise<{ room?: Room; error?: string }> {
    try {
      const accessToken = authService.getAccessToken()
      if (!accessToken) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ roomName, isPrivate })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to create room' }
      }

      return { room: data.room }
    } catch (error) {
      console.error('Create room error:', error)
      return { error: 'Network error while creating room' }
    }
  }

  async getActiveRooms(): Promise<{ rooms?: ActiveRoom[]; error?: string }> {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/rooms/active`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to get active rooms' }
      }

      return { rooms: data.rooms }
    } catch (error) {
      console.error('Get active rooms error:', error)
      return { error: 'Network error while getting active rooms' }
    }
  }

  async getRoom(roomId: string): Promise<{ room?: Room; error?: string }> {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to get room' }
      }

      return { room: data.room }
    } catch (error) {
      console.error('Get room error:', error)
      return { error: 'Network error while getting room' }
    }
  }

  async joinRoom(roomId: string): Promise<{ room?: Room; participant?: Participant; error?: string }> {
    try {
      const accessToken = authService.getAccessToken()
      if (!accessToken) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to join room' }
      }

      return { room: data.room, participant: data.participant }
    } catch (error) {
      console.error('Join room error:', error)
      return { error: 'Network error while joining room' }
    }
  }

  async leaveRoom(roomId: string): Promise<{ error?: string }> {
    try {
      const accessToken = authService.getAccessToken()
      if (!accessToken) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to leave room' }
      }

      return {}
    } catch (error) {
      console.error('Leave room error:', error)
      return { error: 'Network error while leaving room' }
    }
  }

  async sendMessage(roomId: string, message: string): Promise<{ message?: ChatMessage; error?: string }> {
    try {
      const accessToken = authService.getAccessToken()
      if (!accessToken) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to send message' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Send message error:', error)
      return { error: 'Network error while sending message' }
    }
  }

  async getMessages(roomId: string): Promise<{ messages?: ChatMessage[]; error?: string }> {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to get messages' }
      }

      return { messages: data.messages }
    } catch (error) {
      console.error('Get messages error:', error)
      return { error: 'Network error while getting messages' }
    }
  }
}

export const roomService = new RoomService()
export type { Room, Participant, ChatMessage, ActiveRoom }