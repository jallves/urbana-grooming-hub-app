
import React from "react";
import { User } from "lucide-react";
import { BarberSelectionField } from "./BarberSelectionField";
import { BarberDebugInfo } from "./BarberDebugInfo";

interface Props {
  control: any; // react-hook-form control
  barbers: any[];
  barberAvailability: any;
  isCheckingAvailability: boolean;
  getFieldValue: (field: string) => any;
  checkBarberAvailability: (date: Date, time: string, serviceId: string) => Promise<void>;
}

export function ClientAppointmentBarberSection({
  control,
  barbers,
  barberAvailability,
  isCheckingAvailability,
  getFieldValue,
  checkBarberAvailability
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <User className="h-5 w-5 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Escolha seu Barbeiro</h3>
      </div>
      <BarberSelectionField
        control={control}
        barbers={barbers}
        barberAvailability={barberAvailability}
        isCheckingAvailability={isCheckingAvailability}
        getFieldValue={getFieldValue}
        checkBarberAvailability={checkBarberAvailability}
      />
      <BarberDebugInfo 
        barbers={barbers}
        barberAvailability={barberAvailability}
        isCheckingAvailability={isCheckingAvailability}
      />
    </div>
  );
}
