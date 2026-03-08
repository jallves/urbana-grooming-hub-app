import React from 'react';
import { Bell, Calendar, X, CheckCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBarberNotifications, markAsRead, markAllAsRead } from '@/hooks/useBarberNotifications';
import { cn } from '@/lib/utils';

const BarberNotificationBell: React.FC = () => {
  const { notifications, unreadCount } = useBarberNotifications();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h atrás`;
    return `${Math.floor(diffH / 24)}d atrás`;
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="relative text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300"
      >
        <Bell className={cn("h-4 w-4 sm:h-5 sm:w-5", unreadCount > 0 && "animate-[ring_0.5s_ease-in-out]")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-white shadow-lg shadow-red-500/40 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[380px] max-h-[420px] z-[100] rounded-2xl overflow-hidden shadow-2xl border border-urbana-gold/30 bg-gradient-to-b from-[#1a1a2e] to-[#16162a] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-urbana-gold/20 bg-urbana-gold/5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-urbana-gold" />
              <span className="text-sm font-semibold text-urbana-light">Notificações</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-urbana-gold/20 text-urbana-gold font-medium">
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-[11px] text-urbana-light/60 hover:text-urbana-gold hover:bg-transparent h-auto p-1"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[340px] divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-urbana-light/40">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="group flex items-start gap-3 px-4 py-3 hover:bg-urbana-gold/5 transition-colors duration-200 relative"
                >
                  <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-gradient-to-br from-urbana-gold/20 to-amber-600/10 border border-urbana-gold/20">
                    <Calendar className="h-4 w-4 text-urbana-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-urbana-light leading-tight">
                      {notif.title}
                    </p>
                    <p className="text-xs text-urbana-light/60 mt-1 leading-relaxed">
                      {notif.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock className="h-3 w-3 text-urbana-light/40" />
                      <span className="text-[10px] text-urbana-light/40">{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notif.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-urbana-light/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberNotificationBell;
