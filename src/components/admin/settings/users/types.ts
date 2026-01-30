
// Define type for valid roles to match the app_role enum in the database
export type AppRole = 'master' | 'admin' | 'manager' | 'barber' | 'user';

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  image_url?: string | null;
  photo_url?: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  user_email?: string;
  user_name?: string;
}
