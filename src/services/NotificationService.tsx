class NotificationService {
  private notificationPermission: NotificationPermission = 'default';

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async showNotification(title: string, options?: NotificationOptions) {
    if (this.notificationPermission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.log('Notification permission denied');
        return null;
      }
    }

    try {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // showIncomingCallNotification(callerName: string, onAccept?: () => void, onDecline?: () => void) {
  //   this.showNotification('Incoming Call', {
  //     body: `${callerName} is calling you...`,
  //     tag: 'incoming-call',
  //     requireInteraction: true,
  //     actions: [
  //       { action: 'accept', title: 'Accept' },
  //       { action: 'decline', title: 'Decline' }
  //     ]
  //   });
  // }

  showMeetingReminder(meetingTitle: string, startsIn: string) {
    this.showNotification('Meeting Reminder', {
      body: `"${meetingTitle}" starts in ${startsIn}`,
      tag: 'meeting-reminder'
    });
  }
}

export const notificationService = new NotificationService();