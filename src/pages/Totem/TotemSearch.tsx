import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Phone, Sparkles, Loader2, Delete } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TotemSearch: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Add totem-mode class for touch optimization
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
    if (phone.length < 10) {
      toast.error('Digite um telefone válido', {
        description: 'O número deve ter pelo menos 10 dígitos'
      });
      return;
    }

    setIsSearching(true);

    try {
      // Remover formatação para buscar apenas números
      const cleanPhone = phone.replace(/\D/g, '');
      
      console.log('🔍 Buscando cliente com telefone:', cleanPhone);

      // Buscar todos os clientes e filtrar removendo formatação
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

      // Filtrar clientes comparando apenas os dígitos
      const clientes = todosClientes?.filter(c => {
        const clientPhoneClean = (c.whatsapp || '').replace(/\D/g, '');
        return clientPhoneClean.includes(cleanPhone) || cleanPhone.includes(clientPhoneClean);
      }) || [];

      if (!clientes || clientes.length === 0) {
        console.log('❌ Nenhum cliente encontrado com telefone:', cleanPhone);
        toast.error('Telefone não cadastrado', {
          description: 'Este número não está cadastrado no sistema. Procure a recepção para fazer seu cadastro.'
        });
        setIsSearching(false);
        return;
      }

      const cliente = clientes[0];
      console.log('✅ Cliente encontrado:', cliente.nome);

      // Buscar agendamentos do cliente
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data: agendamentos, error: agendamentosError } = await supabase
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

      if (agendamentosError) {
        console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
        toast.error('Erro no sistema', {
          description: 'Não foi possível buscar seus agendamentos. Tente novamente.'
        });
        setIsSearching(false);
        return;
      }

      console.log('📅 Agendamentos encontrados:', agendamentos?.length || 0);

      if (!agendamentos || agendamentos.length === 0) {
        toast.error('Nenhum agendamento encontrado', {
          description: `${cliente.nome}, você não possui agendamentos marcados. Procure a recepção para agendar.`
        });
        setIsSearching(false);
        return;
      }

      console.log('✅ Navegando para lista de agendamentos');
      
      // Navegar para tela de seleção de agendamento
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
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-black to-urbana-brown flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 font-poppins relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(197, 161, 91, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 z-10 animate-fade-in">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-10 sm:h-12 md:h-14 lg:h-16 px-3 sm:px-4 md:px-6 lg:px-8 gap-2 text-sm sm:text-base md:text-lg lg:text-xl text-urbana-light bg-urbana-black-soft/50 backdrop-blur-sm border border-urbana-gray/30 active:bg-urbana-gold/20 active:border-urbana-gold active:text-urbana-gold transition-all duration-200 active:scale-95 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer" style={{ backgroundSize: '200% auto' }}>
            Buscar Agendamento
          </h1>
        </div>
        
        <div className="w-16 sm:w-20 md:w-24 lg:w-32"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto py-2 sm:py-4">
        <Card className="w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-3 sm:p-4 md:p-6 lg:p-10 space-y-3 sm:space-y-4 md:space-y-6 bg-gradient-to-br from-urbana-black-soft/90 to-urbana-black-soft/70 backdrop-blur-xl border-2 border-urbana-gray/30 shadow-2xl rounded-2xl sm:rounded-3xl animate-scale-in">
          {/* Phone Display */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <label className="text-base sm:text-xl md:text-2xl lg:text-3xl font-semibold text-urbana-light flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white drop-shadow" />
              </div>
              Digite seu telefone
            </label>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-urbana-gold to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
              <div className="relative bg-urbana-black/60 border-2 border-urbana-gold/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 text-center transition-colors duration-200">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-mono font-bold text-urbana-gold-vibrant min-h-[32px] sm:min-h-[40px] md:min-h-[50px] lg:min-h-[60px] flex items-center justify-center tracking-wider drop-shadow-lg">
                  {phone ? formatPhone(phone) : '(  )      -    '}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="relative group h-12 sm:h-14 md:h-16 lg:h-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/60 backdrop-blur-sm active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gray/40 active:border-urbana-gold text-urbana-light active:text-urbana-gold-vibrant transition-all duration-150 active:scale-95 rounded-xl overflow-hidden"
                variant="outline"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/0 group-active:from-urbana-gold/20 group-active:to-urbana-gold-vibrant/20 transition-all duration-150" />
                <span className="relative drop-shadow">{num}</span>
              </Button>
            ))}
            
            <Button
              onClick={handleClear}
              className="relative h-12 sm:h-14 md:h-16 lg:h-20 text-xs sm:text-sm md:text-base lg:text-lg font-bold bg-gradient-to-br from-red-500/20 to-red-600/20 active:from-red-500/40 active:to-red-600/40 border-2 border-red-500/30 active:border-red-500 text-red-300 active:text-red-100 transition-all duration-150 active:scale-95 rounded-xl"
            >
              Limpar
            </Button>
            
            <Button
              onClick={() => handleNumberClick('0')}
              className="relative group h-12 sm:h-14 md:h-16 lg:h-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/60 backdrop-blur-sm active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gray/40 active:border-urbana-gold text-urbana-light active:text-urbana-gold-vibrant transition-all duration-150 active:scale-95 rounded-xl overflow-hidden"
              variant="outline"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/0 to-urbana-gold/0 group-active:from-urbana-gold/20 group-active:to-urbana-gold-vibrant/20 transition-all duration-150" />
              <span className="relative drop-shadow">0</span>
            </Button>
            
            <Button
              onClick={handleBackspace}
              className="relative h-12 sm:h-14 md:h-16 lg:h-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-orange-500/20 to-orange-600/20 active:from-orange-500/40 active:to-orange-600/40 border-2 border-orange-500/30 active:border-orange-500 text-orange-300 active:text-orange-100 transition-all duration-150 active:scale-95 rounded-xl"
              variant="outline"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
            </Button>
          </div>

          {/* Enhanced Search Button */}
          <Button
            onClick={handleSearch}
            disabled={phone.length < 10 || isSearching}
            className="relative w-full h-12 sm:h-14 md:h-16 lg:h-20 text-base sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light active:from-urbana-gold active:to-urbana-gold-dark text-urbana-black disabled:from-urbana-gray disabled:to-urbana-gray-light disabled:text-urbana-light/40 transition-all duration-200 active:scale-98 shadow-xl rounded-xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            
            <div className="relative flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  <span>BUSCAR</span>
                </>
              )}
            </div>
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default TotemSearch;
