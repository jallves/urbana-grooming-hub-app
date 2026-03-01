import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cake, MessageCircle, Gift, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BirthdayWidgetProps {
  month: number; // 0-indexed
  year: number;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const BirthdayWidget: React.FC<BirthdayWidgetProps> = ({ month, year }) => {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['birthday-clients-dashboard', month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, data_nascimento, whatsapp, telefone, email')
        .not('data_nascimento', 'is', null);

      if (error) throw error;

      // Filter by selected month (month is 0-indexed, data_nascimento is YYYY-MM-DD)
      const targetMonth = month + 1;
      const filtered = (data || [])
        .filter(c => {
          if (!c.data_nascimento) return false;
          const parts = c.data_nascimento.split('-');
          return parseInt(parts[1]) === targetMonth;
        })
        .sort((a, b) => {
          const dayA = parseInt(a.data_nascimento!.split('-')[2]);
          const dayB = parseInt(b.data_nascimento!.split('-')[2]);
          return dayA - dayB;
        });

      return filtered;
    },
  });

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();

  const isToday = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parseInt(parts[1]) === todayMonth + 1 && parseInt(parts[2]) === todayDay;
  };

  const getAge = (dateStr: string) => {
    const birthYear = parseInt(dateStr.split('-')[0]);
    const age = year - birthYear;
    return age > 0 && age < 120 ? age : null;
  };

  const formatBirthday = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const sendWhatsApp = (client: any) => {
    const phone = (client.whatsapp || client.telefone || '').replace(/\D/g, '');
    if (!phone) return;
    
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const message = encodeURIComponent(
      `🎂 Olá ${client.nome.split(' ')[0]}! A equipe da Barbearia Costa Urbana deseja a você um Feliz Aniversário! 🎉 Que tal comemorar com um corte especial? Agende pelo nosso site!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base lg:text-lg text-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-pink-100 rounded-lg">
              <Cake className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
            </div>
            Aniversariantes — {MONTHS_PT[month]}
          </div>
          {clients.length > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 bg-pink-50 text-pink-700 rounded-full">
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-400 border-t-transparent" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Gift className="h-10 w-10 mb-2 text-gray-300" />
            <p className="text-sm">Nenhum aniversariante em {MONTHS_PT[month]}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {clients.map((client) => {
              const birthdayToday = isToday(client.data_nascimento!);
              const age = getAge(client.data_nascimento!);
              const hasPhone = !!(client.whatsapp || client.telefone);

              return (
                <div
                  key={client.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    birthdayToday
                      ? 'bg-gradient-to-r from-pink-50 to-amber-50 border-pink-200 shadow-sm'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      birthdayToday
                        ? 'bg-pink-200 text-pink-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {formatBirthday(client.data_nascimento!).split('/')[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {client.nome}
                        </p>
                        {birthdayToday && (
                          <PartyPopper className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 animate-bounce" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatBirthday(client.data_nascimento!)}
                        {age && ` · ${age} anos`}
                        {birthdayToday && ' · 🎂 Hoje!'}
                      </p>
                    </div>
                  </div>

                  {hasPhone && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0 h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => sendWhatsApp(client)}
                      title={`Enviar mensagem para ${client.nome}`}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BirthdayWidget;
