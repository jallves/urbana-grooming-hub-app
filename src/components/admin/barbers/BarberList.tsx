
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

// Função para exibir apenas primeiro e segundo nome
const getShortName = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  if (names.length === 1) return names[0];
  return `${names[0]} ${names[1]}`;
};

const BarberList: React.FC<BarberListProps> = ({
  barbers,
  isLoading,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 sm:p-12 rounded-lg border">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-raleway text-sm">Carregando barbeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View Desktop/Tablet */}
      <div className="hidden md:block border rounded-lg">
        <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted font-playfair font-semibold text-sm">
          <div>Barbeiro</div>
          <div>Email</div>
          <div>Especialidades</div>
          <div>Experiência</div>
          <div>Comissão</div>
          <div className="text-right">Ações</div>
        </div>
        
        {barbers.length > 0 ? (
          barbers.map((barber) => (
            <div key={barber.id} className="grid grid-cols-6 gap-4 p-4 border-b items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarImage src={barber.image_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-playfair">
                    {barber.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-raleway font-medium text-sm block truncate" title={barber.name}>
                    {getShortName(barber.name)}
                  </span>
                  <Badge 
                    variant={barber.is_active ? 'default' : 'outline'}
                    className="text-xs mt-1"
                  >
                    {barber.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div className="font-raleway text-sm truncate">{barber.email}</div>
              <div className="font-raleway text-sm truncate">{barber.specialties}</div>
              <div className="font-raleway text-sm">{barber.experience}</div>
              <div className="font-raleway text-sm">{barber.commission_rate}%</div>
              <div className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onEdit(barber.id)}
                      className="font-raleway cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(barber.id)}
                      className="text-destructive font-raleway cursor-pointer"
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
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground font-raleway">Nenhum barbeiro encontrado</p>
            </div>
          </div>
        )}
      </div>

      {/* View Mobile */}
      <div className="md:hidden space-y-3">
        {barbers.length > 0 ? (
          barbers.map((barber) => (
            <div key={barber.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 border-2 border-primary/30">
                    <AvatarImage src={barber.image_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-playfair">
                      {barber.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-raleway font-medium text-sm truncate" title={barber.name}>
                      {getShortName(barber.name)}
                    </h3>
                    <p className="text-muted-foreground font-raleway text-xs truncate">{barber.email}</p>
                    <Badge 
                      variant={barber.is_active ? 'default' : 'outline'}
                      className="text-xs mt-1"
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
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onEdit(barber.id)}
                      className="font-raleway cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(barber.id)}
                      className="text-destructive font-raleway cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground font-raleway">Especialidades:</span>
                  <span className="font-raleway ml-1 block truncate">{barber.specialties}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground font-raleway">Experiência:</span>
                    <span className="font-raleway ml-1">{barber.experience}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-raleway">Comissão:</span>
                    <span className="font-raleway ml-1">{barber.commission_rate}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 rounded-lg border">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground font-raleway">Nenhum barbeiro encontrado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberList;
