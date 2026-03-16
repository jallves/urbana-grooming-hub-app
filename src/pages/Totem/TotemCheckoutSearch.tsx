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
      
      console.log('🔍 [CheckoutSearch] Buscando cliente:', cleanPhone);

      // Construir padrões de busca otimizados (server-side ilike)
      const searchPatterns: string[] = [cleanPhone];
      
      if (cleanPhone.length >= 9) {
        const last9 = cleanPhone.slice(-9);
        searchPatterns.push(last9);
        searchPatterns.push(`${last9.slice(0, 5)}-${last9.slice(5)}`);
      }
      
      if (cleanPhone.length >= 8) {
        const last8 = cleanPhone.slice(-8);
        searchPatterns.push(last8);
        searchPatterns.push(`${last8.slice(0, 4)}-${last8.slice(4)}`);
      }

      const orClauses = searchPatterns
        .flatMap(p => [`whatsapp.ilike.%${p}%`, `telefone.ilike.%${p}%`])
        .join(',');

      // Buscar cliente com filtro server-side
      const { data: clientes, error: clientError } = await supabase
        .from('painel_clientes')
        .select('*')
        .or(orClauses)
        .limit(5);

      if (clientError) {
        console.error('❌ Erro ao buscar cliente:', clientError);
        setIsSearching(false);
        navigate('/totem/error', {
          state: {
            title: 'Erro de conexão',
            message: 'Não foi possível conectar ao sistema. Tente novamente.',
            type: 'error',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }

      if (!clientes || clientes.length === 0) {
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

      const cliente = clientes[0];
      console.log('✅ Cliente encontrado:', cliente.nome);

      // Buscar agendamentos com check-in (status_totem = 'CHEGOU') — query direta, sem edge function
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
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkinError) {
        console.error('❌ Erro ao buscar agendamentos:', checkinError);
        setIsSearching(false);
        navigate('/totem/error', {
          state: {
            title: 'Erro ao buscar atendimento',
            message: 'Ocorreu um erro. Tente novamente.',
            type: 'error',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }

      if (!agendamentosComCheckin || agendamentosComCheckin.length === 0) {
        console.log('❌ Nenhum agendamento com check-in');
        setIsSearching(false);
        navigate('/totem/error', {
          state: {
            title: 'Checkout não disponível',
            message: 'Você não possui atendimentos em andamento. Realize o check-in primeiro.',
            type: 'warning',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }

      const appointment = agendamentosComCheckin[0];
      console.log('✅ Agendamento para checkout:', appointment.id);

      // Navegar imediatamente — session criada inline
      navigate('/totem/checkout', {
        state: {
          session: {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            appointment_id: appointment.id
          },
          client: cliente,
          appointment
        }
      });

    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      setIsSearching(false);
      navigate('/totem/error', {
        state: {
          title: 'Erro inesperado',
          message: 'Tente novamente ou procure um atendente.',
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
