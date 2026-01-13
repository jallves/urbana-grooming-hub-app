import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Settings2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TEFSettingsForm: React.FC = () => {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-gray-900">Configurações TEF</CardTitle>
        </div>
        <CardDescription className="text-gray-600">
          Configure as opções de integração com o TEF PayGo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Funcionalidade em desenvolvimento</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <p className="mb-2">
              As configurações TEF requerem a criação da tabela <code className="bg-yellow-200 px-1 rounded">tef_settings</code> no banco de dados.
            </p>
            <p className="text-sm">
              Esta funcionalidade permitirá configurar:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Terminal ID</li>
              <li>URL da API PayGo</li>
              <li>Chaves de autenticação</li>
              <li>Modo de homologação/produção</li>
              <li>Timeout de transações</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TEFSettingsForm;
