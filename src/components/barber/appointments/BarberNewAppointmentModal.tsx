
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { useAppointmentFormData } from '@/components/admin/appointments/form/useAppointmentFormData';
import { useAppointmentFormSubmit } from '@/components/admin/appointments/form/useAppointmentFormSubmit';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateTimePicker from '@/components/admin/appointments/form/DateTimePicker';
import NotesField from '@/components/admin/appointments/form/NotesField';
import StaffSelect from '@/components/admin/appointments/form/StaffSelect';

interface BarberNewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

const BarberNewAppointmentModal: React.FC<BarberNewAppointmentModalProps> = ({
  isOpen,
  onClose,
  defaultDate = new Date(),
}) => {
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const {
    form,
    isLoading: isFormLoading,
    services,
    staffMembers,
    clients,
    selectedService,
  } = useAppointmentFormData(undefined, defaultDate);

  const { handleSubmit, isLoading: isSubmitLoading } = useAppointmentFormSubmit({
    onClose,
  });

  const isLoading = isFormLoading || isSubmitLoading;

  const onSubmit = async (data: any) => {
    await handleSubmit(data, selectedService);
  };

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const search = clientSearch.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(search) ||
        c.phone?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  // Filter services by search
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    const search = serviceSearch.toLowerCase().trim();
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(search)
    );
  }, [services, serviceSearch]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-4 bg-urbana-black/95 backdrop-blur-xl border-urbana-gold/30 text-urbana-light">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl text-urbana-light flex items-center gap-2">
            <Plus className="h-5 w-5 text-urbana-gold" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client Select with Search */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-urbana-light">Cliente</FormLabel>
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-urbana-light/50" />
                    <Input
                      placeholder="Buscar cliente por nome, telefone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-urbana-black/60 border-urbana-gold/20 text-urbana-light placeholder:text-urbana-light/40"
                    />
                  </div>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className="bg-urbana-black/60 border-urbana-gold/20 text-urbana-light">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-urbana-black border-urbana-gold/30 max-h-[200px]">
                      {filteredClients.length === 0 ? (
                        <div className="p-2 text-sm text-urbana-light/50 text-center">
                          Nenhum cliente encontrado
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id || 'no-id'}
                            className="text-urbana-light hover:bg-urbana-gold/10"
                          >
                            {client.name} {client.phone ? `- ${client.phone}` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Select with Search */}
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-urbana-light">Serviço</FormLabel>
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-urbana-light/50" />
                    <Input
                      placeholder="Buscar serviço..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-urbana-black/60 border-urbana-gold/20 text-urbana-light placeholder:text-urbana-light/40"
                    />
                  </div>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className="bg-urbana-black/60 border-urbana-gold/20 text-urbana-light">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-urbana-black border-urbana-gold/30 max-h-[200px]">
                      {filteredServices.length === 0 ? (
                        <div className="p-2 text-sm text-urbana-light/50 text-center">
                          Nenhum serviço encontrado
                        </div>
                      ) : (
                        filteredServices.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id || 'no-id'}
                            className="text-urbana-light hover:bg-urbana-gold/10"
                          >
                            {service.name} - R$ {service.price} ({service.duration} min)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date & Time - reuse existing but with dark theme override */}
            <div className="[&_label]:text-urbana-light [&_button]:bg-urbana-black/60 [&_button]:border-urbana-gold/20 [&_button]:text-urbana-light [&_.text-black]:text-urbana-light [&_select]:bg-urbana-black/60">
              <DateTimePicker
                form={form}
                barberId={selectedStaffId}
                serviceDuration={selectedService?.duration}
                skipPastValidation={true}
              />
            </div>

            {/* Staff Select - reuse existing with dark theme override */}
            <div className="[&_label]:text-urbana-light [&_button]:bg-urbana-black/60 [&_button]:border-urbana-gold/20 [&_button]:text-urbana-light [&_.text-black]:text-urbana-light">
              <StaffSelect
                staffMembers={staffMembers}
                form={form}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                serviceDuration={selectedService?.duration}
              />
            </div>

            {/* Notes - reuse with dark theme override */}
            <div className="[&_label]:text-urbana-light [&_textarea]:bg-urbana-black/60 [&_textarea]:border-urbana-gold/20 [&_textarea]:text-urbana-light [&_.text-black]:text-urbana-light [&_textarea]:placeholder-urbana-light/40">
              <NotesField form={form} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-urbana-gold text-white hover:bg-urbana-gold/90 font-semibold"
              >
                {isLoading ? 'Salvando...' : 'Agendar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BarberNewAppointmentModal;
