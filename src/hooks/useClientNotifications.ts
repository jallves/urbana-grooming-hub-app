import { useState, useCallback } from 'react';

export interface ClientNotification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  type: 'appointment' | 'reminder' | 'update' | 'cancel' | 'subscription';
  data?: Record<string, any>;
}

let notifications: ClientNotification[] = [];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function addClientNotification(notification: Omit<ClientNotification, 'id' | 'timestamp' | 'read'>) {
  // Avoid duplicate by data.appointmentId + type
  if (notification.data?.appointmentId) {
    const exists = notifications.some(
      (n) => n.data?.appointmentId === notification.data?.appointmentId && n.type === notification.type
    );
    if (exists) return;
  }

  const newNotif: ClientNotification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: new Date(),
    read: false,
  };
  notifications = [newNotif, ...notifications].slice(0, 50);
  notify();
  return newNotif;
}

export function markClientNotifAsRead(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  notify();
}

export function markAllClientNotifsAsRead() {
  notifications = [];
  notify();
}

export function clearClientNotifications() {
  notifications = [];
  notify();
}

export function useClientNotifications() {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    listeners.add(rerender);
    return () => { listeners.delete(rerender); };
  }, [rerender]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead: markClientNotifAsRead,
    markAllAsRead: markAllClientNotifsAsRead,
  };
}
