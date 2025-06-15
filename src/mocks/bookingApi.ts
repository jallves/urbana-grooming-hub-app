
import { addMinutes, isWithinInterval } from "date-fns";

// Mock de serviços
export const mockServices = [
  { id: "1", name: "Corte Masculino", duration: 30 },
  { id: "2", name: "Barba Completa", duration: 45 },
  { id: "3", name: "Corte + Barba Premium", duration: 60 },
];
// Mock de barbeiros
export const mockBarbers = [
  { id: "b1", name: "João Barbeiro" },
  { id: "b2", name: "Marcelo Estilo" },
  { id: "b3", name: "Pedro Navalha" },
];

// Mock de agendamentos existentes neste dia específico
const existingAppoinments = [
  {
    barberId: "b1",
    dateISO: "2025-06-15", // yyyy-MM-dd
    start: "09:00",
    end: "09:45"
  },
  {
    barberId: "b1",
    dateISO: "2025-06-15",
    start: "13:30",
    end: "14:00"
  },
  {
    barberId: "b2",
    dateISO: "2025-06-15",
    start: "10:00",
    end: "11:00"
  },
];

// Função de verificação de disponibilidade (mock)
export async function getAvailableBarbers(date: Date, time: string, serviceId: string) {
  if (!date || !time || !serviceId) return [];
  const service = mockServices.find(s => s.id === serviceId);
  if (!service) return [];

  const dateISO = date.toISOString().split("T")[0];
  const startTime = time;
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date(date);
  start.setHours(h, m, 0, 0);
  const end = addMinutes(start, service.duration);

  return mockBarbers.filter(barber => {
    // Busca agendamentos desse barbeiro neste dia
    const bookings = existingAppoinments.filter(a =>
      a.barberId === barber.id && a.dateISO === dateISO
    );
    // Checa conflito de tempo
    const conflict = bookings.some((booking) => {
      const bookStart = new Date(dateISO + "T" + booking.start);
      const bookEnd = new Date(dateISO + "T" + booking.end);
      return (
        (start < bookEnd && end > bookStart)
      );
    });
    return !conflict;
  });
}
