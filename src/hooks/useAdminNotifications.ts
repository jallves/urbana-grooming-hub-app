import { useState, useCallback, useEffect } from 'react';

export interface AdminNotification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  type: 'appointment' | 'cancel' | 'info' | 'alert';
  data?: Record<string, any>;
}

let notifications: AdminNotification[] = [];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function addAdminNotification(notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) {
  // Deduplicate by appointmentId + type
  if (notification.data?.appointmentId) {
    const exists = notifications.some(
      (n) => n.data?.appointmentId === notification.data?.appointmentId && n.type === notification.type
    );
    if (exists) return;
  }

  const newNotif: AdminNotification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: new Date(),
    read: false,
  };
  notifications = [newNotif, ...notifications].slice(0, 50);
  notify();
  return newNotif;
}

export function markAdminNotifAsRead(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  notify();
}

export function markAllAdminNotifsAsRead() {
  notifications = [];
  notify();
}

export function useAdminNotifications() {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    listeners.add(rerender);
    return () => { listeners.delete(rerender); };
  }, [rerender]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead: markAdminNotifAsRead,
    markAllAsRead: markAllAdminNotifsAsRead,
  };
}
