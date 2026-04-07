/**
 * Calcula a duração total de um agendamento incluindo serviços extras
 * @param mainDuration - Duração do serviço principal em minutos
 * @param servicosExtras - Array de serviços extras (JSON da coluna servicos_extras)
 * @returns Duração total em minutos
 */
export const calculateTotalAppointmentDuration = (
  mainDuration: number,
  servicosExtras: any[] | null | undefined
): number => {
  let total = mainDuration;
  
  if (servicosExtras && Array.isArray(servicosExtras)) {
    total += servicosExtras.reduce((sum: number, s: any) => sum + (s.duracao || 0), 0);
  }
  
  return total;
};
