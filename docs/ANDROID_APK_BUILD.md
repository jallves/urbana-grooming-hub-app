# Como Atualizar o APK Android

## 📁 Qual Pasta Baixar

Você precisa baixar apenas a pasta:

```
TotemCostaUrbana/
```

Esta é a pasta do projeto Android que contém todo o código do APK.

---

## 🔄 Passo a Passo para Atualizar

### 1. Exportar o Projeto para GitHub

No Lovable:
1. Clique em **GitHub** no menu superior
2. Clique em **Sync** ou **Push** para enviar as alterações

### 2. Baixar a Pasta Android

Opção A - **Clone completo** (recomendado):
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio/TotemCostaUrbana
```

Opção B - **Baixar ZIP**:
1. Vá ao seu repositório no GitHub
2. Clique em **Code** → **Download ZIP**
3. Extraia e navegue até a pasta `TotemCostaUrbana/`

### 3. Abrir no Android Studio

1. Abra o **Android Studio**
2. **File** → **Open**
3. Selecione a pasta `TotemCostaUrbana/`
4. Aguarde o Gradle sincronizar (pode demorar alguns minutos)

### 4. Gerar o APK

1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Aguarde a compilação
3. Clique em **Locate** quando aparecer a notificação
4. O APK estará em: `TotemCostaUrbana/app/build/outputs/apk/debug/app-debug.apk`

### 5. Instalar no Tablet

1. Copie o arquivo `app-debug.apk` para o tablet (USB, email, cloud, etc)
2. No tablet, abra o arquivo APK
3. Permita a instalação de fontes desconhecidas se solicitado
4. Instale o app

---

## 🔍 Verificando a Conexão PayGo no Totem

Após instalar o APK atualizado:

### Indicadores na Tela Principal

No canto inferior esquerdo da tela do Totem, você verá:

| Indicador | Significado |
|-----------|-------------|
| 🟢 **TEF OK** | Android + Pinpad conectados |
| 🟡 **Pinpad** | Android OK, mas pinpad desconectado |
| ⚪ **Web** | Rodando no navegador (não no APK) |

### Botões de Diagnóstico

- ⚙️ **Engrenagem** → Abre modal de diagnóstico rápido
- 💻 **Terminal** → Abre console de logs em tempo real (`/totem/tef-debug`)

### Console de Debug (`/totem/tef-debug`)

Esta tela mostra:
- Status do Android WebView
- Status do Pinpad
- Se PayGo está instalado
- Logs em tempo real de todas as operações
- Botões para testar pagamentos

---

## 📋 Arquivos Modificados (Referência)

Os seguintes arquivos foram atualizados para melhorar a integração PayGo:

```
TotemCostaUrbana/
├── app/src/main/java/com/costaurbana/totem/
│   ├── PayGoService.kt      ← Logs detalhados, verificação PayGo
│   ├── TEFBridge.kt         ← Novos métodos de debug
│   └── MainActivity.kt      ← Handler de resposta PayGo
└── app/src/main/AndroidManifest.xml  ← Intent filters

src/
├── pages/Totem/
│   ├── TotemHome.tsx        ← Indicador de status TEF
│   └── TotemTEFDebug.tsx    ← Console de debug (NOVO)
└── lib/tef/
    └── tefAndroidBridge.ts  ← Novos métodos JS
```

---

## ⚠️ Pré-requisitos

Para o TEF funcionar corretamente:

1. **PayGo Integrado** deve estar instalado no tablet
2. **Pinpad Gertec PPC930** deve estar conectado via USB
3. Permissões USB devem ser concedidas ao app

---

## 🆘 Troubleshooting

### "PayGo NÃO está instalado"
- Baixe e instale o app PayGo Integrado da Setis/CloudWalk

### "Pinpad Desconectado"
- Verifique conexão USB
- Reinicie o pinpad
- Conceda permissões USB quando solicitado

### Logs não aparecem
- Certifique-se de estar rodando dentro do APK (não no navegador)
- O indicador deve mostrar "TEF OK" ou "Pinpad", não "Web"
