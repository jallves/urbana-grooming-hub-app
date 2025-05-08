
import React from 'react';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Scissors, 
  Clock, 
  TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Agendamentos Hoje" 
              value="12" 
              description="+2 comparado a ontem" 
              icon={Calendar} 
              trend="up"
            />
            <StatCard 
              title="Faturamento do Dia" 
              value="R$ 840,00" 
              description="6 serviços concluídos" 
              icon={DollarSign} 
              trend="up"
            />
            <StatCard 
              title="Clientes Novos" 
              value="3" 
              description="no último mês" 
              icon={Users} 
              trend="up"
            />
            <StatCard 
              title="Taxa de Ocupação" 
              value="78%" 
              description="Média semanal" 
              icon={Clock} 
              trend="down"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Próximos Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">Alexandre Souza</p>
                        <p className="text-sm text-gray-500">Corte + Barba</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">14:30</p>
                        <p className="text-sm text-gray-500">com Rafael</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Desempenho dos Barbeiros</CardTitle>
              </CardHeader>
              <CardContent>
                {['Rafael', 'Bruno', 'Marcos'].map((name, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{name}</span>
                      <span className="text-sm">{90 - i * 10}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-urbana-gold h-2 rounded-full" 
                        style={{ width: `${90 - i * 10}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="agendamentos">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Conteúdo dos agendamentos será exibido aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Conteúdo financeiro será exibido aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend 
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded-full">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
