
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Scissors, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
// Form theme
import "@/index.css";
import "@/App.css";

import { getAvailableBarbers, mockBarbers, mockServices } from "@/mocks/bookingApi";

type Step = "service" | "date" | "time" | "barber" | "confirm";

interface State {
  serviceId: string;
  date: Date | null;
  time: string;
  barberId: string;
}

export default function BarbershopBookingForm() {
  // Form state
  const [step, setStep] = useState<Step>("service");
  const [form, setForm] = useState<State>({
    serviceId: "",
    date: null,
    time: "",
    barberId: "",
  });
  // Dados simulados
  const services = mockServices;
  const barbers = mockBarbers;
  // States
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableBarbers, setAvailableBarbers] = useState<typeof barbers>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [noBarberMsg, setNoBarberMsg] = useState("");

  // Horários fixos
  const TIME_INTERVALS = Array.from({ length: 24 }, (_, idx) => {
    const hour = 8 + Math.floor(idx / 2);
    const min = idx % 2 === 0 ? "00" : "30";
    return `${String(hour).padStart(2, "0")}:${min}`;
  }).filter(h => {
    const [hr, min] = h.split(":").map(Number);
    return (hr > 7 || (hr === 8 && min === 0)) && (hr < 20 || (hr === 20 && min === 0));
  });

  // Helpers de navegação
  function nextStep() {
    if (step === "service") setStep("date");
    else if (step === "date") setStep("time");
    else if (step === "time") setStep("barber");
    else if (step === "barber") setStep("confirm");
  }
  function prevStep() {
    if (step === "date") setStep("service");
    else if (step === "time") setStep("date");
    else if (step === "barber") setStep("time");
    else if (step === "confirm") setStep("barber");
  }

  // Atualiza opções ao mudar data/serviço
  useEffect(() => {
    if (form.date && form.serviceId) {
      setAvailableTimes(TIME_INTERVALS);
    } else {
      setAvailableTimes([]);
    }
    setForm(prev => ({ ...prev, time: "", barberId: "" }));
    setAvailableBarbers([]);
    setNoBarberMsg("");
  }, [form.date, form.serviceId]);

  // Busca barbeiros disponíveis ao selecionar data/hora/serviço
  useEffect(() => {
    setAvailableBarbers([]);
    setNoBarberMsg("");
    if (form.date && form.time && form.serviceId) {
      setLoadingBarbers(true);
      getAvailableBarbers(form.date, form.time, form.serviceId)
        .then(barbers => {
          setAvailableBarbers(barbers);
          if (barbers.length === 0) {
            setNoBarberMsg("Nenhum barbeiro disponível neste horário. Por favor, escolha outro horário.");
          }
        })
        .finally(() => setLoadingBarbers(false));
    }
  }, [form.date, form.time, form.serviceId]);

  // Validação das etapas
  const canNext =
    (step === "service" && form.serviceId) ||
    (step === "date" && !!form.date) ||
    (step === "time" && form.time) ||
    (step === "barber" && form.barberId);

  function handleChange(field: keyof State, value: string | Date | null) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "serviceId") {
      setStep("date");
    }
  }

  function handleBooking() {
    setBookingData({
      service: services.find(s => s.id === form.serviceId),
      date: form.date,
      time: form.time,
      barber: barbers.find(b => b.id === form.barberId),
    });
    setBookingSuccess(true);
    setStep("confirm");
  }

  // Dias válidos: segunda a sábado
  const disableDays = (date: Date) => {
    // Sunday = 0
    return date.getDay() === 0;
  };

  // Mobile: responsivo
  return (
    <div className="max-w-lg mx-auto px-2 py-8">
      <Card className="bg-stone-900/90 rounded-xl border-stone-800 shadow-lg animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-white">
            <Scissors className="h-6 w-6 text-amber-500" />
            Agendamento Online
          </CardTitle>
          <CardDescription className="text-stone-400">
            Reserve seu horário de forma rápida e fácil.<br />
            {step !== "confirm" && (
              <span className="font-medium text-amber-300">Etapa: {(
                { service: "Serviço", date: "Data", time: "Horário", barber: "Barbeiro", confirm: "Confirmação" } as Record<Step, string>
              )[step]}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-white">
          {/* Etapas */}
          {!bookingSuccess ? (
            <>
              {step === "service" && (
                <div className="space-y-5">
                  <label htmlFor="service" className="block mb-2 text-lg">Serviço</label>
                  <Select value={form.serviceId} onValueChange={v => handleChange("serviceId", v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem value={s.id} key={s.id}>
                          {s.name} - {s.duration} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="w-full mt-3" disabled={!canNext} onClick={nextStep}>Próxima etapa</Button>
                </div>
              )}
              {step === "date" && (
                <div className="space-y-5">
                  <label className="block mb-2 text-lg">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full text-left px-4 font-normal bg-zinc-800 border-zinc-700",
                          !form.date && "text-stone-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {form.date
                          ? format(form.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : <span>Selecione uma data</span>
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="bg-stone-900 p-3 rounded-lg pointer-events-auto">
                        <input
                          type="date"
                          min={format(new Date(), "yyyy-MM-dd")}
                          value={form.date ? format(form.date, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            handleChange("date", date);
                          }}
                          className="bg-zinc-800 border border-zinc-600 text-white rounded px-3 py-2"
                        />
                        <div className="text-xs text-stone-400 mt-1">
                          Apenas datas de segunda a sábado são permitidas.
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                    <Button className="flex-1" disabled={!canNext} onClick={nextStep}>Próxima etapa</Button>
                  </div>
                </div>
              )}
              {step === "time" && (
                <div className="space-y-5">
                  <label className="block mb-2 text-lg">Horário</label>
                  <Select
                    value={form.time}
                    onValueChange={v => handleChange("time", v)}
                    disabled={!form.date || !form.serviceId}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map(time => {
                        const [hr, min] = time.split(":").map(Number);
                        // Desabilitar horários aos domingos
                        const isSunday = form.date?.getDay() === 0;
                        // Desabilita se domingo ou fora exped
                        return (
                          <SelectItem
                            key={time}
                            value={time}
                            disabled={isSunday}
                          >
                            {time}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                    <Button className="flex-1" disabled={!canNext} onClick={nextStep}>Próxima etapa</Button>
                  </div>
                </div>
              )}
              {step === "barber" && (
                <div className="space-y-5">
                  <label className="block mb-2 text-lg">Barbeiro</label>
                  {loadingBarbers ? (
                    <div className="flex gap-2 items-center text-zinc-400 animate-pulse">
                      <Loader2 className="animate-spin" />
                      Buscando disponibilidade dos barbeiros...
                    </div>
                  ) : availableBarbers.length === 0 && form.time ? (
                    <div className="bg-red-900/20 border border-red-700 rounded p-4 text-center">
                      <div className="text-red-400 font-semibold">
                        {noBarberMsg}
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={form.barberId}
                      onValueChange={v => handleChange("barberId", v)}
                      disabled={availableBarbers.length === 0}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <User className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Selecione um barbeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBarbers.map(barber => (
                          <SelectItem key={barber.id} value={barber.id}>
                            {barber.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                    <Button
                      className="flex-1"
                      disabled={!canNext}
                      onClick={handleBooking}
                    >
                      Confirmar agendamento
                    </Button>
                  </div>
                </div>
              )}
              {step === "confirm" && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center">
                    <Scissors className="h-10 w-10 text-amber-500 mb-3" />
                    <h2 className="text-xl font-bold text-amber-300 mb-1">Agendamento realizado!</h2>
                    <div className="text-md text-white/80 mb-4">
                      Seu corte está marcado para:<br />
                      <span className="font-semibold">
                        {bookingData?.service?.name} <br />
                        {bookingData?.date && format(bookingData.date, "dd/MM/yyyy", { locale: ptBR })}, {bookingData?.time}<br />
                        Barbeiro: {bookingData?.barber?.name}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => window.location.reload()}>Novo Agendamento</Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-5 text-center">
              <Scissors className="h-10 w-10 text-amber-500 mb-3 mx-auto" />
              <div className="text-xl font-bold text-amber-300 mb-2">Agendamento realizado!</div>
              <div className="text-white/80 mb-4">
                Seu corte está marcado para:<br />
                <span className="font-semibold">
                  {bookingData?.service?.name} <br />
                  {bookingData?.date && format(bookingData.date, "dd/MM/yyyy", { locale: ptBR })}, {bookingData?.time}<br />
                  Barbeiro: {bookingData?.barber?.name}
                </span>
              </div>
              <Button className="w-full" onClick={() => window.location.reload()}>
                Novo Agendamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
