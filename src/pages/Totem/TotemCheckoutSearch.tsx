import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Phone, CheckCircle2, AlertCircle, CreditCard, Smartphone, Delete } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface CheckoutInfo {
  check_out_time: string;
  payment_method: string;
  payment_status: string;
  payment_amount: number;
  paid_at: string;
}

const TotemCheckoutSearch: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<any>(null);

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
    setCheckoutInfo(null);
    setClientInfo(null);
    setAppointmentInfo(null);
  };

  const handleBackspace = () => {
    setPhone(phone.slice(0, -1));
  };

  const formatPhone = (value: string) => {
    if (value.length <= 2) return value;
    if (value.length <= 7) return `(${value.slice(0, 2)}) ${value.slice(2)}`;
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      pix: 'PIX',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito'
    };
    return methods[method] || method;
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      completed: { label: 'Pago', color: 'text-green-400' },
      processing: { label: 'Processando', color: 'text-yellow-400' },
      pending: { label: 'Pendente', color: 'text-orange-400' },
      failed: { label: 'Falhou', color: 'text-red-400' }
    };
    return statuses[status] || { label: status, color: 'text-urbana-light' };
  };

  const handleSearch = async () => {
    if (phone.length < 8) {
      toast.error('Digite um telefone válido', {
        description: 'O número deve ter pelo menos 8 dígitos'
      });
      return;
    }

    setIsSearching(true);
    setCheckoutInfo(null);
    setClientInfo(null);
    setAppointmentInfo(null);

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

      // Buscar agendamentos do dia - usar data local do Brasil
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
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

      // PRIORIDADE 1: Verificar se existe sessão em checkout (não finalizado)
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

      // PRIORIDADE 2: Buscar SESSÃO ATIVA mais recente (check-in ativo sem checkout)
      const sessaoAtivaRecente = todasSessoes?.find(s => 
        ['check_in', 'in_service'].includes(s.status) && 
        !s.check_out_time
      );

      if (sessaoAtivaRecente) {
        // Buscar o agendamento correspondente à sessão ativa
        const agendamentoParaCheckout = agendamentos.find(a => 
          a.id === sessaoAtivaRecente.appointment_id
        );

        if (!agendamentoParaCheckout) {
          toast.error('Agendamento não encontrado', {
            description: 'Não foi possível localizar o agendamento ativo.'
          });
          setIsSearching(false);
          return;
        }

        console.log('✅ Sessão ativa encontrada:', sessaoAtivaRecente.id, 'para agendamento:', agendamentoParaCheckout.id);
        console.log('✅ Navegando para checkout com sessão ativa:', sessaoAtivaRecente.id);
        
        // Navegar para checkout com dados do agendamento e sessão ATIVA
        navigate('/totem/checkout', { 
          state: { 
            appointment: agendamentoParaCheckout,
            client: cliente,
            session: sessaoAtivaRecente
          } 
        });
        setIsSearching(false);
        return;
      }

      // PRIORIDADE 3: Se não há sessão ativa, verificar se existe checkout já finalizado
      const sessaoComCheckoutFinalizado = todasSessoes?.find(s => 
        s.check_out_time && s.status === 'completed'
      );

      if (sessaoComCheckoutFinalizado) {
        // Buscar informações do pagamento
        const { data: pagamentos, error: paymentError } = await supabase
          .from('totem_payments')
          .select('*')
          .eq('session_id', sessaoComCheckoutFinalizado.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!paymentError && pagamentos && pagamentos.length > 0) {
          const pagamento = pagamentos[0];
          const agendamento = agendamentos.find(a => a.id === sessaoComCheckoutFinalizado.appointment_id);
          
          setCheckoutInfo({
            check_out_time: sessaoComCheckoutFinalizado.check_out_time,
            payment_method: pagamento.payment_method,
            payment_status: pagamento.status,
            payment_amount: pagamento.amount,
            paid_at: pagamento.paid_at || sessaoComCheckoutFinalizado.check_out_time
          });
          setClientInfo(cliente);
          setAppointmentInfo(agendamento);
          
          console.log('✅ Checkout já finalizado encontrado');
          setIsSearching(false);
          return;
        }
      }

      // PRIORIDADE 4: Nenhuma sessão encontrada - verificar situação

      // Verificar se todos os checkouts foram finalizados
      const agendamentosFinalizados = agendamentos.filter(a => {
        const sessao = todasSessoes?.find(s => s.appointment_id === a.id);
        return sessao && sessao.check_out_time;
      });

      if (agendamentosFinalizados.length === agendamentos.length) {
        toast.error('Checkouts já finalizados', {
          description: `${cliente.nome.split(' ')[0]}, todos os seus serviços de hoje já foram finalizados. Agradecemos pela preferência!`,
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
      } else {
        toast.error('Nenhum check-in encontrado', {
          description: `${cliente.nome.split(' ')[0]}, você precisa fazer o check-in primeiro para realizar o checkout. Por favor, dirija-se ao totem de check-in.`,
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
      }
      setIsSearching(false);
      
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 font-poppins relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/85 via-urbana-black/80 to-urbana-brown/75" />
      </div>

      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-urbana-gold-vibrant/10 rounded-full blur-3xl opacity-40" />
      </div>
      
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 z-10">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light text-center flex-1">
          Checkout / Pagamento
        </h1>
        <div className="w-16 sm:w-24 md:w-32"></div>
      </div>

      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto py-2">
        {checkoutInfo && clientInfo && appointmentInfo ? (
          // Mostrar informações do checkout já finalizado
          <Card className="w-full max-w-2xl lg:max-w-4xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl border-2 border-green-500/50 shadow-2xl shadow-green-500/20">
            {/* Header de Checkout Finalizado */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-green-400">
                    CHECKOUT FINALIZADO ✓
                  </p>
                  <p className="text-base sm:text-lg md:text-xl text-green-300/80 mt-1">
                    Olá, {clientInfo.nome}!
                  </p>
                </div>
              </div>
            </div>

            {/* Informações do Agendamento */}
            <div className="p-4 sm:p-6 bg-urbana-black/40 rounded-xl border border-urbana-gold/30 space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4">Detalhes do Serviço</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-urbana-gray-light">Serviço</p>
                  <p className="text-lg sm:text-xl font-bold text-urbana-light">{appointmentInfo.servico.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-urbana-gray-light">Barbeiro</p>
                  <p className="text-lg sm:text-xl font-bold text-urbana-light">{appointmentInfo.barbeiro.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-urbana-gray-light">Horário</p>
                  <p className="text-lg sm:text-xl font-bold text-urbana-light">{appointmentInfo.hora}</p>
                </div>
                <div>
                  <p className="text-sm text-urbana-gray-light">Data</p>
                  <p className="text-lg sm:text-xl font-bold text-urbana-light">
                    {format(new Date(appointmentInfo.data), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            {/* Informações do Pagamento */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-urbana-gold/10 to-urbana-gold-dark/10 rounded-xl border-2 border-urbana-gold/50 space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-urbana-light mb-4 flex items-center gap-3">
                <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-urbana-gold" />
                Informações do Pagamento
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 sm:p-4 bg-urbana-black/40 rounded-lg">
                  <p className="text-sm text-urbana-light/60 mb-1">Forma de Pagamento</p>
                  <div className="flex items-center gap-2">
                    {checkoutInfo.payment_method === 'pix' ? (
                      <Smartphone className="w-5 h-5 text-urbana-gold" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-urbana-gold" />
                    )}
                    <p className="text-lg sm:text-xl font-bold text-urbana-gold">
                      {getPaymentMethodLabel(checkoutInfo.payment_method)}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 bg-urbana-black/40 rounded-lg">
                  <p className="text-sm text-urbana-light/60 mb-1">Status do Pagamento</p>
                  <p className={`text-lg sm:text-xl font-bold ${getPaymentStatusLabel(checkoutInfo.payment_status).color}`}>
                    {getPaymentStatusLabel(checkoutInfo.payment_status).label}
                  </p>
                </div>
                
                <div className="p-3 sm:p-4 bg-urbana-black/40 rounded-lg">
                  <p className="text-sm text-urbana-light/60 mb-1">Valor Pago</p>
                  <p className="text-2xl sm:text-3xl font-black text-urbana-gold">
                    R$ {checkoutInfo.payment_amount.toFixed(2)}
                  </p>
                </div>
                
                <div className="p-3 sm:p-4 bg-urbana-black/40 rounded-lg">
                  <p className="text-sm text-urbana-light/60 mb-1">Data/Hora do Pagamento</p>
                  <p className="text-base sm:text-lg font-bold text-urbana-light">
                    {format(new Date(checkoutInfo.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            {/* Mensagem Final */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-base sm:text-lg text-blue-300 font-medium">
                  Seu pagamento já foi processado e finalizado com sucesso!
                </p>
                <p className="text-sm sm:text-base text-blue-200/70 mt-2">
                  Agradecemos pela preferência. Volte sempre! 💈
                </p>
              </div>
            </div>

            {/* Botão Voltar */}
            <Button
              onClick={() => {
                setCheckoutInfo(null);
                setClientInfo(null);
                setAppointmentInfo(null);
                setPhone('');
                navigate('/totem/home');
              }}
              className="w-full h-16 sm:h-18 md:h-20 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black active:from-urbana-gold-dark active:to-urbana-gold shadow-lg"
            >
              VOLTAR AO INÍCIO
            </Button>
          </Card>
        ) : (
          // Formulário de busca normal
          <Card className="w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-6 bg-card/50 backdrop-blur-sm border-2 border-urbana-gold/30 shadow-2xl">
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
                className="h-14 sm:h-18 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gold/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-urbana-gold/10"
                variant="outline"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              className="h-14 sm:h-18 md:h-20 lg:h-24 text-sm sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-br from-red-500/20 to-red-600/20 active:from-red-500/40 active:to-red-600/40 border-2 border-red-500/40 active:border-red-500 text-red-300 active:text-red-100 transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-red-500/10"
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              className="h-14 sm:h-18 md:h-20 lg:h-24 text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gold/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-urbana-gold/10"
              variant="outline"
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              className="h-14 sm:h-18 md:h-20 lg:h-24 font-bold bg-gradient-to-br from-orange-500/20 to-orange-600/20 active:from-orange-500/40 active:to-orange-600/40 border-2 border-orange-500/40 active:border-orange-500 text-orange-300 active:text-orange-100 transition-all duration-100 active:scale-95 rounded-lg shadow-lg shadow-orange-500/10"
              variant="outline"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
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
        )}
      </div>
    </div>
  );
};

export default TotemCheckoutSearch;
