
/**
 * Representa um barbeiro/profissional da barbearia
 */
export interface Barber {
  /** ID único do barbeiro (UUID) */
  id: string;
  
  /** Nome completo do barbeiro */
  name: string;
  
  /** E-mail de contato */
  email: string;
  
  /** Telefone de contato */
  phone?: string;
  
  /** URL da foto de perfil (opcional) */
  image_url?: string | null;
  
  /** Especialidades (corte, barba, etc) */
  specialties?: string[];
  
  /** Anos de experiência */
  experience?: number;
  
  /** Taxa de comissão (0-100) */
  commission_rate: number;
  
  /** Status de atividade */
  is_active: boolean;
  
  /** Cargo/função */
  role: string;
  
  /** Data de criação (ISO 8601) */
  created_at: string;
  
  /** Data de última atualização (ISO 8601) */
  updated_at: string;
  
  /** @deprecated Use id instead */
  uuid_id?: never; // Marcado como nunca para forçar migração
}