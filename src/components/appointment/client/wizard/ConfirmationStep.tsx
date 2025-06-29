
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Calendar, Clock, User, Scissors, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from '@/types/appointment';

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

interface ConfirmationStepProps {
  bookingData: BookingData;
  clientName: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  bookingData,
  clientName,
  onNotesChange,
  onConfirm,
  isLoading
}) => {
  const { service, barber, date, time, notes } = bookingData;

  if (!service || !barber || !date || !time) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-4">
          <CheckCircle className="h-12 w-12 mx-auto mb-2" />
          <p>Dados incompletos para confirmação</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-white">
          Confirme seu agendamento
        </h3>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        {/* Cliente */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Cliente</p>
            <p className="text-white font-semibold">{clientName}</p>
          </div>
        </div>

        {/* Serviço */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400">Serviço</p>
            <p className="text-white font-semibold">{service.name}</p>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-amber-500">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">R$ {service.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{service.duration} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barbeiro */}
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={barber.image_url} alt={barber.name} />
            <AvatarFallback className="bg-green-500 text-white font-semibold">
              {barber.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm text-gray-400">Barbeiro</p>
            <p className="text-white font-semibold">{barber.name}</p>
            {barber.specialties && (
              <p className="text-sm text-gray-400">{barber.specialties}</p>
            )}
          </div>
        </div>

        {/* Data e Hora */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
            <Calendar className="h-6 w-6 text-black" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Data e Horário</p>
            <p className="text-white font-semibold">
              {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-amber-500 font-semibold">{time}</p>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-300">
            Observações (opcional)
          </label>
        </div>
        <Textarea
          placeholder="Adicione observações sobre seu agendamento..."
          value={notes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
          maxLength={500}
        />
        <p className="text-xs text-gray-500">
          {(notes || '').length}/500 caracteres
        </p>
      </div>

      {/* Resumo do Valor */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Total do Serviço:</span>
          <span className="text-amber-500 font-bold text-lg">
            R$ {service.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botão de Confirmação */}
      <Button
        onClick={onConfirm}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Confirmando agendamento...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Confirmar Agendamento
          </div>
        )}
      </Button>

      <p className="text-sm text-gray-400 text-center">
        Você receberá uma confirmação por WhatsApp após o agendamento.
      </p>
    </div>
  );
};

export default ConfirmationStep;
