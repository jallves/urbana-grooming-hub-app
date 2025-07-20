
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import { Staff } from '@/types/barber';

interface BarberListProps {
  barbers: Staff[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BarberList: React.FC<BarberListProps> = ({
  barbers,
  isLoading,
  onEdit,
  onDelete,
}) => {
  console.log('BarberList renderizando:', { barbers, isLoading });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 sm:p-12 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
          <p className="text-gray-300 font-raleway text-sm">Carregando barbeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View Desktop/Tablet */}
      <div className="hidden md:block bg-gray-900 border border-gray-700 rounded-lg">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-700 bg-black text-urbana-gold font-playfair font-medium text-sm">
          <div>Barbeiro</div>
          <div>Email</div>
          <div>Especialidades</div>
          <div>Experiência</div>
          <div>Comissão</div>
          <div className="text-right">Ações</div>
        </div>
        
        {barbers.length > 0 ? (
          barbers.map((barber) => (
            <div key={barber.id} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-700 hover:bg-gray-800/50 transition-colors items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-urbana-gold/30">
                  <AvatarImage src={barber.image_url} />
                  <AvatarFallback className="bg-urbana-gold/10 text-urbana-gold font-playfair">
                    {barber.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-white font-raleway font-medium text-sm block truncate">{barber.name}</span>
                  <Badge 
                    className={`text-xs mt-1 ${
                      barber.is_active 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {barber.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div className="text-gray-300 font-raleway text-sm truncate">{barber.email}</div>
              <div className="text-gray-300 font-raleway text-sm truncate">{barber.specialties}</div>
              <div className="text-gray-300 font-raleway text-sm">{barber.experience}</div>
              <div className="text-gray-300 font-raleway text-sm">{barber.commission_rate}%</div>
              <div className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-400 hover:text-urbana-gold hover:bg-urbana-gold/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem 
                      onClick={() => onEdit(barber.id)}
                      className="text-white hover:bg-gray-700 font-raleway"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(barber.id)}
                      className="text-red-400 hover:bg-gray-700 font-raleway"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-urbana-gold/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-urbana-gold" />
              </div>
              <p className="text-gray-400 font-raleway">Nenhum barbeiro encontrado</p>
            </div>
          </div>
        )}
      </div>

      {/* View Mobile */}
      <div className="md:hidden space-y-3">
        {barbers.length > 0 ? (
          barbers.map((barber) => (
            <div key={barber.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 border-2 border-urbana-gold/30">
                    <AvatarImage src={barber.image_url} />
                    <AvatarFallback className="bg-urbana-gold/10 text-urbana-gold font-playfair">
                      {barber.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-raleway font-medium text-sm truncate">{barber.name}</h3>
                    <p className="text-gray-300 font-raleway text-xs truncate">{barber.email}</p>
                    <Badge 
                      className={`text-xs mt-1 ${
                        barber.is_active 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {barber.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-400 hover:text-urbana-gold hover:bg-urbana-gold/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem 
                      onClick={() => onEdit(barber.id)}
                      className="text-white hover:bg-gray-700 font-raleway"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(barber.id)}
                      className="text-red-400 hover:bg-gray-700 font-raleway"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 font-raleway">Especialidades:</span>
                  <span className="text-white font-raleway ml-1 block truncate">{barber.specialties}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 font-raleway">Experiência:</span>
                    <span className="text-white font-raleway ml-1">{barber.experience}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-raleway">Comissão:</span>
                    <span className="text-white font-raleway ml-1">{barber.commission_rate}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-urbana-gold/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-urbana-gold" />
              </div>
              <p className="text-gray-400 font-raleway">Nenhum barbeiro encontrado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberList;
