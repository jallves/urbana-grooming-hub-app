
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, Clock, CheckCircle, TrendingUp, Star, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarberProfileInfo from '@/components/barber/BarberProfileInfo';
import { useBarberDashboardMetrics } from '@/hooks/useBarberDashboardMetrics';
import { motion } from 'framer-motion';

const BarberDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, loading } = useBarberDashboardMetrics();

  const quickAccessItems = [
    {
      title: 'Meus Agendamentos',
      description: 'Gerenciar agenda do dia',
      icon: <Calendar className="h-6 w-6" />,
      path: '/barbeiro/agendamentos',
      gradient: 'from-blue-600 to-cyan-600',
      stats: loading ? '...' : metrics.upcomingAppointments,
      color: 'text-blue-400'
    },
    {
      title: 'Comissões',
      description: 'Acompanhar ganhos',
      icon: <DollarSign className="h-6 w-6" />,
      path: '/barbeiro/comissoes',
      gradient: 'from-urbana-gold to-yellow-500',
      stats: loading ? '...' : `R$ ${metrics.totalRevenue.toFixed(0)}`,
      color: 'text-urbana-gold'
    },
    {
      title: 'Meus Clientes',
      description: 'Histórico de atendimentos',
      icon: <Users className="h-6 w-6" />,
      path: '/barbeiro/clientes',
      gradient: 'from-purple-600 to-violet-600',
      stats: loading ? '...' : metrics.completedAppointments,
      color: 'text-purple-400'
    },
    {
      title: 'Agenda Completa',
      description: 'Visualizar calendário',
      icon: <Clock className="h-6 w-6" />,
      path: '/barbeiro/agenda',
      gradient: 'from-green-600 to-emerald-600',
      stats: 'Ver Agenda',
      color: 'text-green-400'
    }
  ];

  const statsCards = [
    {
      title: 'Agendamentos',
      value: loading ? '...' : metrics.totalAppointments,
      subtitle: 'Este mês',
      icon: Calendar,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Concluídos',
      value: loading ? '...' : metrics.completedAppointments,
      subtitle: 'Atendimentos',
      icon: CheckCircle,
      color: 'text-green-400',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Receita',
      value: loading ? '...' : `R$ ${metrics.totalRevenue.toFixed(0)}`,
      subtitle: 'Este mês',
      icon: DollarSign,
      color: 'text-urbana-gold',
      bgGradient: 'from-urbana-gold/10 to-yellow-500/10',
      borderColor: 'border-urbana-gold/20'
    },
    {
      title: 'Próximos',
      value: loading ? '...' : metrics.upcomingAppointments,
      subtitle: 'Agendados',
      icon: Clock,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  return (
    <BarberLayout title="Dashboard">
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-10 w-64 h-64 bg-urbana-gold rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-10 w-80 h-80 bg-urbana-gold rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-urbana-gold to-white bg-clip-text text-transparent">
                Bem-vindo, {user?.email?.split('@')[0]}
              </span>
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
              Gerencie seu trabalho com excelência profissional
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {statsCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-lg border ${stat.borderColor} hover:border-urbana-gold/40 transition-all duration-300`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <p className="text-xs text-gray-400">{stat.subtitle}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {quickAccessItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer group"
                onClick={() => navigate(item.path)}
              >
                <Card className="bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-lg border border-gray-700/50 hover:border-urbana-gold/50 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${item.gradient}`}>
                        {item.icon}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-urbana-gold transition-colors" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2 group-hover:text-urbana-gold transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-2xl font-bold ${item.color}`}>{item.stats}</span>
                      <Eye className="h-4 w-4 text-gray-500 group-hover:text-urbana-gold transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
      </div>
    </BarberLayout>
  );
};

export default BarberDashboard;
