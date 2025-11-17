import { useState, useEffect } from 'react';
import { User, Bell, Shield, Volume2, Eye, Download, Trash2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { authService } from '../services/AuthService';
import { config } from '../utils/config';

interface SettingsPageProps {
  onSignOut?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSignOut }) => {
  const [settings, setSettings] = useState({
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      language: 'en'
    },
    notifications: {
      email: true,
      push: true,
      meetingReminders: true,
      systemUpdates: false
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowContactRequests: true
    },
    accessibility: {
      darkMode: false,
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      screenReader: false
    },
    meeting: {
      defaultDuration: 60,
      autoRecord: false,
      allowGuests: true,
      requirePassword: false
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = authService.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const token = authService.getAccessToken();
      if (!token) {
        toast.error('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save settings');
        return;
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // Mock data export - replace with actual API call
      const data = {
        profile: settings.profile,
        settings,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clear-call-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const deleteAccount = async () => {
    try {
      // Mock account deletion - replace with actual API call
      // await fetch('/api/settings/account', {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ confirmDelete: true })
      // });

      toast.success('Account deletion initiated. You will be signed out.');
      onSignOut?.();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const updateSetting = (category: string, key: string, value: string | number | boolean): void => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="meeting" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Meeting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.profile.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('profile', 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('profile', 'email', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.profile.language}
                  onValueChange={(value: string) => updateSetting('profile', 'language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="te">Telugu</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked: boolean) => updateSetting('notifications', 'email', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked: boolean) => updateSetting('notifications', 'push', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="meeting-reminders">Meeting Reminders</Label>
                  <p className="text-sm text-gray-600">Get reminded about upcoming meetings</p>
                </div>
                <Switch
                  id="meeting-reminders"
                  checked={settings.notifications.meetingReminders}
                  onCheckedChange={(checked: boolean) => updateSetting('notifications', 'meetingReminders', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="system-updates">System Updates</Label>
                  <p className="text-sm text-gray-600">Receive notifications about system updates</p>
                </div>
                <Switch
                  id="system-updates"
                  checked={settings.notifications.systemUpdates}
                  onCheckedChange={(checked: boolean) => updateSetting('notifications', 'systemUpdates', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value: string) => updateSetting('privacy', 'profileVisibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="contacts">Contacts Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="online-status">Show Online Status</Label>
                  <p className="text-sm text-gray-600">Let others see when you're online</p>
                </div>
                <Switch
                  id="online-status"
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked: boolean) => updateSetting('privacy', 'showOnlineStatus', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="contact-requests">Allow Contact Requests</Label>
                  <p className="text-sm text-gray-600">Allow others to send you contact requests</p>
                </div>
                <Switch
                  id="contact-requests"
                  checked={settings.privacy.allowContactRequests}
                  onCheckedChange={(checked: boolean) => updateSetting('privacy', 'allowContactRequests', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-gray-600">Use dark theme for better visibility</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.accessibility.darkMode}
                  onCheckedChange={(checked: boolean) => updateSetting('accessibility', 'darkMode', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="large-text">Large Text</Label>
                  <p className="text-sm text-gray-600">Increase text size for better readability</p>
                </div>
                <Switch
                  id="large-text"
                  checked={settings.accessibility.largeText}
                  onCheckedChange={(checked: boolean) => updateSetting('accessibility', 'largeText', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="high-contrast">High Contrast</Label>
                  <p className="text-sm text-gray-600">Increase contrast for better visibility</p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.accessibility.highContrast}
                  onCheckedChange={(checked: boolean) => updateSetting('accessibility', 'highContrast', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reduce-motion">Reduce Motion</Label>
                  <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                </div>
                <Switch
                  id="reduce-motion"
                  checked={settings.accessibility.reduceMotion}
                  onCheckedChange={(checked: boolean) => updateSetting('accessibility', 'reduceMotion', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="screen-reader">Screen Reader Support</Label>
                  <p className="text-sm text-gray-600">Optimize for screen reader compatibility</p>
                </div>
                <Switch
                  id="screen-reader"
                  checked={settings.accessibility.screenReader}
                  onCheckedChange={(checked: boolean) => updateSetting('accessibility', 'screenReader', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meeting">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="default-duration">Default Meeting Duration</Label>
                <Select
                  value={settings.meeting.defaultDuration.toString()}
                  onValueChange={(value: string) => updateSetting('meeting', 'defaultDuration', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-record">Auto Record Meetings</Label>
                  <p className="text-sm text-gray-600">Automatically record all meetings</p>
                </div>
                <Switch
                  id="auto-record"
                  checked={settings.meeting.autoRecord}
                  onCheckedChange={(checked: boolean) => updateSetting('meeting', 'autoRecord', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-guests">Allow Guest Participants</Label>
                  <p className="text-sm text-gray-600">Allow people without accounts to join</p>
                </div>
                <Switch
                  id="allow-guests"
                  checked={settings.meeting.allowGuests}
                  onCheckedChange={(checked: boolean) => updateSetting('meeting', 'allowGuests', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-password">Require Meeting Password</Label>
                  <p className="text-sm text-gray-600">Require password to join meetings</p>
                </div>
                <Switch
                  id="require-password"
                  checked={settings.meeting.requirePassword}
                  onCheckedChange={(checked: boolean) => updateSetting('meeting', 'requirePassword', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <div className="space-x-4">
          <Button variant="outline" onClick={exportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Button onClick={saveSettings} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
