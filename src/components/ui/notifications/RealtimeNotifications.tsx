
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'appointment_created' | 'appointment_cancelled' | 'appointment_completed';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const RealtimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    const subscription = supabase
      .channel('barber_notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'painel_agendamentos'
        }, 
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'appointment_created',
            title: 'Novo Agendamento',
            message: 'Você tem um novo agendamento!',
            timestamp: new Date(),
            read: false
          };
          
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
          
          toast.success('🔔 Novo agendamento recebido!', {
            description: 'Verifique seus agendamentos para mais detalhes.',
            duration: 5000,
          });
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'painel_agendamentos'
        }, 
        (payload) => {
          if (payload.new.status === 'cancelado' && payload.old.status !== 'cancelado') {
            const newNotification: Notification = {
              id: `${payload.new.id}_cancelled`,
              type: 'appointment_cancelled',
              title: 'Agendamento Cancelado',
              message: 'Um agendamento foi cancelado.',
              timestamp: new Date(),
              read: false
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.email]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment_created':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'appointment_cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'appointment_completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                      !notification.read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-gray-400 text-xs mt-1">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealtimeNotifications;
