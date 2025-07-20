
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BarberScheduleManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="h-full min-h-0 flex flex-col bg-gray-950 text-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-100">Gestão de Escalas</h1>
          <p className="text-xs sm:text-sm text-gray-400">Configure horários de trabalho dos barbeiros</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Escala</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
            <DialogHeader>
              <DialogTitle>Nova Escala</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-gray-400">Formulário para criar nova escala será implementado</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 min-h-0 p-3 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border border-gray-700 h-auto mb-3">
            <TabsTrigger 
              value="schedule" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-gray-300"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Escalas</span>
              <span className="sm:hidden">Esc</span>
            </TabsTrigger>
            <TabsTrigger 
              value="availability" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-300"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Disponibilidade</span>
              <span className="sm:hidden">Disp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="barbers" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-gray-300"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Barbeiros</span>
              <span className="sm:hidden">Barb</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0">
            <TabsContent value="schedule" className="h-full m-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 h-full">
                {[1, 2, 3, 4, 5, 6].map((day) => (
                  <div key={day} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-100 text-sm">Segunda-feira</h3>
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Ativo</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>João Silva</span>
                        <span>08:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>Carlos Santos</span>
                        <span>14:00 - 22:00</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="availability" className="h-full m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 h-full">
                {[1, 2, 3, 4, 5, 6].map((barber) => (
                  <div key={barber} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">JS</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100 text-sm">João Silva</h3>
                        <p className="text-xs text-gray-400">Barbeiro Senior</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-300">Hoje</span>
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Disponível</span>
                      </div>
                      <div className="text-xs text-gray-400">08:00 - 18:00</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="barbers" className="h-full m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 h-full">
                {[1, 2, 3, 4].map((barber) => (
                  <div key={barber} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                    <div className="text-center mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">JS</span>
                      </div>
                      <h3 className="font-semibold text-gray-100 text-sm">João Silva</h3>
                      <p className="text-xs text-gray-400">Barbeiro Senior</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Agendamentos</span>
                        <span className="text-green-400">12</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Comissão</span>
                        <span className="text-urbana-gold">R$ 1.250</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default BarberScheduleManagement;
