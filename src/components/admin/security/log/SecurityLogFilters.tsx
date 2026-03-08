import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { entityLabels, actionLabels } from './securityLogTypes';

interface Props {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterEntity: string;
  onEntityChange: (v: string) => void;
  filterAction: string;
  onActionChange: (v: string) => void;
  filterUser: string;
  onUserChange: (v: string) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (v: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (v: Date | undefined) => void;
  uniqueEntities: (string | null)[];
  uniqueActions: string[];
  uniqueUsers: { email: string; name: string }[];
}

const SecurityLogFilters: React.FC<Props> = ({
  searchTerm, onSearchChange,
  filterEntity, onEntityChange,
  filterAction, onActionChange,
  filterUser, onUserChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  uniqueEntities, uniqueActions, uniqueUsers,
}) => {
  const hasFilters = filterEntity !== 'all' || filterAction !== 'all' || filterUser !== 'all' || searchTerm;

  const clearFilters = () => {
    onSearchChange('');
    onEntityChange('all');
    onActionChange('all');
    onUserChange('all');
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, ação..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Date from */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-9 justify-start text-left font-normal text-xs", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateFrom ? format(dateFrom, "dd/MM/yy", { locale: ptBR }) : "De"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={onDateFromChange} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          {/* Date to */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-9 justify-start text-left font-normal text-xs", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateTo ? format(dateTo, "dd/MM/yy", { locale: ptBR }) : "Até"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={onDateToChange} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          {/* Action filter */}
          <Select value={filterAction} onValueChange={onActionChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {actionLabels[action] || action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Entity filter */}
          <Select value={filterEntity} onValueChange={onEntityChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as entidades</SelectItem>
              {uniqueEntities.map(entity => (
                <SelectItem key={entity || 'null'} value={entity || ''}>
                  {entityLabels[entity || ''] || entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User filter - separate row if users exist */}
        {uniqueUsers.length > 0 && (
          <div className="mt-3">
            <Select value={filterUser} onValueChange={onUserChange}>
              <SelectTrigger className="h-9 text-xs max-w-xs">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {uniqueUsers.map(u => (
                  <SelectItem key={u.email} value={u.email}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityLogFilters;
