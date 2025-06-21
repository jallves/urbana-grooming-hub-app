
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { Scissors, UserPlus, LogIn } from "lucide-react";
import BarbershopBookingForm from "@/components/booking/BarbershopBookingForm";

export default function BookingOnline() {
  const navigate = useNavigate();
  const { client, loading } = useClientAuth();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && client) {
      setShowForm(true);
    }
  }, [client, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  if (client && showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 flex items-center justify-center py-6">
        <BarbershopBookingForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-[#111827] border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Scissors className="h-16 w-16 text-[#F59E0B]" />
          </div>
          <CardTitle className="text-3xl font-bold text-white font-clash">
            Costa Urbana
          </CardTitle>
          <CardDescription className="text-[#9CA3AF] font-inter text-lg">
            Agendamento Online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-[#9CA3AF] mb-6">
            Para agendar seu horário, você precisa ter uma conta conosco.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/cliente/registro')}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold py-3"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Criar Conta
            </Button>
            
            <Button
              onClick={() => navigate('/cliente/login')}
              variant="outline"
              className="w-full border-gray-600 text-white hover:bg-gray-800 py-3"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Já tenho conta
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-[#F59E0B] hover:text-[#D97706]"
            >
              ← Voltar ao site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
