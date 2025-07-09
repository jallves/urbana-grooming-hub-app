
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LogOut,
  Menu,
  X,
  BarChart3,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Settings,
  ArrowLeft,
  Scissors,
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
    { 
      name: 'Dashboard', 
      href: '/barbeiro', 
      icon: BarChart3, 
      exact: true,
      description: 'Visão geral'
    },
    { 
      name: 'Agendamentos', 
      href: '/barbeiro/agendamentos', 
      icon: Calendar,
      description: 'Gerenciar agenda'
    },
    { 
      name: 'Minha Agenda', 
      href: '/barbeiro/agenda', 
      icon: Clock,
      description: 'Horários disponíveis'
    },
    { 
      name: 'Clientes', 
      href: '/barbeiro/clientes', 
      icon: Users,
      description: 'Base de clientes'
    },
    { 
      name: 'Comissões', 
      href: '/barbeiro/comissoes', 
      icon: DollarSign,
      description: 'Ganhos e comissões'
    },
    { 
      name: 'Perfil', 
      href: '/barbeiro/perfil', 
      icon: Settings,
      description: 'Configurações'
    },
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
    <div className="min-h-screen bg-gray-50 text-gray-900 w-full">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-gray-200 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Barbeiro</span>
              <p className="text-xs text-gray-500">Painel Profissional</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-6 px-4">
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
                className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl mb-2 text-left transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div>
                  <span className="font-medium">{item.name}</span>
                  <p className={`text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                {user?.email?.charAt(0).toUpperCase() || 'B'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split('@')[0] || 'Barbeiro'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="w-full min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-8 py-4 w-full">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Scissors className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">Barbeiro</span>
                    <p className="text-xs text-gray-500">Costa Urbana</p>
                  </div>
                </div>

                <nav className="flex items-center space-x-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, item.exact);

                    return (
                      <button
                        key={item.name}
                        onClick={() => navigate(item.href)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {!isDashboard && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/barbeiro')}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}

              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-900">
                  {title || 'Painel do Barbeiro'}
                </h1>
                <p className="text-sm text-gray-500">Costa Urbana Barbearia</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'B'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email?.split('@')[0] || 'Barbeiro'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content - Constrained Width */}
        <main className="w-full max-w-7xl mx-auto p-4 lg:p-8">{children}</main>
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
