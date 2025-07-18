import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2, Search, Plus, Clock } from 'lucide-react';
import ServiceForm from './ServiceForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  is_active: boolean;
}

const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <>
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-urbana-gold" />
            <Input
              placeholder="Buscar serviços..."
              className="pl-10 bg-black border-urbana-gold/30 text-white placeholder:text-gray-400 focus:border-urbana-gold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreateService} 
            className="w-full sm:w-auto bg-urbana-gold text-black hover:bg-urbana-gold/90 font-raleway font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </div>

        <div className="rounded-md border border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-urbana-gold">Nome</TableHead>
                <TableHead className="text-urbana-gold">Preço</TableHead>
                <TableHead className="text-urbana-gold">Duração</TableHead>
                <TableHead className="text-urbana-gold">Status</TableHead>
                <TableHead className="text-right text-urbana-gold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-white">
                    Carregando serviços...
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-white">
                    Nenhum serviço encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id} className="border-gray-700 hover:bg-gray-800">
                    <TableCell className="font-medium text-white">
                      {service.name}
                      {service.description && (
                        <p className="text-sm text-gray-400 truncate max-w-xs">{service.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-white">
                      R$ {service.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-white">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-urbana-gold" />
                        {formatDuration(service.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={service.is_active ? "default" : "outline"}
                        className={service.is_active ? "bg-urbana-gold text-black" : "text-gray-400"}
                      >
                        {service.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:text-urbana-gold">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          <DropdownMenuItem 
                            onClick={() => handleEditService(service.id)}
                            className="text-white hover:bg-gray-800"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => confirmDeleteService(service.id)}
                            className="text-red-400 hover:bg-gray-800"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {isFormOpen && (
        <ServiceForm
          serviceId={selectedService}
          onCancel={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchServices();
          }}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir serviço</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteService}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  async function fetchServices() {
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
      toast.error('Erro ao carregar serviços', {
        description: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateService() {
    setSelectedService(null);
    setIsFormOpen(true);
  }

  function handleEditService(serviceId: string) {
    setSelectedService(serviceId);
    setIsFormOpen(true);
  }

  function confirmDeleteService(serviceId: string) {
    setServiceToDelete(serviceId);
    setIsDeleteDialogOpen(true);
  }

  async function handleDeleteService() {
    if (!serviceToDelete) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete);

      if (error) throw error;

      setServices(services.filter(service => service.id !== serviceToDelete));
      toast.success('Serviço excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast.error('Erro ao excluir serviço', {
        description: (error as Error).message
      });
    } finally {
      setServiceToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }
};

export default ServiceList;
