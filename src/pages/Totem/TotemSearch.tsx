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
    <div className="min-h-screen bg-background flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => navigate('/totem')}
          variant="outline"
          size="lg"
          className="h-20 px-8 text-2xl"
        >
          <ArrowLeft className="w-8 h-8 mr-4" />
          Voltar
        </Button>
        <h1 className="text-5xl font-bold text-foreground">Buscar Agendamento</h1>
        <div className="w-48"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-3xl p-12 space-y-8 bg-card">
          {/* Phone Display */}
          <div className="space-y-4">
            <label className="text-3xl font-semibold text-foreground flex items-center gap-4">
              <Phone className="w-10 h-10 text-urbana-gold" />
              Digite seu telefone
            </label>
            <div className="bg-background border-4 border-urbana-gold rounded-xl p-8 text-center">
              <p className="text-5xl font-mono font-bold text-foreground min-h-[60px] flex items-center justify-center">
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
                className="h-24 text-4xl font-bold bg-muted hover:bg-urbana-gold hover:text-black transition-colors"
                variant="outline"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={handleClear}
              className="h-24 text-3xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar
            </Button>
            <Button
              onClick={() => handleNumberClick('0')}
              className="h-24 text-4xl font-bold bg-muted hover:bg-urbana-gold hover:text-black transition-colors"
              variant="outline"
            >
              0
            </Button>
            <Button
              onClick={handleBackspace}
              className="h-24 text-3xl font-bold bg-muted hover:bg-muted/80"
              variant="outline"
            >
              ⌫
            </Button>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={phone.length < 10 || isSearching}
            className="w-full h-24 text-4xl font-bold bg-urbana-gold text-black hover:bg-urbana-gold/90 disabled:opacity-50"
          >
            {isSearching ? (
              'Buscando...'
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
