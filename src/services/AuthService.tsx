const API_URL = import.meta.env.VITE_API_URL;

interface User {
  _id: string
  email: string
  name: string
  preferences: {
    darkMode: boolean
    largeText: boolean
    language: string
  }
}

interface UserProfile {
  _id: string
  email: string
  name: string
  preferences: {
    darkMode: boolean
    largeText: boolean
    language: string
  }
  createdAt: string
  lastLogin?: string
}

interface AuthResponse {
  user?: User
  token?: string
  profile?: UserProfile
  error?: string
}

class AuthService {
  private currentUser: User | null = null
  private currentToken: string | null = null
  private currentProfile: UserProfile | null = null

  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Signup failed' }
      }

      // Store the token and user data
      this.currentToken = data.token
      this.currentUser = data.user
      this.currentProfile = data.user

      // Store in localStorage
      localStorage.setItem('clearCallToken', data.token)
      localStorage.setItem('clearCallUser', JSON.stringify(data.user))

      return { user: data.user, token: data.token, profile: data.user }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: 'Network error during signup' }
    }
  }

  async signin(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Signin failed' }
      }

      // Store the token and user data
      this.currentToken = data.token
      this.currentUser = data.user
      this.currentProfile = data.user

      // Store in localStorage
      localStorage.setItem('clearCallToken', data.token)
      localStorage.setItem('clearCallUser', JSON.stringify(data.user))

      return { user: data.user, token: data.token, profile: data.user }
    } catch (error) {
      console.error('Signin error:', error)
      return { error: 'Network error during signin' }
    }
  }

  async signout(): Promise<void> {
    this.currentUser = null
    this.currentToken = null
    this.currentProfile = null

    localStorage.removeItem('clearCallToken')
    localStorage.removeItem('clearCallUser')
  }

  async getCurrentSession(): Promise<AuthResponse> {
    // Check if we have a stored token
    const storedToken = localStorage.getItem('clearCallToken')
    const storedUser = localStorage.getItem('clearCallUser')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)

        // Verify token is still valid by making a request
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()

          // Set current state
          this.currentToken = storedToken
          this.currentUser = parsedUser
          this.currentProfile = data.profile

          return {
            user: parsedUser,
            token: storedToken,
            profile: data.profile
          }
        } else {
          // Token expired or invalid
          await this.signout()
          return { error: 'Session expired' }
        }
      } catch (error) {
        console.error('Session restore error:', error)
        await this.signout()
        return { error: 'Invalid stored session' }
      }
    }

    return { error: 'No active session' }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  getCurrentProfile(): UserProfile | null {
    return this.currentProfile
  }

  getAccessToken(): string | null {
    return this.currentToken
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<{ profile?: UserProfile; error?: string }> {
    try {
      const token = this.getAccessToken()
      if (!token) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Update failed' }
      }

      this.currentProfile = data.profile
      localStorage.setItem('clearCallUser', JSON.stringify(data.profile))

      return { profile: data.profile }
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: 'Network error during profile update' }
    }
  }

  async getCallHistory(): Promise<{ callHistory?: any[]; error?: string }> {
    try {
      const token = this.getAccessToken()
      if (!token) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${API_URL}/api/user/call-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to get call history' }
      }

      return { callHistory: data.callHistory }
    } catch (error) {
      console.error('Get call history error:', error)
      return { error: 'Network error while getting call history' }
    }
  }

  async addCallHistory(callRecord: any): Promise<{ error?: string }> {
    try {
      const token = this.getAccessToken()
      if (!token) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${API_URL}/api/user/call-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(callRecord)
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to add call history' }
      }

      return {}
    } catch (error) {
      console.error('Add call history error:', error)
      return { error: 'Network error while adding call history' }
    }
  }
}

export const authService = new AuthService()
export type { User, UserProfile, AuthResponse }