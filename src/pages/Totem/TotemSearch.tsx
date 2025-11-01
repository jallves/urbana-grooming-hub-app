import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Phone } from 'lucide-react';
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
      toast.error('Digite um telefone válido');
      return;
    }

    setIsSearching(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: cliente, error: clientError } = await supabase
        .from('painel_clientes')
        .select('*')
        .eq('whatsapp', phone)
        .single();

      if (clientError || !cliente) {
        toast.error('Cliente não encontrado');
        setIsSearching(false);
        return;
      }

      const { data: agendamento, error: agendamentoError } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .eq('cliente_id', cliente.id)
        .eq('data', today)
        .in('status', ['agendado', 'confirmado'])
        .single();

      if (agendamentoError || !agendamento) {
        toast.error('Nenhum agendamento encontrado para hoje');
        setIsSearching(false);
        return;
      }

      navigate('/totem/confirmation', { 
        state: { 
          appointment: agendamento,
          client: cliente 
        } 
      });
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      toast.error('Erro ao buscar agendamento');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-urbana-black flex flex-col p-4 sm:p-6 md:p-8 font-poppins relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-12 z-10">
        <Button
          onClick={() => navigate('/totem')}
          variant="ghost"
          size="lg"
          className="h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 text-base sm:text-lg md:text-xl text-urbana-light active:text-urbana-gold active:bg-urbana-gold/20 transition-all duration-100 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-urbana-light text-center flex-1">
          Buscar Agendamento
        </h1>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10 overflow-y-auto">
        <Card className="w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-4 sm:p-6 md:p-8 lg:p-12 space-y-4 sm:space-y-6 md:space-y-8 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          {/* Phone Display */}
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

          {/* Numeric Keypad */}
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

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={phone.length < 10 || isSearching}
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

export default TotemSearch;
