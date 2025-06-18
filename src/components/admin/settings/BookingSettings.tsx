
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Calendar, Save } from 'lucide-react';

interface BusinessHours {
  monday: { start: string; end: string; closed?: boolean };
  tuesday: { start: string; end: string; closed?: boolean };
  wednesday: { start: string; end: string; closed?: boolean };
  thursday: { start: string; end: string; closed?: boolean };
  friday: { start: string; end: string; closed?: boolean };
  saturday: { start: string; end: string; closed?: boolean };
  sunday: { start: string; end: string; closed?: boolean };
}

const BookingSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { start: '09:00', end: '18:00' },
    tuesday: { start: '09:00', end: '18:00' },
    wednesday: { start: '09:00', end: '18:00' },
    thursday: { start: '09:00', end: '18:00' },
    friday: { start: '09:00', end: '18:00' },
    saturday: { start: '08:00', end: '17:00' },
    sunday: { closed: true, start: '09:00', end: '17:00' }
  });

  const [settings, setSettings] = useState({
    appointmentInterval: '30',
    advanceBookingDays: '30',
    cancellationHours: '24',
    maxAppointmentsPerDay: '10'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      data?.forEach(({ setting_key, setting_value }) => {
        if (setting_key === 'business_hours') {
          // Safe type conversion with proper checking
          const hours = setting_value as unknown;
          if (hours && typeof hours === 'object') {
            setBusinessHours(hours as BusinessHours);
          }
        } else if (setting_key === 'appointment_interval') {
          setSettings(prev => ({ ...prev, appointmentInterval: setting_value as string }));
        } else if (setting_key === 'advance_booking_days') {
          setSettings(prev => ({ ...prev, advanceBookingDays: setting_value as string }));
        } else if (setting_key === 'cancellation_hours') {
          setSettings(prev => ({ ...prev, cancellationHours: setting_value as string }));
        } else if (setting_key === 'max_appointments_per_day') {
          setSettings(prev => ({ ...prev, maxAppointmentsPerDay: setting_value as string }));
        }
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive'
      });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Salvar horários de funcionamento - convert to JSON-compatible format
      await supabase
        .from('booking_settings')
        .upsert({
          setting_key: 'business_hours',
          setting_value: businessHours as unknown as any
        });

      // Salvar outras configurações
      const settingsToSave = [
        { key: 'appointment_interval', value: settings.appointmentInterval },
        { key: 'advance_booking_days', value: settings.advanceBookingDays },
        { key: 'cancellation_hours', value: settings.cancellationHours },
        { key: 'max_appointments_per_day', value: settings.maxAppointmentsPerDay }
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from('booking_settings')
          .upsert({
            setting_key: setting.key,
            setting_value: setting.value as unknown as any
          });
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações de Agendamento</h2>
        <p className="text-gray-600">Configure os horários de funcionamento e regras de agendamento</p>
      </div>

      {/* Horários de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de Funcionamento
          </CardTitle>
          <CardDescription>
            Defina os horários de funcionamento para cada dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {weekDays.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-32">
                <Label className="font-medium">{label}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={!businessHours[key as keyof BusinessHours].closed}
                  onCheckedChange={(checked) => {
                    setBusinessHours(prev => ({
                      ...prev,
                      [key]: {
                        ...prev[key as keyof BusinessHours],
                        closed: !checked
                      }
                    }));
                  }}
                />
                <span className="text-sm text-gray-600">
                  {businessHours[key as keyof BusinessHours].closed ? 'Fechado' : 'Aberto'}
                </span>
              </div>

              {!businessHours[key as keyof BusinessHours].closed && (
                <>
                  <div className="flex items-center gap-2">
                    <Label>Das:</Label>
                    <Input
                      type="time"
                      value={businessHours[key as keyof BusinessHours].start}
                      onChange={(e) => {
                        setBusinessHours(prev => ({
                          ...prev,
                          [key]: {
                            ...prev[key as keyof BusinessHours],
                            start: e.target.value
                          }
                        }));
                      }}
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label>Às:</Label>
                    <Input
                      type="time"
                      value={businessHours[key as keyof BusinessHours].end}
                      onChange={(e) => {
                        setBusinessHours(prev => ({
                          ...prev,
                          [key]: {
                            ...prev[key as keyof BusinessHours],
                            end: e.target.value
                          }
                        }));
                      }}
                      className="w-32"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurações de Agendamento
          </CardTitle>
          <CardDescription>
            Configure as regras para agendamentos online
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo entre Agendamentos (minutos)</Label>
            <Input
              id="interval"
              type="number"
              value={settings.appointmentInterval}
              onChange={(e) => setSettings(prev => ({ ...prev, appointmentInterval: e.target.value }))}
              min="15"
              max="120"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance">Agendamento Antecipado (dias)</Label>
            <Input
              id="advance"
              type="number"
              value={settings.advanceBookingDays}
              onChange={(e) => setSettings(prev => ({ ...prev, advanceBookingDays: e.target.value }))}
              min="1"
              max="90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation">Cancelamento Mínimo (horas)</Label>
            <Input
              id="cancellation"
              type="number"
              value={settings.cancellationHours}
              onChange={(e) => setSettings(prev => ({ ...prev, cancellationHours: e.target.value }))}
              min="1"
              max="72"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDaily">Máximo Agendamentos/Dia</Label>
            <Input
              id="maxDaily"
              type="number"
              value={settings.maxAppointmentsPerDay}
              onChange={(e) => setSettings(prev => ({ ...prev, maxAppointmentsPerDay: e.target.value }))}
              min="1"
              max="50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default BookingSettings;
