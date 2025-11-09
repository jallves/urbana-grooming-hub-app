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
      // Remover formatação para buscar apenas números
      const cleanPhone = phone.replace(/\D/g, '');
      
      console.log('🔍 Buscando cliente com telefone:', cleanPhone);

      // 🔒 SUPORTE UNIFICADO: Buscar em ambas as tabelas de clientes
      
      // Buscar em painel_clientes primeiro
      const painelClientesResponse = await supabase
        .from('painel_clientes')
        .select('*');

      let cliente = null;
      let clientSource = 'painel';

      if (painelClientesResponse.data) {
        const clientesPainel = painelClientesResponse.data.filter((c: any) => {
          const clientPhoneClean = (c.whatsapp || '').replace(/\D/g, '');
          return clientPhoneClean.includes(cleanPhone) || cleanPhone.includes(clientPhoneClean);
        });

        if (clientesPainel && clientesPainel.length > 0) {
          cliente = clientesPainel[0];
          console.log('✅ Cliente encontrado em painel_clientes:', cliente.nome);
        }
      }

      // Se não encontrou em painel_clientes, buscar em clients (appointments)
      if (!cliente) {
        console.log('⚠️ Cliente não encontrado em painel_clientes, buscando em clients...');
        const clientsResponse = await supabase
          .from('clients')
          .select('*');

        if (clientsResponse.data) {
          const clientsData = clientsResponse.data.filter((c: any) => {
            const clientPhoneClean = (c.phone || '').replace(/\D/g, '');
            return clientPhoneClean.includes(cleanPhone) || cleanPhone.includes(clientPhoneClean);
          });

          if (clientsData && clientsData.length > 0) {
            const clientData = clientsData[0];
            console.log('✅ Cliente encontrado em clients (painel):', clientData.name);
            
            // Normalizar estrutura
            cliente = {
              id: clientData.id,
              nome: clientData.name,
              whatsapp: clientData.phone,
              email: clientData.email
            };
            clientSource = 'clients';
          }
        }
      }

      if (!cliente) {
        console.log('❌ Nenhum cliente encontrado em nenhuma tabela com telefone:', cleanPhone);
        toast.error('Telefone não cadastrado', {
          description: 'Este número não está cadastrado no sistema. Procure a recepção para fazer seu cadastro.',
          duration: 8000,
          style: {
            background: 'hsl(var(--urbana-brown))',
            color: 'hsl(var(--urbana-light))',
            border: '3px solid hsl(var(--destructive))',
            fontSize: '1.25rem',
            padding: '1.5rem',
            maxWidth: '600px'
          }
        });
        setIsSearching(false);
        return;
      }

      console.log('✅ Cliente encontrado (origem:', clientSource, '):', cliente.nome);

      // Buscar agendamentos do cliente - usar data local do Brasil
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      console.log('📅 Buscando agendamentos a partir de:', hoje);
      
      // 🔒 SUPORTE UNIFICADO: Buscar agendamentos em ambas as tabelas
      let agendamentos: any[] = [];
      
      // Buscar em painel_agendamentos
      const painelAgendamentosResponse = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .eq('cliente_id', cliente.id)
        .gte('data', hoje)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (painelAgendamentosResponse.data && painelAgendamentosResponse.data.length > 0) {
        console.log('📦 Agendamentos em painel_agendamentos:', painelAgendamentosResponse.data.length);
        agendamentos = [...agendamentos, ...painelAgendamentosResponse.data];
      }
      
      // Se cliente veio de clients, buscar também em appointments
      if (clientSource === 'clients') {
        console.log('🔍 Buscando também em appointments (painel cliente)...');
        const appointmentsResponse = await supabase
          .from('appointments')
          .select(`
            *,
            service:services(*),
            staff:staff(*)
          `)
          .eq('client_id', cliente.id)
          .gte('start_time', `${hoje}T00:00:00`)
          .order('start_time', { ascending: true });

        if (appointmentsResponse.data && appointmentsResponse.data.length > 0) {
          console.log('📦 Agendamentos em appointments:', appointmentsResponse.data.length);
          
          // Normalizar estrutura para appointments
          const normalizedAppointments = appointmentsResponse.data.map((apt: any) => ({
            id: apt.id,
            cliente_id: apt.client_id,
            barbeiro_id: apt.staff_id,
            servico_id: apt.service_id,
            data: apt.start_time?.split('T')[0],
            hora: apt.start_time?.split('T')[1]?.substring(0, 5),
            status: apt.status === 'scheduled' ? 'CONFIRMADO' : 
                    apt.status === 'confirmed' ? 'CONFIRMADO' :
                    apt.status === 'completed' ? 'FINALIZADO' : 'CONFIRMADO',
            status_totem: apt.status === 'confirmed' ? 'CHEGOU' : 'AGUARDANDO',
            servico: apt.service ? {
              id: apt.service.id,
              nome: apt.service.name,
              preco: apt.service.price,
              duracao: apt.service.duration
            } : null,
            barbeiro: apt.staff ? {
              id: apt.staff.id,
              nome: apt.staff.name
            } : null,
            _source: 'appointments' // Flag para identificar origem
          }));
          
          agendamentos = [...agendamentos, ...normalizedAppointments];
        }
      }

      console.log('📅 Total de agendamentos encontrados:', agendamentos.length);

      // Verificar qual ação foi solicitada
      if (action === 'novo-agendamento') {
        // Para novo agendamento, apenas precisamos do cliente
        console.log('✅ Navegando para novo agendamento');
        navigate('/totem/servico', {
          state: {
            client: cliente
          }
        });
        setIsSearching(false);
        return;
      }

      // Para PRODUTOS, apenas precisamos do cliente
      if (action === 'produtos') {
        console.log('✅ Navegando para produtos');
        navigate('/totem/products', {
          state: {
            client: cliente
          }
        });
        setIsSearching(false);
        return;
      }

      // Para CHECK-IN, verificar se há agendamentos
      if (!agendamentos || agendamentos.length === 0) {
        toast.error('Nenhum agendamento encontrado', {
          description: `${cliente.nome.split(' ')[0]}, você não possui agendamentos futuros para fazer check-in. Por favor, procure a recepção para agendar.`,
          duration: 10000,
          style: {
            background: 'hsl(var(--urbana-brown))',
            color: 'hsl(var(--urbana-light))',
            border: '3px solid hsl(var(--urbana-gold))',
            fontSize: '1.25rem',
            padding: '1.5rem',
            maxWidth: '600px'
          }
        });
        setIsSearching(false);
        return;
      }
      
      // Navegar para tela de seleção de agendamento (check-in)
      console.log('✅ Navegando para lista de agendamentos');
      navigate('/totem/appointments-list', {
        state: {
          appointments: agendamentos,
          client: cliente 
        } 
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
