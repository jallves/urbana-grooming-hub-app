import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TEFHomologacao: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-gray-900">Homologação TEF PayGo</CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Ambiente de testes para integração TEF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Funcionalidade em desenvolvimento</AlertTitle>
            <AlertDescription className="text-yellow-700">
              <p className="mb-2">
                O painel de homologação TEF requer a criação da tabela <code className="bg-yellow-200 px-1 rounded">tef_mock_transactions</code> no banco de dados.
              </p>
              <p className="text-sm">
                Esta funcionalidade permite:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Simular transações de pagamento</li>
                <li>Testar fluxos de aprovação/recusa</li>
                <li>Validar integração com PayGo TESS</li>
                <li>Resolver pendências de transações</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TEFHomologacao;
