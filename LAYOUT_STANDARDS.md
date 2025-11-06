# 📐 Padrões de Layout - Costa Urbana Admin

## 🎯 Visão Geral

Este documento define os padrões de largura e espaçamento para todas as telas do sistema administrativo, garantindo consistência visual e melhor experiência do usuário.

## 📏 Dimensões Padronizadas

### Tela de Autenticação (`AuthContainer`)
```tsx
// src/components/ui/containers/AuthContainer.tsx
<div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
```

**Dimensões:**
- Mobile: `max-w-md` = **448px**
- Tablet: `md:max-w-lg` = **512px**
- Desktop: `lg:max-w-xl` = **576px**
- Padding interno: `p-8 sm:p-10` (32px → 40px)

### Painel Admin (`AdminLayout`)
```tsx
// src/components/admin/AdminLayout.tsx
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
```

**Dimensões:**
- Largura máxima: `max-w-7xl` = **1280px**
- Padding horizontal: `px-4 sm:px-6 lg:px-8` (16px → 24px → 32px)
- Padding vertical: `py-6` = **24px**

### Páginas Individuais do Admin

Todas as páginas do painel admin devem usar:
```tsx
<AdminLayout title="Título da Página">
  <div className="w-full h-full">
    {/* Conteúdo */}
  </div>
</AdminLayout>
```

**Importante:**
- `w-full` = ocupa toda largura do container
- `h-full` = ocupa toda altura disponível
- O `max-w-7xl` já está aplicado no `AdminLayout`

## ✅ Páginas Padronizadas

### ✓ Auth (Login/Cadastro)
- [x] `src/pages/Auth.tsx`
- Container: `max-w-md md:max-w-lg lg:max-w-xl`
- Padding: `p-8 sm:p-10`

### ✓ Dashboard Admin
- [x] `src/pages/Admin.tsx`
- [x] `src/pages/AdminAppointments.tsx`
- [x] `src/pages/AdminClients.tsx`
- [x] `src/pages/AdminEmployees.tsx`
- [x] `src/pages/AdminBarbers.tsx`
- [x] `src/pages/AdminProducts.tsx`
- [x] `src/pages/AdminFinance.tsx`
- [x] `src/pages/AdminMarketing.tsx`
- [x] `src/pages/AdminBirthdays.tsx`
- [x] `src/pages/AdminSupport.tsx`
- [x] `src/pages/AdminBarberSchedules.tsx`
- [x] `src/pages/AdminCashFlow.tsx`
- [x] `src/pages/AdminAnalytics.tsx`
- [x] `src/pages/AdminSettings.tsx`
- [x] `src/pages/AdminCommissions.tsx`

## 📱 Responsividade

### Breakpoints Tailwind
```css
sm:  640px   /* Celular grande / Tablet pequeno */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop pequeno */
xl:  1280px  /* Desktop médio */
2xl: 1536px  /* Desktop grande */
```

### Padrão de Classes Responsivas
```tsx
// Largura
className="w-full max-w-md md:max-w-lg lg:max-w-xl"

// Padding
className="p-4 sm:p-6 lg:p-8"

// Texto
className="text-sm sm:text-base lg:text-lg"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## 🎨 Padrões de Espaçamento

### Padding Interno (dentro de cards/containers)
```tsx
// Pequeno
className="p-4"        // 16px

// Médio
className="p-6"        // 24px

// Grande
className="p-8"        // 32px

// Extra Grande
className="p-10"       // 40px

// Responsivo
className="p-4 sm:p-6 lg:p-8"  // 16px → 24px → 32px
```

### Margin/Gap (entre elementos)
```tsx
// Pequeno
className="space-y-2"  // 8px vertical
className="gap-2"      // 8px

// Médio
className="space-y-4"  // 16px vertical
className="gap-4"      // 16px

// Grande
className="space-y-6"  // 24px vertical
className="gap-6"      // 24px

// Extra Grande
className="space-y-8"  // 32px vertical
className="gap-8"      // 32px
```

## 🛠️ Template de Página Admin

Ao criar uma nova página admin, use este template:

```tsx
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';
import YourComponent from '@/components/admin/your-component';

const AdminYourPage: React.FC = () => {
  return (
    <AdminRoute>
      <AdminLayout title="Título da Página">
        <div className="w-full h-full flex flex-col">
          {/* Header opcional */}
          <div className="p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-playfair text-urbana-gold">
              📊 Título da Seção
            </h1>
            <p className="text-gray-300 font-raleway mt-2 text-sm sm:text-base">
              Descrição da seção
            </p>
          </div>
          
          {/* Conteúdo principal */}
          <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
            <YourComponent />
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminYourPage;
```

## 🚫 O Que NÃO Fazer

### ❌ Larguras fixas
```tsx
// ERRADO
<div className="w-[500px]">

// CORRETO
<div className="w-full max-w-lg">
```

### ❌ Padding/margin sem responsividade
```tsx
// ERRADO
<div className="p-8">

// CORRETO
<div className="p-4 sm:p-6 lg:p-8">
```

### ❌ Múltiplos max-w no mesmo componente
```tsx
// ERRADO (conflito)
<div className="max-w-4xl">
  <div className="max-w-6xl">

// CORRETO
<AdminLayout>
  <div className="w-full">
```

### ❌ Container dentro de container
```tsx
// ERRADO (redundante)
<AdminLayout>
  <div className="container mx-auto">
    <div className="max-w-7xl">

// CORRETO
<AdminLayout>
  <div className="w-full">
```

## 📋 Checklist de Implementação

Ao criar ou modificar uma página admin:

- [ ] Usa `AdminLayout` como wrapper
- [ ] Usa `AdminRoute` para proteção
- [ ] Container principal tem `w-full`
- [ ] Padding é responsivo (`p-4 sm:p-6 lg:p-8`)
- [ ] Texto é responsivo quando apropriado
- [ ] Grid/Flex adaptam em diferentes breakpoints
- [ ] Testado em mobile, tablet e desktop
- [ ] Sem overflow horizontal em mobile
- [ ] Scroll funciona corretamente

## 🔄 Manutenção

**Última atualização:** 06/11/2024  
**Responsável:** Time de Desenvolvimento  
**Próxima revisão:** Quando adicionar novos componentes

---

## 📞 Dúvidas?

Consulte:
- `src/components/ui/containers/AuthContainer.tsx` - Container de autenticação
- `src/components/admin/AdminLayout.tsx` - Layout principal do admin
- Exemplos em `src/pages/Admin*.tsx` - Páginas já implementadas
