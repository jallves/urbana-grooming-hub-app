import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
  placeholder = "DD/MM/AAAA",
}: DateOfBirthPickerProps) {
  const formatDateToDisplay = (date?: Date): string => {
    if (!date) return "";
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear().toString();
    return `${d}/${m}/${y}`;
  };

  const [displayValue, setDisplayValue] = React.useState(formatDateToDisplay(value));

  React.useEffect(() => {
    setDisplayValue(formatDateToDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (raw.length <= 2) {
      formatted = raw;
    } else if (raw.length <= 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    } else {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    }
    setDisplayValue(formatted);

    if (raw.length === 8) {
      const day = parseInt(raw.slice(0, 2));
      const month = parseInt(raw.slice(2, 4));
      const year = parseInt(raw.slice(4, 8));
      const date = new Date(year, month - 1, day, 12, 0, 0);
      if (
        date.getDate() === day &&
        date.getMonth() === month - 1 &&
        date.getFullYear() === year &&
        date <= new Date()
      ) {
        onChange(date);
      } else {
        onChange(undefined);
      }
    } else {
      onChange(undefined);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      maxLength={10}
      className={cn("h-12 rounded-xl", className)}
    />
  );
}
