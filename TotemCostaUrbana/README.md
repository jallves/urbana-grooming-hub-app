# Totem Costa Urbana - Android App

## Integração com PayGo Integrado via URI

Este APK foi desenvolvido para integrar com o **PayGo Integrado** usando o método de **Integração Direta via URI**, conforme documentação oficial:
- https://github.com/adminti2/mobile-integracao-uri

## Arquitetura

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   WebView       │ ←──→ │  TotemCostaUrba  │ ←──→ │  PayGo           │
│   (React PWA)   │      │  (Este APK)      │      │  Integrado       │
│                 │      │                  │      │                  │
│  TEF.iniciar    │      │  Intent URI      │      │  Processamento   │
│  Pagamento()    │ ───→ │  TRANSACTION     │ ───→ │  TEF             │
│                 │      │                  │      │                  │
│  onTefResultado │      │  Intent URI      │      │  Resposta        │
│  (callback)     │ ←─── │  SERVICO         │ ←─── │  Transação       │
└─────────────────┘      └──────────────────┘      └──────────────────┘
```

## Intent Actions Utilizados

| Action | Descrição |
|--------|-----------|
| `br.com.setis.payment.TRANSACTION` | Inicia transação (VENDA, CANCELAMENTO, etc) |
| `br.com.setis.confirmation.TRANSACTION` | Confirma/desfaz transação |
| `br.com.setis.interfaceautomacao.SERVICO` | Recebe resposta do PayGo |

## Estrutura do Projeto

```
TotemCostaUrbana/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── gradle/wrapper/gradle-wrapper.properties
└── app/
    ├── build.gradle.kts
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml          # Intent filters para PayGo
        ├── java/com/costaurbana/totem/
        │   ├── MainActivity.kt          # Activity principal + handler PayGo
        │   ├── TEFBridge.kt              # Ponte JavaScript ↔ Android
        │   └── PayGoService.kt           # Integração URI com PayGo
        └── res/
            ├── layout/activity_main.xml
            ├── xml/device_filter.xml
            ├── values/colors.xml
            ├── values/strings.xml
            └── values/themes.xml
```

## Como Funciona a Integração

### 1. Iniciando Pagamento (Web → Android → PayGo)

```javascript
// No WebView (JavaScript)
window.TEF.iniciarPagamento(JSON.stringify({
  ordemId: "ordem-123",
  valor: 5000,           // R$ 50,00 em centavos
  tipo: "credito",       // credito, debito, credito_parcelado, pix
  parcelas: 1
}));
```

### 2. URI Gerada pelo APK

```
app://payment/input?operation=VENDA&transactionId=ordem-123_1234567890&amount=5000&currencyCode=986&cardType=CARTAO_CREDITO&finType=A_VISTA
```

### 3. Dados da Automação (Bundle Extra)

```
app://payment/posData?posName=TotemCostaUrbana&posVersion=1.0.0&posDeveloper=CostaUrbana&allowCashback=false&allowDiscount=false&allowDifferentReceipts=true&allowShortReceipt=true
```

### 4. Resposta do PayGo (PayGo → Android → Web)

O PayGo retorna via Intent com action `br.com.setis.interfaceautomacao.SERVICO`:

```
app://payment/output?transactionResult=0&authorizationCode=123456&transactionNsu=987654&cardName=VISA&maskedPan=411111***1111&...
```

O APK parseia e envia para o WebView:

```javascript
// Callback no WebView
window.onTefResultado({
  status: "aprovado",
  nsu: "987654",
  autorizacao: "123456",
  bandeira: "VISA",
  // ... outros dados
});
```

## AndroidManifest - Intent Filter

```xml
<!-- PayGo Integrado Response Handler -->
<intent-filter android:label="filter_app_payment">
    <action android:name="br.com.setis.interfaceautomacao.SERVICO"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    
    <data android:scheme="app" android:host="payment"/>
    <data android:scheme="app" android:host="resolve"/>
</intent-filter>
```

## Pré-requisitos

1. **PayGo Integrado** instalado no tablet Android
2. **Credenciais de homologação** configuradas no PayGo
3. **Pinpad USB** (Gertec PPC930) conectado

## Como Compilar no Android Studio

1. Baixe a pasta `TotemCostaUrbana` do GitHub
2. Abra o Android Studio → File → Open → selecione a pasta
3. Aguarde o Gradle sync
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. O APK estará em `app/build/outputs/apk/debug/app-debug.apk`

## Testes em Homologação

### Operações Suportadas

| Operação | URI Parameter |
|----------|---------------|
| Venda | `operation=VENDA` |
| Cancelamento | `operation=CANCELAMENTO` |
| Reimpressão | `operation=REIMPRESSAO` |
| Teste Comunicação | `operation=TESTE_COMUNICACAO` |

### Tipos de Pagamento

| Tipo | cardType | finType |
|------|----------|---------|
| Débito | `CARTAO_DEBITO` | `A_VISTA` |
| Crédito à vista | `CARTAO_CREDITO` | `A_VISTA` |
| Crédito parcelado | `CARTAO_CREDITO` | `PARCELADO_ESTABELECIMENTO` |
| PIX | - | `paymentMode=PAGAMENTO_CARTEIRA_VIRTUAL` |

### Códigos de Resultado (transactionResult)

| Código | Significado |
|--------|-------------|
| 0 | Transação aprovada |
| 1-99 | Transação negada |
| -1 | Transação cancelada pelo usuário |

## Interface JavaScript Disponível

O WebView tem acesso a:

```javascript
// Iniciar pagamento TEF
TEF.iniciarPagamento(jsonParams)

// Cancelar pagamento atual
TEF.cancelarPagamento()

// Verificar status do pinpad
TEF.verificarPinpad()  // retorna JSON

// Debug
TEF.setModoDebug(boolean)
TEF.getLogs()
TEF.limparLogs()
```

## Personalização Visual

O APK envia cores da Costa Urbana para o PayGo:

```kotlin
screenBackgroundColor = "#1a1a2e"   // Fundo escuro
toolbarBackgroundColor = "#c9a961"  // Dourado
fontColor = "#ffffff"               // Texto branco
```

## Troubleshooting

### PayGo não abre

- Verifique se o PayGo Integrado está instalado
- Verifique se o package name está correto

### Resposta não retorna

- Verifique o intent-filter no AndroidManifest
- Verifique se o launchMode é `singleTask`
- Verifique os logs no Logcat

### Pinpad não detectado

- Verifique permissão USB
- Verifique se o VendorID 1753 (Gertec) está no device_filter.xml

## Documentação de Referência

- [PayGo Integração URI](https://github.com/adminti2/mobile-integracao-uri)
- [Android Intents](https://developer.android.com/reference/android/content/Intent)
