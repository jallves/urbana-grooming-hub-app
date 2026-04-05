import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cake, MessageCircle, X } from 'lucide-react';
import { addAdminNotification } from '@/hooks/useAdminNotifications';
import { addBarberNotification } from '@/hooks/useBarberNotifications';

interface BirthdayClient {
  id: string;
  nome: string;
  data_nascimento: string;
  telefone?: string | null;
}

interface WeeklyBirthdayPopupProps {
  context: 'admin' | 'barber';
}

const STORAGE_KEY = 'birthday_popup_last_week';

function getWeekKey(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const oneJan = new Date(monday.getFullYear(), 0, 1);
  const days = Math.floor((monday.getTime() - oneJan.getTime()) / 86400000);
  const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${monday.getFullYear()}-W${weekNum}`;
}

function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function formatBirthdayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function calculateAge(dateStr: string): number {
  const birth = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isBirthdayToday(dateStr: string): boolean {
  const birth = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  return birth.getDate() === today.getDate() && birth.getMonth() === today.getMonth();
}

const WeeklyBirthdayPopup: React.FC<WeeklyBirthdayPopupProps> = ({ context }) => {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<BirthdayClient[]>([]);

  useEffect(() => {
    const weekKey = getWeekKey();
    const lastShown = localStorage.getItem(`${STORAGE_KEY}_${context}`);
    if (lastShown === weekKey) return;

    const fetchBirthdays = async () => {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, data_nascimento, telefone')
        .not('data_nascimento', 'is', null);

      if (error || !data) return;

      const { start, end } = getWeekRange();
      const startMonth = start.getMonth() + 1;
      const startDay = start.getDate();
      const endMonth = end.getMonth() + 1;
      const endDay = end.getDate();

      const birthdayClients = data.filter(client => {
        if (!client.data_nascimento) return false;
        const bdate = new Date(client.data_nascimento + 'T00:00:00');
        const bMonth = bdate.getMonth() + 1;
        const bDay = bdate.getDate();
        if (startMonth === endMonth) {
          return bMonth === startMonth && bDay >= startDay && bDay <= endDay;
        }
        return (bMonth === startMonth && bDay >= startDay) ||
               (bMonth === endMonth && bDay <= endDay);
      });

      if (birthdayClients.length > 0) {
        setClients(birthdayClients);
        setOpen(true);
        localStorage.setItem(`${STORAGE_KEY}_${context}`, weekKey);

        // Also add internal notification
        const names = birthdayClients.map(c => c.nome).join(', ');
        const notif = {
          title: `🎂 ${birthdayClients.length} aniversariante${birthdayClients.length > 1 ? 's' : ''} esta semana`,
          description: names,
          type: 'info' as const,
          data: { birthdayWeek: weekKey },
        };

        if (context === 'admin') {
          addAdminNotification(notif);
        } else {
          addBarberNotification(notif);
        }
      }
    };

    fetchBirthdays();
  }, [context]);

  const sendWhatsApp = (client: BirthdayClient) => {
    if (!client.telefone) return;
    const phone = client.telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá ${client.nome}! 🎂🎉 A equipe da Barbearia Costa Urbana deseja um Feliz Aniversário! Que tal comemorar com um corte especial? Estamos te esperando!`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const aToday = isBirthdayToday(a.data_nascimento) ? 0 : 1;
      const bToday = isBirthdayToday(b.data_nascimento) ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;
      const aDate = new Date(a.data_nascimento + 'T00:00:00');
      const bDate = new Date(b.data_nascimento + 'T00:00:00');
      return (aDate.getMonth() * 31 + aDate.getDate()) - (bDate.getMonth() * 31 + bDate.getDate());
    });
  }, [clients]);

  if (clients.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 font-playfair">
            <Cake className="h-6 w-6 text-urbana-gold" />
            Aniversariantes da Semana
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-raleway">
            {clients.length} cliente{clients.length > 1 ? 's' : ''} faz{clients.length > 1 ? 'em' : ''} aniversário esta semana
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[350px] overflow-y-auto space-y-2 mt-2">
          {sortedClients.map(client => {
            const isToday = isBirthdayToday(client.data_nascimento);
            const age = calculateAge(client.data_nascimento);

            return (
              <div
                key={client.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isToday
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-urbana-gold/40'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl flex-shrink-0">{isToday ? '🎉' : '🎂'}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {client.nome}
                      {isToday && (
                        <span className="ml-2 text-xs bg-urbana-gold text-white px-2 py-0.5 rounded-full font-medium">
                          Hoje!
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBirthdayDate(client.data_nascimento)} • {age + 1} anos
                    </p>
                  </div>
                </div>

                {client.telefone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sendWhatsApp(client)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
                    title="Enviar parabéns via WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-3">
          <Button onClick={() => setOpen(false)} className="bg-urbana-gold hover:bg-urbana-gold/90 text-white">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyBirthdayPopup;
