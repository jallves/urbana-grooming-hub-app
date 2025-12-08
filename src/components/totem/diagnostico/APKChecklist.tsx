import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Code,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'unknown';
  code?: string;
  codeLanguage?: string;
}

interface APKChecklistProps {
  isAndroidEnvironment: boolean;
  hasAndroidInterface: boolean;
  hasTEFInterface: boolean;
  hasPinpadConnected: boolean;
  isMockMode: boolean;
}

export const APKChecklist: React.FC<APKChecklistProps> = ({
  isAndroidEnvironment,
  hasAndroidInterface,
  hasTEFInterface,
  hasPinpadConnected,
  isMockMode
}) => {
  const copyCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código "${name}" copiado!`);
  };

  const mainActivityCode = `// MainActivity.kt
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var tefBridge: TEFBridge

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        tefBridge = TEFBridge(this, webView)
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
        }
        
        // PASSO 1: Registrar JavascriptInterface
        webView.addJavascriptInterface(tefBridge, "Android")
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // PASSO 2: Injetar window.TEF após página carregar
                injetarTEFInterface()
            }
        }
        
        setContentView(webView)
        webView.loadUrl("https://sua-url.lovable.app")
    }
    
    private fun injetarTEFInterface() {
        val js = """
            window.TEF = {
                iniciarPagamento: function(json) {
                    Android.iniciarPagamento(json);
                },
                cancelarPagamento: function() {
                    Android.cancelarPagamento();
                },
                verificarPinpad: function() {
                    return Android.verificarPinpad();
                },
                setModoDebug: function(enabled) {
                    Android.setModoDebug(enabled);
                },
                getLogs: function() {
                    return Android.getLogs();
                },
                limparLogs: function() {
                    Android.limparLogs();
                }
            };
            console.log('[TEF] Interface injetada com sucesso');
            window.dispatchEvent(new CustomEvent('tefAndroidReady', {
                detail: { version: '1.0.0' }
            }));
        """.trimIndent()
        
        webView.evaluateJavascript(js, null)
    }
}`;

  const tefBridgeCode = `// TEFBridge.kt
class TEFBridge(
    private val context: Context,
    private val webView: WebView
) {
    private val gson = Gson()
    private var payGoSDK: PayGoSDK? = null // Substituir pelo SDK real
    
    init {
        // Inicializar SDK PayGo aqui
        // payGoSDK = PayGoSDK.getInstance(context)
    }
    
    @JavascriptInterface
    fun iniciarPagamento(jsonParams: String) {
        try {
            val params = gson.fromJson(jsonParams, PaymentParams::class.java)
            
            // CHAMAR SDK PAYGO REAL AQUI
            // Exemplo:
            // payGoSDK.startPayment(
            //     amount = params.valorCentavos,
            //     paymentType = params.metodo,
            //     installments = params.parcelas ?: 1,
            //     orderId = params.ordemId,
            //     callback = object : PaymentCallback {
            //         override fun onSuccess(result: PaymentResult) {
            //             enviarResultado(TEFResultado(
            //                 status = "aprovado",
            //                 nsu = result.nsu,
            //                 autorizacao = result.authCode,
            //                 bandeira = result.cardBrand,
            //                 valor = params.valorCentavos
            //             ))
            //         }
            //         override fun onError(error: PaymentError) {
            //             enviarResultado(TEFResultado(
            //                 status = "erro",
            //                 mensagem = error.message,
            //                 codigoErro = error.code
            //             ))
            //         }
            //     }
            // )
            
        } catch (e: Exception) {
            enviarResultado(TEFResultado(
                status = "erro",
                mensagem = e.message ?: "Erro desconhecido"
            ))
        }
    }
    
    @JavascriptInterface
    fun cancelarPagamento() {
        // payGoSDK?.cancelPayment()
    }
    
    @JavascriptInterface
    fun verificarPinpad(): String {
        // val status = payGoSDK?.getPinpadStatus()
        // return gson.toJson(mapOf(
        //     "conectado" to (status?.isConnected ?: false),
        //     "modelo" to (status?.model ?: ""),
        //     "timestamp" to System.currentTimeMillis()
        // ))
        
        // REMOVER MOCK E USAR SDK REAL!
        return gson.toJson(mapOf(
            "conectado" to false,
            "modelo" to "Aguardando SDK PayGo",
            "timestamp" to System.currentTimeMillis()
        ))
    }
    
    @JavascriptInterface
    fun setModoDebug(enabled: Boolean) {
        // payGoSDK?.setDebugMode(enabled)
    }
    
    @JavascriptInterface
    fun getLogs(): String {
        return gson.toJson(mapOf("logs" to listOf<String>()))
    }
    
    @JavascriptInterface
    fun limparLogs() {
        // Limpar logs internos
    }
    
    private fun enviarResultado(resultado: TEFResultado) {
        val json = gson.toJson(resultado)
        webView.post {
            webView.evaluateJavascript(
                "if(window.onTefResultado) window.onTefResultado($json);",
                null
            )
        }
    }
}

data class PaymentParams(
    val ordemId: String,
    val valorCentavos: Int,
    val metodo: String,
    val parcelas: Int?
)

data class TEFResultado(
    val status: String,
    val valor: Int? = null,
    val bandeira: String? = null,
    val nsu: String? = null,
    val autorizacao: String? = null,
    val codigoResposta: String? = null,
    val codigoErro: String? = null,
    val mensagem: String? = null,
    val comprovanteCliente: String? = null,
    val comprovanteLojista: String? = null,
    val ordemId: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)`;

  const checklist: ChecklistItem[] = [
    {
      id: 'environment',
      title: '1. Ambiente Android WebView',
      description: 'A PWA deve rodar dentro de um WebView no APK Android',
      status: isAndroidEnvironment ? 'pass' : 'fail',
    },
    {
      id: 'interface',
      title: '2. JavascriptInterface (window.Android)',
      description: 'O APK deve chamar webView.addJavascriptInterface(bridge, "Android")',
      status: hasAndroidInterface ? 'pass' : 'fail',
    },
    {
      id: 'tef',
      title: '3. Interface TEF (window.TEF)',
      description: 'O APK deve injetar window.TEF via evaluateJavascript após onPageFinished',
      status: hasTEFInterface ? 'pass' : 'fail',
    },
    {
      id: 'sdk',
      title: '4. SDK PayGo Integrado (não MOCK)',
      description: 'O APK deve usar o SDK PayGo TEF Local real, não dados simulados',
      status: isMockMode ? 'fail' : (hasPinpadConnected ? 'pass' : 'unknown'),
    },
    {
      id: 'pinpad',
      title: '5. Pinpad Conectado',
      description: 'O pinpad PPC930 deve estar conectado via USB e reconhecido pelo SDK',
      status: hasPinpadConnected ? 'pass' : 'fail',
    },
  ];

  const passCount = checklist.filter(i => i.status === 'pass').length;
  const totalCount = checklist.length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            Checklist de Integração APK
          </CardTitle>
          <Badge variant={passCount === totalCount ? 'default' : 'destructive'}>
            {passCount}/{totalCount} completos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checklist Items */}
        <div className="space-y-3">
          {checklist.map((item) => (
            <div 
              key={item.id}
              className={`p-3 rounded-lg border ${
                item.status === 'pass' 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : item.status === 'fail'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-yellow-500/30 bg-yellow-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {item.status === 'pass' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : item.status === 'fail' ? (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Código para o Desenvolvedor */}
        {(!hasTEFInterface || !hasAndroidInterface) && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Code className="h-4 w-4" />
              Código Kotlin para o Desenvolvedor Android
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MainActivity.kt</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyCode(mainActivityCode, 'MainActivity.kt')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <ScrollArea className="h-48 w-full rounded-md border bg-muted/30">
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
                  {mainActivityCode}
                </pre>
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">TEFBridge.kt</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyCode(tefBridgeCode, 'TEFBridge.kt')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <ScrollArea className="h-48 w-full rounded-md border bg-muted/30">
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
                  {tefBridgeCode}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
