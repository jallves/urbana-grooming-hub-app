
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Scissors, Edit, Trash2, MoreVertical, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  is_active: boolean;
  created_at: string;
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-urbana-gold" />
            <Input
              placeholder="Buscar serviços..."
              className="pl-8 sm:pl-10 bg-gray-700 border-urbana-gold/30 text-white placeholder:text-gray-400 focus:border-urbana-gold text-xs sm:text-sm h-8 sm:h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            className="bg-urbana-gold text-black hover:bg-urbana-gold/90 font-raleway font-medium h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Serviço</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Lista de serviços */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Scissors className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">Nenhum serviço encontrado</p>
            </div>
          </div>
        ) : (
          <div className="p-3 sm:p-4 h-full overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white text-sm sm:text-base truncate mr-2">
                        {service.name}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                          <DropdownMenuItem className="text-white hover:bg-gray-700 text-xs sm:text-sm">
                            <Edit className="h-3 w-3 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:bg-gray-700 text-xs sm:text-sm">
                            <Trash2 className="h-3 w-3 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {service.description && (
                      <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Preço:</span>
                        <span className="text-urbana-gold font-medium">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Duração:</span>
                        <span className="text-white flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration}min
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status:</span>
                        <Badge 
                          variant={service.is_active ? "default" : "outline"}
                          className={`text-xs ${service.is_active ? "bg-urbana-gold text-black" : "text-gray-400 border-gray-600"}`}
                        >
                          {service.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceList;
