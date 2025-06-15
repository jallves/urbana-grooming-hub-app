
import React from "react";
import { AppointmentNotesField } from "./AppointmentNotesField";

interface Props {
  control: any;
}

export function ClientAppointmentNotesSection({ control }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Observações</h3>
      <AppointmentNotesField control={control} />
    </div>
  );
}
