import { useState, useCallback, useEffect } from 'react';

export interface BarberNotification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  type: 'appointment' | 'info' | 'alert';
  data?: Record<string, any>;
}

// Simple in-memory store shared via module scope
let notifications: BarberNotification[] = [];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function addBarberNotification(notification: Omit<BarberNotification, 'id' | 'timestamp' | 'read'>) {
  // Deduplicate by data.appointmentId + type, or by title for non-appointment notifications
  if (notification.data?.appointmentId) {
    const exists = notifications.some(
      (n) => n.data?.appointmentId === notification.data?.appointmentId && n.type === notification.type
    );
    if (exists) return;
  } else if (notification.data?.test) {
    const exists = notifications.some((n) => n.title === notification.title && n.data?.test);
    if (exists) return;
  }

  const newNotif: BarberNotification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: new Date(),
    read: false,
  };
  notifications = [newNotif, ...notifications].slice(0, 50);
  notify();
  return newNotif;
}

export function markAsRead(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  notify();
}

export function markAllAsRead() {
  notifications = [];
  notify();
}

export function useBarberNotifications() {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    listeners.add(rerender);
    return () => { listeners.delete(rerender); };
  }, [rerender]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    markAllAsRead,
  };
}
