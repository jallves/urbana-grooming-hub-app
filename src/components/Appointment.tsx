
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Appointment: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Solicitação de Agendamento Enviada",
        description: "Entraremos em contato em breve para confirmar seu horário.",
      });
    }, 1500);
  };

  return (
    <section id="appointment" className="urbana-section bg-urbana-brown text-white">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Agende seu Horário</h2>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-90">
            Marque sua visita e experimente serviços premium de barbearia
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome Completo
                </label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  required
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Seu número de telefone"
                  required
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Seu e-mail"
                  required
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2">
                  Serviço
                </label>
                <Select>
                  <SelectTrigger className="bg-white/20 border-urbana-gold/50">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haircut">Corte Clássico</SelectItem>
                    <SelectItem value="beard">Barba</SelectItem>
                    <SelectItem value="shave">Barboterapia</SelectItem>
                    <SelectItem value="combo">Combo Cabelo & Barba</SelectItem>
                    <SelectItem value="color">Coloração</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="barber" className="block text-sm font-medium mb-2">
                  Barbeiro Preferido
                </label>
                <Select>
                  <SelectTrigger className="bg-white/20 border-urbana-gold/50">
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer Disponível</SelectItem>
                    <SelectItem value="rafael">Rafael Costa</SelectItem>
                    <SelectItem value="lucas">Lucas Oliveira</SelectItem>
                    <SelectItem value="gabriel">Gabriel Santos</SelectItem>
                    <SelectItem value="mateus">Mateus Silva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Preferida
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white/20 border-urbana-gold/50 text-left justify-start h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Observações Adicionais
              </label>
              <Textarea
                id="notes"
                placeholder="Pedidos especiais ou informações adicionais"
                rows={4}
                className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white py-6 text-lg"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Agendar Horário"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Appointment;
