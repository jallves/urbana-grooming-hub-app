import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminRoute from '../components/auth/AdminRoute';

const AdminPage: React.FC = () => {
  return (
    <AdminRoute allowBarber={true}>
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 border-b border-amber-500/30 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Painel da Barbearia</h1>
                  <p className="text-gray-300 mt-1">Gerencie agendamentos, serviços e equipe</p>
                </div>
              </div>
            </div>
            
            {/* Adicionei cards de resumo antes do dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium">AGENDAMENTOS HOJE</h3>
                <p className="text-2xl font-bold text-white mt-2">12</p>
                <div className="mt-4 h-2 bg-gray-700 rounded-full">
                  <div className="h-2 bg-amber-500 rounded-full w-3/4"></div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium">FATURAMENTO</h3>
                <p className="text-2xl font-bold text-white mt-2">R$ 2.450</p>
                <div className="flex items-center mt-2 text-amber-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs ml-1">+12% em relação à semana passada</span>
                </div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium">BARBEIROS DISPONÍVEIS</h3>
                <p className="text-2xl font-bold text-white mt-2">3/5</p>
                <div className="flex mt-3 space-x-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className={`h-2 rounded-full flex-1 ${item <= 3 ? 'bg-amber-500' : 'bg-gray-700'}`}></div>
                  ))}
                </div>
              </div>
            </div>
            
            <AdminDashboard />
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminPage;