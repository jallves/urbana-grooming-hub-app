import React from 'react';
import { Bell, Calendar, Clock, X, CheckCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientNotifications } from '@/hooks/useClientNotifications';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  appointment: <Calendar className="h-4 w-4 text-urbana-gold" />,
  reminder: <Clock className="h-4 w-4 text-sky-400" />,
  update: <AlertCircle className="h-4 w-4 text-amber-400" />,
  cancel: <X className="h-4 w-4 text-red-400" />,
};

const bgMap: Record<string, string> = {
  appointment: 'from-urbana-gold/20 to-amber-600/10 border-urbana-gold/20',
  reminder: 'from-sky-500/20 to-cyan-500/10 border-sky-500/20',
  update: 'from-amber-500/20 to-orange-500/10 border-amber-500/20',
  cancel: 'from-red-500/20 to-rose-500/10 border-red-500/20',
};

const ClientNotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useClientNotifications();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

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
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
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
        className="relative text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300"
      >
        <Bell className={cn("h-4 w-4 sm:h-5 sm:w-5", unreadCount > 0 && "animate-[ring_0.5s_ease-in-out]")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-lg shadow-red-500/40 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[300px] sm:w-[360px] max-h-[400px] z-[100] rounded-2xl overflow-hidden shadow-2xl border border-urbana-gold/30 bg-gradient-to-b from-[#1a1a2e] to-[#16162a] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-urbana-gold/20 bg-urbana-gold/5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-urbana-gold" />
              <span className="text-sm font-semibold text-urbana-light">Notificações</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-urbana-gold/20 text-urbana-gold font-medium">
                  {unreadCount}
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
          <div className="overflow-y-auto max-h-[330px] divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-urbana-light/40">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
                <p className="text-xs mt-1 opacity-60">Seus lembretes aparecerão aqui</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="group flex items-start gap-3 px-4 py-3 hover:bg-urbana-gold/5 transition-colors duration-200 relative"
                >
                  <div className={cn(
                    "shrink-0 mt-0.5 p-2 rounded-xl bg-gradient-to-br border",
                    bgMap[notif.type] || bgMap.appointment
                  )}>
                    {iconMap[notif.type] || iconMap.appointment}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-urbana-light leading-tight">
                      {notif.title}
                    </p>
                    <p className="text-xs text-urbana-light/60 mt-1 leading-relaxed whitespace-pre-line">
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

export default ClientNotificationBell;
