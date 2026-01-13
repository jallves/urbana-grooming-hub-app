import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle } from 'lucide-react';

const TimeOffManagement: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gerenciamento de Folgas
        </CardTitle>
        <CardDescription>
          Gerencie folgas, férias e feriados da equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este recurso requer a tabela <code>time_off</code> que ainda não foi criada no banco de dados.
            Entre em contato com o administrador para configurar este recurso.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TimeOffManagement;
