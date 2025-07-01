
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'barber';
  status: 'active' | 'inactive';
  photo_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'barber';
  status: 'active' | 'inactive';
  password: string;
  photo_url?: string;
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'barber';
  status?: 'active' | 'inactive';
  password?: string;
  photo_url?: string;
}
