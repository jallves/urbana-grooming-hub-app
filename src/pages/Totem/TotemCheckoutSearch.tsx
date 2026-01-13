import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';

const TotemCheckoutSearch: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const handleSearch = async (phone: string) => {
    setIsSearching(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (!cleanPhone || cleanPhone.length < 10) {
        setIsSearching(false);
        
        navigate('/totem/error', {
          state: {
            title: 'Telefone inválido',
            message: 'Por favor, digite um número de telefone válido com DDD',
            type: 'warning',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }
      
      console.log('🔍 Buscando cliente para checkout:', cleanPhone);

      // Buscar cliente
      const { data: clientes, error: clientError } = await supabase
        .from('painel_clientes')
        .select('*');

      if (clientError) {
        console.error('❌ Erro ao buscar cliente:', clientError);
        setIsSearching(false);
        
        navigate('/totem/error', {
          state: {
            title: 'Erro de conexão',
            message: 'Não foi possível conectar ao sistema. Verifique sua conexão e tente novamente.',
            type: 'error',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }

      const clientesFiltrados = clientes?.filter((c: any) => {
        const clientPhoneClean = (c.whatsapp || c.telefone || '').replace(/\D/g, '');
        return clientPhoneClean.includes(cleanPhone) || cleanPhone.includes(clientPhoneClean);
      }) || [];

      if (!clientesFiltrados || clientesFiltrados.length === 0) {
        setIsSearching(false);
        
        navigate('/totem/error', {
          state: {
            title: 'Cliente não encontrado',
            message: 'Favor realizar seu cadastro',
            type: 'info',
            showRetry: false,
            showRegister: true,
            action: 'checkout'
          }
        });
        return;
      }

      const cliente = clientesFiltrados[0];
      console.log('✅ Cliente encontrado:', cliente.nome);

      // Buscar agendamentos do cliente com check-in realizado
      const { data: agendamentos, error: agendError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .eq('cliente_id', cliente.id)
        .in('status', ['confirmado', 'em_atendimento'])
        .order('created_at', { ascending: false });

      if (agendError) {
        console.error('❌ Erro ao buscar agendamentos:', agendError);
        setIsSearching(false);
        
        navigate('/totem/error', {
          state: {
            title: 'Erro ao buscar atendimento',
            message: 'Ocorreu um erro ao buscar seus dados de atendimento. Tente novamente.',
            type: 'error',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }

      if (!agendamentos || agendamentos.length === 0) {
        setIsSearching(false);
        
        navigate('/totem/error', {
          state: {
            title: 'Checkout não disponível',
            message: 'Você não possui agendamentos em andamento. Favor realizar check-in primeiro.',
            type: 'warning',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }

      const appointment = agendamentos[0];
      console.log('✅ Agendamento encontrado para checkout:', appointment);

      // Create a simple session object
      const session = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        appointment_id: appointment.id
      };

      navigate('/totem/checkout', {
        state: {
          session,
          client: cliente,
          appointment: appointment
        }
      });

    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      setIsSearching(false);
      
      navigate('/totem/error', {
        state: {
          title: 'Erro inesperado',
          message: 'Ocorreu um erro inesperado. Por favor, tente novamente ou procure um atendente.',
          type: 'error',
          showRetry: false,
          showGoHome: true
        }
      });
    }
  };

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
