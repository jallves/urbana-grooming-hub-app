import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Scissors, Loader2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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
  
  const services = mockServices;
  const barbers = mockBarbers;
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableBarbers, setAvailableBarbers] = useState<typeof barbers>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [noBarberMsg, setNoBarberMsg] = useState("");

  // Time intervals from 8:00 to 20:00 every 30 minutes
  const TIME_INTERVALS = Array.from({ length: 24 }, (_, idx) => {
    const hour = 8 + Math.floor(idx / 2);
    const min = idx % 2 === 0 ? "00" : "30";
    return `${String(hour).padStart(2, "0")}:${min}`;
  }).filter(h => {
    const [hr, min] = h.split(":").map(Number);
    return (hr > 7 || (hr === 8 && min === 0)) && (hr < 20 || (hr === 20 && min === 0));
  });

  // Navigation helpers
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

  // Update options when date/service changes
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

  // Fetch available barbers when date/time/service selected
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

  const disableDays = (date: Date) => date.getDay() === 0; // Disable Sundays

  // Progress calculation
  const progressValue = {
    service: 20,
    date: 40,
    time: 60,
    barber: 80,
    confirm: 100
  }[step];

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card className="bg-stone-900/95 border-stone-700 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Scissors className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Agendamento Online</CardTitle>
              <CardDescription className="text-stone-400">
                Reserve seu horário em poucos passos
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 pb-2">
          <Progress value={progressValue} className="h-2 bg-stone-800" indicatorClassName="bg-amber-500" />
          {step !== "confirm" && (
            <p className="text-xs text-amber-400 mt-2 font-medium">
              Etapa: {(
                { service: "Serviço", date: "Data", time: "Horário", barber: "Barbeiro" } as Record<Step, string>
              )[step]}
            </p>
          )}
        </div>

        <CardContent className="pt-4 pb-6 px-6">
          {!bookingSuccess ? (
            <>
              {/* Service Selection */}
              {step === "service" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold">1</span>
                      Qual serviço você deseja?
                    </h3>
                    <Select value={form.serviceId} onValueChange={v => handleChange("serviceId", v)}>
                      <SelectTrigger className="bg-stone-800 border-stone-700 text-white h-12">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-800 border-stone-700">
                        {services.map(s => (
                          <SelectItem value={s.id} key={s.id} className="hover:bg-stone-700">
                            <div className="flex justify-between w-full">
                              <span>{s.name}</span>
                              <span className="text-amber-400">{s.duration} min</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold" 
                    disabled={!canNext} 
                    onClick={nextStep}
                  >
                    Continuar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Date Selection */}
              {step === "date" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold">2</span>
                      Escolha a data
                    </h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 text-left px-4 font-normal bg-stone-800 border-stone-700 hover:bg-stone-700",
                            !form.date && "text-stone-400"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4 text-amber-400" />
                          {form.date
                            ? format(form.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            : <span>Selecione uma data</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-stone-700" align="start">
                        <div className="bg-stone-800 p-3 rounded-lg">
                          <input
                            type="date"
                            min={format(new Date(), "yyyy-MM-dd")}
                            value={form.date ? format(form.date, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              handleChange("date", date);
                            }}
                            className="bg-stone-700 border border-stone-600 text-white rounded px-3 py-2 w-full focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                          <div className="text-xs text-stone-400 mt-2">
                            A barbearia não abre aos domingos
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 border-stone-700 text-white hover:bg-stone-700" 
                      onClick={prevStep}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button 
                      className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold" 
                      disabled={!canNext} 
                      onClick={nextStep}
                    >
                      Continuar <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Time Selection */}
              {step === "time" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold">3</span>
                      Escolha o horário
                    </h3>
                    <Select
                      value={form.time}
                      onValueChange={v => handleChange("time", v)}
                      disabled={!form.date || !form.serviceId}
                    >
                      <SelectTrigger className="bg-stone-800 border-stone-700 text-white h-12">
                        <Clock className="mr-2 h-4 w-4 text-amber-400" />
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-800 border-stone-700">
                        {availableTimes.map(time => (
                          <SelectItem
                            key={time}
                            value={time}
                            className="hover:bg-stone-700"
                            disabled={form.date?.getDay() === 0}
                          >
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 border-stone-700 text-white hover:bg-stone-700" 
                      onClick={prevStep}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button 
                      className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold" 
                      disabled={!canNext} 
                      onClick={nextStep}
                    >
                      Continuar <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Barber Selection */}
              {step === "barber" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-sm font-bold">4</span>
                      Escolha seu barbeiro
                    </h3>
                    {loadingBarbers ? (
                      <div className="flex items-center justify-center gap-3 py-4 text-stone-400">
                        <Loader2 className="animate-spin h-5 w-5 text-amber-500" />
                        Buscando barbeiros disponíveis...
                      </div>
                    ) : availableBarbers.length === 0 && form.time ? (
                      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-center">
                        <div className="text-red-400 font-medium">
                          {noBarberMsg}
                        </div>
                      </div>
                    ) : (
                      <Select
                        value={form.barberId}
                        onValueChange={v => handleChange("barberId", v)}
                        disabled={availableBarbers.length === 0}
                      >
                        <SelectTrigger className="bg-stone-800 border-stone-700 text-white h-12">
                          <User className="mr-2 h-4 w-4 text-amber-400" />
                          <SelectValue placeholder="Selecione um barbeiro" />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-800 border-stone-700">
                          {availableBarbers.map(barber => (
                            <SelectItem 
                              key={barber.id} 
                              value={barber.id}
                              className="hover:bg-stone-700"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-amber-400">
                                  {barber.name.charAt(0)}
                                </div>
                                <span>{barber.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 border-stone-700 text-white hover:bg-stone-700" 
                      onClick={prevStep}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button 
                      className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold" 
                      disabled={!canNext} 
                      onClick={handleBooking}
                    >
                      Confirmar <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Confirmation Screen */
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-amber-400 mb-2">Agendamento Confirmado!</h3>
              
              <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-5 mt-6 mb-8 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-amber-400" />
                  <span className="font-medium">{bookingData?.service?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-amber-400" />
                  <span>
                    {bookingData?.date && format(bookingData.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    <span className="ml-2 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md text-sm">
                      {bookingData?.time}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-amber-400" />
                  <span>Barbeiro: <span className="font-medium">{bookingData?.barber?.name}</span></span>
                </div>
              </div>

              <Button 
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold"
                onClick={() => window.location.reload()}
              >
                Fazer Novo Agendamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}