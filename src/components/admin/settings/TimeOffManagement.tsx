
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Plus, Trash2, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimeOff {
  id: string;
  staff_id: string | null;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  is_recurring: boolean;
  staff?: { name: string };
}

interface Staff {
  id: string;
  name: string;
}

const TimeOffManagement: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    type: 'vacation',
    is_recurring: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar folgas
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('time_off')
        .select(`
          *,
          staff:staff_id (name)
        `)
        .order('start_date', { ascending: false });

      if (timeOffError) throw timeOffError;
      setTimeOffs(timeOffData || []);

      // Carregar staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (staffError) throw staffError;
      setStaff(staffData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToInsert = {
        staff_id: formData.staff_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        type: formData.type,
        is_recurring: formData.is_recurring
      };

      const { error } = await supabase
        .from('time_off')
        .insert([dataToInsert]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Folga/feriado adicionado com sucesso!'
      });

      setFormData({
        staff_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        type: 'vacation',
        is_recurring: false
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a folga/feriado.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Folga/feriado removido com sucesso!'
      });
      loadData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a folga/feriado.',
        variant: 'destructive'
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      vacation: 'Férias',
      sick: 'Atestado',
      holiday: 'Feriado',
      personal: 'Pessoal'
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      vacation: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      holiday: 'bg-purple-100 text-purple-800',
      personal: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Folgas e Feriados</h2>
          <p className="text-gray-600">Configure folgas individuais e feriados gerais</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Folga/Feriado
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Folga/Feriado</CardTitle>
            <CardDescription>
              Preencha os dados para registrar uma nova folga ou feriado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Férias</SelectItem>
                      <SelectItem value="sick">Atestado</SelectItem>
                      <SelectItem value="holiday">Feriado</SelectItem>
                      <SelectItem value="personal">Pessoal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Barbeiro (deixe em branco para feriado geral)</Label>
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um barbeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Feriado Geral</SelectItem>
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo/Descrição</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Descrição da folga ou feriado"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Folgas e Feriados Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeOffs.length === 0 ? (
            <div className="text-center py-8">
              <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma folga ou feriado registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeOffs.map((timeOff) => (
                <div key={timeOff.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(timeOff.type)}`}>
                        {getTypeLabel(timeOff.type)}
                      </span>
                      <span className="font-medium">
                        {timeOff.staff ? timeOff.staff.name : 'Feriado Geral'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {format(new Date(timeOff.start_date), 'dd/MM/yyyy', { locale: ptBR })} - {' '}
                      {format(new Date(timeOff.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    {timeOff.reason && (
                      <div className="text-sm text-gray-500 mt-1">
                        {timeOff.reason}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(timeOff.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeOffManagement;
