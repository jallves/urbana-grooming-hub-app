
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
    },
    { 
      name: 'Agendamentos', 
      href: '/barbeiro/agendamentos', 
      icon: Calendar,
    },
    { 
      name: 'Minha Agenda', 
      href: '/barbeiro/agenda', 
      icon: Clock,
    },
    { 
      name: 'Clientes', 
      href: '/barbeiro/clientes', 
      icon: Users,
    },
    { 
      name: 'Comissões', 
      href: '/barbeiro/comissoes', 
      icon: DollarSign,
    },
    { 
      name: 'Perfil', 
      href: '/barbeiro/perfil', 
      icon: Settings,
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

  const getCurrentModuleName = () => {
    const currentItem = menuItems.find(item => isActive(item.href, item.exact));
    return currentItem?.name || 'Painel do Barbeiro';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex overflow-hidden">
      {/* Fixed Sidebar - Desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <div className="flex flex-col flex-grow bg-gray-900/95 backdrop-blur-lg border-r border-gray-700/50 shadow-xl">
          {/* Sidebar Header */}
          <div className="flex items-center h-16 px-6 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <Scissors className="w-6 h-6 text-black" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">Barbeiro</span>
                <p className="text-xs text-gray-400">Costa Urbana</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    active
                      ? 'bg-urbana-gold text-black shadow-lg font-medium'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-black">
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
              size="sm"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-lg shadow-xl border-r border-gray-700/50 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
              <Scissors className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Barbeiro</span>
              <p className="text-xs text-gray-400">Costa Urbana</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  active
                    ? 'bg-urbana-gold text-black shadow-lg font-medium'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50 h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-700/50 w-8 h-8 sm:w-9 sm:h-9"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white">
                {title || getCurrentModuleName()}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">Costa Urbana Barbearia</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                <AvatarFallback className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-black text-xs sm:text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'B'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">
                  {user?.email?.split('@')[0] || 'Barbeiro'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-gray-900 overflow-auto">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BarberLayout;
