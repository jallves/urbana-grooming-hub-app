
import React from "react";
import { Calendar } from "lucide-react";
import { DateTimeSelectionFields } from "./DateTimeSelectionFields";
import { Control } from "react-hook-form";
import { Service } from "@/types/appointment";

interface Props {
  control: Control<any>;
  selectedService: Service | null;
  availableTimes: string[];
  disabledDays: Date[];
  getFieldValue: (field: string) => any;
  fetchAvailableTimes: (date: Date, serviceId: string) => void;
}

export function ClientAppointmentDateTimeSection({
  control,
  selectedService,
  availableTimes,
  disabledDays,
  getFieldValue,
  fetchAvailableTimes,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Calendar className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Data e Horário</h3>
      </div>
      <DateTimeSelectionFields
        control={control}
        selectedService={selectedService}
        availableTimes={availableTimes}
        disabledDays={disabledDays}
        getFieldValue={getFieldValue}
        fetchAvailableTimes={fetchAvailableTimes}
      />
    </div>
  );
}
