import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Camera, 
  Mic, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

interface PermissionManagerProps {
  onPermissionsGranted: (permissions: { camera: boolean; microphone: boolean }) => void;
  requestedPermissions: { camera?: boolean; microphone?: boolean };
  allowSkip?: boolean;
  onSkip?: () => void;
}

interface PermissionState {
  camera: 'unknown' | 'granted' | 'denied' | 'prompt';
  microphone: 'unknown' | 'granted' | 'denied' | 'prompt';
}

export function PermissionManager({ onPermissionsGranted, requestedPermissions, allowSkip = false, onSkip }: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'unknown',
    microphone: 'unknown'
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    const newPermissions: PermissionState = {
      camera: 'unknown',
      microphone: 'unknown'
    };

    try {
      if (navigator.permissions) {
        // Check camera permission
        if (requestedPermissions.camera) {
          try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            newPermissions.camera = cameraPermission.state as any;
            console.log('📷 Camera permission state:', cameraPermission.state);
          } catch (error) {
            console.warn('⚠️ Could not check camera permission:', error);
            newPermissions.camera = 'prompt';
          }
        }

        // Check microphone permission
        if (requestedPermissions.microphone) {
          try {
            const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            newPermissions.microphone = micPermission.state as any;
            console.log('🎤 Microphone permission state:', micPermission.state);
          } catch (error) {
            console.warn('⚠️ Could not check microphone permission:', error);
            newPermissions.microphone = 'prompt';
          }
        }
      } else {
        // Fallback for browsers without permissions API
        console.log('⚠️ Permissions API not supported, checking via getUserMedia');
        newPermissions.camera = requestedPermissions.camera ? 'prompt' : 'unknown';
        newPermissions.microphone = requestedPermissions.microphone ? 'prompt' : 'unknown';
      }

      setPermissions(newPermissions);

      // Check if all required permissions are granted
      const cameraGranted = !requestedPermissions.camera || newPermissions.camera === 'granted';
      const micGranted = !requestedPermissions.microphone || newPermissions.microphone === 'granted';

      console.log('🔍 Permission check results:', { cameraGranted, micGranted, newPermissions });

      if (cameraGranted && micGranted && (newPermissions.camera === 'granted' || newPermissions.microphone === 'granted')) {
        console.log('✅ All required permissions granted, notifying parent');
        onPermissionsGranted({
          camera: newPermissions.camera === 'granted',
          microphone: newPermissions.microphone === 'granted'
        });
      }
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      setError('Could not check current permissions. Please try granting permissions manually.');
    }
  };

  const requestPermissions = async () => {
    setIsRequesting(true);
    setError('');

    try {
      const constraints: MediaStreamConstraints = {};

      if (requestedPermissions.camera) {
        constraints.video = {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        };
      }

      if (requestedPermissions.microphone) {
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        };
      }

      console.log('🔐 Requesting media permissions...', constraints);
      console.log('📢 Your browser will now ask for camera/microphone access');
      console.log('📢 Please click "Allow" in the permission popup');
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('✅ Media permissions granted successfully');
      console.log('  Video tracks:', stream.getVideoTracks().length);
      console.log('  Audio tracks:', stream.getAudioTracks().length);

      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => {
        console.log('  Stopping track:', track.kind, track.label);
        track.stop();
      });

      // Update permission states
      const newPermissions: PermissionState = {
        camera: requestedPermissions.camera ? 'granted' : 'unknown',
        microphone: requestedPermissions.microphone ? 'granted' : 'unknown'
      };
      setPermissions(newPermissions);

      // Notify parent component that permissions are granted
      onPermissionsGranted({
        camera: newPermissions.camera === 'granted',
        microphone: newPermissions.microphone === 'granted'
      });

    } catch (error: any) {
      console.error('❌ Permission request failed:', error);
      
      let errorMessage = 'Failed to request permissions';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'You clicked "Block" or "Deny" when asked for permissions. See instructions below to fix this.';
        
        // Update permissions to show denied state
        const newPermissions: PermissionState = {
          camera: requestedPermissions.camera ? 'denied' : 'unknown',
          microphone: requestedPermissions.microphone ? 'denied' : 'unknown'
        };
        setPermissions(newPermissions);
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone detected. Please connect devices and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is being used by another app. Close other apps (Zoom, Teams, Skype) and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Device doesn\'t meet requirements. Trying basic settings...';
        
        // Try again with more basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: requestedPermissions.camera ? true : false,
            audio: requestedPermissions.microphone ? true : false
          });
          basicStream.getTracks().forEach(track => track.stop());
          
          const newPermissions: PermissionState = {
            camera: requestedPermissions.camera ? 'granted' : 'unknown',
            microphone: requestedPermissions.microphone ? 'granted' : 'unknown'
          };
          setPermissions(newPermissions);
          onPermissionsGranted({
            camera: newPermissions.camera === 'granted',
            microphone: newPermissions.microphone === 'granted'
          });
          setIsRequesting(false);
          return;
        } catch (retryError) {
          errorMessage = 'Failed to access devices even with basic settings.';
        }
      } else {
        errorMessage = error.message || 'Unexpected error. Please refresh the page and try again.';
      }
      
      setError(errorMessage);
      
      // Update permission states to reflect current status
      await checkCurrentPermissions();
    } finally {
      setIsRequesting(false);
    }
  };

  const getPermissionIcon = (state: string) => {
    switch (state) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'prompt':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPermissionBadge = (state: string) => {
    switch (state) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Granted</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Denied</Badge>;
      case 'prompt':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Required</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  const isAllGranted = () => {
    const cameraOk = !requestedPermissions.camera || permissions.camera === 'granted';
    const micOk = !requestedPermissions.microphone || permissions.microphone === 'granted';
    return cameraOk && micOk;
  };

  const needsPermissions = () => {
    const needsCamera = requestedPermissions.camera && permissions.camera !== 'granted';
    const needsMic = requestedPermissions.microphone && permissions.microphone !== 'granted';
    return needsCamera || needsMic;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Media Permissions
        </CardTitle>
        <CardDescription>
          Grant access to camera and microphone for video calling features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Requesting State Banner */}
        {isRequesting && (
          <Alert className="border-blue-200 bg-blue-50 animate-pulse">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong className="block mb-1">👀 Look for the permission popup!</strong>
              <p className="text-sm">Your browser is asking for camera/microphone access. Please click <strong>"Allow"</strong> in the popup (usually at the top of the page).</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        <div className="space-y-3">
          {requestedPermissions.camera && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="text-sm font-medium">Camera</span>
              </div>
              <div className="flex items-center gap-2">
                {getPermissionIcon(permissions.camera)}
                {getPermissionBadge(permissions.camera)}
              </div>
            </div>
          )}

          {requestedPermissions.microphone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="text-sm font-medium">Microphone</span>
              </div>
              <div className="flex items-center gap-2">
                {getPermissionIcon(permissions.microphone)}
                {getPermissionBadge(permissions.microphone)}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong className="block mb-1">Permission Denied</strong>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        {needsPermissions() && !error && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Why we need permissions:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                {requestedPermissions.camera && <li>• Camera: For video calling and sign language recognition</li>}
                {requestedPermissions.microphone && <li>• Microphone: For voice calls and voice-to-text features</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Troubleshooting help */}
        {(permissions.camera === 'denied' || permissions.microphone === 'denied' || error) && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-900">
              <strong className="block mb-2">How to grant permissions:</strong>
              
              {/* Chrome/Edge Instructions */}
              <div className="mb-3">
                <p className="font-semibold mb-1">Chrome/Edge/Opera:</p>
                <ol className="space-y-1 list-decimal list-inside ml-2">
                  <li>Look for the 🎥 or 🔒 icon in the address bar (left side)</li>
                  <li>Click it and select "Always allow"</li>
                  <li>Click "Done" then click "Check Again" below</li>
                </ol>
              </div>

              {/* Firefox Instructions */}
              <div className="mb-3">
                <p className="font-semibold mb-1">Firefox:</p>
                <ol className="space-y-1 list-decimal list-inside ml-2">
                  <li>Click the 🔒 icon in the address bar</li>
                  <li>Find "Use the Camera" and "Use the Microphone"</li>
                  <li>Click ✕ to clear blocks, then click "Check Again"</li>
                </ol>
              </div>

              {/* Safari Instructions */}
              <div className="mb-3">
                <p className="font-semibold mb-1">Safari:</p>
                <ol className="space-y-1 list-decimal list-inside ml-2">
                  <li>Go to Safari → Settings → Websites</li>
                  <li>Select Camera and Microphone</li>
                  <li>Set this website to "Allow"</li>
                </ol>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="font-semibold text-yellow-900 mb-2">⚡ Fastest Fix:</p>
                <ol className="space-y-1 list-decimal list-inside text-yellow-900">
                  <li>Press <kbd className="px-2 py-1 bg-yellow-200 rounded text-xs font-mono">F5</kbd> (Windows) or <kbd className="px-2 py-1 bg-yellow-200 rounded text-xs font-mono">⌘+R</kbd> (Mac)</li>
                  <li>Click <strong>"Allow"</strong> when browser asks</li>
                  <li>Done! ✅</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {needsPermissions() && (
              <Button 
                onClick={requestPermissions}
                disabled={isRequesting}
                className="flex-1"
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  'Grant Permissions'
                )}
              </Button>
            )}

            <Button 
              onClick={checkCurrentPermissions}
              variant="outline"
              size={needsPermissions() ? "sm" : "default"}
              className={needsPermissions() ? "" : "flex-1"}
              disabled={isRequesting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>

          {allowSkip && needsPermissions() && (
            <Button 
              onClick={onSkip}
              variant="ghost"
              className="w-full text-xs"
              disabled={isRequesting}
            >
              Continue without camera/microphone (view-only mode)
            </Button>
          )}
        </div>

        {/* Success State */}
        {isAllGranted() && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>All permissions granted!</strong> You can now use all Clear Call features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}