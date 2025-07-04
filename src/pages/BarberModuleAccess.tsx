
import React from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Calendar, Users, Scissors, ChartBar, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useModuleAccess } from '@/components/admin/staff/hooks/useModuleAccess';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const BarberModuleAccess: React.FC = () => {
  const { moduleAccess, loading } = useModuleAccess();

  const modules: Module[] = [
    {
      id: 'appointments',
      name: 'Agendamentos',
      description: 'Visualização e gerenciamento da agenda de atendimentos',
      icon: <Calendar className="h-5 w-5" />,
      path: '/barbeiro/agendamentos'
    },
    {
      id: 'clients',
      name: 'Clientes',
      description: 'Acesso aos dados dos clientes atendidos',
      icon: <Users className="h-5 w-5" />,
      path: '/barbeiro/clientes'
    },
    {
      id: 'services',
      name: 'Serviços',
      description: 'Visualização dos serviços disponíveis',
      icon: <Scissors className="h-5 w-5" />,
      path: '/barbeiro/servicos'
    },
    {
      id: 'reports',
      name: 'Relatórios',
      description: 'Acesso a relatórios de comissões e desempenho',
      icon: <ChartBar className="h-5 w-5" />,
      path: '/barbeiro/comissoes'
    }
  ];

  if (loading) {
    return (
      <BarberLayout title="Permissões">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white rounded-full"></div>
        </div>
      </BarberLayout>
    );
  }

  return (
    <BarberLayout title="Permissões de Acesso">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Suas Permissões</h2>
          <p className="text-zinc-400">
            Visualize suas permissões de acesso aos módulos do sistema
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-white">Módulos Disponíveis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {modules.map((module) => {
                const hasAccess = moduleAccess.includes(module.id);

                return (
                  <Tooltip.Provider key={module.id}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.97 }}
                          className="transition-transform"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${hasAccess ? 'bg-primary/10' : 'bg-zinc-800'}`}>
                                {module.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-white">{module.name}</h3>
                                  {hasAccess ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                      Acesso Permitido
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                      Sem Acesso
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-zinc-400 mt-1">{module.description}</p>
                              </div>
                            </div>
                            {!hasAccess && (
                              <Lock className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                            )}
                          </div>
                        </motion.div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content className="bg-zinc-800 text-white text-sm px-3 py-2 rounded-md shadow-md">
                          {hasAccess
                            ? 'Você tem acesso a este módulo'
                            : 'Solicite acesso ao administrador'}
                          <Tooltip.Arrow className="fill-zinc-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                    <Separator className="my-4" />
                  </Tooltip.Provider>
                );
              })}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg bg-zinc-800 p-4"
              >
                <p className="text-sm text-zinc-300">
                  Para solicitar acesso a módulos adicionais, entre em contato com o administrador do sistema.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </BarberLayout>
  );
};

export default BarberModuleAccess;
