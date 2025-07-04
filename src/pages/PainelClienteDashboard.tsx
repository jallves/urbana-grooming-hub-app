
import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Phone, Mail, Plus, Clock, MapPin } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { motion } from 'framer-motion';
import DashboardContainer from '@/components/ui/containers/DashboardContainer';

export default function PainelClienteDashboard() {
  const { cliente } = usePainelClienteAuth();
  const navigate = useNavigate();

  if (!cliente) {
    return <Navigate to="/painel-cliente/login" replace />;
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 }
    })
  };

  return (
    <DashboardContainer>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Bem-vindo, {cliente.nome}!
        </h1>
        <p className="text-gray-400">
          Gerencie seus agendamentos e perfil de forma simples e rápida
        </p>
      </motion.div>

      {/* Botão Principal - Agendar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 border-none shadow-xl mb-8">
          <CardContent className="p-6 text-center">
            <Plus className="h-12 w-12 text-black mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">Agendar Horário</h2>
            <p className="text-black/80 mb-4">
              Reserve seu horário com nossos barbeiros especializados
            </p>
            <Button
              onClick={() => navigate('/painel-cliente/agendar')}
              size="lg"
              className="bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Agendar Agora
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-gray-900 border border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <User className="h-5 w-5 text-amber-500 mr-2" />
              <CardTitle className="text-white text-lg">Seus Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-gray-300">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{cliente.email}</span>
              </div>
              {cliente.whatsapp && (
                <div className="flex items-center text-gray-300">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">{cliente.whatsapp}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-gray-900 border border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <MapPin className="h-5 w-5 text-amber-500 mr-2" />
              <CardTitle className="text-white text-lg">Nossa Localização</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-2">
                Urbana Barbearia - Centro
              </p>
              <div className="flex items-center text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-xs">Seg-Sex: 9h às 18h | Sáb: 8h às 17h</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-gray-900 border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all hover:shadow-lg">
            <CardContent 
              className="p-6 text-center"
              onClick={() => navigate('/painel-cliente/agendamentos')}
            >
              <Calendar className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Meus Agendamentos</h3>
              <p className="text-gray-400 text-sm">
                Visualize e gerencie seus horários marcados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-gray-900 border border-gray-700 hover:border-amber-500/50 cursor-pointer transition-all hover:shadow-lg">
            <CardContent 
              className="p-6 text-center"
              onClick={() => navigate('/painel-cliente/perfil')}
            >
              <User className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Editar Perfil</h3>
              <p className="text-gray-400 text-sm">
                Atualize suas informações pessoais
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardContainer>
  );
}
