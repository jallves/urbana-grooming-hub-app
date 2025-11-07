import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Phone, Sparkles, Loader2, Delete } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import barbershopBg from '@/assets/barbershop-background.jpg';

const TotemSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const action = (location.state as any)?.action;

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

      // Verificar qual ação foi solicitada
      if (action === 'novo-agendamento') {
        // Para novo agendamento, apenas precisamos do cliente
        console.log('✅ Navegando para novo agendamento');
        navigate('/totem/novo-agendamento', {
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-2 sm:p-4 md:p-6 font-poppins relative overflow-hidden">
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
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 sm:w-72 sm:h-72 bg-urbana-gold/5 rounded-full blur-2xl opacity-30" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(197, 161, 91, 0.1) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-4 md:mb-6 z-10 animate-fade-in">
        <Button
          onClick={() => navigate('/totem/home')}
          variant="ghost"
          size="lg"
          className="h-8 sm:h-10 md:h-12 px-2 sm:px-3 md:px-4 gap-1 sm:gap-2 text-xs sm:text-sm md:text-base text-urbana-light bg-urbana-black-soft/50 backdrop-blur-sm border border-urbana-gray/30 active:bg-urbana-gold/20 active:border-urbana-gold active:text-urbana-gold transition-all duration-200 active:scale-95 rounded-lg"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light animate-shimmer" style={{ backgroundSize: '200% auto' }}>
            Buscar Agendamento
          </h1>
        </div>
        
        <div className="w-10 sm:w-16 md:w-20"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto py-1 sm:py-2">
        <Card className="w-full max-w-sm sm:max-w-xl md:max-w-2xl p-2 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 bg-gradient-to-br from-urbana-black-soft/90 to-urbana-black-soft/70 backdrop-blur-xl border-2 border-urbana-gray/30 shadow-2xl rounded-xl sm:rounded-2xl animate-scale-in">
          {/* Phone Display */}
          <div className="space-y-1 sm:space-y-2 md:space-y-3">
            <label className="text-sm sm:text-base md:text-xl font-semibold text-urbana-light flex items-center gap-1 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white drop-shadow" />
              </div>
              Digite seu telefone
            </label>
            
            <div className="relative bg-urbana-black/60 border-2 border-urbana-gold/40 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center">
              <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-mono font-bold text-urbana-gold-vibrant min-h-[24px] sm:min-h-[32px] md:min-h-[40px] flex items-center justify-center tracking-wider drop-shadow-lg">
                {phone ? formatPhone(phone) : '(  )      -    '}
              </p>
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="relative group h-10 sm:h-14 md:h-16 lg:h-20 text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 backdrop-blur-sm active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gold/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold-vibrant transition-all duration-100 active:scale-94 rounded-lg overflow-hidden shadow-lg shadow-urbana-gold/10"
                variant="outline"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="relative drop-shadow-lg">{num}</span>
              </Button>
            ))}
            
            <Button
              onClick={handleClear}
              className="relative h-10 sm:h-14 md:h-16 lg:h-20 text-[10px] sm:text-xs md:text-sm font-bold bg-gradient-to-br from-red-500/20 to-red-600/20 active:from-red-500/40 active:to-red-600/40 border-2 border-red-500/40 active:border-red-500 text-red-300 active:text-red-100 transition-all duration-100 active:scale-94 rounded-lg shadow-lg shadow-red-500/10"
              style={{ touchAction: 'manipulation' }}
            >
              Limpar
            </Button>
            
            <Button
              onClick={() => handleNumberClick('0')}
              className="relative group h-10 sm:h-14 md:h-16 lg:h-20 text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black/90 backdrop-blur-sm active:from-urbana-gold/30 active:to-urbana-gold-vibrant/30 border-2 border-urbana-gold/30 active:border-urbana-gold text-urbana-light active:text-urbana-gold-vibrant transition-all duration-100 active:scale-94 rounded-lg overflow-hidden shadow-lg shadow-urbana-gold/10"
              variant="outline"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="relative drop-shadow-lg">0</span>
            </Button>
            
            <Button
              onClick={handleBackspace}
              className="relative h-10 sm:h-14 md:h-16 lg:h-20 font-bold bg-gradient-to-br from-orange-500/20 to-orange-600/20 active:from-orange-500/40 active:to-orange-600/40 border-2 border-orange-500/40 active:border-orange-500 text-orange-300 active:text-orange-100 transition-all duration-100 active:scale-94 rounded-lg shadow-lg shadow-orange-500/10"
              variant="outline"
              style={{ touchAction: 'manipulation' }}
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
            </Button>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={phone.length < 10 || isSearching}
            className="relative w-full h-10 sm:h-14 md:h-16 lg:h-20 text-sm sm:text-base md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light active:from-urbana-gold active:to-urbana-gold-dark text-urbana-black disabled:from-urbana-gray disabled:to-urbana-gray-light disabled:text-urbana-light/40 transition-all duration-150 active:scale-96 shadow-xl rounded-lg overflow-hidden group"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="relative flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
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
