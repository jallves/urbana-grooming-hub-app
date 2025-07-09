import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LogOut,
  Menu,
  X,
  BarChart2,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/barbeiro', icon: BarChart2, exact: true },
    { name: 'Agendamentos', href: '/barbeiro/agendamentos', icon: Calendar },
    { name: 'Minha Agenda', href: '/barbeiro/agenda', icon: Clock },
    { name: 'Clientes', href: '/barbeiro/clientes', icon: Users },
    { name: 'Comissões', href: '/barbeiro/comissoes', icon: DollarSign },
    { name: 'Perfil', href: '/barbeiro/perfil', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/barbeiro/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const isDashboard = location.pathname === '/barbeiro';

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-lg border-r border-gray-700/50 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-urbana-gold">Barbeiro</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-colors ${
                  active
                    ? 'bg-urbana-gold text-black font-medium'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-urbana-gold text-black">
                {user?.email?.charAt(0).toUpperCase() || 'B'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split('@')[0] || 'Barbeiro'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Header */}
        <header className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-700/50"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {!isDashboard && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/barbeiro')}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}

              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">
                  {title || 'Painel do Barbeiro'}
                </h1>
                <p className="text-sm text-gray-400">Costa Urbana Barbearia</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default BarberLayout;
