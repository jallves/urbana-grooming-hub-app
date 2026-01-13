import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// This component requires integration_error_logs table which is not yet created
export default function IntegrationErrorsMonitor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitor de Integrações</CardTitle>
        <CardDescription>
          Acompanhe e reprocesse falhas de integração Totem → ERP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este recurso requer a tabela <code>integration_error_logs</code> que ainda não foi criada no banco de dados.
            Entre em contato com o administrador para configurar este recurso.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
