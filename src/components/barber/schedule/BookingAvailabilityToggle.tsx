import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserX, UserCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberData } from '@/hooks/barber/useBarberData';
import { toast } from 'sonner';

const BookingAvailabilityToggle: React.FC = () => {
  const { barberData, isLoading: isLoadingBarber } = useBarberData();
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estado atual
  useEffect(() => {
    const loadAvailability = async () => {
      if (!barberData?.id) return;

      try {
        const { data, error } = await supabase
          .from('painel_barbeiros')
          .select('available_for_booking')
          .eq('id', barberData.id)
          .single();

        if (error) throw error;

        setIsAvailable(data?.available_for_booking ?? true);
      } catch (error) {
        console.error('Erro ao carregar disponibilidade:', error);
        toast.error('Erro ao carregar configuração de disponibilidade');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [barberData?.id]);

  const handleToggle = async () => {
    if (!barberData?.id) return;

    setIsSaving(true);
    try {
      const newValue = !isAvailable;

      const { error } = await supabase
        .from('painel_barbeiros')
        .update({ available_for_booking: newValue })
        .eq('id', barberData.id);

      if (error) throw error;

      setIsAvailable(newValue);
      
      toast.success(
        newValue 
          ? 'Você está disponível para novos agendamentos' 
          : 'Você está indisponível para novos agendamentos',
        {
          description: newValue 
            ? 'Clientes poderão agendar horários com você'
            : 'Seus horários livres não aparecerão para novos agendamentos'
        }
      );
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      toast.error('Erro ao atualizar disponibilidade');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingBarber || isLoading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {isAvailable ? (
              <UserCheck className="h-6 w-6 text-green-400" />
            ) : (
              <UserX className="h-6 w-6 text-orange-400" />
            )}
            <h3 className="text-lg font-semibold text-white">
              Disponível para Novos Agendamentos
            </h3>
          </div>
          
          <p className="text-sm text-gray-400 mb-4">
            Controle se você aparece como disponível quando clientes fazem novos agendamentos.
            Não afeta agendamentos já existentes, totem, vendas ou comissões.
          </p>

          <Alert className={`${isAvailable ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
            <AlertCircle className={`h-4 w-4 ${isAvailable ? 'text-green-400' : 'text-orange-400'}`} />
            <AlertDescription className={`${isAvailable ? 'text-green-300' : 'text-orange-300'}`}>
              {isAvailable ? (
                <>
                  <strong>Status Atual: Disponível</strong>
                  <br />
                  Seus horários livres aparecem para novos agendamentos
                </>
              ) : (
                <>
                  <strong>Status Atual: Indisponível</strong>
                  <br />
                  Seus horários livres NÃO aparecem para novos agendamentos.
                  Agendamentos existentes, totem e vendas continuam funcionando normalmente.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Switch
            checked={isAvailable}
            onCheckedChange={handleToggle}
            disabled={isSaving}
            className="data-[state=checked]:bg-green-500"
          />
          <span className="text-xs text-gray-400">
            {isAvailable ? 'ATIVO' : 'INATIVO'}
          </span>
        </div>
      </div>

      {!isAvailable && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-white mb-2">O que continua funcionando:</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>✅ Agendamentos já existentes</li>
            <li>✅ Check-in no totem</li>
            <li>✅ Finalização de atendimentos</li>
            <li>✅ Venda de produtos</li>
            <li>✅ Recebimento de comissões</li>
          </ul>
          <p className="text-xs text-orange-400 mt-3">
            ⚠️ Apenas novos agendamentos serão bloqueados
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingAvailabilityToggle;
