
// src/types/barber.ts
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image_url?: string;
  specialties: string[]; // Alterado para array
  experience: number; // Alterado para number
  commission_rate: number;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  
  /** @deprecated */
  uuid_id?: string; // Marcado como deprecated
}

// Export Barber as an alias for Staff to maintain backward compatibility
export type Barber = Staff;
