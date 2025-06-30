
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Settings, Calendar, CheckCircle } from 'lucide-react';
import BarberScheduleManager from '@/components/barber/schedule/BarberScheduleManager';
import BarberAvailabilityManager from './BarberAvailabilityManager';

interface Staff {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

const BarberScheduleManagement: React.FC = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingDefault, setApplyingDefault] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStaff(data || []);
      
      // Auto-select first staff member if available
      if (data && data.length > 0) {
        setSelectedStaffId(data[0].id);
        setSelectedStaff(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar staff:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de profissionais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelect = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    setSelectedStaffId(staffId);
    setSelectedStaff(staffMember || null);
  };

  const setupDefaultScheduleForAll = async () => {
    setApplyingDefault(true);
    try {
      console.log('Aplicando horário padrão para todos os profissionais...');
      
      const defaultSchedule = [
        { day_of_week: 1, start_time: '09:00', end_time: '20:00', is_active: true }, // Segunda
        { day_of_week: 2, start_time: '09:00', end_time: '20:00', is_active: true }, // Terça
        { day_of_week: 3, start_time: '09:00', end_time: '20:00', is_active: true }, // Quarta
        { day_of_week: 4, start_time: '09:00', end_time: '20:00', is_active: true }, // Quinta
        { day_of_week: 5, start_time: '09:00', end_time: '20:00', is_active: true }, // Sexta
        { day_of_week: 6, start_time: '09:00', end_time: '20:00', is_active: true }, // Sábado
        // Domingo (0) não é incluído, ficando fechado
      ];

      for (const staffMember of staff) {
        console.log(`Configurando horários para ${staffMember.name}...`);
        
        // Deletar horários existentes do profissional
        await supabase
          .from('working_hours')
          .delete()
          .eq('staff_id', staffMember.id);

        // Inserir novos horários padrão
        const workingHours = defaultSchedule.map(schedule => ({
          staff_id: staffMember.id,
          ...schedule
        }));

        const { error } = await supabase
          .from('working_hours')
          .insert(workingHours);

        if (error) {
          console.error(`Erro ao configurar horários para ${staffMember.name}:`, error);
          throw error;
        }
        
        console.log(`✓ Horários configurados para ${staffMember.name}`);
      }
      
      toast({
        title: "Sucesso",
        description: `Horário padrão aplicado para ${staff.length} profissional(is): Segunda a Sábado (09:00-20:00), Domingo fechado.`,
        action: <CheckCircle className="h-4 w-4 text-green-500" />
      });
    } catch (error) {
      console.error('Erro ao configurar horários padrão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível configurar os horários padrão para todos os profissionais.",
        variant: "destructive",
      });
    } finally {
      setApplyingDefault(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando profissionais...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-urbana-gold" />
            Gerenciamento de Horários dos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Horário Padrão Configurado</p>
                <p>
                  <strong>Segunda a Sábado:</strong> 09:00 às 20:00<br />
                  <strong>Domingo:</strong> Fechado
                </p>
                <p className="mt-2 text-xs">
                  Este horário será aplicado automaticamente para novos profissionais e pode ser ajustado individualmente conforme necessário.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Selecionar Profissional:
              </label>
              <Select value={selectedStaffId} onValueChange={handleStaffSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {staffMember.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={setupDefaultScheduleForAll}
                disabled={applyingDefault}
                className="bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black"
              >
                <Settings className="mr-2 h-4 w-4" />
                {applyingDefault ? 'Aplicando...' : 'Aplicar Padrão para Todos'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStaff && (
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários Padrão
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Disponibilidade Específica
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="mt-6">
            <BarberScheduleManager 
              barberId={selectedStaffId} 
              barberName={selectedStaff.name}
            />
          </TabsContent>
          
          <TabsContent value="availability" className="mt-6">
            <BarberAvailabilityManager
              barberId={selectedStaffId}
              barberName={selectedStaff.name}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default BarberScheduleManagement;
