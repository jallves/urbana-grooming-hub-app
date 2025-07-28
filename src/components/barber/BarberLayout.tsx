
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RealtimeNotifications from '@/components/ui/notifications/RealtimeNotifications';

interface BarberLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const BarberLayout: React.FC<BarberLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: '/barbeiro/dashboard', 
      icon: Home 
    },
    { 
      name: 'Agendamentos', 
      path: '/barbeiro/agendamentos', 
      icon: Calendar 
    },
    { 
      name: 'Comissões', 
      path: '/barbeiro/comissoes', 
      icon: DollarSign 
    },
    { 
      name: 'Clientes', 
      path: '/barbeiro/clientes', 
      icon: Users 
    },
    { 
      name: 'Relatórios', 
      path: '/barbeiro/relatorios', 
      icon: BarChart3 
    },
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                {title || 'Painel do Barbeiro'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <RealtimeNotifications />
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800/30 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActiveRoute(item.path)
                    ? 'text-urbana-gold border-urbana-gold'
                    : 'text-gray-400 border-transparent hover:text-white hover:border-gray-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default BarberLayout;
