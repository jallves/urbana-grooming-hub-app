import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Home, Calendar, Users, Gift, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: Home },
  { name: 'Agendamentos', path: '/admin/agendamentos', icon: Calendar },
  { name: 'Clientes', path: '/admin/clientes', icon: Users },
  { name: 'Aniversários', path: '/admin/aniversarios', icon: Gift },
  { name: 'Configurações', path: '/admin/configuracoes', icon: Settings },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gray-900 text-gray-100 border-r border-gray-800">
        <div className="h-16 flex items-center justify-center text-2xl font-bold text-white bg-gray-800">
          Painel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Sidebar Mobile (com animação) */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-gray-100 shadow-lg lg:hidden flex flex-col"
      >
        {/* Header do Drawer */}
        <div className="h-16 flex items-center justify-between px-4 bg-gray-800">
          <span className="text-lg font-bold">Menu</span>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};

export default AdminSidebar;
