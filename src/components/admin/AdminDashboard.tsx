import React, { useState } from 'react';
import FinancialMetricsCards from './dashboard/FinancialMetricsCards';
import OperationalMetricsCards from './dashboard/OperationalMetricsCards';
import FinancialEvolutionChart from './dashboard/FinancialEvolutionChart';
import PendingAccountsWidget from './dashboard/PendingAccountsWidget';
import TopBarbersWidget from './dashboard/TopBarbersWidget';
import InactiveClientsWidget from './dashboard/InactiveClientsWidget';
import BirthdayWidget from './dashboard/BirthdayWidget';
import QuickActionsGrid from './dashboard/QuickActionsGrid';
import DashboardMonthFilter from './dashboard/DashboardMonthFilter';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';

export default function AdminDashboard() {
  useDashboardRealtime();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 lg:space-y-6 p-2 sm:p-3 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
              Dashboard Financeiro
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-0.5 sm:mt-1">
              Visão completa e gerencial do desempenho financeiro da empresa
            </p>
          </div>
          <DashboardMonthFilter
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <FinancialMetricsCards month={selectedMonth} year={selectedYear} />

      {/* Operational Metrics */}
      <OperationalMetricsCards month={selectedMonth} year={selectedYear} />

      {/* Quick Actions Grid */}
      <QuickActionsGrid />

      {/* Top Barbers and Financial Evolution in Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <TopBarbersWidget month={selectedMonth} year={selectedYear} />
        <FinancialEvolutionChart />
      </div>

      {/* Pending Accounts + Inactive Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PendingAccountsWidget />
        <BirthdayWidget month={selectedMonth} year={selectedYear} />
      </div>

      {/* Inactive Clients */}
      <InactiveClientsWidget />
    </div>
  );
}
