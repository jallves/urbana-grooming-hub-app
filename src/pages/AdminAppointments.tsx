import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';

interface AppointmentFormProps {
  mode: 'admin' | 'client';
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultValues?: any;
}

export default function AppointmentForm({
  mode,
  isOpen,
  onClose,
  defaultDate,
  defaultValues
}: AppointmentFormProps) {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    service_id: '',
    barber_id: '',
    date: defaultDate?.toISOString().split('T')[0] || '',
    time: '',
    status: 'agendado',
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: barbersData } = await supabase.from('barbers').select('*').eq('active', true);
      const { data: servicesData } = await supabase.from('services').select('*').eq('active', true);
      setBarbers(barbersData || []);
      setServices(servicesData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (defaultValues) {
      setForm((prev) => ({
        ...prev,
        ...defaultValues,
      }));
    }
  }, [defaultValues]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const { client_name, service_id, barber_id, date, time, status } = form;

    // validação básica
    if (!service_id || !barber_id || !date || !time || (mode === 'admin' && !client_name)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const start_time = `${date}T${time}`;

    setLoading(true);

    const payload = {
      client_name: mode === 'admin' ? client_name : null, // pode ser preenchido automaticamente no back-end
      service_id,
      barber_id,
      start_time,
      status: mode === 'admin' ? status : 'agendado',
    };

    const { error } = await supabase.from('appointments').insert(payload);

    if (error) {
      toast.error('Erro ao salvar agendamento');
      console.error(error);
    } else {
      toast.success('Agendamento criado com sucesso');
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        {defaultValues ? 'Editar Agendamento' : 'Novo Agendamento'}
      </h2>

      {mode === 'admin' && (
        <div className="mb-4">
          <label className="block text-sm font-medium">Nome do Cliente</label>
          <Input
            value={form.client_name}
            onChange={(e) => handleChange('client_name', e.target.value)}
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium">Serviço</label>
        <Select
          value={form.service_id}
          onValueChange={(val) => handleChange('service_id', val)}
        >
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Barbeiro</label>
        <Select
          value={form.barber_id}
          onValueChange={(val) => handleChange('barber_id', val)}
        >
          {barbers.map((barber) => (
            <SelectItem key={barber.id} value={barber.id}>
              {barber.name}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Data</label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium">Horário</label>
        <Input
          type="time"
          value={form.time}
          onChange={(e) => handleChange('time', e.target.value)}
        />
      </div>

      {mode === 'admin' && (
        <div className="mb-4">
          <label className="block text-sm font-medium">Status</label>
          <Select
            value={form.status}
            onValueChange={(val) => handleChange('status', val)}
          >
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
