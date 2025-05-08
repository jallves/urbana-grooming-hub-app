
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
        title: "Appointment Request Submitted",
        description: "We'll contact you shortly to confirm your appointment.",
      });
    }, 1500);
  };

  return (
    <section id="appointment" className="urbana-section bg-urbana-brown text-white">
      <div className="urbana-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Book Your Appointment</h2>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-90">
            Schedule your visit and experience premium grooming services
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="Your name"
                  required
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Your phone number"
                  required
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  required
                  className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
                />
              </div>

              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2">
                  Service
                </label>
                <Select>
                  <SelectTrigger className="bg-white/20 border-urbana-gold/50">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haircut">Classic Haircut</SelectItem>
                    <SelectItem value="beard">Beard Trim</SelectItem>
                    <SelectItem value="shave">Luxury Shave</SelectItem>
                    <SelectItem value="combo">Hair & Beard Combo</SelectItem>
                    <SelectItem value="color">Color Treatment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="barber" className="block text-sm font-medium mb-2">
                  Preferred Barber
                </label>
                <Select>
                  <SelectTrigger className="bg-white/20 border-urbana-gold/50">
                    <SelectValue placeholder="Select a barber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Available</SelectItem>
                    <SelectItem value="rafael">Rafael Costa</SelectItem>
                    <SelectItem value="lucas">Lucas Oliveira</SelectItem>
                    <SelectItem value="gabriel">Gabriel Santos</SelectItem>
                    <SelectItem value="mateus">Mateus Silva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Preferred Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white/20 border-urbana-gold/50 text-left justify-start h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Additional Notes
              </label>
              <Textarea
                id="notes"
                placeholder="Any special requests or information"
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
                {loading ? "Submitting..." : "Book Appointment"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Appointment;
