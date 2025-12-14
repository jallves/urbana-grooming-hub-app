import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Rocket, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Shield
} from 'lucide-react';

const TEFProducao: React.FC = () => {
  const isProduction = false; // Alterar para true quando entrar em produção

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 rounded-xl">
              <Rocket className="h-6 w-6 text-rose-700" />
            </div>
            <div>
              <CardTitle className="text-xl text-rose-900">TEF Produção</CardTitle>
              <CardDescription className="text-rose-700">
                Configurações e documentação do ambiente de produção TEF PayGo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status atual */}
      <Alert className={isProduction ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}>
        {isProduction ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Clock className="h-5 w-5 text-amber-600" />
        )}
        <AlertTitle className={isProduction ? 'text-green-800' : 'text-amber-800'}>
          {isProduction ? 'Ambiente de Produção Ativo' : 'Aguardando Ativação de Produção'}
        </AlertTitle>
        <AlertDescription className={isProduction ? 'text-green-700' : 'text-amber-700'}>
          {isProduction 
            ? 'O sistema TEF está operando em ambiente de produção com transações reais.'
            : 'O sistema está em ambiente de homologação. A documentação de produção será adicionada após a certificação PayGo.'
          }
        </AlertDescription>
      </Alert>

      {/* Checklist para produção */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            Checklist para Produção
          </CardTitle>
          <CardDescription>
            Etapas necessárias para migrar da homologação para produção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { done: true, label: 'Desenvolvimento do app Android concluído' },
              { done: true, label: 'Integração WebView ↔ TEF Bridge funcionando' },
              { done: true, label: 'Hook useTEFAndroid implementado no PWA' },
              { done: true, label: 'Testes de simulação no painel admin' },
              { done: true, label: 'Edge function tef-webhook implementada' },
              { done: false, label: 'Cadastro PayGo TEF Local (credenciamento)' },
              { done: false, label: 'Recebimento do SDK de produção PayGo' },
              { done: false, label: 'Configuração de credenciais de produção' },
              { done: false, label: 'Testes com transações reais (piloto)' },
              { done: false, label: 'Certificação final PayGo' },
              { done: false, label: 'Go-live produção' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${item.done ? 'text-gray-900' : 'text-gray-500'}`}>
                  {item.label}
                </span>
                {item.done && (
                  <Badge className="ml-auto bg-green-100 text-green-700 text-[10px]">Concluído</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder para documentação futura */}
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Documentação de Produção
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Após a certificação PayGo e ativação do ambiente de produção, 
              esta seção será atualizada com:
            </p>
            <ul className="text-sm text-gray-500 mt-4 space-y-1">
              <li>• Credenciais e configurações de produção</li>
              <li>• Endpoints de produção</li>
              <li>• Procedimentos de contingência</li>
              <li>• Contatos de suporte PayGo</li>
              <li>• Logs de transações reais</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Aviso importante */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800">Importante</AlertTitle>
        <AlertDescription className="text-red-700">
          Nunca utilize credenciais de produção em ambiente de homologação ou desenvolvimento. 
          Transações de produção são reais e geram custos financeiros.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TEFProducao;
