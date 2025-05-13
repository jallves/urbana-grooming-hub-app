
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useModuleAccess } from '@/components/admin/staff/hooks/useModuleAccess';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Check, X } from 'lucide-react';

const BarberModules: React.FC = () => {
  const { moduleAccess, loading } = useModuleAccess();

  const modules = [
    { 
      id: 'appointments', 
      name: 'Agendamentos', 
      description: 'Gerenciamento de agendamentos e calendário'
    },
    { 
      id: 'clients', 
      name: 'Clientes', 
      description: 'Visualização e gestão de clientes'
    },
    { 
      id: 'services', 
      name: 'Serviços', 
      description: 'Gerenciamento de serviços oferecidos'
    },
    { 
      id: 'reports', 
      name: 'Relatórios', 
      description: 'Acesso a relatórios e estatísticas'
    }
  ];

  return (
    <BarberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Seus Módulos de Acesso</h1>
          <p className="text-gray-500">
            Visualize quais módulos você tem permissão para acessar no sistema
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-urbana-gold"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(module => {
              const hasAccess = moduleAccess.includes(module.id);
              
              return (
                <Card key={module.id} className={hasAccess ? "border-urbana-gold" : "opacity-70"}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {module.name}
                      {hasAccess ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasAccess ? (
                      <p className="text-sm text-green-600">
                        Você tem acesso a este módulo
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Você não tem permissão para acessar este módulo
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50 text-xs text-gray-500 justify-end">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      ID: {module.id}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </BarberLayout>
  );
};

export default BarberModules;
