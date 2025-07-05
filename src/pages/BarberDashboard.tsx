
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, BarChart2, CheckCircle, TrendingUp, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarberProfileInfo from '@/components/barber/BarberProfileInfo';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, loading } = useBarberDashboardMetrics();

  const quickAccessItems = [
    {
      title: 'Meus Agendamentos',
      description: 'Visualizar agenda do dia',
      icon: <Calendar className="h-8 w-8" />,
      path: '/barbeiro/agendamentos',
      gradient: 'from-blue-500 to-cyan-500',
      stats: loading ? '...' : metrics.upcomingAppointments
    },
    {
      title: 'Comissões',
      description: 'Acompanhar ganhos',
      icon: <DollarSign className="h-8 w-8" />,
      path: '/barbeiro/comissoes',
      gradient: 'from-green-500 to-emerald-500',
      stats: loading ? '...' : `R$ ${metrics.totalRevenue.toFixed(0)}`
    },
    {
      title: 'Meus Clientes',
      description: 'Histórico de atendimentos',
      icon: <Users className="h-8 w-8" />,
      path: '/barbeiro/clientes',
      gradient: 'from-purple-500 to-violet-500',
      stats: loading ? '...' : metrics.completedAppointments
    },
    {
      title: 'Agenda Completa',
      description: 'Visualizar calendário',
      icon: <Clock className="h-8 w-8" />,
      path: '/barbeiro/agenda',
      gradient: 'from-orange-500 to-red-500',
      stats: 'Ver Agenda'
    }
  ];

  const performanceData = [
    { mes: 'Jan', clientes: 45, receita: 2800 },
    { mes: 'Fev', clientes: 52, receita: 3200 },
    { mes: 'Mar', clientes: 38, receita: 2400 },
    { mes: 'Abr', clientes: 61, receita: 3800 },
    { mes: 'Mai', clientes: 55, receita: 3400 },
    { mes: 'Jun', clientes: 67, receita: 4200 }
  ];

  const servicesData = [
    { name: 'Corte', value: 40, color: '#3B82F6' },
    { name: 'Barba', value: 25, color: '#10B981' },
    { name: 'Combo', value: 30, color: '#8B5CF6' },
    { name: 'Outros', value: 5, color: '#F59E0B' }
  ];

  return (
    <BarberLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Bem-vindo, {user?.email?.split('@')[0]}
          </h2>
          <p className="text-gray-400 text-lg">Gerencie seu trabalho com excelência profissional</p>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Agendamentos</CardTitle>
                <Calendar className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {loading ? '...' : metrics.totalAppointments}
                </div>
                <p className="text-xs text-blue-200">Este mês</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Concluídos</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {loading ? '...' : metrics.completedAppointments}
                </div>
                <p className="text-xs text-green-200">Atendimentos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-purple-500/30 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Receita</CardTitle>
                <DollarSign className="h-5 w-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  R$ {loading ? '...' : metrics.totalRevenue.toFixed(0)}
                </div>
                <p className="text-xs text-purple-200">Este mês</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Próximos</CardTitle>
                <Clock className="h-5 w-5 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {loading ? '...' : metrics.upcomingAppointments}
                </div>
                <p className="text-xs text-orange-200">Agendados</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickAccessItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer group`}
              onClick={() => navigate(item.path)}
            >
              <Card className={`bg-gradient-to-br ${item.gradient}/20 border-white/10 backdrop-blur-lg hover:bg-gradient-to-br hover:${item.gradient}/30 transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${item.gradient} text-white`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{item.stats}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-black/40 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Performance Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <XAxis dataKey="mes" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <RechartTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Services Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-black/40 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Distribuição de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={servicesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {servicesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {servicesData.map((service, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: service.color }}
                      />
                      <span className="text-sm text-gray-400">{service.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <BarberProfileInfo />
        </motion.div>
      </div>
    </BarberLayout>
  );
};

export default BarberDashboard;
