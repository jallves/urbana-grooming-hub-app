
export type AppointmentViewMode = 'calendar' | 'list';

export interface AdminRouteProps {
  children: React.ReactNode;
  allowBarber?: boolean;
  requiredModule?: string;
}
