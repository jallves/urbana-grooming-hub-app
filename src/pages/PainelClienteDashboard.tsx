
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, LogOut, Settings, Phone, Mail, Scissors } from 'lucide-react';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { motion } from 'framer-motion';

export default function PainelClienteDashboard() {
  const { cliente, logout } = usePainelClienteAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/painel-cliente/login');
  };

  if (!cliente) {
    return <Navigate to="/painel-cliente/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-500 rounded-full shadow-lg">
                <Scissors className="h-8 w-8 text-black" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel do Cliente</h1>
            <p className="text-gray-400">Bem-vindo, {cliente.nome}!</p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-4 flex items-center space-x-3">
                <User className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-gray-400 text-sm">Nome</p>
                  <p className="text-white font-medium">{cliente.nome}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-4 flex items-center space-x-3">
                <Mail className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-gray-400 text-sm">E-mail</p>
                  <p className="text-white font-medium">{cliente.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-4 flex items-center space-x-3">
                <Phone className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-gray-400 text-sm">WhatsApp</p>
                  <p className="text-white font-medium">{cliente.whatsapp}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-zinc-900 border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Meus Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Visualize e gerencie seus agendamentos
                </p>
                <Button 
                  onClick={() => navigate('/painel-cliente/agendamentos')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  Ver Agendamentos
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-amber-500" />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Edite suas informações pessoais
                </p>
                <Button 
                  onClick={() => navigate('/painel-cliente/perfil')}
                  variant="outline"
                  className="w-full border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black"
                >
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Logout Button */}
          <div className="text-center">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
