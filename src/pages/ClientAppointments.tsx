
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import ClientAppointmentList from '@/components/client/appointment/ClientAppointmentList';

export default function ClientAppointments() {
  const navigate = useNavigate();
  const { client } = useClientAuth();

  if (!client) {
    navigate('/cliente/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-white font-clash mb-2">
              Agendamentos
            </h1>
            <p className="text-gray-400 font-inter">
              Gerencie todos os seus agendamentos
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <ClientAppointmentList />
        </div>
      </div>
    </div>
  );
}
