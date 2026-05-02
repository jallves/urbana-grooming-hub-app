import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AppointmentList from '@/components/admin/appointments/list/AppointmentList';
import { Button } from '@/components/ui/button';
import { Tv, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAppointments() {
  const filaUrl = `${window.location.origin}/painel-fila`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(filaUrl);
      toast.success('URL copiada!', { description: filaUrl });
    } catch {
      toast.error('Não foi possível copiar a URL.');
    }
  };

  return (
    <AdminLayout 
      title="Gestão de Agendamentos" 
      description="Gerencie todos os agendamentos da barbearia em tempo real"
      icon="📅"
    >
      <div className="w-full max-w-none h-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Painel da TV */}
          <div className="bg-gradient-to-r from-urbana-black to-zinc-900 border-2 border-urbana-gold/40 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-urbana-gold/15 border border-urbana-gold/40 flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5 text-urbana-gold" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-playfair text-base sm:text-lg font-semibold">
                    Painel da TV — Fila Virtual
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                    Tela em tempo real para exibir em televisão/tablet na barbearia. Mostra todos os agendamentos do dia
                    organizados por status (agendado, em atendimento, concluído).
                  </p>
                  <code className="block mt-2 text-[11px] sm:text-xs text-urbana-gold/90 break-all">
                    {filaUrl}
                  </code>
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyUrl}
                  className="border-urbana-gold/40 text-urbana-gold bg-transparent hover:bg-urbana-gold/10"
                >
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copiar
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.open(filaUrl, '_blank', 'noopener')}
                  className="bg-urbana-gold text-black hover:bg-urbana-gold/90"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Abrir
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de agendamentos */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <AppointmentList />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
