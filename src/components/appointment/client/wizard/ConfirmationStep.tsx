
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Calendar, Clock, User, Scissors, DollarSign, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service } from '@/types/appointment';

interface Barber {
  id: string;
  name: string;
  image_url: string;
  specialties: string;
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
  const [notes, setNotes] = useState(bookingData.notes || '');

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(value);
  };

  if (!bookingData.service || !bookingData.barber || !bookingData.date || !bookingData.time) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Dados incompletos para confirmação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">
          Confirme seu agendamento
        </h3>
      </div>

      {/* Resumo do Agendamento */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            Resumo do Agendamento
          </h4>

          <div className="space-y-4">
            {/* Cliente */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Cliente</p>
                <p className="text-white font-medium">{clientName}</p>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Serviço */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">Serviço</p>
                <p className="text-white font-medium">{bookingData.service.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{bookingData.service.duration} minutos</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    R$ {bookingData.service.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Barbeiro */}
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={bookingData.barber.image_url} alt={bookingData.barber.name} />
                <AvatarFallback className="bg-green-500 text-white">
                  {bookingData.barber.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-gray-400">Barbeiro</p>
                <p className="text-white font-medium">{bookingData.barber.name}</p>
                {bookingData.barber.specialties && (
                  <p className="text-sm text-gray-500">{bookingData.barber.specialties}</p>
                )}
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Data e Hora */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Data e Horário</p>
                <p className="text-white font-medium">
                  {format(bookingData.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-amber-500 font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {bookingData.time}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            <h4 className="text-lg font-semibold text-white">
              Observações (Opcional)
            </h4>
          </div>
          
          <Textarea
            placeholder="Adicione alguma observação sobre seu agendamento..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Botão de Confirmação */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-green-500/10 border-amber-500/20">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-white mb-2">
            Tudo pronto para confirmar!
          </h4>
          <p className="text-gray-400 mb-6">
            Você receberá uma confirmação por WhatsApp após finalizar o agendamento.
          </p>
          
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirmar Agendamento
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationStep;
