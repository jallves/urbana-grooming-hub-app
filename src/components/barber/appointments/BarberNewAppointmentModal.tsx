
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, User, Scissors, CalendarDays, Clock, UserCheck, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAppointmentFormData } from '@/components/admin/appointments/form/useAppointmentFormData';
import { useAppointmentFormSubmit } from '@/components/admin/appointments/form/useAppointmentFormSubmit';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NotesField from '@/components/admin/appointments/form/NotesField';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedAppointmentValidation } from '@/hooks/useUnifiedAppointmentValidation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';

interface BarberNewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
}

type Step = 'auth' | 'client' | 'service' | 'datetime' | 'confirm';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'client', label: 'Cliente', icon: User },
  { key: 'service', label: 'Serviço', icon: Scissors },
  { key: 'datetime', label: 'Data & Hora', icon: CalendarDays },
  { key: 'confirm', label: 'Confirmar', icon: CheckCircle2 },
];

const BarberNewAppointmentModal: React.FC<BarberNewAppointmentModalProps> = ({
  isOpen,
  onClose,
  defaultDate = new Date(),
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('auth');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Time slots
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { getAvailableTimeSlots } = useUnifiedAppointmentValidation();

  const {
    form,
    isLoading: isFormLoading,
    services,
    staffMembers,
    clients,
    selectedService,
  } = useAppointmentFormData(undefined, defaultDate);

  const { handleSubmit, isLoading: isSubmitLoading } = useAppointmentFormSubmit({
    onClose: () => {
      resetModal();
      onClose();
    },
  });

  const isLoading = isFormLoading || isSubmitLoading;

  // Verify barber admin authorization
  useEffect(() => {
    if (!isOpen) return;
    
    const verifyAuth = async () => {
      setAuthChecking(true);
      try {
        if (!user?.email) {
          setIsAuthorized(false);
          return;
        }

        const { data } = await supabase
          .from('painel_barbeiros')
          .select('id, is_barber_admin, nome')
          .eq('email', user.email)
          .eq('ativo', true)
          .maybeSingle();

        if (data?.is_barber_admin) {
          setIsAuthorized(true);
          setCurrentStep('client');
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      } finally {
        setAuthChecking(false);
      }
    };

    verifyAuth();
  }, [isOpen, user?.email]);

  const resetModal = useCallback(() => {
    setCurrentStep('auth');
    setIsAuthorized(false);
    setAuthChecking(true);
    setClientSearch('');
    setServiceSearch('');
    setAvailableSlots([]);
  }, []);

  // Watch form values
  const selectedClientId = form.watch('client_id');
  const selectedServiceId = form.watch('service_id');
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');

  // Resolve client/service/staff names for confirmation
  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);
  const selectedServiceData = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);
  const selectedStaff = useMemo(() => staffMembers.find(s => s.id === selectedStaffId), [staffMembers, selectedStaffId]);

  // Load available time slots when date or staff changes
  useEffect(() => {
    if (currentStep !== 'datetime' || !selectedDate || !selectedStaffId || !selectedService) return;

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const slots = await getAvailableTimeSlots(
          selectedStaffId,
          selectedDate,
          selectedService.duration,
          { skipPastValidation: true }
        );
        setAvailableSlots(slots);

        // Clear time if no longer available
        const currentTime = form.getValues('time');
        if (currentTime && !slots.find(s => s.time === currentTime && s.available)) {
          form.setValue('time', '');
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [currentStep, selectedDate, selectedStaffId, selectedService, getAvailableTimeSlots, form]);

  // Filtered lists
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const search = clientSearch.toLowerCase().trim();
    return clients.filter(
      (c) => c.name?.toLowerCase().includes(search) || c.phone?.toLowerCase().includes(search) || c.email?.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    const search = serviceSearch.toLowerCase().trim();
    return services.filter((s) => s.name?.toLowerCase().includes(search));
  }, [services, serviceSearch]);

  // Step validation
  const canProceed = (step: Step): boolean => {
    switch (step) {
      case 'client': return !!selectedClientId;
      case 'service': return !!selectedServiceId;
      case 'datetime': return !!selectedDate && !!selectedTime && !!selectedStaffId;
      case 'confirm': return true;
      default: return false;
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].key);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].key);
    }
  };

  const onSubmit = async (data: any) => {
    await handleSubmit(data, selectedService);
  };

  // Auth check screen
  if (authChecking || !isAuthorized) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[420px] max-w-[95vw] mx-4 bg-urbana-black/95 backdrop-blur-xl border-urbana-gold/30 text-urbana-light">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            {authChecking ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-urbana-gold" />
                <p className="text-sm text-urbana-light/70">Verificando autorização...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-urbana-light">Acesso Negado</h3>
                <p className="text-sm text-urbana-light/60 text-center max-w-[280px]">
                  Somente barbeiros administradores podem criar novos agendamentos.
                </p>
                <Button onClick={onClose} variant="ghost" className="border border-urbana-gold/20 text-urbana-light hover:bg-transparent hover:text-urbana-gold">
                  Fechar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-4 bg-urbana-black/95 backdrop-blur-xl border-urbana-gold/30 text-urbana-light">
        <DialogHeader>
          <DialogTitle className="text-lg text-urbana-light flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            Novo Agendamento
          </DialogTitle>
          <p className="text-xs text-green-400/80 flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-3 w-3" />
            Barbeiro Admin autorizado
          </p>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-1 py-2">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = step.key === currentStep;
            const isCompleted = idx < currentStepIndex;
            return (
              <React.Fragment key={step.key}>
                <button
                  type="button"
                  onClick={() => idx <= currentStepIndex && setCurrentStep(step.key)}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-all',
                    isActive && 'scale-105',
                    idx > currentStepIndex && 'opacity-40 cursor-default',
                    idx <= currentStepIndex && 'cursor-pointer',
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                    isActive && 'border-urbana-gold bg-urbana-gold/20',
                    isCompleted && 'border-green-500 bg-green-500/20',
                    !isActive && !isCompleted && 'border-urbana-light/20 bg-transparent',
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <StepIcon className={cn('h-4 w-4', isActive ? 'text-urbana-gold' : 'text-urbana-light/40')} />
                    )}
                  </div>
                  <span className={cn('text-[10px] font-medium', isActive ? 'text-urbana-gold' : 'text-urbana-light/50')}>
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-1 rounded mt-[-14px]',
                    idx < currentStepIndex ? 'bg-green-500/50' : 'bg-urbana-light/10',
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* STEP 1: Client */}
            {currentStep === 'client' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-urbana-gold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Selecione o cliente
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-urbana-light/50" />
                  <Input
                    placeholder="Buscar por nome, telefone ou e-mail..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9 bg-urbana-black/60 border-urbana-gold/20 text-urbana-light placeholder:text-urbana-light/40"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1">
                        {filteredClients.length === 0 ? (
                          <div className="text-center py-6 text-urbana-light/40 text-sm">
                            Nenhum cliente encontrado
                          </div>
                        ) : (
                          filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => field.onChange(client.id)}
                              className={cn(
                                'w-full text-left p-3 rounded-lg border transition-all',
                                field.value === client.id
                                  ? 'border-urbana-gold bg-urbana-gold/10'
                                  : 'border-urbana-light/10 hover:border-urbana-gold/30 hover:bg-urbana-gold/5'
                              )}
                            >
                              <p className="text-sm font-medium text-urbana-light">{client.name}</p>
                              {(client.phone || client.email) && (
                                <p className="text-xs text-urbana-light/50 mt-0.5">
                                  {client.phone}{client.phone && client.email ? ' • ' : ''}{client.email}
                                </p>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* STEP 2: Service */}
            {currentStep === 'service' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-urbana-gold flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Selecione o serviço
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-urbana-light/50" />
                  <Input
                    placeholder="Buscar serviço..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="pl-9 bg-urbana-black/60 border-urbana-gold/20 text-urbana-light placeholder:text-urbana-light/40"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1">
                        {filteredServices.length === 0 ? (
                          <div className="text-center py-6 text-urbana-light/40 text-sm">
                            Nenhum serviço encontrado
                          </div>
                        ) : (
                          filteredServices.map((service) => (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => field.onChange(service.id)}
                              className={cn(
                                'w-full text-left p-3 rounded-lg border transition-all',
                                field.value === service.id
                                  ? 'border-urbana-gold bg-urbana-gold/10'
                                  : 'border-urbana-light/10 hover:border-urbana-gold/30 hover:bg-urbana-gold/5'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-urbana-light">{service.name}</p>
                                <span className="text-xs font-bold text-urbana-gold">R$ {service.price.toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-urbana-light/50 mt-0.5">
                                <Clock className="inline h-3 w-3 mr-1" />
                                {service.duration} min
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* STEP 3: Date, Staff & Time */}
            {currentStep === 'datetime' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-urbana-gold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Data, Profissional & Horário
                </h3>

                {/* Barber select */}
                <FormField
                  control={form.control}
                  name="staff_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-urbana-light text-xs">Profissional</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="bg-urbana-black/60 border-urbana-gold/20 text-urbana-light">
                            <SelectValue placeholder="Selecione o barbeiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-urbana-black border-urbana-gold/30">
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id} className="text-urbana-light hover:bg-urbana-gold/10">
                              <span className="flex items-center gap-2">
                                <UserCheck className="h-3.5 w-3.5 text-urbana-gold" />
                                {staff.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date picker */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-urbana-light text-xs">Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal bg-urbana-black/60 border-urbana-gold/20 text-urbana-light",
                                !field.value && "text-urbana-light/40"
                              )}
                            >
                              {field.value
                                ? format(field.value, "dd 'de' MMMM, yyyy", { locale: ptBR })
                                : 'Selecione a data'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-urbana-black border-urbana-gold/30" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time slot grid */}
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-urbana-light text-xs flex items-center gap-2">
                        Horários disponíveis
                        {selectedService && (
                          <span className="text-urbana-gold/70 font-normal">
                            ({selectedService.duration} min)
                          </span>
                        )}
                      </FormLabel>

                      {!selectedStaffId || !selectedDate ? (
                        <div className="text-center py-4 text-urbana-light/40 text-xs border border-dashed border-urbana-light/10 rounded-lg">
                          Selecione o profissional e a data primeiro
                        </div>
                      ) : loadingSlots ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-urbana-light/50">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs">Buscando horários...</span>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-4 text-red-400/70 text-xs border border-dashed border-red-400/20 rounded-lg">
                          <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                          Nenhum horário disponível nesta data
                        </div>
                      ) : (
                        <>
                          {/* Legend */}
                          <div className="flex items-center gap-3 text-[10px] text-urbana-light/50 mb-2">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded bg-green-500/30 border border-green-500/50" /> Disponível
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/30" /> Ocupado
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded bg-urbana-gold border border-urbana-gold" /> Selecionado
                            </span>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => slot.available && field.onChange(slot.time)}
                                className={cn(
                                  'py-2 px-1 rounded-md text-xs font-medium transition-all border',
                                  slot.available && field.value !== slot.time &&
                                    'bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50',
                                  !slot.available &&
                                    'bg-red-500/10 border-red-500/20 text-red-400/50 cursor-not-allowed line-through',
                                  field.value === slot.time &&
                                    'bg-urbana-gold/20 border-urbana-gold text-urbana-gold font-bold ring-1 ring-urbana-gold/50',
                                )}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* STEP 4: Confirmation */}
            {currentStep === 'confirm' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-urbana-gold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirme o agendamento
                </h3>

                <div className="rounded-xl border border-urbana-gold/20 bg-urbana-gold/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-urbana-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-urbana-light/50 uppercase tracking-wider">Cliente</p>
                      <p className="text-sm font-medium text-urbana-light">{selectedClient?.name || '—'}</p>
                      {selectedClient?.phone && <p className="text-xs text-urbana-light/50">{selectedClient.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Scissors className="h-4 w-4 text-urbana-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-urbana-light/50 uppercase tracking-wider">Serviço</p>
                      <p className="text-sm font-medium text-urbana-light">{selectedServiceData?.name || '—'}</p>
                      <p className="text-xs text-urbana-light/50">
                        R$ {selectedServiceData?.price.toFixed(2)} • {selectedServiceData?.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserCheck className="h-4 w-4 text-urbana-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-urbana-light/50 uppercase tracking-wider">Profissional</p>
                      <p className="text-sm font-medium text-urbana-light">{selectedStaff?.name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 text-urbana-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-urbana-light/50 uppercase tracking-wider">Data & Horário</p>
                      <p className="text-sm font-medium text-urbana-light">
                        {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : '—'}
                        {selectedTime ? ` às ${selectedTime}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="[&_label]:text-urbana-light [&_textarea]:bg-urbana-black/60 [&_textarea]:border-urbana-gold/20 [&_textarea]:text-urbana-light [&_textarea]:placeholder-urbana-light/40">
                  <NotesField form={form} />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-urbana-light/10">
              {currentStepIndex > 0 ? (
                <Button type="button" variant="ghost" size="sm" onClick={goBack} className="border border-urbana-gold/20 text-urbana-light hover:bg-transparent hover:text-urbana-gold">
                  Voltar
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="border border-urbana-gold/20 text-urbana-light hover:bg-transparent hover:text-urbana-gold">
                  Cancelar
                </Button>
              )}

              {currentStep === 'confirm' ? (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  className="bg-urbana-gold text-urbana-black hover:bg-urbana-gold hover:opacity-90 font-semibold px-6"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Salvando...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar Agendamento</>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={!canProceed(currentStep)}
                  onClick={goNext}
                  className="bg-urbana-gold text-urbana-black hover:bg-urbana-gold hover:opacity-90 font-semibold"
                >
                  Próximo
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BarberNewAppointmentModal;
