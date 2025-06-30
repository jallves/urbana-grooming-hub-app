
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface AppointmentStatusBadgeProps {
  status: string;
}

// Status colors for appointments with dark theme
const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  confirmed: 'bg-green-500/20 text-green-300 border-green-500/50',
  completed: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/50',
  no_show: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
};

const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({ status }) => {
  return (
    <Badge className={`${statusColors[status]} font-raleway`}>
      {statusLabels[status] || status}
    </Badge>
  );
};

export default AppointmentStatusBadge;
