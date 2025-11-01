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
    <div className="min-h-screen bg-urbana-black flex flex-col p-8 font-poppins relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-urbana-black via-urbana-brown/20 to-urbana-black opacity-50" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-12 z-10">
        <Button
          onClick={() => navigate('/totem')}
          variant="ghost"
          size="lg"
          className="h-16 px-8 text-xl text-urbana-light hover:text-urbana-gold hover:bg-urbana-gold/10"
        >
          <ArrowLeft className="w-7 h-7 mr-3" />
          Voltar
        </Button>
        <h1 className="text-5xl font-bold text-urbana-light text-center flex-1">
          Buscar Agendamento
        </h1>
        <div className="w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center z-10">
        <Card className="w-full max-w-3xl p-12 space-y-8 bg-card/50 backdrop-blur-sm border-urbana-gray/30 shadow-2xl">
          {/* Phone Display */}
          <div className="space-y-4">
            <label className="text-3xl font-semibold text-urbana-light flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-urbana-gold/10 flex items-center justify-center">
                <Phone className="w-7 h-7 text-urbana-gold" />
              </div>
              Digite seu telefone
            </label>
            <div className="bg-urbana-black/50 border-4 border-urbana-gold/30 rounded-2xl p-8 text-center hover:border-urbana-gold/50 transition-colors">
              <p className="text-5xl font-mono font-bold text-urbana-light min-h-[60px] flex items-center justify-center">
                {phone ? formatPhone(phone) : '(  )      -    '}
              </p>
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-24 text-4xl font-bold bg-urbana-black/50 hover:bg-urbana-gold/20 border-2 border-urbana-gray/30 hover:border-urbana-gold text-urbana-light hover:text-urbana-gold transition-all"
                variant="outline"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              className="h-24 text-2xl font-bold bg-urbana-black/50 hover:bg-destructive/20 border-2 border-urbana-gray/30 hover:border-destructive text-urbana-light hover:text-destructive transition-all"
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              className="h-24 text-4xl font-bold bg-urbana-black/50 hover:bg-urbana-gold/20 border-2 border-urbana-gray/30 hover:border-urbana-gold text-urbana-light hover:text-urbana-gold transition-all"
              variant="outline"
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              className="h-24 text-3xl font-bold bg-urbana-black/50 hover:bg-destructive/20 border-2 border-urbana-gray/30 hover:border-destructive text-urbana-light transition-all"
              variant="outline"
            >
              ⌫
            </Button>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={phone.length < 10 || isSearching}
            className="w-full h-24 text-4xl font-bold bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black hover:from-urbana-gold-dark hover:to-urbana-gold disabled:opacity-50 shadow-lg shadow-urbana-gold/30 hover:shadow-urbana-gold/50 transition-all"
          >
            {isSearching ? (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
                Buscando...
              </div>
            ) : (
              <>
                <Search className="w-10 h-10 mr-4" />
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
