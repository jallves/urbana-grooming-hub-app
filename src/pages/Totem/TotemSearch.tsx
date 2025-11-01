import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TotemSearch: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
      
      // Buscar cliente pelo telefone
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

      // Buscar agendamento do dia
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

      // Redirecionar para confirmação com dados
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
    <div className="min-h-screen bg-background flex flex-col p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-2">
        <Button
          onClick={() => navigate('/totem')}
          variant="outline"
          size="lg"
          className="h-16 sm:h-18 md:h-20 px-4 sm:px-6 md:px-8 text-xl sm:text-xl md:text-2xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 sm:mr-3 md:mr-4" />
          Voltar
        </Button>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-center flex-1">Buscar Agendamento</h1>
        <div className="w-20 sm:w-32 md:w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-3xl p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-7 md:space-y-8 bg-card">
          {/* Phone Display */}
          <div className="space-y-3 sm:space-y-4">
            <label className="text-2xl sm:text-2xl md:text-3xl font-semibold text-foreground flex items-center gap-3 sm:gap-4">
              <Phone className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-urbana-gold" />
              Digite seu telefone
            </label>
            <div className="bg-background border-3 sm:border-4 border-urbana-gold rounded-xl p-4 sm:p-6 md:p-8 text-center">
              <p className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-foreground min-h-[50px] sm:min-h-[55px] md:min-h-[60px] flex items-center justify-center">
                {phone ? formatPhone(phone) : '(  )      -    '}
              </p>
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-18 sm:h-20 md:h-24 text-3xl sm:text-3xl md:text-4xl font-bold bg-muted hover:bg-urbana-gold hover:text-black transition-colors"
                variant="outline"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              className="h-18 sm:h-20 md:h-24 text-2xl sm:text-2xl md:text-3xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              className="h-18 sm:h-20 md:h-24 text-3xl sm:text-3xl md:text-4xl font-bold bg-muted hover:bg-urbana-gold hover:text-black transition-colors"
              variant="outline"
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              className="h-18 sm:h-20 md:h-24 text-2xl sm:text-2xl md:text-3xl font-bold bg-muted hover:bg-muted/80"
              variant="outline"
            >
              ⌫
            </Button>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={phone.length < 10 || isSearching}
            className="w-full h-20 sm:h-22 md:h-24 text-3xl sm:text-3xl md:text-4xl font-bold bg-urbana-gold text-black hover:bg-urbana-gold/90 disabled:opacity-50"
          >
            {isSearching ? (
              'Buscando...'
            ) : (
              <>
                <Search className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 mr-3 sm:mr-3 md:mr-4" />
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
