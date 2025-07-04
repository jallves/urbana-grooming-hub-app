import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, BarChart2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarberProfileInfo from '@/components/barber/BarberProfileInfo';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip as RechartTooltip
} from 'recharts';

const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, loading } = useBarberDashboardMetrics();

  const quickAccessItems = [
    {
      title: 'Dashboard',
      description: 'Visualizar métricas e relatórios pessoais',
      icon: <BarChart2 className="h-8 w-8 text-gray-300" />,
      path: '/barbeiro',
      color: 'bg-gradient-to-br from-indigo-600 to-indigo-800'
    },
    {
      title: 'Minha Agenda',
      description: 'Visualizar e gerenciar agendamentos',
      icon: <Calendar className="h-8 w-8 text-gray-300" />,
      path: '/barbeiro/agendamentos',
      color: 'bg-gradient-to-br from-blue-600 to-blue-800'
    },
    {
      title: 'Comissões',
      description: 'Acompanhar ganhos e histórico',
      icon: <DollarSign className="h-8 w-8 text-gray-300" />,
      path: '/barbeiro/comissoes',
      color: 'bg-gradient-to-br from-green-600 to-green-800'
    },
    {
      title: 'Clientes',
      description: 'Visualizar histórico de clientes',
      icon: <Users className="h-8 w-8 text-gray-300" />,
      path: '/barbeiro/clientes',
      color: 'bg-gradient-to-br from-purple-600 to-purple-800'
    },
    {
      title: 'Próximo Atendimento',
      description: 'Ver detalhes do próximo cliente',
      icon: <Clock className="h-8 w-8 text-gray-300" />,
      path: '/barbeiro/agendamentos',
      color: 'bg-gradient-to-br from-amber-500 to-amber-700'
    }
  ];

  const chartData = [
    { dia: 'Seg', valor: 3 },
    { dia: 'Ter', valor: 5 },
    { dia: 'Qua', valor: 4 },
    { dia: 'Qui', valor: 6 },
    { dia: 'Sex', valor: 2 },
    { dia: 'Sáb', valor: 7 },
  ];

  return (
    <BarberLayout title="Dashboard">
      <div className="panel-content-responsive">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Bem-vindo, {user?.email?.split('@')[0]}</h2>
          <p className="text-gray-400">Acesse as principais funcionalidades do seu painel</p>
        </div>

        {/* Métricas do Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {/* Example of a motion-enhanced card with tooltip */}
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="rounded-2xl">
                  <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                      <Calendar className="h-4 w-4 text-blue-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {loading ? '...' : metrics.totalAppointments}
                      </div>
                      <p className="text-xs text-blue-100">Este mês</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-gray-800 text-white text-sm px-3 py-2 rounded-md shadow-md">
                  Total de agendamentos realizados neste mês
                  <Tooltip.Arrow className="fill-gray-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          {/* Outros Cards de Métricas (repetir padrão com motion se quiser) */}

          {/* ... */}
        </div>

        {/* Acessos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessItems.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer transition-transform rounded-xl ${item.color}`}
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-6 flex flex-col">
                <div className="mb-2 drop-shadow-lg">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-white text-lg">{item.title}</h3>
                  <p className="text-gray-200 text-sm">{item.description}</p>
                </div>
              </CardContent>
            </motion.div>
          ))}
        </div>

        {/* Perfil e gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <BarberProfileInfo />

          <Card className="bg-gray-900 border-gray-700 p-4">
            <h3 className="text-white text-lg mb-4">Atendimentos por Dia</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="dia" stroke="#ccc" />
                <RechartTooltip />
                <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberDashboard;

