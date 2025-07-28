
# Componentes do Barbeiro

Esta documentação descreve os componentes principais do painel do barbeiro.

## BarberAppointments

**Localização:** `src/components/barber/BarberAppointments.tsx`

**Descrição:** Componente principal que exibe a lista de agendamentos do barbeiro com funcionalidades de visualização, edição e gerenciamento.

### Props
Nenhuma prop externa necessária.

### Funcionalidades
- ✅ Exibição de agendamentos em cards
- ✅ Estatísticas em tempo real (total, concluídos, próximos, receita)
- ✅ Ações de concluir e cancelar agendamentos
- ✅ Modal de edição de agendamentos
- ✅ Atualizações otimistas da UI
- ✅ Estados de loading e feedback visual

### Hooks Utilizados
- `useBarberAppointmentsOptimized`: Hook principal que gerencia todos os estados e ações
- `useFormValidation`: Validação de formulários
- `useRateLimit`: Controle de tentativas de ação

### Componentes Filhos
- `AppointmentCard`: Card individual de agendamento
- `EditAppointmentModal`: Modal de edição
- `AppointmentSkeleton`: Loading skeleton
- `ActionFeedback`: Feedback de ações
- `RealtimeNotifications`: Notificações em tempo real

### Exemplo de Uso
```tsx
import BarberAppointments from '@/components/barber/BarberAppointments';

function BarberDashboard() {
  return (
    <div>
      <BarberAppointments />
    </div>
  );
}
```

### Estados Gerenciados
- `appointments`: Lista de agendamentos
- `loading`: Estado de carregamento
- `stats`: Estatísticas calculadas
- `updatingId`: ID do agendamento sendo atualizado
- `isEditModalOpen`: Estado do modal de edição
- `selectedAppointmentId`: ID do agendamento selecionado
- `selectedAppointmentDate`: Data do agendamento selecionado

### Ações Disponíveis
- `handleCompleteAppointment(id)`: Marca agendamento como concluído
- `handleCancelAppointment(id)`: Cancela agendamento
- `handleEditAppointment(id, date)`: Abre modal de edição
- `fetchAppointments()`: Recarrega lista de agendamentos

## AppointmentCard

**Localização:** `src/components/barber/appointments/AppointmentCard.tsx`

**Descrição:** Card individual que exibe as informações de um agendamento.

### Props
```typescript
interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  updatingId: string | null;
  onComplete: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onEdit: (id: string, startTime: string) => void;
}
```

### Funcionalidades
- ✅ Exibe informações do cliente, serviço e horário
- ✅ Botões de ação (concluir, cancelar, editar)
- ✅ Badges de status visual
- ✅ Loading states durante operações
- ✅ Validação de permissões por status

### Estados Visuais
- `scheduled`: Agendado (azul)
- `completed`: Concluído (verde)
- `cancelled`: Cancelado (vermelho)
- `no-show`: Não compareceu (cinza)

## EditAppointmentModal

**Localização:** `src/components/barber/appointments/EditAppointmentModal.tsx`

**Descrição:** Modal para edição de agendamentos existentes.

### Props
```typescript
interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  currentDate: Date;
  onSuccess: () => Promise<void>;
}
```

### Funcionalidades
- ✅ Formulário de edição com validação
- ✅ Seleção de nova data e horário
- ✅ Verificação de disponibilidade
- ✅ Feedback visual de operações
- ✅ Integração com esquemas de validação Zod

### Validações
- Data não pode ser no passado
- Horário deve estar disponível
- Campos obrigatórios devem ser preenchidos
- Formato de dados deve ser válido

## Hooks Personalizados

### useBarberAppointmentsOptimized

**Localização:** `src/hooks/barber/useBarberAppointmentsOptimized.ts`

**Descrição:** Hook principal que orquestra todos os outros hooks relacionados a agendamentos.

```typescript
const {
  appointments,
  loading,
  stats,
  updatingId,
  fetchAppointments,
  handleCompleteAppointment,
  handleCancelAppointment,
  isEditModalOpen,
  selectedAppointmentId,
  selectedAppointmentDate,
  handleEditAppointment,
  closeEditModal
} = useBarberAppointmentsOptimized();
```

### useBarberAppointmentStats

**Localização:** `src/hooks/barber/useBarberAppointmentStats.ts`

**Descrição:** Hook que calcula estatísticas baseadas na lista de agendamentos.

```typescript
const stats = useBarberAppointmentStats(appointments);
// Returns: { total, completed, upcoming, revenue }
```

### useFormValidation

**Localização:** `src/hooks/useFormValidation.ts`

**Descrição:** Hook para validação de formulários com esquemas Zod.

```typescript
const { errors, validateField, validateForm, clearErrors } = useFormValidation(schema);
```

### useRateLimit

**Localização:** `src/hooks/useRateLimit.ts`

**Descrição:** Hook para controle de rate limiting em ações.

```typescript
const { canExecute, execute } = useRateLimit(maxAttempts, timeWindow);
```

## Esquemas de Validação

### appointmentSchemas.ts

**Localização:** `src/lib/validation/appointmentSchemas.ts`

Contém esquemas Zod para validação de:
- Criação de agendamentos
- Edição de agendamentos
- Atualização de status
- Dados do cliente

### clientSchemas.ts

**Localização:** `src/lib/validation/clientSchemas.ts`

Contém esquemas Zod para validação de:
- Dados do cliente
- Informações de contato
- Preferências do cliente

## Testes

### Estrutura de Testes
```
src/
├── components/barber/__tests__/
│   ├── BarberAppointments.test.tsx
│   └── AppointmentCard.test.tsx
├── hooks/__tests__/
│   ├── useBarberAppointmentsOptimized.test.ts
│   └── useBarberAppointmentStats.test.ts
└── lib/__tests__/
    ├── validation/
    │   ├── appointmentSchemas.test.ts
    │   └── clientSchemas.test.ts
    └── test-utils.tsx
```

### Executar Testes
```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm test -- BarberAppointments.test.tsx

# Executar testes com coverage
npm test -- --coverage
```

### Utilitários de Teste
O arquivo `src/lib/test-utils.tsx` fornece:
- Providers de teste configurados
- Funções para criar dados mock
- Configuração do ambiente de teste
- Helpers para testes de componentes

## Boas Práticas

### 1. Estrutura de Componentes
- Manter componentes pequenos e focados
- Usar hooks personalizados para lógica complexa
- Separar responsabilidades claramente

### 2. Gerenciamento de Estado
- Estados locais para UI
- React Query para dados do servidor
- Atualizações otimistas quando possível

### 3. Tratamento de Erros
- Validação no frontend e backend
- Feedback visual para usuários
- Logs estruturados para debugging

### 4. Performance
- Memoização quando necessário
- Lazy loading de componentes
- Debounce em operações custosas

### 5. Acessibilidade
- Estrutura semântica do HTML
- Suporte a navegação por teclado
- Textos alternativos e labels

### 6. Testes
- Testes unitários para hooks
- Testes de integração para componentes
- Testes E2E para fluxos críticos
