import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
      
      console.log('🔍 Buscando cliente para checkout:', cleanPhone);

      // @ts-ignore
      const response = await supabase
        .from('painel_clientes')
        .select('*');

      if (response.error) {
        console.error('❌ Erro ao buscar cliente:', response.error);
        toast.error('Erro no sistema', {
          description: 'Não foi possível buscar o cliente. Tente novamente.'
        });
        setIsSearching(false);
        return;
      }

      const clientes = response.data?.filter((c: any) => {
        const clientPhoneClean = (c.whatsapp || '').replace(/\D/g, '');
        return clientPhoneClean.includes(cleanPhone) || cleanPhone.includes(clientPhoneClean);
      }) || [];

      if (!clientes || clientes.length === 0) {
        toast.error('Telefone não cadastrado', {
          description: 'Este número não está cadastrado no sistema. Procure a recepção.',
          duration: 8000
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
        toast.error('Erro ao buscar sessão ativa');
        setIsSearching(false);
        return;
      }

      const sessions = sessionResponse.data;
      if (!sessions || sessions.length === 0) {
        toast.error('Nenhuma sessão ativa encontrada', {
          description: 'Você precisa fazer check-in antes de fazer checkout.',
          duration: 8000
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
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro. Por favor, procure a recepção.'
      });
    } finally {
      setIsSearching(false);
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
