/**
 * Origem do agendamento — usado na auditoria do administrador master.
 * Registra de qual painel/dispositivo o agendamento foi criado.
 */
export type AppointmentOrigin =
  | 'painel_cliente'
  | 'totem'
  | 'painel_barbeiro'
  | 'painel_admin'
  | 'site'
  | 'desconhecida';

export const APPOINTMENT_ORIGIN_LABELS: Record<string, string> = {
  painel_cliente: 'Painel do Cliente',
  totem: 'Totem',
  painel_barbeiro: 'Painel do Barbeiro',
  painel_admin: 'Painel Administrativo',
  site: 'Site',
  desconhecida: 'Origem desconhecida',
};

export const appointmentOriginLabel = (origin?: string | null) =>
  APPOINTMENT_ORIGIN_LABELS[origin || 'desconhecida'] || origin || 'Origem desconhecida';

/**
 * Campos de origem para inserir em painel_agendamentos.
 */
export const appointmentOrigin = (origem: AppointmentOrigin) => ({
  origem,
  origem_device:
    typeof navigator !== 'undefined' ? String(navigator.userAgent).slice(0, 300) : null,
});
