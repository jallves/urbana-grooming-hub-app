
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Home, Users, User, Package, DollarSign, Settings, BarChart2, MessageSquare, Tag } from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: <Home className="h-5 w-5" /> },
    { name: 'Agendamentos', href: '/admin/agendamentos', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Profissionais', href: '/admin/profissionais', icon: <User className="h-5 w-5" /> },
    { name: 'Clientes', href: '/admin/clientes', icon: <Users className="h-5 w-5" /> },
    { name: 'Produtos e Serviços', href: '/admin/produtos', icon: <Package className="h-5 w-5" /> },
    { name: 'Financeiro', href: '/admin/financeiro', icon: <DollarSign className="h-5 w-5" /> },
    { name: 'Marketing', href: '/admin/marketing', icon: <Tag className="h-5 w-5" /> },
    { name: 'Relatórios', href: '/admin/relatorios', icon: <BarChart2 className="h-5 w-5" /> },
    { name: 'Suporte', href: '/admin/suporte', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Configurações', href: '/admin/configuracoes', icon: <Settings className="h-5 w-5" /> }
  ];

  return (
    <div className="h-full px-3 py-4 overflow-y-auto bg-background border-r">
      <div className="mb-6 px-2">
        <h2 className="text-xl font-semibold">Admin</h2>
      </div>
      <ul className="space-y-2 px-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`
              }
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminSidebar;
