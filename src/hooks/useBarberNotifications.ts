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
  const newNotif: BarberNotification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: new Date(),
    read: false,
  };
  notifications = [newNotif, ...notifications].slice(0, 50); // Keep max 50
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
