
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BarberAvailability {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
}

interface BarberAvailabilityManagerProps {
  barberId: string;
  barberName: string;
}

const BarberAvailabilityManager: React.FC<BarberAvailabilityManagerProps> = ({
  barberId,
  barberName
}) => {
  const { toast } = useToast();
  const [availabilities, setAvailabilities] = useState<BarberAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    date: '',
    start_time: '09:00',
    end_time: '18:00',
    is_available: true,
    reason: ''
  });

  useEffect(() => {
    fetchAvailabilities();
  }, [barberId]);

  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', barberId)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setAvailabilities(data || []);
    } catch (error) {
      console.error('Erro ao carregar disponibilidades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as disponibilidades.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = async () => {
    if (!newAvailability.date) {
      toast({
        title: "Erro",
        description: "Selecione uma data.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('barber_availability')
        .insert({
          barber_id: barberId,
          date: newAvailability.date,
          start_time: newAvailability.start_time,
          end_time: newAvailability.end_time,
          is_available: newAvailability.is_available,
          reason: newAvailability.reason || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Disponibilidade adicionada com sucesso!",
      });

      setNewAvailability({
        date: '',
        start_time: '09:00',
        end_time: '18:00',
        is_available: true,
        reason: ''
      });

      fetchAvailabilities();
    } catch (error) {
      console.error('Erro ao adicionar disponibilidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAvailability = async (id: string, updates: Partial<BarberAvailability>) => {
    try {
      const { error } = await supabase
        .from('barber_availability')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setAvailabilities(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );

      toast({
        title: "Sucesso",
        description: "Disponibilidade atualizada!",
      });
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a disponibilidade.",
        variant: "destructive",
      });
    }
  };

  const deleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('barber_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAvailabilities(prev => prev.filter(item => item.id !== id));

      toast({
        title: "Sucesso",
        description: "Disponibilidade removida!",
      });
    } catch (error) {
      console.error('Erro ao remover disponibilidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a disponibilidade.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando disponibilidades...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-urbana-gold" />
          Disponibilidade Específica - {barberName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formulário para adicionar nova disponibilidade */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium">Adicionar Disponibilidade Específica</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <Input
                type="date"
                value={newAvailability.date}
                onChange={(e) => setNewAvailability(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Início</label>
              <Input
                type="time"
                value={newAvailability.start_time}
                onChange={(e) => setNewAvailability(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Fim</label>
              <Input
                type="time"
                value={newAvailability.end_time}
                onChange={(e) => setNewAvailability(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={newAvailability.is_available}
                onCheckedChange={(checked) => setNewAvailability(prev => ({ ...prev, is_available: checked }))}
              />
              <label className="text-sm font-medium">
                {newAvailability.is_available ? 'Disponível' : 'Indisponível'}
              </label>
            </div>
          </div>
          
          {!newAvailability.is_available && (
            <div>
              <label className="text-sm font-medium mb-2 block">Motivo</label>
              <Textarea
                value={newAvailability.reason}
                onChange={(e) => setNewAvailability(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Motivo da indisponibilidade..."
                rows={2}
              />
            </div>
          )}
          
          <Button 
            onClick={addAvailability}
            disabled={saving}
            className="bg-urbana-gold hover:bg-urbana-gold/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {saving ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>

        {/* Lista de disponibilidades */}
        <div className="space-y-4">
          <h3 className="font-medium">Disponibilidades Cadastradas</h3>
          
          {availabilities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma disponibilidade específica cadastrada.
            </p>
          ) : (
            <div className="space-y-3">
              {availabilities.map((availability) => (
                <div key={availability.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {format(new Date(availability.date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {availability.start_time} - {availability.end_time}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          availability.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {availability.is_available ? 'Disponível' : 'Indisponível'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={availability.is_available}
                        onCheckedChange={(checked) => 
                          updateAvailability(availability.id, { is_available: checked })
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAvailability(availability.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {availability.reason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Motivo:</strong> {availability.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarberAvailabilityManager;
