import React, { useState } from 'react';
import { Crown, Users, CreditCard, LayoutDashboard } from 'lucide-react';
import SubscriptionDashboardTab from './SubscriptionDashboardTab';
import SubscriptionPlansTab from './SubscriptionPlansTab';
import SubscriptionSubscribersTab from './SubscriptionSubscribersTab';
import SubscriptionPaymentsTab from './SubscriptionPaymentsTab';

const tabs = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, activeColor: 'bg-amber-500 text-white shadow-amber-200', inactiveColor: 'bg-amber-50 text-amber-700 hover:bg-amber-100', iconActive: 'text-white', iconInactive: 'text-amber-500' },
  { id: 'plans', label: 'Planos', icon: Crown, activeColor: 'bg-violet-500 text-white shadow-violet-200', inactiveColor: 'bg-violet-50 text-violet-700 hover:bg-violet-100', iconActive: 'text-white', iconInactive: 'text-violet-500' },
  { id: 'subscribers', label: 'Assinantes', icon: Users, activeColor: 'bg-emerald-500 text-white shadow-emerald-200', inactiveColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', iconActive: 'text-white', iconInactive: 'text-emerald-500' },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard, activeColor: 'bg-blue-500 text-white shadow-blue-200', inactiveColor: 'bg-blue-50 text-blue-700 hover:bg-blue-100', iconActive: 'text-white', iconInactive: 'text-blue-500' },
];

const SubscriptionModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Tab Navigation */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-2 sm:px-4 lg:px-6 pt-2 sm:pt-4 pb-2">
        <div className="flex gap-1.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm
                  transition-all duration-200 border whitespace-nowrap flex-shrink-0
                  ${isActive
                    ? `${tab.activeColor} border-transparent shadow-lg`
                    : `${tab.inactiveColor} border-transparent`
                  }
                `}
              >
                <tab.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? tab.iconActive : tab.iconInactive}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 pb-4">
        {activeTab === 'dashboard' && <SubscriptionDashboardTab />}
        {activeTab === 'plans' && <SubscriptionPlansTab />}
        {activeTab === 'subscribers' && <SubscriptionSubscribersTab />}
        {activeTab === 'payments' && <SubscriptionPaymentsTab />}
      </div>
    </div>
  );
};

export default SubscriptionModule;
