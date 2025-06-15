
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type Barber = {
  id: string;
  name: string;
  is_active: boolean;
  role: string;
};

const generateTimeSlots = (duration: number) => {
  // Horários de 8h às 20h, intervalos conforme duração do serviço
  const slots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

export default function BasicAppointmentForm() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [serviceId, setServiceId] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>("");
  const [barberId, setBarberId] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Buscar serviços
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => setServices(data ?? []));
    // Buscar barbeiros ativos (staff_sequencial)
    supabase
      .from("staff_sequencial")
      .select("uuid_id, name, is_active, role")
      .eq("is_active", true)
      .eq("role", "barber")
      .then(({ data }) => {
        setBarbers(
          (data ?? []).map((b: any) => ({
            id: b.uuid_id,
            name: b.name,
            is_active: b.is_active,
            role: b.role,
          }))
        );
      });
  }, []);

  useEffect(() => {
    // Quando muda o serviço, atualiza possíveis horários
    const selected = services.find((s) => s.id === serviceId);
    setSelectedService(selected ?? null);
    if (selected) {
      setAvailableTimes(generateTimeSlots(selected.duration));
    } else {
      setAvailableTimes([]);
      setTime("");
    }
  }, [serviceId, services]);

  async function hasBarberConflict(bid: string, selectedDate: Date, selectedTime: string, duration: number) {
    // Busca todos os agendamentos do barbeiro no dia e confere conflito
    const [h, m] = selectedTime.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(h, m, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, start_time, end_time")
      .eq("staff_id", bid)
      .in("status", ["scheduled", "confirmed"])
      .gte("start_time", new Date(start).toISOString().split("T")[0])
      .lte("start_time", new Date(start).toISOString().split("T")[0] + "T23:59:59.999Z");

    if (error || !appointments) return false;

    return appointments.some((appt: any) => {
      const appStart = new Date(appt.start_time);
      const appEnd = new Date(appt.end_time);
      return start < appEnd && end > appStart;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !date || !time || !barberId) {
      toast({
        title: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setChecking(true);
    const duration = selectedService?.duration ?? 60;
    const conflict = await hasBarberConflict(barberId, date, time, duration);
    setChecking(false);

    if (conflict) {
      toast({
        title: "Conflito de Agenda",
        description: "Este barbeiro já tem um atendimento nesse horário.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    // Simples: cria agendamento (pode adicionar campos extra como client_id depois)
    const [hour, minute] = time.split(":").map(Number);
    const start_time = new Date(date);
    start_time.setHours(hour, minute, 0, 0);
    const end_time = new Date(start_time);
    end_time.setMinutes(end_time.getMinutes() + duration);

    const { error } = await supabase.from("appointments").insert([
      {
        service_id: serviceId,
        staff_id: barberId,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString(),
        status: "scheduled",
      }
    ]);

    setLoading(false);
    if (error) {
      toast({
        title: "Erro ao agendar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Agendamento criado com sucesso!",
        description: `Seu corte foi reservado para ${format(start_time, "dd/MM/yyyy")} às ${format(start_time, "HH:mm")}.`,
        duration: 7000,
      });
      // Reset form (opcional)
      setServiceId("");
      setDate(null);
      setTime("");
      setBarberId("");
    }
  }

  return (
    <Card className="max-w-lg mx-auto p-8 bg-zinc-900 text-white border-zinc-800">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-2">Novo Agendamento</h2>
        {/* Serviço */}
        <div>
          <label className="block mb-1">Serviço</label>
          <select
            className="w-full rounded bg-zinc-800 border-zinc-700 p-2"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">Selecione</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration}min)
              </option>
            ))}
          </select>
        </div>
        {/* Data */}
        <div>
          <label className="block mb-1">Data</label>
          <input
            type="date"
            className="w-full rounded bg-zinc-800 border-zinc-700 p-2 text-white"
            value={date ? format(date, "yyyy-MM-dd") : ""}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : null)}
          />
        </div>
        {/* Hora */}
        <div>
          <label className="block mb-1">Hora</label>
          <select
            className="w-full rounded bg-zinc-800 border-zinc-700 p-2"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!selectedService}
          >
            <option value="">Selecione</option>
            {availableTimes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {/* Barbeiro */}
        <div>
          <label className="block mb-1">Barbeiro</label>
          <select
            className="w-full rounded bg-zinc-800 border-zinc-700 p-2"
            value={barberId}
            onChange={(e) => setBarberId(e.target.value)}
          >
            <option value="">Selecione</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          disabled={loading || checking}
          className="w-full mt-4 bg-urbana-gold text-black hover:bg-urbana-gold/80"
        >
          {checking ? "Checando agenda..." : loading ? "Agendando..." : "Agendar"}
        </Button>
      </form>
    </Card>
  );
}
