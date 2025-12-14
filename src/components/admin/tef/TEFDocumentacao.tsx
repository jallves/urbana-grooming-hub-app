import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, 
  Code, 
  Smartphone, 
  Usb, 
  CheckCircle2, 
  Cpu,
  Layers,
  GitBranch,
  Terminal
} from 'lucide-react';

const TEFDocumentacao: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <CardTitle className="text-xl text-purple-900">Documentação TEF - Homologação</CardTitle>
              <CardDescription className="text-purple-700">
                Toda documentação técnica do sistema TEF PayGo integrado ao Totem Android
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <Accordion type="multiple" defaultValue={["arquitetura", "requisitos"]} className="space-y-3">
          {/* Arquitetura */}
          <AccordionItem value="arquitetura" className="border border-gray-200 rounded-xl bg-white px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Arquitetura do Sistema</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg font-mono text-xs text-gray-100 overflow-x-auto">
                  <pre>{`┌──────────────────────────────────────────────────────────────┐
│                   TOTEM ANDROID (APK Nativo)                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────┐      ┌─────────────────┐              │
│   │    WebView      │ ◄──► │   TEF Bridge    │              │
│   │   (PWA React)   │      │  (JavaScript)   │              │
│   └─────────────────┘      └────────┬────────┘              │
│                                     │                        │
│                            ┌────────▼────────┐              │
│                            │  PayGo TEF SDK  │              │
│                            │   (TEF Local)   │              │
│                            └────────┬────────┘              │
│                                     │                        │
│                            ┌────────▼────────┐              │
│                            │  Pinpad PPC930  │              │
│                            │   (USB/Serial)  │              │
│                            └─────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND SUPABASE                            │
├──────────────────────────────────────────────────────────────┤
│   Edge Functions  ◄──►  Database  ◄──►  Auth                │
│   (tef-webhook)        (financial_records, vendas)          │
└──────────────────────────────────────────────────────────────┘`}</pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-800 mb-1">Frontend</p>
                    <p className="text-xs text-blue-700">PWA React rodando em WebView</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs font-medium text-green-800 mb-1">Bridge</p>
                    <p className="text-xs text-green-700">Interface JS ↔ Android Nativo</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-800 mb-1">TEF</p>
                    <p className="text-xs text-purple-700">SDK PayGo TEF Local</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Requisitos */}
          <AccordionItem value="requisitos" className="border border-gray-200 rounded-xl bg-white px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-900">Requisitos de Hardware e Software</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        Tablet/Totem
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Samsung Galaxy Tab A SM-T510</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Android 11+ (API 30)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>2GB RAM mínimo</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Usb className="h-4 w-4 text-gray-600" />
                        Pinpad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Gertec PPC930</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Conexão USB OTG</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">Vendor ID</Badge>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">1753</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">Product ID</Badge>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">0xC902 (CDC/ACM)</code>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4 text-gray-600" />
                      Software/SDK
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs font-medium">Android SDK</p>
                        <p className="text-xs text-gray-600">API 21+</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs font-medium">PayGo TEF</p>
                        <p className="text-xs text-gray-600">SDK Local</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs font-medium">Kotlin</p>
                        <p className="text-xs text-gray-600">1.9+</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-xs font-medium">WebView</p>
                        <p className="text-xs text-gray-600">Chrome 90+</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Interface JavaScript */}
          <AccordionItem value="interface-js" className="border border-gray-200 rounded-xl bg-white px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-gray-900">Interface JavaScript (Bridge)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  O app Android expõe uma interface JavaScript no WebView que permite a comunicação entre o PWA e o SDK TEF.
                </p>

                <div className="bg-gray-900 p-4 rounded-lg text-xs text-gray-100 overflow-x-auto">
                  <pre>{`// ═══════════════════════════════════════════════════════════
// MÉTODOS EXPOSTOS PELO APP ANDROID (window.TEF)
// ═══════════════════════════════════════════════════════════

// Iniciar pagamento TEF
TEF.iniciarPagamento(jsonParams: string): boolean
// Parâmetros (JSON stringificado):
{
  "ordemId": "ORD-12345",           // ID único da ordem
  "valorCentavos": 15000,            // R$ 150,00 em centavos
  "metodo": "credito",               // debito | credito | credito_parcelado | voucher | pix
  "parcelas": 1                      // 1-12 (só para crédito parcelado)
}

// Cancelar pagamento em andamento
TEF.cancelarPagamento(): boolean

// Verificar status do pinpad
TEF.verificarPinpad(): string  // JSON com status

// Ativar/desativar modo debug
TEF.setModoDebug(enabled: boolean): void

// Obter logs (modo debug)
TEF.getLogs(): string[]

// ═══════════════════════════════════════════════════════════
// CALLBACK RECEBIDO NO PWA
// ═══════════════════════════════════════════════════════════

// Definir no PWA antes de chamar iniciarPagamento:
window.onTefResultado = function(resultado) {
  // resultado.status: "aprovado" | "negado" | "cancelado" | "erro"
  // resultado.nsu: string (Número Sequencial Único)
  // resultado.autorizacao: string (Código de autorização)
  // resultado.bandeira: string (Visa, Master, Elo, etc)
  // resultado.mensagem: string (Mensagem para exibição)
  // resultado.comprovante: string (Texto do comprovante)
}`}</pre>
                </div>

                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-3">
                    <p className="text-xs text-amber-800">
                      <strong>Importante:</strong> O objeto <code>window.TEF</code> só existe quando o PWA está rodando dentro do WebView do app Android. 
                      Em ambiente web, utilize o hook <code>useTEFAndroid</code> que já possui fallback automático.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Fluxo de Pagamento */}
          <AccordionItem value="fluxo" className="border border-gray-200 rounded-xl bg-white px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-cyan-600" />
                <span className="font-semibold text-gray-900">Fluxo de Pagamento Completo</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                <ol className="space-y-3">
                  {[
                    { step: 1, title: 'Cliente seleciona produtos/serviços', desc: 'PWA monta o carrinho e calcula total' },
                    { step: 2, title: 'Cliente escolhe forma de pagamento', desc: 'Débito, crédito, crédito parcelado ou PIX' },
                    { step: 3, title: 'PWA chama TEF.iniciarPagamento()', desc: 'Envia JSON com dados da transação' },
                    { step: 4, title: 'App Android recebe e processa', desc: 'Parseia JSON e chama SDK PayGo' },
                    { step: 5, title: 'Pinpad exibe tela para cliente', desc: 'Inserir/aproximar cartão, digitar senha' },
                    { step: 6, title: 'SDK processa com adquirente', desc: 'Comunicação com Cielo/Rede/Stone' },
                    { step: 7, title: 'Resultado retorna para app', desc: 'Aprovado, negado ou erro' },
                    { step: 8, title: 'App chama window.onTefResultado()', desc: 'Callback com dados da transação' },
                    { step: 9, title: 'PWA registra no backend', desc: 'Supabase: vendas, pagamentos, financial_records' },
                    { step: 10, title: 'Exibe comprovante e finaliza', desc: 'Imprime/exibe comprovante digital' },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Hook useTEFAndroid */}
          <AccordionItem value="hook" className="border border-gray-200 rounded-xl bg-white px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <Code className="h-5 w-5 text-violet-600" />
                <span className="font-semibold text-gray-900">Hook useTEFAndroid (React)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="bg-gray-900 p-4 rounded-lg text-xs text-gray-100 overflow-x-auto">
                <pre>{`import { useTEFAndroid } from '@/hooks/useTEFAndroid';

function TotemPayment() {
  const {
    isAndroidAvailable,     // true se rodando no app Android
    isPinpadConnected,      // true se pinpad USB detectado
    isProcessing,           // true durante transação
    androidVersion,         // versão do app Android
    pinpadStatus,           // objeto com status detalhado
    iniciarPagamento,       // função async para iniciar pagamento
    cancelarPagamento,      // função para cancelar
    verificarConexao        // função para verificar pinpad
  } = useTEFAndroid({
    onSuccess: (resultado) => {
      // Pagamento aprovado
      console.log('NSU:', resultado.nsu);
      console.log('Auth:', resultado.autorizacao);
      // Registrar no backend...
    },
    onError: (erro) => {
      // Pagamento negado ou erro
      console.error(erro.mensagem);
    },
    onCancelled: () => {
      // Usuário cancelou
      console.log('Cancelado pelo usuário');
    }
  });

  const handlePagar = async () => {
    const aprovado = await iniciarPagamento({
      ordemId: 'ORD-' + Date.now(),
      valor: 150.00,    // em reais (convertido para centavos internamente)
      tipo: 'credit',   // 'debit' | 'credit' | 'credit_installment' | 'pix'
      parcelas: 1
    });

    if (aprovado) {
      // Sucesso - onSuccess já foi executado
    }
  };

  return (
    <div>
      {!isAndroidAvailable && (
        <Alert>Modo web - TEF simulado</Alert>
      )}
      
      {isAndroidAvailable && !isPinpadConnected && (
        <Alert>Conecte o pinpad USB</Alert>
      )}

      <Button 
        onClick={handlePagar}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processando...' : 'Pagar R$ 150,00'}
      </Button>
    </div>
  );
}`}</pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
};

export default TEFDocumentacao;
