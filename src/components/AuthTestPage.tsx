import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { authService } from '../services/AuthService';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export function AuthTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testUser, setTestUser] = useState({
    email: 'test@clearcall.com',
    password: 'testpass123',
    name: 'Test User'
  });

  const updateResult = (name: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => {
      const index = prev.findIndex(r => r.name === name);
      const newResult = { name, status, message, data };
      if (index >= 0) {
        const newResults = [...prev];
        newResults[index] = newResult;
        return newResults;
      }
      return [...prev, newResult];
    });
  };

  const addTest = (name: string) => {
    setTestResults(prev => {
      if (!prev.find(r => r.name === name)) {
        return [...prev, { name, status: 'pending', message: 'Running...' }];
      }
      return prev;
    });
  };

  const testApiEndpoint = async (endpoint: string, options: any = {}) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b2516160${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers
        }
      });

      const data = await response.json();
      return { success: response.ok, data, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Health check
      addTest('Health Check');
      const healthResult = await testApiEndpoint('/health');
      if (healthResult.success) {
        updateResult('Health Check', 'success', 'API server is running', healthResult.data);
      } else {
        updateResult('Health Check', 'error', `API server error: ${healthResult.error || healthResult.data?.error}`);
        return; // Don't continue if health check fails
      }

      // Test 2: Check existing sessions (debug)
      addTest('Debug Sessions');
      const sessionsResult = await testApiEndpoint('/debug-sessions');
      if (sessionsResult.success) {
        updateResult('Debug Sessions', 'success', `Found ${sessionsResult.data.sessionCount} sessions`, sessionsResult.data);
      } else {
        updateResult('Debug Sessions', 'error', `Debug sessions failed: ${sessionsResult.error || sessionsResult.data?.error}`);
      }

      // Test 3: Test authentication endpoint
      addTest('Test Auth Endpoint');
      const authTestResult = await testApiEndpoint('/test-auth');
      if (authTestResult.success) {
        updateResult('Test Auth Endpoint', 'success', 'Already authenticated', authTestResult.data);
      } else {
        updateResult('Test Auth Endpoint', 'error', `Auth test failed: ${authTestResult.data?.error}`, authTestResult.data);
      }

      // Test 4: Sign up new user
      addTest('User Signup');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      const signupResult = await authService.signup(testUser.email, testUser.password, testUser.name);
      if (signupResult.user && !signupResult.error) {
        updateResult('User Signup', 'success', 'User created and signed in successfully', signupResult);
      } else {
        updateResult('User Signup', 'error', `Signup failed: ${signupResult.error}`, signupResult);
      }

      // Test 5: Test authentication with new session
      addTest('Auth After Signup');
      const authAfterSignupResult = await testApiEndpoint('/test-auth', {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      });
      if (authAfterSignupResult.success) {
        updateResult('Auth After Signup', 'success', 'Authentication successful with new session', authAfterSignupResult.data);
      } else {
        updateResult('Auth After Signup', 'error', `Auth failed: ${authAfterSignupResult.data?.error}`, authAfterSignupResult.data);
      }

      // Test 6: Get Profile
      addTest('Get Profile');
      const profileResult = await testApiEndpoint('/user/profile', {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      });
      if (profileResult.success) {
        updateResult('Get Profile', 'success', 'Profile retrieved successfully', profileResult.data);
      } else {
        updateResult('Get Profile', 'error', `Get profile failed: ${profileResult.data?.error}`, profileResult.data);
      }

      // Test 7: Update Profile (preferences)
      addTest('Update Profile');
      const updateProfileResult = await authService.updateProfile({
        preferences: {
          darkMode: true,
          largeText: false,
          language: 'en'
        }
      });
      if (updateProfileResult.profile && !updateProfileResult.error) {
        updateResult('Update Profile', 'success', 'Profile updated successfully', updateProfileResult);
      } else {
        updateResult('Update Profile', 'error', `Update profile failed: ${updateProfileResult.error}`, updateProfileResult);
      }

      // Test 8: Get Call History
      addTest('Get Call History');
      const callHistoryResult = await authService.getCallHistory();
      if (callHistoryResult.callHistory && !callHistoryResult.error) {
        updateResult('Get Call History', 'success', `Retrieved ${callHistoryResult.callHistory.length} call records`, callHistoryResult);
      } else {
        updateResult('Get Call History', 'error', `Get call history failed: ${callHistoryResult.error}`, callHistoryResult);
      }

      // Test 9: Add Call History
      addTest('Add Call History');
      const addCallResult = await authService.addCallHistory({
        type: 'test',
        participants: ['Test Participant'],
        duration: 123,
        quality: 'good',
        features_used: ['Voice-to-Text']
      });
      if (!addCallResult.error) {
        updateResult('Add Call History', 'success', 'Call record added successfully', addCallResult);
      } else {
        updateResult('Add Call History', 'error', `Add call history failed: ${addCallResult.error}`, addCallResult);
      }

      // Test 10: Get Contacts
      addTest('Get Contacts');
      const contactsResult = await testApiEndpoint('/contacts', {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      });
      if (contactsResult.success) {
        updateResult('Get Contacts', 'success', `Retrieved ${contactsResult.data.contacts?.length || 0} contacts`, contactsResult.data);
      } else {
        updateResult('Get Contacts', 'error', `Get contacts failed: ${contactsResult.data?.error}`, contactsResult.data);
      }

      // Test 11: Add Contact
      addTest('Add Contact');
      const addContactResult = await testApiEndpoint('/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          name: 'Test Contact',
          email: 'testcontact@example.com',
          phone: '+1234567890'
        })
      });
      if (addContactResult.success) {
        updateResult('Add Contact', 'success', 'Contact added successfully', addContactResult.data);
      } else {
        updateResult('Add Contact', 'error', `Add contact failed: ${addContactResult.data?.error}`, addContactResult.data);
      }

      // Test 12: Get Calendar Events
      addTest('Get Calendar Events');
      const calendarResult = await testApiEndpoint('/calendar/events', {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        }
      });
      if (calendarResult.success) {
        updateResult('Get Calendar Events', 'success', `Retrieved ${calendarResult.data.events?.length || 0} events`, calendarResult.data);
      } else {
        updateResult('Get Calendar Events', 'error', `Get calendar events failed: ${calendarResult.data?.error}`, calendarResult.data);
      }

      // Test 13: Create Calendar Event
      addTest('Create Calendar Event');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const createEventResult = await testApiEndpoint('/calendar/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          title: 'Test Meeting',
          date: tomorrow.toISOString().split('T')[0],
          time: '10:00',
          duration: 60,
          participants: ['test@example.com']
        })
      });
      if (createEventResult.success) {
        updateResult('Create Calendar Event', 'success', 'Calendar event created successfully', createEventResult.data);
      } else {
        updateResult('Create Calendar Event', 'error', `Create calendar event failed: ${createEventResult.data?.error}`, createEventResult.data);
      }

      // Test 14: Create Room
      addTest('Create Room');
      const createRoomResult = await testApiEndpoint('/rooms/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify({
          roomName: 'Test Room',
          isPrivate: false
        })
      });
      if (createRoomResult.success) {
        updateResult('Create Room', 'success', 'Room created successfully', createRoomResult.data);
      } else {
        updateResult('Create Room', 'error', `Create room failed: ${createRoomResult.data?.error}`, createRoomResult.data);
      }

      // Test 15: Get Active Rooms
      addTest('Get Active Rooms');
      const activeRoomsResult = await testApiEndpoint('/rooms/active');
      if (activeRoomsResult.success) {
        updateResult('Get Active Rooms', 'success', `Retrieved ${activeRoomsResult.data.rooms?.length || 0} active rooms`, activeRoomsResult.data);
      } else {
        updateResult('Get Active Rooms', 'error', `Get active rooms failed: ${activeRoomsResult.data?.error}`, activeRoomsResult.data);
      }

      // Test 16: Test Session Persistence
      addTest('Session Persistence');
      const currentSession = await authService.getCurrentSession();
      if (currentSession.user && currentSession.profile && !currentSession.error) {
        updateResult('Session Persistence', 'success', 'Session persisted correctly', currentSession);
      } else {
        updateResult('Session Persistence', 'error', `Session persistence failed: ${currentSession.error}`, currentSession);
      }

    } catch (error) {
      console.error('Test error:', error);
      updateResult('Test Suite', 'error', `Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearTestData = async () => {
    try {
      await authService.signout();
      setTestResults([]);
      updateResult('Clear Test Data', 'success', 'Test data cleared, signed out');
    } catch (error) {
      updateResult('Clear Test Data', 'error', `Clear failed: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clear Call Authentication Test Suite</h1>
          <p className="text-gray-600">Comprehensive testing of authentication flow and dashboard features</p>
        </div>

        {/* Test Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  value={testUser.email}
                  onChange={(e) => setTestUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Test email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={testUser.password}
                  onChange={(e) => setTestUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Test password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={testUser.name}
                  onChange={(e) => setTestUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Test name"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={runComprehensiveTests}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Complete Test Suite
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={clearTestData}
                disabled={isRunning}
              >
                Clear Test Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <p className="text-sm text-gray-600">
              {testResults.length > 0 && (
                <>
                  {testResults.filter(r => r.status === 'success').length} passed, {' '}
                  {testResults.filter(r => r.status === 'error').length} failed, {' '}
                  {testResults.filter(r => r.status === 'pending').length} running
                </>
              )}
            </p>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tests run yet. Click "Run Complete Test Suite" to begin.</p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{result.name}</h4>
                        <span className={`text-sm px-2 py-1 rounded ${
                          result.status === 'success' ? 'bg-green-100 text-green-700' :
                          result.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            View Response Data
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Session Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Session Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Current User:</strong> {authService.getCurrentUser()?.name || 'None'}</div>
              <div><strong>Access Token:</strong> {authService.getAccessToken() ? 'Present' : 'None'}</div>
              <div><strong>Profile:</strong> {authService.getCurrentProfile()?.email || 'None'}</div>
              <div><strong>Project ID:</strong> {projectId}</div>
              <div><strong>Local Storage Session:</strong> {localStorage.getItem('clearCallSession') ? 'Present' : 'None'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}