# 🚀 Referência Rápida - Totem Costa Urbana

## ⚠️ REGRA OBRIGATÓRIA: Teclado Padrão

**SEMPRE** use o componente `TotemPinKeypad` para entrada de PIN ou telefone.

### ✅ Uso Correto

```tsx
import { TotemPinKeypad } from '@/components/totem/TotemPinKeypad';

// Para PIN (4 dígitos)
<TotemPinKeypad
  mode="pin"
  title="Autenticação"
  subtitle="Digite seu PIN"
  pinLength={4}
  onSubmit={(pin) => handleAuth(pin)}
/>

// Para Telefone (10-11 dígitos)
<TotemPinKeypad
  mode="phone"
  title="Buscar Cliente"
  subtitle="Digite o telefone"
  phoneLength={11}
  onSubmit={(phone) => handleSearch(phone)}
  onCancel={() => navigate('/totem/home')}
/>
```

### ❌ NUNCA Faça

- ❌ Criar componentes de teclado customizados
- ❌ Usar `<input type="tel">` ou `<input type="number">`
- ❌ Usar `InputOTP` ou similares
- ❌ Copiar e colar código do teclado

## 📋 Checklist Antes de Implementar

- [ ] A tela precisa de entrada de PIN? → Use `TotemPinKeypad` com `mode="pin"`
- [ ] A tela precisa de entrada de telefone? → Use `TotemPinKeypad` com `mode="phone"`
- [ ] Importei de `@/components/totem/TotemPinKeypad`?
- [ ] Configurei `onSubmit` corretamente?
- [ ] Testei no mobile e desktop?

## 🎯 Telas que DEVEM usar TotemPinKeypad

| Tela | Modo | Status |
|------|------|--------|
| TotemLogin | pin | ✅ Implementado |
| TotemSearch | phone | ✅ Implementado |
| TotemCheckoutSearch | phone | ✅ Implementado |
| TotemProductAuth | pin/phone | ⚠️ Verificar |
| TotemAgendamentoAuth | phone | ⚠️ Verificar |

## 🔄 Ao Implementar Nova Feature

1. **Precisa de autenticação?** → Use `TotemPinKeypad`
2. **Precisa buscar cliente?** → Use `TotemPinKeypad` com `mode="phone"`
3. **Dúvida?** → Consulte `TOTEM_KEYPAD_PATTERN.md`

## 📚 Documentação Completa

- Design System: `docs/TOTEM_DESIGN_SYSTEM.md`
- Padrão de Teclado: `docs/TOTEM_KEYPAD_PATTERN.md`
- Componentes: `docs/TOTEM_COMPONENTS_USAGE.md`

---

**🚨 IMPORTANTE:** Este componente NÃO deve ser modificado sem aprovação. Se precisar de mudanças, consulte a equipe primeiro.
