# Guia de Build - TotemCostaUrbana APK

## Pré-requisitos

1. **Android Studio** instalado (Arctic Fox ou superior)
2. **Java JDK 17+** configurado
3. **PayGo Integrado** instalado no tablet

---

## Método 1: Via Linha de Comando (CMD/Terminal)

### Windows (CMD ou PowerShell)

```batch
@echo off
REM ============================================
REM Script de Build - TotemCostaUrbana APK
REM ============================================

REM 1. Navegar para a pasta do projeto Android
cd TotemCostaUrbana

REM 2. Limpar builds anteriores
call gradlew.bat clean

REM 3. Build do APK Debug (para testes)
call gradlew.bat assembleDebug

REM 4. O APK estará em:
REM    app\build\outputs\apk\debug\app-debug.apk

echo.
echo ============================================
echo APK Debug gerado com sucesso!
echo Localização: app\build\outputs\apk\debug\app-debug.apk
echo ============================================
pause
```

### Linux/macOS (Terminal)

```bash
#!/bin/bash
# ============================================
# Script de Build - TotemCostaUrbana APK
# ============================================

# 1. Navegar para a pasta do projeto Android
cd TotemCostaUrbana

# 2. Dar permissão de execução ao gradlew
chmod +x gradlew

# 3. Limpar builds anteriores
./gradlew clean

# 4. Build do APK Debug (para testes)
./gradlew assembleDebug

echo ""
echo "============================================"
echo "APK Debug gerado com sucesso!"
echo "Localização: app/build/outputs/apk/debug/app-debug.apk"
echo "============================================"
```

---

## Método 2: Via Android Studio

1. Abra o Android Studio
2. **File > Open** → selecione a pasta `TotemCostaUrbana/`
3. Aguarde o Gradle sincronizar (pode levar alguns minutos)
4. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
5. Quando concluir, clique em **"locate"** para encontrar o APK

---

## Build de Release (para Produção)

### Gerar APK de Release (não assinado)

```bash
# Windows
gradlew.bat assembleRelease

# Linux/macOS
./gradlew assembleRelease
```

### Gerar APK de Release Assinado

1. Crie uma keystore (se não tiver):
```bash
keytool -genkey -v -keystore costa-urbana-release.keystore -alias costa_urbana -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure em `app/build.gradle`:
```groovy
android {
    signingConfigs {
        release {
            storeFile file('costa-urbana-release.keystore')
            storePassword 'sua_senha'
            keyAlias 'costa_urbana'
            keyPassword 'sua_senha_key'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

3. Build:
```bash
./gradlew assembleRelease
```

---

## Instalação no Tablet

### Via ADB (Android Debug Bridge)

```bash
# Conectar tablet via USB e habilitar "Depuração USB"

# Listar dispositivos conectados
adb devices

# Instalar APK Debug
adb install -r app/build/outputs/apk/debug/app-debug.apk

# OU instalar APK Release
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Via Transferência Direta

1. Copie o APK para um pendrive
2. Conecte no tablet
3. Use um gerenciador de arquivos para instalar

---

## Estrutura do APK

```
TotemCostaUrbana/
├── app/
│   ├── src/main/
│   │   ├── java/com/costaurbana/totem/
│   │   │   ├── MainActivity.kt      # Activity principal + WebView
│   │   │   ├── TEFBridge.kt         # Ponte JavaScript ↔ Android
│   │   │   └── PayGoService.kt      # Integração PayGo via URI
│   │   ├── res/
│   │   │   ├── layout/              # Layouts XML
│   │   │   └── drawable/            # Ícones e drawables
│   │   └── AndroidManifest.xml      # Permissões e intents
│   └── build.gradle                 # Dependências do módulo
├── build.gradle                     # Configuração raiz
├── settings.gradle                  # Settings do Gradle
└── gradlew / gradlew.bat            # Scripts do Gradle
```

---

## Fluxo de Integração TEF

```
┌─────────────────────────────────────────────────────────┐
│                   APK TotemCostaUrbana                  │
│                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐  │
│  │   WebView   │◄─►│  TEFBridge  │◄─►│ PayGoService │  │
│  │  (React)    │   │ (window.TEF)│   │  (Intents)   │  │
│  └─────────────┘   └─────────────┘   └──────┬───────┘  │
│                                              │         │
└──────────────────────────────────────────────┼─────────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │  PayGo Integrado │
                                    │    (externo)     │
                                    └──────────────────┘
```

---

## Troubleshooting

### "Gradle sync failed"
- Verifique se JAVA_HOME está configurado
- Delete a pasta `.gradle/` e tente novamente

### "Could not find com.android.tools.build:gradle"
- Verifique conexão com internet
- Execute `gradlew --refresh-dependencies`

### APK não instala
- Habilite "Fontes desconhecidas" no tablet
- Desinstale versão anterior antes de instalar nova

### WebView mostra tela branca
- Verifique se o tablet tem internet
- Verifique os logs com: `adb logcat | grep TotemMain`

### PayGo não abre
- Verifique se PayGo Integrado está instalado
- Verifique os logs: `adb logcat | grep PayGoService`

---

## URLs Importantes

- **PWA URL Produção**: `https://barbeariacostaurbana.com.br/totem`
- **PWA URL Dev**: `https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com/totem`
- **Documentação PayGo**: [GitHub - mobile-integracao-uri](https://github.com/nicfrezza/mobile-integracao-uri)

---

## Changelog de Atualizações

### v1.2.2 (Janeiro 2026) - CORREÇÃO FRONTEND - LOOP DE VALIDAÇÃO
- ✅ **CORREÇÃO CRÍTICA no FRONTEND** (NÃO requer rebuild de APK):
  - **Problema**: `checkPending()` usava `hasPending = hasPendingData || hasConfirmationId`
  - Se existia `tef_last_confirmation_id` no localStorage, considerava como pendência mesmo que o APK dissesse `hasPendingData: false`
  - **Solução 1**: `checkPending()` agora usa APENAS `hasPendingData` do APK (não mais `hasConfirmationId`)
  - **Solução 2**: `clearSavedPendingData()` agora limpa TODOS os dados: `tef_pending_data`, `tef_last_confirmation_id`, `tef_last_nsu`, `tef_venda_state`, etc.
  - **Resultado**: Após resolução bem-sucedida, sistema NÃO reporta mais falsa pendência

### v1.2.1 (Janeiro 2026) - CORREÇÃO APK - LIMPEZA APÓS BROADCAST
- ✅ **CORREÇÃO no APK**: APK agora limpa `lastPendingData` e dados persistidos APÓS enviar broadcast
  - Problema: frontend ficava em loop de validação porque `getPendingInfo()` retornava dados locais do APK (não do PayGo real)
  - Solução: `clearPersistedPendingData()` é chamado logo após `sendBroadcast()` ser executado
  - Resultado: `getPendingInfo()` retorna `hasPendingData: false` imediatamente após resolução

### v1.2.0 (Janeiro 2026)
- ✅ **CORREÇÃO CRÍTICA - Resolução de Pendência**: Implementação conforme documentação oficial PayGo (seção 3.4.3)
  - Broadcast enviado com DUAS URIs separadas: `uri` (dados pendência) + `Confirmacao` (status)
  - Intent Action: `br.com.setis.confirmation.TRANSACTION`
  - Flag: `FLAG_INCLUDE_STOPPED_PACKAGES`
- ✅ **Novo método `limparPendingData()`**: Permite frontend limpar dados do APK manualmente
- ✅ **Logs detalhados**: Logs expandidos para debug de resolução de pendências

### v1.1.0 (Janeiro 2026)
- ✅ **Splash Screen**: Adicionada logo oficial da Costa Urbana Barbearia
- ✅ **Ícone do APK**: Atualizado para usar a logo oficial
- ✅ **Loading**: Tela de carregamento melhorada com logo grande e barra de progresso dourada
- ✅ **TEF Bridge**: Métodos `getPendingInfo()` e `resolverPendencia(status)` para suporte aos Passos 33/34 PayGo

### v1.0.0 (Inicial)
- WebView para carregar o PWA do Totem
- Integração TEF via PayGo Integrado
- Tela de diagnóstico inicial

---

## Métodos TEF Disponíveis (window.TEF)

| Método | Descrição |
|--------|-----------|
| `iniciarPagamento(json)` | Inicia transação de pagamento |
| `cancelarVenda(json)` | Cancela venda anterior |
| `confirmarTransacao(id, status)` | Confirma transação manualmente |
| `resolverPendencia(status)` | Resolve pendência sem dados externos |
| `resolverPendenciaComDados(json, status)` | Resolve pendência com dados do JS |
| `getPendingInfo()` | Obtém info de pendências |
| `limparPendingData()` | **NOVO** - Limpa dados de pendência do APK |
| `salvarConfirmationId(id, nsu, auth)` | Salva IDs para resolução futura |
| `verificarPinpad()` | Verifica status do pinpad |
| `getStatus()` | Status completo do serviço |
