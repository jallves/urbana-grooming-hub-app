
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ClientCalendarHeaderProps {
  date: Date;
  viewMode: 'day' | 'week';
  setDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week') => void;
}

const ClientCalendarHeader: React.FC<ClientCalendarHeaderProps> = ({
  date,
  viewMode,
  setDate,
  setViewMode
}) => {
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    if (viewMode === 'day') {
      newDate.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    }
    setDate(newDate);
  };

  const goToToday = () => {
    setDate(new Date());
  };

  return (
    <Card className="bg-gray-800 border-gray-700 mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate('prev')}
                className="border-gray-600 text-gray-300 hover:text-urbana-gold hover:border-urbana-gold bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h2 className="text-lg font-semibold text-white font-playfair min-w-[200px] text-center">
                {format(date, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate('next')}
                className="border-gray-600 text-gray-300 hover:text-urbana-gold hover:border-urbana-gold bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={goToToday}
              className="border-gray-600 text-gray-300 hover:text-urbana-gold hover:border-urbana-gold bg-gray-800"
            >
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
              className={viewMode === 'day' 
                ? "bg-urbana-gold text-black hover:bg-urbana-gold/90" 
                : "border-gray-600 text-gray-300 hover:text-urbana-gold hover:border-urbana-gold bg-gray-800"
              }
            >
              Dia
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' 
                ? "bg-urbana-gold text-black hover:bg-urbana-gold/90" 
                : "border-gray-600 text-gray-300 hover:text-urbana-gold hover:border-urbana-gold bg-gray-800"
              }
            >
              Semana
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCalendarHeader;
