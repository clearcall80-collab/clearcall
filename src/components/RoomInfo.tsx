import { useState } from 'react';
import { Copy, Check, Users, Clock, Share2 } from 'lucide-react';
import { Button } from './ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

interface RoomInfoProps {
  roomId: string;
  participantCount: number;
  duration: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'te';
}

export function RoomInfo({ roomId, participantCount, duration, open, onOpenChange, language }: RoomInfoProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const translations = {
    en: {
      meetingInfo: "Meeting Information",
      roomCode: "Room Code",
      shareCode: "Share this code with others to invite them",
      copyCode: "Copy Code",
      copied: "Copied!",
      shareLink: "Share Link",
      copyLink: "Copy Link",
      participants: "Participants",
      duration: "Duration",
      close: "Close"
    },
    te: {
      meetingInfo: "మీటింగ్ సమాచారం",
      roomCode: "రూమ్ కోడ్",
      shareCode: "ఇతరులను ఆహ్వానించడానికి ఈ కోడ్‌ను షేర్ చేయండి",
      copyCode: "కోడ్ కాపీ చేయండి",
      copied: "కాపీ చేయబడింది!",
      shareLink: "లింక్ షేర్ చేయండి",
      copyLink: "లింక్ కాపీ చేయండి",
      participants: "పాల్గొనేవారు",
      duration: "వ్యవధి",
      close: "మూసివేయండి"
    }
  };

  const t = translations[language];

  const roomCode = roomId.slice(-6).toUpperCase();
  const shareLink = `${window.location.origin}?room=${roomCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      toast.success(t.copied);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      toast.success(t.copied);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Clear Call Meeting',
          text: `Join my video call using code: ${roomCode}`,
          url: shareLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.meetingInfo}</DialogTitle>
          <DialogDescription>
            {t.shareCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Room Code */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t.roomCode}
              </div>
              <div className="text-4xl font-bold font-mono tracking-wider text-blue-600 dark:text-blue-400">
                {roomCode}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyCode}
                className="flex-1"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t.copied}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {t.copyCode}
                  </>
                )}
              </Button>
              <Button
                onClick={handleShare}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t.shareLink}
              </Button>
            </div>
          </div>

          {/* Meeting Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.participants}
                </span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {participantCount}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.duration}
                </span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {duration}
              </div>
            </div>
          </div>

          {/* Share Link */}
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Meeting Link
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}