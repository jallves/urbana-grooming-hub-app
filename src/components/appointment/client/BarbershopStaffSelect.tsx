
import React from 'react';
import { Staff } from '@/types/barber';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Clock } from 'lucide-react';

interface BarbershopStaffSelectProps {
  staffMembers: Staff[];
  form: UseFormReturn<any>;
  barberAvailability?: { id: string; name: string; available: boolean }[];
  isCheckingAvailability?: boolean;
}

const BarbershopStaffSelect: React.FC<BarbershopStaffSelectProps> = ({
  staffMembers,
  form,
  barberAvailability = [],
  isCheckingAvailability = false
}) => {
  const selectedStaffId = form.watch('staff_id');

  if (staffMembers.length === 0) {
    return (
      <FormField
        control={form.control}
        name="staff_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Escolha seu Barbeiro</FormLabel>
            <div className="p-6 bg-stone-700 border border-stone-600 rounded-lg text-stone-400 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Carregando barbeiros...</p>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  const shouldShowAvailability = barberAvailability.length > 0;

  return (
    <FormField
      control={form.control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Escolha seu Barbeiro
            {isCheckingAvailability && (
              <Badge variant="secondary" className="ml-2">
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                Verificando disponibilidade...
              </Badge>
            )}
          </FormLabel>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {staffMembers.map((staff) => {
              const isSelected = field.value === staff.id;
              const availability = barberAvailability.find(b => b.id === staff.id);
              const isAvailable = !shouldShowAvailability || availability?.available !== false;

              return (
                <Card
                  key={staff.id}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? 'ring-2 ring-amber-500 bg-stone-700 border-amber-500' 
                      : 'bg-stone-800 border-stone-600 hover:border-stone-500'
                  } ${!isAvailable ? 'opacity-50' : ''}`}
                  onClick={() => {
                    if (isAvailable) {
                      field.onChange(staff.id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar/Foto do barbeiro */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                          {staff.image_url ? (
                            <img 
                              src={staff.image_url} 
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            staff.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle className="absolute -top-1 -right-1 h-6 w-6 text-amber-500 bg-stone-800 rounded-full" />
                        )}
                      </div>

                      {/* Informações do barbeiro */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{staff.name}</h3>
                        
                        {staff.specialties && (
                          <p className="text-sm text-stone-300 mt-1 line-clamp-2">
                            {staff.specialties}
                          </p>
                        )}
                        
                        {staff.experience && (
                          <p className="text-xs text-stone-400 mt-1">
                            {staff.experience}
                          </p>
                        )}

                        {/* Status de disponibilidade */}
                        <div className="flex items-center gap-2 mt-2">
                          {shouldShowAvailability && (
                            <Badge 
                              variant={isAvailable ? "default" : "destructive"}
                              className={isAvailable ? "bg-green-600" : "bg-red-600"}
                            >
                              {isAvailable ? "Disponível" : "Indisponível"}
                            </Badge>
                          )}
                          
                          {isSelected && (
                            <Badge variant="outline" className="border-amber-500 text-amber-500">
                              Selecionado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {shouldShowAvailability && staffMembers.every(staff => 
            barberAvailability.find(b => b.id === staff.id)?.available === false
          ) && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-red-400 text-center">
                ❌ Nenhum barbeiro disponível para este horário. 
                Tente selecionar outro horário.
              </p>
            </div>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BarbershopStaffSelect;
