import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { authService } from '../services/AuthService';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';

export function DebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showTokens, setShowTokens] = useState(false);

  const refreshDebugInfo = async () => {
    const currentUser = authService.getCurrentUser();
    const currentProfile = authService.getCurrentProfile();
    const accessToken = authService.getAccessToken();
    const sessionData = await authService.getCurrentSession();

    // Check localStorage
    const localSession = localStorage.getItem('clearCallSession');
    const localUser = localStorage.getItem('clearCallUser');
    const localProfile = localStorage.getItem('clearCallProfile');

    setDebugInfo({
      currentUser,
      currentProfile,
      accessToken: accessToken ? (showTokens ? accessToken : 'Present') : 'None',
      sessionData,
      localStorage: {
        session: localSession ? 'Present' : 'None',
        user: localUser ? 'Present' : 'None',
        profile: localProfile ? 'Present' : 'None'
      },
      environment: {
        projectId,
        publicAnonKey: showTokens ? publicAnonKey : `${publicAnonKey.substring(0, 20)}...`
      },
      timestamp: new Date().toISOString()
    });
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [showTokens]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Debug Information</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokens(!showTokens)}
            >
              {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showTokens ? 'Hide' : 'Show'} Tokens
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDebugInfo}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}