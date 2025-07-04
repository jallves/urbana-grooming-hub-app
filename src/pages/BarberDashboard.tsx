
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, BarChart2, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarberProfileInfo from '@/components/barber/BarberProfileInfo';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';

const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, loading } = useBarberDashboardMetrics();

  const quickAccessItems = [
    {
      title: 'Dashboard',
      description: 'Visualizar métricas e relatórios pessoais',
      icon: <BarChart2 className="h-8 w-8 text-zinc-300" />,
      path: '/barbeiro',
      color: 'bg-gradient-to-br from-indigo-600 to-indigo-800'
    },
    {
      title: 'Minha Agenda',
      description: 'Visualizar e gerenciar agendamentos',
      icon: <Calendar className="h-8 w-8 text-zinc-300" />,
      path: '/barbeiro/agendamentos',
      color: 'bg-gradient-to-br from-blue-600 to-blue-800'
    },
    {
      title: 'Comissões',
      description: 'Acompanhar ganhos e histórico',
      icon: <DollarSign className="h-8 w-8 text-zinc-300" />,
      path: '/barbeiro/comissoes',
      color: 'bg-gradient-to-br from-green-600 to-green-800'
    },
    {
      title: 'Clientes',
      description: 'Visualizar histórico de clientes',
      icon: <Users className="h-8 w-8 text-zinc-300" />,
      path: '/barbeiro/clientes',
      color: 'bg-gradient-to-br from-purple-600 to-purple-800'
    },
    {
      title: 'Próximo Atendimento',
      description: 'Ver detalhes do próximo cliente',
      icon: <Clock className="h-8 w-8 text-zinc-300" />,
      path: '/barbeiro/agendamentos',
      color: 'bg-gradient-to-br from-amber-500 to-amber-700'
    }
  ];

  return (
    <BarberLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user?.email?.split('@')[0]}</h2>
          <p className="text-zinc-400">Acesse as principais funcionalidades do seu painel</p>
        </div>

        {/* Métricas do Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : metrics.totalAppointments}
              </div>
              <p className="text-xs text-blue-100">Este mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-800 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : metrics.completedAppointments}
              </div>
              <p className="text-xs text-green-100">Este mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-700 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos</CardTitle>
              <Clock className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : metrics.upcomingAppointments}
              </div>
              <p className="text-xs text-amber-100">Agendados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-purple-100">Este mês</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessItems.map((item, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer hover:-translate-y-1 transition-transform border-0 overflow-hidden ${item.color}`} 
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-6 flex flex-col">
                <div className="mb-2">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-white text-lg">{item.title}</h3>
                  <p className="text-zinc-300 text-sm">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarberProfileInfo />

          <Card>
            <CardHeader>
              <CardTitle>Este Mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">Total de Serviços</span>
                <span className="font-medium">
                  {loading ? '...' : metrics.completedAppointments}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">Total de Receita</span>
                <span className="font-medium">
                  {loading ? '...' : `R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">Média por Serviço</span>
                <span className="font-medium">
                  {loading ? '...' : `R$ ${metrics.averageServiceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400">Cancelamentos</span>
                <span className="font-medium text-red-400">
                  {loading ? '...' : metrics.cancelledAppointments}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BarberLayout>
  );
};

export default BarberDashboard;
