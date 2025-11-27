import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Settings,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsGrid: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Agendamentos',
      description: 'Gerenciar horários',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      action: () => navigate('/admin/agendamentos'),
    },
    {
      title: 'Financeiro',
      description: 'ERP Completo',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: () => navigate('/admin/erp-financeiro'),
    },
    {
      title: 'Clientes',
      description: 'Base de clientes',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      action: () => navigate('/admin/clientes'),
    },
    {
      title: 'Barbeiros',
      description: 'Equipe e comissões',
      icon: Scissors,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      action: () => navigate('/admin/barbeiros'),
    },
    {
      title: 'Produtos',
      description: 'Estoque e vendas',
      icon: Package,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      action: () => navigate('/admin/produtos'),
    },
    {
      title: 'Relatórios',
      description: 'Análises detalhadas',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      action: () => navigate('/admin/relatorios'),
    },
  ];

  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3 lg:p-4 rounded-lg border-2 ${action.borderColor} ${action.bgColor} hover:shadow-md transition-all hover:scale-105 active:scale-95 min-h-[100px] sm:min-h-[120px] touch-manipulation`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${action.bgColor} flex items-center justify-center mb-1.5 sm:mb-2 border ${action.borderColor} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color}`} />
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-900 text-center leading-tight">
                  {action.title}
                </p>
                <p className="text-[9px] sm:text-xs text-gray-500 text-center mt-0.5 sm:mt-1 leading-tight hidden sm:block">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsGrid;
