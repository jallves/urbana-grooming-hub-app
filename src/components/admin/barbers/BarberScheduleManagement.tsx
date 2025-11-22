
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, AlertCircle } from 'lucide-react';
import BarberScheduleManager from '@/components/barber/schedule/BarberScheduleManager';
import { useToast } from '@/hooks/use-toast';

interface Barber {
  id: string;
  name: string;
  email: string;
}

const BarberScheduleManagement: React.FC = () => {
  const { toast } = useToast();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, email')
        .eq('role', 'barber')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setBarbers(data || []);
      
      // Auto-selecionar o primeiro barbeiro
      if (data && data.length > 0) {
        setSelectedBarberId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de barbeiros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBarber = barbers.find(b => b.id === selectedBarberId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">
          Carregando barbeiros...
        </div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum barbeiro encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre barbeiros no módulo de Funcionários primeiro.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Selecione o Barbeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{barber.name}</span>
                      <span className="text-xs text-muted-foreground">({barber.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedBarberId && selectedBarber && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">⚠️ IMPORTANTE</p>
                <p className="mb-2">
                  Os horários de trabalho são <strong>essenciais</strong> para que o barbeiro apareça 
                  nos horários disponíveis para agendamento.
                </p>
                <p>
                  <strong>Sem horários configurados, o barbeiro NÃO aparecerá como disponível!</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedBarberId && selectedBarber && (
          <BarberScheduleManager 
            barberId={selectedBarberId}
            barberName={selectedBarber.name}
          />
        )}
      </div>
    </div>
  );
};

export default BarberScheduleManagement;
