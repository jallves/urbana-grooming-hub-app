
import React from "react";
import { Scissors } from "lucide-react";
import { ServiceSelectionField } from "./ServiceSelectionField";
import { Control } from "react-hook-form";
import { Service } from "@/types/appointment";

interface Props {
  control: Control<any>;
  services: Service[];
  onServiceSelect: (service: Service | null) => void;
}

export function ClientAppointmentServiceSection({ control, services, onServiceSelect }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-urbana-gold/20 rounded-lg">
          <Scissors className="h-5 w-5 text-urbana-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white">Escolha seu Serviço</h3>
      </div>
      <ServiceSelectionField 
        control={control} 
        services={services}
        onServiceSelect={onServiceSelect}
      />
    </div>
  );
}
