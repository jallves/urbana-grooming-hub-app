
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface AppointmentStatusBadgeProps {
  status: string;
}

// Status colors for appointments
const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
  ausente: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
  ausente: 'Ausente',
};

const statusLabelsShort: Record<string, string> = {
  scheduled: 'Agend.',
  confirmed: 'Conf.',
  completed: 'Final.',
  cancelled: 'Canc.',
  no_show: 'N/Comp.',
  ausente: 'Ausente',
};

const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({ status }) => {
  const fullLabel = statusLabels[status] || status;
  const shortLabel = statusLabelsShort[status] || status;
  return (
    <Badge className={`${statusColors[status]} text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 whitespace-nowrap`}>
      <span className="hidden sm:inline">{fullLabel}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </Badge>
  );
};

export default AppointmentStatusBadge;
