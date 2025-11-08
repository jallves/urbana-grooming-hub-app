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

      // Buscar todos os clientes e filtrar removendo formatação
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

      // Filtrar clientes comparando apenas os dígitos
      const clientes = response.data?.filter((c: any) => {
        const clientPhoneClean = (c.whatsapp || '').replace(/\D/g, '');
        return clientPhoneClean.includes(cleanPhone) || cleanPhone.includes(clientPhoneClean);
      }) || [];

      if (!clientes || clientes.length === 0) {
        console.log('❌ Nenhum cliente encontrado com telefone:', cleanPhone);
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

      const cliente = clientes[0];
      console.log('✅ Cliente encontrado:', cliente.nome);

      // Buscar agendamentos do cliente - usar data local do Brasil
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      console.log('📅 Buscando agendamentos a partir de:', hoje);
      
      // @ts-ignore
      const agendamentosResponse = await supabase
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

      if (agendamentosResponse.error) {
        console.error('❌ Erro ao buscar agendamentos:', agendamentosResponse.error);
        toast.error('Erro no sistema', {
          description: 'Não foi possível buscar seus agendamentos. Tente novamente.'
        });
        setIsSearching(false);
        return;
      }

      console.log('📅 Agendamentos encontrados:', agendamentosResponse.data?.length || 0);

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
      const agendamentos = agendamentosResponse.data;
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
