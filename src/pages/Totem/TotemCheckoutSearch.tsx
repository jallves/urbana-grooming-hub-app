import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TotemCheckoutSearch: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add('totem-mode');
    return () => {
      document.documentElement.classList.remove('totem-mode');
    };
  }, []);

  const handleNumberClick = (num: string) => {
    if (phone.length < 11) {
      setPhone(phone + num);
    }
  };

  const handleClear = () => {
    setPhone('');
  };

  const handleBackspace = () => {
    setPhone(phone.slice(0, -1));
  };

  const formatPhone = (value: string) => {
    if (value.length <= 2) return value;
    if (value.length <= 7) return `(${value.slice(0, 2)}) ${value.slice(2)}`;
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
  };

  const handleSearch = async () => {
    if (phone.length < 8) {
      toast.error('Digite um telefone válido', {
        description: 'O número deve ter pelo menos 8 dígitos'
      });
      return;
    }

    setIsSearching(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      console.log('🔍 Buscando cliente para checkout:', cleanPhone);

      // Buscar cliente por telefone (com ou sem DDD)
      const { data: todosClientes, error: clientError } = await supabase
        .from('painel_clientes')
        .select('*');

      if (clientError) {
        console.error('❌ Erro ao buscar cliente:', clientError);
        toast.error('Erro no sistema', {
          description: 'Não foi possível buscar o cliente. Tente novamente.'
        });
        setIsSearching(false);
        return;
      }

      // Filtrar clientes - busca flexível com ou sem DDD
      const clientes = todosClientes?.filter(c => {
        const clientPhoneClean = (c.whatsapp || '').replace(/\D/g, '');
        // Busca com DDD ou sem DDD (últimos 8-9 dígitos)
        const clientPhoneLast9 = clientPhoneClean.slice(-9);
        const searchLast9 = cleanPhone.slice(-9);
        return clientPhoneClean.includes(cleanPhone) || 
               cleanPhone.includes(clientPhoneClean) ||
               clientPhoneLast9.includes(searchLast9) ||
               searchLast9.includes(clientPhoneLast9);
      }) || [];

      if (!clientes || clientes.length === 0) {
        console.log('❌ Nenhum cliente encontrado');
        toast.error('Telefone não cadastrado', {
          description: 'Este número não está cadastrado no sistema.'
        });
        setIsSearching(false);
        return;
      }

      const cliente = clientes[0];
      console.log('✅ Cliente encontrado:', cliente.nome);

      // Buscar agendamentos do dia com check-in feito
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .eq('cliente_id', cliente.id)
        .eq('data', hoje)
        .order('hora', { ascending: true });

      if (agendamentosError) {
        console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
        toast.error('Erro no sistema', {
          description: 'Não foi possível buscar seus agendamentos.'
        });
        setIsSearching(false);
        return;
      }

      console.log('📅 Agendamentos encontrados:', agendamentos?.length || 0);

      if (!agendamentos || agendamentos.length === 0) {
        toast.error('Nenhum agendamento hoje', {
          description: `${cliente.nome}, você não possui agendamentos para hoje.`
        });
        setIsSearching(false);
        return;
      }

      // Buscar sessões do totem para todos os agendamentos
      const { data: todasSessoes, error: sessionError } = await supabase
        .from('totem_sessions')
        .select('*')
        .in('appointment_id', agendamentos.map(a => a.id))
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('❌ Erro ao buscar sessões:', sessionError);
        toast.error('Erro no sistema', {
          description: 'Não foi possível buscar suas sessões.'
        });
        setIsSearching(false);
        return;
      }

      console.log('🎫 Sessões encontradas:', todasSessoes?.length || 0);

      // Verificar se existe sessão em checkout ou checkout não finalizado
      const sessaoEmCheckout = todasSessoes?.find(s => 
        s.status === 'checkout' && !s.check_out_time
      );

      if (sessaoEmCheckout) {
        const agendamento = agendamentos.find(a => a.id === sessaoEmCheckout.appointment_id);
        console.log('✅ Sessão em checkout encontrada, navegando...');
        navigate('/totem/checkout', { 
          state: { 
            appointment: agendamento,
            client: cliente,
            session: sessaoEmCheckout
          } 
        });
        setIsSearching(false);
        return;
      }

      // Buscar agendamentos com check-in mas sem checkout finalizado
      const agendamentosComCheckin = agendamentos.filter(a => {
        const sessao = todasSessoes?.find(s => s.appointment_id === a.id);
        return sessao && 
               ['check_in', 'in_service'].includes(sessao.status) && 
               !sessao.check_out_time;
      });

      if (agendamentosComCheckin.length === 0) {
        // Verificar se todos os checkouts foram finalizados
        const agendamentosFinalizados = agendamentos.filter(a => {
          const sessao = todasSessoes?.find(s => s.appointment_id === a.id);
          return sessao && sessao.check_out_time;
        });

        if (agendamentosFinalizados.length === agendamentos.length) {
          toast.error('Checkouts já finalizados', {
            description: `${cliente.nome}, todos os seus serviços de hoje já foram finalizados.`
          });
        } else {
          toast.error('Nenhum check-in encontrado', {
            description: `${cliente.nome}, você precisa fazer o check-in primeiro para realizar o checkout.`
          });
        }
        setIsSearching(false);
        return;
      }

      // Se tem múltiplos agendamentos com check-in, pegar o primeiro
      const agendamentoParaCheckout = agendamentosComCheckin[0];
      const sessaoParaCheckout = todasSessoes?.find(s => 
        s.appointment_id === agendamentoParaCheckout.id
      );

      if (!sessaoParaCheckout) {
        toast.error('Sessão não encontrada', {
          description: 'Não foi possível localizar sua sessão ativa.'
        });
        setIsSearching(false);
        return;
      }

      console.log('✅ Navegando para checkout');
      
      // Navegar para checkout com dados do agendamento e sessão
      navigate('/totem/checkout', { 
        state: { 
          appointment: agendamentoParaCheckout,
          client: cliente,
          session: sessaoParaCheckout
        } 
      });
      
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro ao processar sua solicitação.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1">
          Checkout / Pagamento
        </h1>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto">
        <Card className="w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-12 space-y-4 sm:space-y-6 md:space-y-8 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          <div className="space-y-3 sm:space-y-4">
            <label className="text-xl sm:text-2xl md:text-3xl font-semibold text-urbana-light flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-urbana-gold/10 flex items-center justify-center">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-urbana-gold" />
              </div>
              Digite seu telefone
            </label>
            <div className="bg-urbana-black/50 border-2 sm:border-3 md:border-4 border-urbana-gold/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center active:border-urbana-gold transition-colors duration-100">
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mono font-bold text-urbana-light min-h-[40px] sm:min-h-[50px] md:min-h-[60px] flex items-center justify-center">
                {phone ? formatPhone(phone) : '(  )      -    '}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-14 sm:h-18 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl font-bold bg-urbana-black/50 active:bg-urbana-gold/30 border-2 border-urbana-gray/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95"
                variant="outline"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              className="h-14 sm:h-18 md:h-20 lg:h-24 text-sm sm:text-lg md:text-xl lg:text-2xl font-bold bg-urbana-black/50 active:bg-destructive/30 border-2 border-urbana-gray/30 active:border-destructive text-urbana-light active:text-destructive transition-all duration-100 active:scale-95"
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              className="h-14 sm:h-18 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl font-bold bg-urbana-black/50 active:bg-urbana-gold/30 border-2 border-urbana-gray/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95"
              variant="outline"
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              className="h-14 sm:h-18 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl font-bold bg-urbana-black/50 active:bg-destructive/30 border-2 border-urbana-gray/30 active:border-destructive text-urbana-light transition-all duration-100 active:scale-95"
              variant="outline"
            >
              ⌫
            </Button>
          </div>

          <Button
            onClick={handleSearch}
            disabled={phone.length < 8 || isSearching}
            className="w-full h-14 sm:h-18 md:h-20 lg:h-24 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black active:from-urbana-gold-dark active:to-urbana-gold disabled:opacity-50 shadow-lg shadow-urbana-gold/30 active:shadow-urbana-gold/50 transition-all duration-100 active:scale-98"
          >
            {isSearching ? (
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-3 sm:border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                Buscando...
              </div>
            ) : (
              <>
                <Search className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mr-2 sm:mr-3 md:mr-4" />
                BUSCAR
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default TotemCheckoutSearch;
