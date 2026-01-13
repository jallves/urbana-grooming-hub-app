import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const TimeOffManager: React.FC = () => {
  return (
    <div className="space-y-4">
      <Alert className="border-yellow-500 bg-yellow-500/10">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-200">Funcionalidade em desenvolvimento</AlertTitle>
        <AlertDescription className="text-yellow-300/80">
          <p className="mb-2">
            O gerenciamento de ausências requer a criação da tabela <code className="bg-yellow-900/50 px-1 rounded">time_off</code> no banco de dados.
          </p>
          <p className="text-sm">
            Esta funcionalidade permitirá:
          </p>
          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
            <li>Registrar períodos de férias</li>
            <li>Registrar folgas programadas</li>
            <li>Bloquear horários para ausências</li>
            <li>Evitar agendamentos durante ausências</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="text-center py-8 text-gray-400">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Gerenciamento de ausências em breve disponível</p>
      </div>
    </div>
  );
};

export default TimeOffManager;
