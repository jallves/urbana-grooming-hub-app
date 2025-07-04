
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardContainer from '@/components/ui/containers/DashboardContainer';

export default function PainelClienteAgendamentos() {
  // Mock data - substituir por dados reais
  const agendamentos = [
    {
      id: 1,
      data: '2024-01-15',
      hora: '14:30',
      servico: 'Corte + Barba',
      barbeiro: 'João Silva',
      status: 'confirmado'
    },
    {
      id: 2,
      data: '2024-01-22',
      hora: '16:00',
      servico: 'Corte Degradê',
      barbeiro: 'Pedro Santos',
      status: 'agendado'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'text-green-400 bg-green-400/10';
      case 'agendado': return 'text-amber-400 bg-amber-400/10';
      case 'cancelado': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <DashboardContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">Meus Agendamentos</h1>
            <p className="text-gray-400">Visualize e gerencie seus horários marcados</p>
          </div>
        </div>

        {agendamentos.length === 0 ? (
          <Card className="bg-gray-900 border border-gray-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-gray-400">
                Você ainda não possui agendamentos. Que tal marcar um horário?
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agendamentos.map((agendamento, index) => (
              <motion.div
                key={agendamento.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900 border border-gray-700 hover:border-gray-600 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">
                        {agendamento.servico}
                      </CardTitle>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(agendamento.status)}`}>
                        {agendamento.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-gray-300">
                        <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-sm">{agendamento.data}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-sm">{agendamento.hora}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <User className="h-4 w-4 mr-2 text-amber-500" />
                      <span className="text-sm">{agendamento.barbeiro}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardContainer>
  );
}
