import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Edit, Save, X, Camera, Shield, Bell, Palette, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { authService, UserProfile } from '../services/AuthService';

interface ProfilePageProps {
  language: 'en' | 'te';
  isDarkMode: boolean;
  isLargeText: boolean;
  onToggleDarkMode: () => void;
  onToggleLargeText: () => void;
  onToggleLanguage: () => void;
}

export function ProfilePage({ 
  language, 
  isDarkMode, 
  isLargeText,
  onToggleDarkMode,
  onToggleLargeText,
  onToggleLanguage
}: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [notifications, setNotifications] = useState({
    callInvites: true,
    meetingReminders: true,
    chatMessages: true,
    appUpdates: false
  });

  const translations = {
    en: {
      profile: "Profile",
      personalInfo: "Personal Information",
      name: "Name",
      email: "Email",
      phone: "Phone",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      preferences: "Preferences",
      appearance: "Appearance",
      darkMode: "Dark Mode",
      largeText: "Large Text",
      language: "Language",
      english: "English",
      telugu: "తెలుగు",
      notifications: "Notifications",
      callInvites: "Call Invites",
      meetingReminders: "Meeting Reminders",
      chatMessages: "Chat Messages",
      appUpdates: "App Updates",
      privacy: "Privacy & Security",
      accountSecurity: "Account Security",
      dataPrivacy: "Data Privacy",
      blockedUsers: "Blocked Users",
      changePassword: "Change Password",
      twoFactor: "Two-Factor Authentication",
      downloadData: "Download My Data",
      deleteAccount: "Delete Account",
      profileUpdated: "Profile updated successfully"
    },
    te: {
      profile: "ప్రొఫైల్",
      personalInfo: "వ్యక్తిగత సమాచారం",
      name: "పేరు",
      email: "ఇమెయిల్",
      phone: "ఫోన్",
      edit: "సవరించండి",
      save: "సేవ్ చేయండి",
      cancel: "రద్దు చేయండి",
      preferences: "ప్రాధాన్యతలు",
      appearance: "కనిపించే విధం",
      darkMode: "డార్క్ మోడ్",
      largeText: "పెద్ద వచనం",
      language: "భాష",
      english: "English",
      telugu: "తెలుగు",
      notifications: "నోటిఫికేషన్‌లు",
      callInvites: "కాల్ ఆహ్వానాలు",
      meetingReminders: "మీటింగ్ రిమైండర్‌లు",
      chatMessages: "చాట్ మెసేజ్‌లు",
      appUpdates: "యాప్ అప్‌డేట్‌లు",
      privacy: "గోప్యత & భద్రత",
      accountSecurity: "ఖాతా భద్రత",
      dataPrivacy: "డేటా గోప్యత",
      blockedUsers: "బ్లాక్ చేసిన వినియోగదారులు",
      changePassword: "పాస్‌వర్డ్ మార్చండి",
      twoFactor: "రెండు-కారక ప్రమాణీకరణ",
      downloadData: "నా డేటాను డౌన్‌లోడ్ చేయండి",
      deleteAccount: "ఖాతాను తొలగించండి",
      profileUpdated: "ప్రొఫైల్ విజయవంతంగా అప్‌డేట్ చేయబడింది"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const currentProfile = authService.getCurrentProfile();
      if (currentProfile) {
        setProfile(currentProfile);
        setEditForm({
          name: currentProfile.name,
          email: currentProfile.email,
          phone: currentProfile.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await authService.updateProfile({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone
      });

      if (response.profile) {
        setProfile(response.profile);
        setEditing(false);
      } else {
        console.error('Failed to update profile:', response.error);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || ''
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold">{t.profile}</h2>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.personalInfo}
            </CardTitle>
            {!editing ? (
              <Button variant="outline" onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                {t.edit}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="h-4 w-4" />
                  {t.cancel}
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t.save}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                  {profile?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {profile?.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                value={editing ? editForm.name : profile?.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                disabled={!editing}
                className={!editing ? 'bg-gray-50 dark:bg-gray-800' : ''}
              />
            </div>
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={editing ? editForm.email : profile?.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                disabled={!editing}
                className={!editing ? 'bg-gray-50 dark:bg-gray-800' : ''}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                value={editing ? editForm.phone : profile?.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                disabled={!editing}
                className={!editing ? 'bg-gray-50 dark:bg-gray-800' : ''}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t.preferences}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">{t.appearance}</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">{t.darkMode}</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={onToggleDarkMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="large-text">{t.largeText}</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Increase text size for better readability
                  </p>
                </div>
                <Switch
                  id="large-text"
                  checked={isLargeText}
                  onCheckedChange={onToggleLargeText}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="language">{t.language}</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose your preferred language
                </p>
              </div>
              <Select
                value={language}
                onValueChange={(value) => {
                  if (value !== language) {
                    onToggleLanguage();
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t.english}</SelectItem>
                  <SelectItem value="te">{t.telugu}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.notifications}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="call-invites">{t.callInvites}</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get notified when someone invites you to a call
              </p>
            </div>
            <Switch
              id="call-invites"
              checked={notifications.callInvites}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, callInvites: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="meeting-reminders">{t.meetingReminders}</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive reminders for scheduled meetings
              </p>
            </div>
            <Switch
              id="meeting-reminders"
              checked={notifications.meetingReminders}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, meetingReminders: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="chat-messages">{t.chatMessages}</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get notified about new chat messages
              </p>
            </div>
            <Switch
              id="chat-messages"
              checked={notifications.chatMessages}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, chatMessages: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="app-updates">{t.appUpdates}</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications about app updates
              </p>
            </div>
            <Switch
              id="app-updates"
              checked={notifications.appUpdates}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, appUpdates: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.privacy}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            {t.changePassword}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            {t.twoFactor}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            {t.blockedUsers}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            {t.downloadData}
          </Button>
          <Button variant="destructive" className="w-full justify-start">
            {t.deleteAccount}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}