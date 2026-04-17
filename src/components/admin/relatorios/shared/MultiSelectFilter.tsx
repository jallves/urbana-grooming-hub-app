import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MultiSelectFilterProps {
  /** Rótulo padrão exibido quando nada está selecionado */
  placeholder: string;
  /** Lista de opções (cada string é um valor selecionável) */
  options: string[];
  /** Conjunto atual de valores selecionados (vazio = "todos") */
  selected: string[];
  /** Callback quando a seleção muda */
  onChange: (next: string[]) => void;
  /** Texto exibido no contador quando há seleção (ex: "selecionados") */
  selectedLabel?: string;
  /** Classes adicionais para o trigger */
  triggerClassName?: string;
  /** Permite buscar dentro das opções */
  searchable?: boolean;
}

/**
 * Filtro multi-seleção compacto, baseado em Popover + Checkbox.
 * Comportamento: lista vazia (selected = []) significa "Todos".
 */
const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  placeholder,
  options,
  selected,
  onChange,
  selectedLabel = 'selecionados',
  triggerClassName,
  searchable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(term));
  }, [options, search]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  const display =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0]
      : `${selected.length} ${selectedLabel}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-white border-gray-300 h-9 text-xs font-normal',
            selected.length > 0 && 'border-primary text-primary font-medium',
            triggerClassName
          )}
        >
          <span className="truncate">{display}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[220px] p-0 bg-white border-gray-200"
        align="start"
      >
        {searchable && (
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 bg-gray-50">
          <button
            onClick={selectAll}
            className="text-[10px] text-primary hover:underline font-medium"
            type="button"
          >
            Selecionar todos
          </button>
          <button
            onClick={clearAll}
            className="text-[10px] text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
            type="button"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        </div>

        <div className="max-h-[260px] overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-3">Nenhum resultado</p>
          ) : (
            filteredOptions.map(opt => {
              const isChecked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 text-xs',
                    isChecked && 'bg-primary/5'
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggle(opt)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectFilter;
