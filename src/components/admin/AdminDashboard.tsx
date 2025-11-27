import React from 'react';
import FinancialMetricsCards from './dashboard/FinancialMetricsCards';
import FinancialEvolutionChart from './dashboard/FinancialEvolutionChart';
import PendingAccountsWidget from './dashboard/PendingAccountsWidget';
import TopBarbersWidget from './dashboard/TopBarbersWidget';
import QuickActionsGrid from './dashboard/QuickActionsGrid';

export default function AdminDashboard() {
  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 lg:space-y-6 p-2 sm:p-3 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header Section - Mobile First */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-200">
        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
          Dashboard Financeiro
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-0.5 sm:mt-1">
          Visão completa e gerencial do desempenho financeiro da empresa
        </p>
      </div>

      {/* Financial Metrics Cards */}
      <FinancialMetricsCards />

      {/* Quick Actions Grid */}
      <QuickActionsGrid />

      {/* Financial Evolution Chart */}
      <FinancialEvolutionChart />

      {/* Pending Accounts */}
      <PendingAccountsWidget />

      {/* Top Barbers */}
      <TopBarbersWidget />
    </div>
  );
}
