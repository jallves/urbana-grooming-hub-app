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
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estado atual
  useEffect(() => {
    const loadAvailability = async () => {
      if (!barberData?.id) {
        setIsLoading(false);
        return;
      }

      console.log('🔍 Carregando disponibilidade para barbeiro:', barberData.id);

      try {
        const { data, error } = await supabase
          .from('painel_barbeiros')
          .select('available_for_booking')
          .eq('id', barberData.id)
          .single();

        if (error) {
          console.error('❌ Erro ao carregar disponibilidade:', error);
          throw error;
        }

        console.log('✅ Disponibilidade carregada:', data?.available_for_booking);
        
        // CRÍTICO: Se o campo não existir, usar true como padrão APENAS na primeira vez
        // Mas sempre usar o valor do banco se existir
        const availabilityValue = data?.available_for_booking !== undefined 
          ? data.available_for_booking 
          : true;
        
        setIsAvailable(availabilityValue);
      } catch (error) {
        console.error('❌ Erro ao carregar disponibilidade:', error);
        toast.error('Erro ao carregar configuração de disponibilidade');
        // Em caso de erro, manter o estado atual (não mudar para true)
        setIsAvailable(prev => prev !== null ? prev : true);
      } finally {
        setIsLoading(false);
      }
    };

    // Resetar loading quando barberData mudar
    if (barberData?.id) {
      setIsLoading(true);
      loadAvailability();
    }
  }, [barberData?.id]);

  const handleToggle = async () => {
    if (!barberData?.id || isAvailable === null) return;

    const newValue = !isAvailable;
    console.log('🔄 Alterando disponibilidade de', isAvailable, 'para', newValue);

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .update({ available_for_booking: newValue })
        .eq('id', barberData.id)
        .select('available_for_booking')
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar disponibilidade:', error);
        throw error;
      }

      console.log('✅ Disponibilidade atualizada no banco:', data?.available_for_booking);
      
      // Usar o valor retornado do banco para garantir sincronização
      setIsAvailable(data?.available_for_booking ?? newValue);
      
      toast.success(
        newValue 
          ? '✅ Você está disponível para novos agendamentos' 
          : '🔒 Você está indisponível para novos agendamentos',
        {
          description: newValue 
            ? 'Clientes poderão agendar horários com você'
            : 'Seus horários livres não aparecerão para novos agendamentos',
          duration: 5000
        }
      );
    } catch (error: any) {
      console.error('❌ Erro ao atualizar disponibilidade:', error);
      toast.error('Erro ao atualizar disponibilidade', {
        description: error.message || 'Não foi possível salvar a alteração. Tente novamente.',
        duration: 5000
      });
      // Não mudar o estado local em caso de erro
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingBarber || isLoading || isAvailable === null) {
    return (
      <div className="backdrop-blur-xl bg-urbana-black/40 border border-urbana-gold/20 rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-urbana-black/60 rounded w-3/4"></div>
          <div className="h-4 bg-urbana-black/60 rounded w-full"></div>
          <div className="h-10 bg-urbana-black/60 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-urbana-black/40 border border-urbana-gold/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            {isAvailable ? (
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0" />
            ) : (
              <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 flex-shrink-0" />
            )}
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-urbana-light">
              Disponível para Novos Agendamentos
            </h3>
          </div>
          
          <p className="text-xs sm:text-sm text-urbana-light/70 mb-3 sm:mb-4 leading-relaxed">
            Controle se você aparece como disponível quando clientes fazem novos agendamentos.
            Não afeta agendamentos já existentes, totem, vendas ou comissões.
          </p>

          <Alert className={`${isAvailable ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
            <AlertCircle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isAvailable ? 'text-green-400' : 'text-orange-400'}`} />
            <AlertDescription className={`${isAvailable ? 'text-green-300' : 'text-orange-300'} text-xs sm:text-sm leading-relaxed`}>
              {isAvailable ? (
                <>
                  <strong className="block mb-1">Status Atual: Disponível</strong>
                  Seus horários livres aparecem para novos agendamentos
                </>
              ) : (
                <>
                  <strong className="block mb-1">Status Atual: Indisponível</strong>
                  Seus horários livres NÃO aparecem para novos agendamentos.
                  Agendamentos existentes, totem e vendas continuam funcionando normalmente.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 md:gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-urbana-light/60 md:order-2">
            {isAvailable ? 'ATIVO' : 'INATIVO'}
          </span>
          <Switch
            checked={isAvailable}
            onCheckedChange={handleToggle}
            disabled={isSaving}
            className="data-[state=checked]:bg-green-500 md:order-1 scale-110 sm:scale-125"
          />
        </div>
      </div>

      {!isAvailable && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-urbana-gold/20">
          <h4 className="text-xs sm:text-sm font-medium text-urbana-light mb-2">O que continua funcionando:</h4>
          <ul className="text-[11px] sm:text-xs md:text-sm text-urbana-light/70 space-y-0.5 sm:space-y-1 leading-relaxed">
            <li>✅ Agendamentos já existentes</li>
            <li>✅ Check-in no totem</li>
            <li>✅ Finalização de atendimentos</li>
            <li>✅ Venda de produtos</li>
            <li>✅ Recebimento de comissões</li>
          </ul>
          <p className="text-[11px] sm:text-xs text-orange-400 mt-2 sm:mt-3 leading-relaxed">
            ⚠️ Apenas novos agendamentos serão bloqueados
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingAvailabilityToggle;
