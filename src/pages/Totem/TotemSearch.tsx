import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';

const TotemSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearching, setIsSearching] = useState(false);
  const action = (location.state as any)?.action;

  // Add totem-mode class for touch optimization
  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const getTitleByAction = () => {
    switch (action) {
      case 'novo-agendamento':
        return 'Novo Agendamento';
      case 'check-in':
        return 'Check-in';
      case 'produtos':
        return 'Produtos e Cuidados';
      default:
        return 'Buscar Cliente';
    }
  };

  const handleSearch = async (phone: string) => {
    setIsSearching(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      console.log('🔍 Buscando cliente com telefone:', cleanPhone);

      // Extrair últimos 8-9 dígitos para busca flexível (ignora formatação salva no banco)
      const shortPhone = cleanPhone.length > 9 ? cleanPhone.slice(-9) : cleanPhone;
      const midPhone = cleanPhone.length > 8 ? cleanPhone.slice(-8) : cleanPhone;

      // ⚡ OTIMIZADO: Busca server-side com múltiplos padrões para cobrir formatações variadas
      const { data: painelClientes } = await supabase
        .from('painel_clientes')
        .select('*')
        .or(`whatsapp.ilike.%${cleanPhone}%,telefone.ilike.%${cleanPhone}%,whatsapp.ilike.%${shortPhone}%,telefone.ilike.%${shortPhone}%,whatsapp.ilike.%${midPhone}%,telefone.ilike.%${midPhone}%`)
        .limit(1);

      let cliente: any = painelClientes?.[0] || null;
      let clientSource = 'painel';

      // Fallback: buscar em clients (appointments) se não encontrou
      if (!cliente) {
        console.log('⚠️ Não encontrado em painel_clientes, buscando em clients...');
        const { data: clientsData } = await supabase
          .from('clients')
          .select('*')
          .or(`phone.ilike.%${cleanPhone}%`)
          .limit(1);

        if (clientsData?.[0]) {
          const c = clientsData[0];
          cliente = { id: c.id, nome: c.name, whatsapp: c.phone, email: c.email };
          clientSource = 'clients';
        }
      }

      if (!cliente) {
        console.log('❌ Nenhum cliente encontrado');
        setIsSearching(false);
        navigate('/totem/error', {
          state: {
            title: 'Cliente não encontrado',
            message: 'Favor realizar seu cadastro',
            type: 'info',
            showRetry: false,
            showRegister: true,
            action
          }
        });
        return;
      }

      console.log('✅ Cliente encontrado (origem:', clientSource, '):', cliente.nome);

      // ⚡ OTIMIZADO: Data de hoje calculada uma vez
      const now = new Date();
      const hoje = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // ⚡ OTIMIZADO: Queries em PARALELO (checkout pendente + agendamentos)
      const [checkoutsResponse, agendamentosResponse] = await Promise.all([
        // 1. Verificar checkouts pendentes
        supabase
          .from('painel_agendamentos')
          .select('id, data, hora, status, status_totem')
          .eq('cliente_id', cliente.id)
          .eq('status_totem', 'CHEGOU')
          .in('status', ['confirmado', 'em_atendimento']),
        // 2. Buscar agendamentos futuros
        supabase
          .from('painel_agendamentos')
          .select(`*, servico:painel_servicos(*), barbeiro:painel_barbeiros(*)`)
          .eq('cliente_id', cliente.id)
          .gte('data', hoje)
          .order('data', { ascending: true })
          .order('hora', { ascending: true })
      ]);

      // Processar checkouts pendentes
      const checkoutsPendentes = checkoutsResponse.data;
      if (checkoutsPendentes && checkoutsPendentes.length > 0) {
        console.log(`🔔 ${checkoutsPendentes.length} checkout(s) pendente(s)`);
        toast.info('Checkouts Pendentes', {
          description: `Você possui ${checkoutsPendentes.length} atendimento(s) aguardando pagamento!`,
          duration: 5000
        });
        navigate('/totem/pending-checkouts', {
          state: { whatsapp: cliente.whatsapp, cliente }
        });
        setIsSearching(false);
        return;
      }

      // Roteamento por ação
      if (action === 'novo-agendamento') {
        navigate('/totem/servico', { state: { client: cliente } });
        setIsSearching(false);
        return;
      }

      if (action === 'produtos') {
        navigate('/totem/products', { state: { client: cliente } });
        setIsSearching(false);
        return;
      }

      // CHECK-IN: verificar agendamentos
      let agendamentos: any[] = agendamentosResponse.data || [];

      // Se cliente veio de clients, buscar também em appointments (em paralelo já seria ideal, mas é raro)
      if (clientSource === 'clients') {
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`*, service:services(*), staff:staff(*)`)
          .eq('client_id', cliente.id)
          .gte('start_time', `${hoje}T00:00:00`)
          .order('start_time', { ascending: true });

        if (appointmentsData?.length) {
          const normalized = appointmentsData.map((apt: any) => ({
            id: apt.id,
            cliente_id: apt.client_id,
            barbeiro_id: apt.staff_id,
            servico_id: apt.service_id,
            data: apt.start_time?.split('T')[0],
            hora: apt.start_time?.split('T')[1]?.substring(0, 5),
            status: apt.status === 'scheduled' || apt.status === 'confirmed' ? 'CONFIRMADO' : 
                    apt.status === 'completed' ? 'FINALIZADO' : 'CONFIRMADO',
            status_totem: apt.status === 'confirmed' ? 'CHEGOU' : 'AGUARDANDO',
            servico: apt.service ? { id: apt.service.id, nome: apt.service.name, preco: apt.service.price, duracao: apt.service.duration } : null,
            barbeiro: apt.staff ? { id: apt.staff.id, nome: apt.staff.name } : null,
            _source: 'appointments'
          }));
          agendamentos = [...agendamentos, ...normalized];
        }
      }

      if (!agendamentos.length) {
        setIsSearching(false);
        navigate('/totem/error', {
          state: {
            title: 'Check-in não disponível',
            message: 'Cliente não possui check-in pendente, favor realizar agendamento',
            type: 'warning',
            showRetry: false,
            showGoHome: true
          }
        });
        return;
      }

      navigate('/totem/appointments-list', {
        state: { appointments: agendamentos, client: cliente }
      });
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro ao processar sua solicitação. Por favor, procure a recepção.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative">
      <TotemPinKeypad
        mode="phone"
        title={getTitleByAction()}
        subtitle="Digite o número de telefone do cliente"
        onSubmit={handleSearch}
        onCancel={() => navigate('/totem/home')}
        loading={isSearching}
        phoneLength={11}
      />
      
      {/* Botão Cadastro no canto superior direito */}
      <div className="fixed top-8 right-8">
        <button
          onClick={() => navigate('/totem/cadastro', { 
            state: { 
              action,
              phone: '' 
            } 
          })}
          className="relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold rounded-full shadow-lg shadow-urbana-gold/50 hover:opacity-90 transition-opacity"
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-urbana-light rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-urbana-light rounded-full"></div>
          <span className="text-urbana-dark font-bold text-sm uppercase tracking-wider">
            Cadastro
          </span>
        </button>
      </div>
    </div>
  );
};

export default TotemSearch;
