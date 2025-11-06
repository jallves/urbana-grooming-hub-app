
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BarberScheduleManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gestão de Escalas</h1>
          <p className="text-xs sm:text-sm text-gray-600">Configure horários de trabalho dos barbeiros</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-urbana-gold to-yellow-500 hover:from-urbana-gold/90 hover:to-yellow-500/90 text-white text-sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Escala</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Nova Escala</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-gray-600">Formulário para criar nova escala será implementado</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 min-h-0 p-3 sm:p-4 bg-gray-50">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 h-auto mb-3">
            <TabsTrigger 
              value="schedule" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Escalas</span>
              <span className="sm:hidden">Esc</span>
            </TabsTrigger>
            <TabsTrigger 
              value="availability" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Disponibilidade</span>
              <span className="sm:hidden">Disp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="barbers" 
              className="flex items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Barbeiros</span>
              <span className="sm:hidden">Barb</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 min-h-0 overflow-auto">
            <TabsContent value="schedule" className="h-full m-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((day) => (
                  <div key={day} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">Segunda-feira</h3>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Ativo</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-700">
                        <span>João Silva</span>
                        <span>08:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-700">
                        <span>Carlos Santos</span>
                        <span>14:00 - 22:00</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="availability" className="h-full m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((barber) => (
                  <div key={barber} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">JS</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">João Silva</h3>
                        <p className="text-xs text-gray-600">Barbeiro Senior</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Hoje</span>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Disponível</span>
                      </div>
                      <div className="text-xs text-gray-600">08:00 - 18:00</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="barbers" className="h-full m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((barber) => (
                  <div key={barber} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="text-center mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">JS</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">João Silva</h3>
                      <p className="text-xs text-gray-600">Barbeiro Senior</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Agendamentos</span>
                        <span className="text-green-600">12</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Comissão</span>
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
