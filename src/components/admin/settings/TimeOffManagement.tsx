
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimeOff {
  id: string;
  staff_id: string | null;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  created_at: string;
  staff?: {
    name: string;
  };
}

interface StaffMember {
  id: string;
  name: string;
}

const TimeOffManagement: React.FC = () => {
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTimeOff, setEditingTimeOff] = useState<TimeOff | null>(null);
  
  // Form fields
  const [staffId, setStaffId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [type, setType] = useState<string>('vacation');

  useEffect(() => {
    fetchTimeOffs();
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchTimeOffs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_off')
        .select(`
          *,
          staff:staff_id(name)
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTimeOffs(data || []);
    } catch (error) {
      console.error('Error fetching time offs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as folgas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !reason) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const timeOffData = {
        staff_id: (staffId && staffId !== 'all') ? staffId : null,
        start_date: startDate,
        end_date: endDate,
        reason,
        type
      };

      if (editingTimeOff) {
        const { error } = await supabase
          .from('time_off')
          .update(timeOffData)
          .eq('id', editingTimeOff.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Folga atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('time_off')
          .insert([timeOffData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Folga cadastrada com sucesso!",
        });
      }

      resetForm();
      fetchTimeOffs();
    } catch (error) {
      console.error('Error saving time off:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a folga.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (timeOff: TimeOff) => {
    setEditingTimeOff(timeOff);
    setStaffId(timeOff.staff_id || 'all');
    setStartDate(timeOff.start_date);
    setEndDate(timeOff.end_date);
    setReason(timeOff.reason);
    setType(timeOff.type);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta folga?')) return;

    try {
      const { error } = await supabase
        .from('time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Folga excluída com sucesso!",
      });

      fetchTimeOffs();
    } catch (error) {
      console.error('Error deleting time off:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a folga.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setStaffId('all');
    setStartDate('');
    setEndDate('');
    setReason('');
    setType('vacation');
    setEditingTimeOff(null);
    setIsFormOpen(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Férias';
      case 'sick': return 'Atestado Médico';
      case 'personal': return 'Pessoal';
      case 'holiday': return 'Feriado';
      default: return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'vacation': return 'default';
      case 'sick': return 'destructive';
      case 'personal': return 'secondary';
      case 'holiday': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-playfair">Gerenciamento de Folgas</h2>
          <p className="text-gray-700 font-raleway text-sm">
            Gerencie folgas, férias e feriados da equipe
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 w-full sm:w-auto touch-manipulation"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Folga
        </Button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-gray-900 font-playfair">
              {editingTimeOff ? 'Editar Folga' : 'Nova Folga'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff">Profissional</Label>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional (ou deixe em branco para todos)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os profissionais</SelectItem>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Férias</SelectItem>
                      <SelectItem value="sick">Atestado Médico</SelectItem>
                      <SelectItem value="personal">Pessoal</SelectItem>
                      <SelectItem value="holiday">Feriado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Motivo</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva o motivo da folga..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTimeOff ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Time Off List */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-gray-900 font-playfair">Folgas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold mx-auto"></div>
            </div>
          ) : timeOffs.length === 0 ? (
            <div className="text-center py-8 text-gray-600 font-raleway">
              Nenhuma folga cadastrada.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-gray-900 font-playfair font-semibold text-sm">Profissional</th>
                    <th className="text-left p-3 text-gray-900 font-playfair font-semibold text-sm">Tipo</th>
                    <th className="text-left p-3 text-gray-900 font-playfair font-semibold text-sm">Data Inicial</th>
                    <th className="text-left p-3 text-gray-900 font-playfair font-semibold text-sm">Data Final</th>
                    <th className="text-left p-3 text-gray-900 font-playfair font-semibold text-sm">Motivo</th>
                    <th className="text-left p-3 text-gray-900 font-playfair font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {timeOffs.map((timeOff) => (
                    <tr key={timeOff.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-900 font-raleway text-sm">
                        {timeOff.staff?.name || 'Todos os profissionais'}
                      </td>
                      <td className="p-3">
                        <Badge variant={getTypeBadgeVariant(timeOff.type)} className="font-raleway">
                          {getTypeLabel(timeOff.type)}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-900 font-raleway text-sm">
                        {format(new Date(timeOff.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="p-3 text-gray-900 font-raleway text-sm">
                        {format(new Date(timeOff.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="p-3 max-w-xs truncate text-gray-700 font-raleway text-sm">
                        {timeOff.reason}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(timeOff)}
                            className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold hover:text-white touch-manipulation"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(timeOff.id)}
                            className="touch-manipulation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeOffManagement;
