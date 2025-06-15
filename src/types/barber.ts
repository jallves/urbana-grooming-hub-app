
export interface Barber {
  id: string; // Agora sempre string (UUID)
  uuid_id?: string;
  name: string;
  email: string;
  phone: string;
  image_url: string;
  specialties: string;
  experience: string;
  commission_rate: number;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}
