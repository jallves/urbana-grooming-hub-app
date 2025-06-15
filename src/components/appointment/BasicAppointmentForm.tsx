import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  const [clientId, setClientId] = useState("");
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
      .then(({ data }) => {
        console.log("[BasicAppointmentForm] Serviços encontrados:", data);
        setServices(data ?? []);
      });

    // Buscar barbeiros ativos da TABELA staff
    supabase
      .from("staff")
      .select("id, name, is_active, role")
      .eq("is_active", true)
      .eq("role", "barber")
      .then(({ data, error }) => {
        console.log("[BasicAppointmentForm] Dados brutos staff:", data, error);
        // Só barbeiros válidos com id definido e nome
        const filtered =
          Array.isArray(data)
            ? data
                .filter((b: any) => !!b.id && !!b.name)
                .map((b: any) => ({
                  id: b.id,
                  name: b.name,
                  is_active: b.is_active,
                  role: b.role,
                }))
            : [];
        console.log("[BasicAppointmentForm] Barbeiros filtrados:", filtered);
        setBarbers(filtered);
      });
  }, []);

  useEffect(() => {
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
    const [h, m] = selectedTime.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(h, m, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);

    console.log("[hasBarberConflict] Checando conflitos com:", {
      bid,
      selectedDate,
      selectedTime,
      duration,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, staff_id, status")
      .eq("staff_id", bid)
      .in("status", ["scheduled", "confirmed"])
      .gte("start_time", start.toISOString().split("T")[0])
      .lte("start_time", start.toISOString().split("T")[0] + "T23:59:59.999Z");

    console.log("[hasBarberConflict] Result appointments:", { error, appointments });

    if (error || !appointments) {
      console.warn("[hasBarberConflict] Falha ao buscar appointments", error);
      return false;
    }

    const conflict = appointments.some((appt: any) => {
      const appStart = new Date(appt.start_time);
      const appEnd = new Date(appt.end_time);
      const overlaps = start < appEnd && end > appStart;
      console.log(
        "[hasBarberConflict] Comparando agendamento:",
        { appStart, appEnd, overlaps }
      );
      return overlaps;
    });

    return conflict;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Para teste: define um client_id fixo caso vazio (ajuste conforme produção)
    const client_id = clientId || "00000000-0000-0000-0000-000000000000";
    if (!client_id || !serviceId || !date || !time || !barberId) {
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
    // Monta payload correto
    const [hour, minute] = time.split(":").map(Number);
    const start_time = new Date(date);
    start_time.setHours(hour, minute, 0, 0);
    const end_time = new Date(start_time);
    end_time.setMinutes(end_time.getMinutes() + duration);

    const apptPayload = {
      client_id,
      service_id: serviceId,
      staff_id: barberId,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      status: "scheduled",
    };

    // Corrigido: payload precisa de todos os campos obrigatórios da tabela!
    const { error } = await supabase.from("appointments").insert([apptPayload]);

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
      setServiceId("");
      setDate(null);
      setTime("");
      setBarberId("");
      setClientId("");
    }
  }

  return (
    <Card className="max-w-lg mx-auto p-8 bg-zinc-900 text-white border-zinc-800">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-2">Novo Agendamento</h2>
        {/* Cliente ID (visível só para teste) */}
        <div>
          <label className="block mb-1">ID do Cliente</label>
          <input
            className="w-full rounded bg-zinc-800 border-zinc-700 p-2"
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Cole aqui o ID do cliente (para teste)"
          />
        </div>
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
            disabled={barbers.length === 0}
          >
            <option value="">Selecione</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
            ))}
          </select>
          {barbers.length === 0 && (
            <div className="mt-2 text-sm text-yellow-300 bg-yellow-900/40 rounded p-2">
              Nenhum barbeiro ativo cadastrado disponível.
            </div>
          )}
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
