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

      // REGRA: Verificar se tem check-in realizado (não pode checkout sem check-in)
      // Buscar agendamentos com check-in finalizado e checkout pendente
      // status_totem = 'CHEGOU' é setado pela edge function totem-checkin
      const { data: agendamentosComCheckin, error: checkinError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .eq('cliente_id', cliente.id)
        .eq('status_totem', 'CHEGOU')
        .in('status', ['confirmado', 'em_atendimento'])
        .order('created_at', { ascending: false });

      if (checkinError) {
        console.error('❌ Erro ao buscar agendamentos com check-in:', checkinError);
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

      // Se não há agendamentos com check-in finalizado
      if (!agendamentosComCheckin || agendamentosComCheckin.length === 0) {
        console.log('❌ Nenhum agendamento com check-in finalizado');
        
        // Verificar se tem agendamentos pendentes de check-in
        // Agendamentos sem status_totem ou com status diferente de CHEGOU
        const { data: agendamentosPendentes } = await supabase
          .from('painel_agendamentos')
          .select('id, data, hora, status, status_totem')
          .eq('cliente_id', cliente.id)
          .in('status', ['agendado', 'confirmado'])
          .or('status_totem.is.null,status_totem.neq.CHEGOU');
        
        if (agendamentosPendentes && agendamentosPendentes.length > 0) {
          // Tem agendamento mas não fez check-in
          setIsSearching(false);
          navigate('/totem/error', {
            state: {
              title: 'Check-in Pendente',
              message: 'Você possui agendamento(s) aguardando check-in. Por favor, realize o check-in primeiro.',
              type: 'warning',
              showRetry: false,
              showGoHome: true
            }
          });
          return;
        }
        
        // Não tem nenhum agendamento
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

      const appointment = agendamentosComCheckin[0];
      console.log('✅ Agendamento com check-in encontrado para checkout:', appointment);

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
