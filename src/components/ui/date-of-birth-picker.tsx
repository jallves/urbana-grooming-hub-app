import * as React from "react";
import { format, setMonth, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface DateOfBirthPickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateOfBirthPicker({
  value,
  onChange,
  className,
  placeholder = "Selecione a data",
}: DateOfBirthPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    value || new Date(currentYear - 25, 0, 1)
  );

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(displayMonth, parseInt(month));
    setDisplayMonth(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(displayMonth, parseInt(year));
    setDisplayMonth(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-12 justify-start text-left font-normal border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center gap-2 p-3 pb-0">
          <Select
            value={displayMonth.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="flex-1 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {MONTHS.map((month, i) => (
                <SelectItem key={i} value={i.toString()} className="min-h-[44px] flex items-center">
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={displayMonth.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-24 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()} className="min-h-[44px] flex items-center">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          disabled={(date) => date > new Date()}
          locale={ptBR}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
