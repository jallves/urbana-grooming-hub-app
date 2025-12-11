#!/bin/bash
# ============================================
# TotemCostaUrbana - Build Script (Linux/macOS)
# ============================================

echo ""
echo "=========================================="
echo "  TotemCostaUrbana - Build APK"
echo "=========================================="
echo ""

# Verificar se estamos na pasta correta
if [ ! -f "gradlew" ]; then
    echo "ERRO: Execute este script dentro da pasta TotemCostaUrbana"
    echo ""
    exit 1
fi

# Dar permissão de execução
chmod +x gradlew

echo "[1/3] Limpando builds anteriores..."
./gradlew clean
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao limpar projeto"
    exit 1
fi

echo ""
echo "[2/3] Compilando APK Debug..."
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao compilar APK"
    exit 1
fi

echo ""
echo "[3/3] Build concluido!"
echo ""
echo "=========================================="
echo "  APK GERADO COM SUCESSO!"
echo "=========================================="
echo ""
echo "  Localizacao do APK:"
echo "  app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "=========================================="
echo ""

# Abrir pasta do APK (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open app/build/outputs/apk/debug/
fi
