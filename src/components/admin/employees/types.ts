
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'barber';
  status: 'active' | 'inactive';
  photo_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
