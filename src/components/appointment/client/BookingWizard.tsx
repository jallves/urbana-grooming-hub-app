
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowLeft, ArrowRight, Calendar, Clock, User, Scissors } from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';
import { useClientFormData } from './hooks/useClientFormData';
import ServiceSelectionStep from './wizard/ServiceSelectionStep';
import BarberSelectionStep from './wizard/BarberSelectionStep';
import TimeSelectionStep from './wizard/TimeSelectionStep';
import ConfirmationStep from './wizard/ConfirmationStep';

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  image_url: string;
  specialties: string;
  experience: string;
  role: string;
  is_active: boolean;
}

interface BookingData {
  service?: Service;
  barber?: Barber;
  date?: Date;
  time?: string;
  notes?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
}

const steps = [
  { id: 1, title: 'Serviço', icon: Scissors, description: 'Escolha o serviço desejado' },
  { id: 2, title: 'Barbeiro', icon: User, description: 'Selecione seu barbeiro' },
  { id: 3, title: 'Horário', icon: Clock, description: 'Escolha data e hora' },
  { id: 4, title: 'Confirmação', icon: CheckCircle, description: 'Confirme seu agendamento' }
];

export const BookingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const { services, barbers, loading } = useClientFormData();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
    }
  }, [client, navigate]);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!bookingData.service;
      case 2: return !!bookingData.barber;
      case 3: return !!bookingData.date && !!bookingData.time;
      case 4: return true;
      default: return false;
    }
  };

  const handleConfirmBooking = async () => {
    if (!client || !bookingData.service || !bookingData.barber || !bookingData.date || !bookingData.time) {
      toast({
        title: "Erro",
        description: "Dados incompletos para o agendamento.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const [hours, minutes] = bookingData.time.split(':').map(Number);
      const startTime = new Date(bookingData.date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + bookingData.service.duration);

      // Validar agendamento
      const { data: validationData, error: validationError } = await supabase.rpc(
        'validate_appointment_booking',
        {
          p_client_id: client.id,
          p_staff_id: bookingData.barber.id,
          p_service_id: bookingData.service.id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString()
        }
      );

      if (validationError) {
        throw new Error(validationError.message);
      }

      // Type assertion for the RPC response - first to unknown, then to ValidationResult
      const validation = validationData as unknown as ValidationResult;
      
      if (!validation.valid) {
        throw new Error(validation.error || 'Erro na validação do agendamento');
      }

      // Criar agendamento
      const { error: insertError } = await supabase
        .from('appointments')
        .insert([{
          client_id: client.id,
          service_id: bookingData.service.id,
          staff_id: bookingData.barber.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled',
          notes: bookingData.notes || null,
        }]);

      if (insertError) throw insertError;

      // Enviar confirmação por WhatsApp
      try {
        await supabase.functions.invoke('send-whatsapp-confirmation', {
          body: {
            clientName: client.name,
            clientPhone: client.phone,
            serviceName: bookingData.service.name,
            staffName: bookingData.barber.name,
            appointmentDate: bookingData.date.toLocaleDateString('pt-BR'),
            appointmentTime: bookingData.time,
            servicePrice: bookingData.service.price.toFixed(2),
            serviceDuration: bookingData.service.duration.toString()
          }
        });
      } catch (whatsappError) {
        console.warn('Erro ao enviar WhatsApp:', whatsappError);
      }

      toast({
        title: "Agendamento confirmado!",
        description: "Seu agendamento foi criado com sucesso. Você receberá uma confirmação por WhatsApp.",
      });

      navigate('/cliente/dashboard');
    } catch (error: any) {
      console.error('Erro ao confirmar agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ServiceSelectionStep
            selectedService={bookingData.service}
            onServiceSelect={(service) => updateBookingData({ service })}
            services={services}
            loading={loading}
          />
        );
      case 2:
        return (
          <BarberSelectionStep
            selectedBarber={bookingData.barber}
            onBarberSelect={(barber) => updateBookingData({ barber })}
            selectedService={bookingData.service}
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            barbers={barbers}
            loading={loading}
          />
        );
      case 3:
        return (
          <TimeSelectionStep
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            onDateSelect={(date) => updateBookingData({ date, time: undefined })}
            onTimeSelect={(time) => updateBookingData({ time })}
            selectedBarber={bookingData.barber}
            selectedService={bookingData.service}
          />
        );
      case 4:
        return (
          <ConfirmationStep
            bookingData={bookingData}
            clientName={client?.name || ''}
            onNotesChange={(notes) => updateBookingData({ notes })}
            onConfirm={handleConfirmBooking}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  if (!client) return null;

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            variant="outline"
            className="mr-4 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white font-clash">
              Novo Agendamento
            </h1>
            <p className="text-gray-400 font-inter">
              Siga os passos para agendar seu horário
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                    ${isCompleted 
                      ? 'bg-green-600 text-white' 
                      : isActive 
                        ? 'bg-amber-500 text-black' 
                        : 'bg-gray-700 text-gray-400'
                    }
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className={`font-medium ${isActive ? 'text-amber-500' : isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 max-w-20">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>

        {/* Content */}
        <Card className="bg-gray-900 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">
              Passo {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50"
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirmBooking}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Confirmando...' : 'Confirmar Agendamento'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
