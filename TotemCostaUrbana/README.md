# Totem Costa Urbana - Android App

## Estrutura Corrigida

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
        ├── AndroidManifest.xml
        ├── java/com/costaurbana/totem/
        │   ├── MainActivity.kt
        │   ├── TEFBridge.kt
        │   └── PayGoService.kt
        └── res/
            ├── layout/activity_main.xml
            ├── xml/device_filter.xml
            ├── values/colors.xml
            ├── values/strings.xml
            └── values/themes.xml
```

## Como Compilar no Android Studio

1. **Baixe a pasta TotemCostaUrbana** do GitHub
2. **Abra o Android Studio** → File → Open → selecione a pasta `TotemCostaUrbana`
3. **Aguarde o Gradle sync** (pode demorar na primeira vez)
4. **Build** → Build Bundle(s) / APK(s) → Build APK(s)
5. O APK estará em `app/build/outputs/apk/debug/app-debug.apk`

## O Que o App Faz

- Abre a URL do Totem Web em fullscreen
- Injeta interface JavaScript `window.TEF` para comunicação Web ↔ Android
- Detecta pinpad USB Gertec PPC930
- Mostra tela de loading enquanto carrega

## Interface JavaScript Disponível

O Web pode chamar:
- `TEF.iniciarPagamento(jsonParams)` - Inicia pagamento TEF
- `TEF.cancelarPagamento()` - Cancela pagamento atual
- `TEF.verificarPinpad()` - Retorna status do pinpad
- `TEF.setModoDebug(boolean)` - Ativa/desativa debug
- `TEF.getLogs()` - Obtém logs

## Importante

O SDK PayGo ainda NÃO está integrado. Quando receber:
1. Coloque o `.aar` em `app/libs/`
2. Adicione dependência no `build.gradle.kts`
3. Implemente chamadas reais no `PayGoService.kt`
