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
  phone?: string
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
  token?: string | null
  refreshToken?: string | null
  profile?: UserProfile
  error?: string
}

class AuthService {
  private currentUser: User | null = null
  private currentToken: string | null = null
  private currentRefreshToken: string | null = null
  private currentProfile: UserProfile | null = null
  private refreshPromise: Promise<AuthResponse> | null = null

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
      this.currentRefreshToken = data.refreshToken
      this.currentUser = data.user
      this.currentProfile = data.user

      // Store in localStorage
      localStorage.setItem('clearCallToken', data.token)
      localStorage.setItem('clearCallRefreshToken', data.refreshToken)
      localStorage.setItem('clearCallUser', JSON.stringify(data.user))

      return { user: data.user, token: data.token, refreshToken: data.refreshToken, profile: data.user }
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
      this.currentRefreshToken = data.refreshToken
      this.currentUser = data.user
      this.currentProfile = data.user

      // Store in localStorage
      localStorage.setItem('clearCallToken', data.token)
      localStorage.setItem('clearCallRefreshToken', data.refreshToken)
      localStorage.setItem('clearCallUser', JSON.stringify(data.user))

      return { user: data.user, token: data.token, refreshToken: data.refreshToken, profile: data.user }
    } catch (error) {
      console.error('Signin error:', error)
      return { error: 'Network error during signin' }
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this._refreshToken()
    const result = await this.refreshPromise
    this.refreshPromise = null
    return result
  }

  private async _refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return { error: 'No refresh token available' }
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()

      if (!response.ok) {
        await this.signout()
        return { error: data.error || 'Token refresh failed' }
      }

      // Update tokens
      this.currentToken = data.token
      this.currentRefreshToken = data.refreshToken

      // Store in localStorage
      localStorage.setItem('clearCallToken', data.token)
      localStorage.setItem('clearCallRefreshToken', data.refreshToken)

      return { token: data.token, refreshToken: data.refreshToken }
    } catch (error) {
      console.error('Token refresh error:', error)
      await this.signout()
      return { error: 'Network error during token refresh' }
    }
  }

  async forgotPassword(email: string): Promise<{ message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to send reset email' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Forgot password error:', error)
      return { error: 'Network error during password reset request' }
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Password reset failed' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: 'Network error during password reset' }
    }
  }

  async verifyEmail(email: string): Promise<{ message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to send verification email' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Verify email error:', error)
      return { error: 'Network error during email verification request' }
    }
  }

  async confirmEmail(token: string): Promise<{ message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/confirm-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Email verification failed' }
      }

      return { message: data.message }
    } catch (error) {
      console.error('Confirm email error:', error)
      return { error: 'Network error during email verification' }
    }
  }

  async signout(): Promise<void> {
    this.currentUser = null
    this.currentToken = null
    this.currentRefreshToken = null
    this.currentProfile = null
    this.refreshPromise = null

    localStorage.removeItem('clearCallToken')
    localStorage.removeItem('clearCallRefreshToken')
    localStorage.removeItem('clearCallUser')
  }

  async getCurrentSession(): Promise<AuthResponse> {
    // Check if we have a stored token
    const storedToken = localStorage.getItem('clearCallToken')
    const storedRefreshToken = localStorage.getItem('clearCallRefreshToken')
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
          this.currentRefreshToken = storedRefreshToken
          this.currentUser = parsedUser
          this.currentProfile = data.profile

          return {
            user: parsedUser,
            token: storedToken,
            refreshToken: storedRefreshToken || undefined,
            profile: data.profile
          }
        } else if (response.status === 401 && storedRefreshToken) {
          // Try to refresh token
          const refreshResult = await this.refreshToken()
          if (refreshResult.token) {
            // Retry the profile request with new token
            const retryResponse = await fetch(`${API_URL}/api/user/profile`, {
              headers: {
                'Authorization': `Bearer ${this.currentToken}`
              }
            })

            if (retryResponse.ok) {
              const retryData = await retryResponse.json()

              this.currentUser = parsedUser
              this.currentProfile = retryData.profile

              return {
                user: parsedUser,
                token: this.currentToken,
                refreshToken: this.currentRefreshToken || undefined,
                profile: retryData.profile
              }
            }
          }

          // Token refresh failed
          await this.signout()
          return { error: 'Session expired' }
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

  getRefreshToken(): string | null {
    return this.currentRefreshToken
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<{ profile?: UserProfile; error?: string }> {
    try {
      let token = this.getAccessToken()
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

      if (response.status === 401 && this.currentRefreshToken) {
        // Try to refresh token and retry
        const refreshResult = await this.refreshToken()
        if (refreshResult.token) {
          token = this.getAccessToken()
          const retryResponse = await fetch(`${API_URL}/api/user/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
          })

          if (!retryResponse.ok) {
            const retryData = await retryResponse.json()
            return { error: retryData.error || 'Update failed' }
          }

          const retryData = await retryResponse.json()
          this.currentProfile = retryData.profile
          localStorage.setItem('clearCallUser', JSON.stringify(retryData.profile))
          return { profile: retryData.profile }
        }
      }

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
      let token = this.getAccessToken()
      if (!token) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${API_URL}/api/user/call-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 && this.currentRefreshToken) {
        // Try to refresh token and retry
        const refreshResult = await this.refreshToken()
        if (refreshResult.token) {
          token = this.getAccessToken()
          const retryResponse = await fetch(`${API_URL}/api/user/call-history`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            return { callHistory: retryData.callHistory }
          }
        }
      }

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
      let token = this.getAccessToken()
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

      if (response.status === 401 && this.currentRefreshToken) {
        // Try to refresh token and retry
        const refreshResult = await this.refreshToken()
        if (refreshResult.token) {
          token = this.getAccessToken()
          const retryResponse = await fetch(`${API_URL}/api/user/call-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(callRecord)
          })

          if (!retryResponse.ok) {
            const retryData = await retryResponse.json()
            return { error: retryData.error || 'Failed to add call history' }
          }

          return {}
        }
      }

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
