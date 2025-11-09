import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';
import { TotemErrorFeedback } from '@/components/totem/TotemErrorFeedback';

const TotemCheckoutSearch: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const handleSearch = async (phone: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (!cleanPhone || cleanPhone.length < 10) {
        setError({
          title: 'Telefone inválido',
          message: 'Por favor, digite um número de telefone válido com DDD'
        });
        setIsSearching(false);
        return;
      }
      
      console.log('🔍 Buscando cliente para checkout:', cleanPhone);

      // @ts-ignore
      const response = await supabase
        .from('painel_clientes')
        .select('*');

      if (response.error) {
        console.error('❌ Erro ao buscar cliente:', response.error);
        setError({
          title: 'Erro de conexão',
          message: 'Não foi possível conectar ao sistema. Verifique sua conexão e tente novamente.'
        });
        setIsSearching(false);
        return;
      }

      const clientes = response.data?.filter((c: any) => {
        const clientPhoneClean = (c.whatsapp || '').replace(/\D/g, '');
        return clientPhoneClean.includes(cleanPhone) || cleanPhone.includes(clientPhoneClean);
      }) || [];

      if (!clientes || clientes.length === 0) {
        setError({
          title: 'Cliente não encontrado',
          message: 'Não encontramos nenhum cadastro com este telefone. Verifique o número digitado ou procure a recepção.'
        });
        setIsSearching(false);
        return;
      }

      const cliente = clientes[0];
      console.log('✅ Cliente encontrado:', cliente.nome);

      // Buscar sessão ativa de totem
      // @ts-ignore
      const sessionResponse = await supabase
        .from('totem_sessions')
        .select(`
          *,
          appointment:painel_agendamentos(
            *,
            servico:painel_servicos(*),
            barbeiro:painel_barbeiros(*),
            cliente:painel_clientes(*)
          )
        `)
        .eq('appointment.cliente_id', cliente.id)
        .in('status', ['check_in', 'in_service'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionResponse.error) {
        console.error('❌ Erro ao buscar sessão:', sessionResponse.error);
        setError({
          title: 'Erro ao buscar atendimento',
          message: 'Ocorreu um erro ao buscar seus dados de atendimento. Tente novamente.'
        });
        setIsSearching(false);
        return;
      }

      const sessions = sessionResponse.data;
      if (!sessions || sessions.length === 0) {
        setError({
          title: 'Nenhum atendimento encontrado',
          message: 'Você não possui um atendimento ativo no momento. Procure a recepção para fazer check-in.'
        });
        setIsSearching(false);
        return;
      }

      const session = sessions[0];
      console.log('✅ Sessão ativa encontrada');

      navigate('/totem/checkout', {
        state: {
          session,
          client: cliente,
          appointment: session.appointment
        }
      });

    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      setError({
        title: 'Erro inesperado',
        message: 'Ocorreu um erro inesperado. Por favor, tente novamente ou procure um atendente.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (error) {
    return (
      <TotemErrorFeedback
        title={error.title}
        message={error.message}
        onRetry={() => setError(null)}
        onGoHome={() => navigate('/totem')}
      />
    );
  }

  return (
    <TotemPinKeypad
      mode="phone"
      title="Check-out"
      subtitle="Digite o número de telefone para finalizar o atendimento"
      onSubmit={handleSearch}
      onCancel={() => navigate('/totem/home')}
      loading={isSearching}
      phoneLength={11}
    />
  );
};

export default TotemCheckoutSearch;
