
# Padrões de Código - Barbearia Costa Urbana

Este documento define os padrões de código, convenções e melhores práticas para o projeto.

## Estrutura de Arquivos

### Organização de Pastas
```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes de interface base
│   ├── admin/           # Componentes específicos do admin
│   ├── barber/          # Componentes específicos do barbeiro
│   └── client/          # Componentes específicos do cliente
├── hooks/               # Hooks personalizados
│   ├── barber/         # Hooks específicos do barbeiro
│   └── admin/          # Hooks específicos do admin
├── lib/                # Utilitários e configurações
│   ├── validation/     # Esquemas de validação
│   └── utils/          # Funções utilitárias
├── types/              # Definições de tipos TypeScript
└── contexts/           # Contextos React
```

### Convenções de Nomenclatura

#### Arquivos e Pastas
- **Componentes**: PascalCase (`BarberAppointments.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useBarberAppointments.ts`)
- **Utilitários**: camelCase (`dateUtils.ts`)
- **Tipos**: camelCase (`appointmentTypes.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

#### Variáveis e Funções
- **Variáveis**: camelCase (`appointmentList`)
- **Funções**: camelCase (`handleSubmit`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_ATTEMPTS`)
- **Componentes**: PascalCase (`AppointmentCard`)

#### Interfaces e Types
- **Interfaces**: PascalCase com sufixo `Interface` ou descrição clara (`AppointmentData`)
- **Types**: PascalCase (`AppointmentStatus`)
- **Enums**: PascalCase (`AppointmentStatusEnum`)

## Estrutura de Componentes

### Template Base
```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
  children?: React.ReactNode;
  // Outras props específicas
}

const ComponentName: React.FC<ComponentNameProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("base-classes", className)} {...props}>
      {children}
    </div>
  );
};

export default ComponentName;
```

### Props e Interfaces
```typescript
// ✅ Boa prática
interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  onComplete: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  className?: string;
  isLoading?: boolean;
}

// ❌ Evitar
interface Props {
  data: any;
  onClick: Function;
}
```

## Hooks Personalizados

### Estrutura Recomendada
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFeatureOptions {
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseFeatureReturn {
  data: DataType | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // Ações específicas
  handleAction: (param: string) => Promise<void>;
}

export const useFeature = (options: UseFeatureOptions = {}): UseFeatureReturn => {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const refetch = useCallback(async () => {
    if (!options.enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchData();
      setData(result);
      options.onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [options, toast]);

  const handleAction = useCallback(async (param: string) => {
    // Implementação da ação
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    handleAction,
  };
};
```

## Validação com Zod

### Estrutura de Esquemas
```typescript
import { z } from 'zod';

// Esquemas base
const baseAppointmentSchema = z.object({
  client_id: z.string().uuid("ID do cliente deve ser um UUID válido"),
  service_id: z.string().uuid("ID do serviço deve ser um UUID válido"),
  staff_id: z.string().uuid("ID do barbeiro deve ser um UUID válido"),
  notes: z.string().optional(),
});

// Esquemas específicos
export const createAppointmentSchema = baseAppointmentSchema.extend({
  scheduled_date: z.string().refine(
    (date) => new Date(date) > new Date(),
    "Data deve ser futura"
  ),
  scheduled_time: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Horário deve estar no formato HH:MM"
  ),
});

export const updateAppointmentSchema = baseAppointmentSchema.partial().extend({
  id: z.string().uuid("ID deve ser um UUID válido"),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show']).optional(),
});

// Tipos derivados
export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;
```

## Tratamento de Erros

### Estrutura Padrão
```typescript
interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

const handleError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
) => {
  const {
    showToast = true,
    logError = true,
    fallbackMessage = "Ocorreu um erro inesperado"
  } = options;

  let message = fallbackMessage;
  let details = '';

  if (error instanceof Error) {
    message = error.message;
    details = error.stack || '';
  } else if (typeof error === 'string') {
    message = error;
  }

  if (logError) {
    console.error('Error:', { message, details, timestamp: new Date().toISOString() });
  }

  if (showToast) {
    toast({
      title: "Erro",
      description: message,
      variant: "destructive",
    });
  }

  return { message, details };
};
```

## Estilização com Tailwind

### Classes Base
```typescript
// ✅ Usar classes semânticas
const cardStyles = "bg-card text-card-foreground rounded-lg shadow-sm border";
const buttonStyles = "bg-primary text-primary-foreground hover:bg-primary/90";

// ❌ Evitar classes diretas
const cardStyles = "bg-white text-black rounded-lg shadow-sm border-gray-200";
```

### Componentes Condicionais
```typescript
const getStatusStyles = (status: AppointmentStatus) => {
  const baseStyles = "px-2 py-1 rounded-full text-xs font-medium";
  
  switch (status) {
    case 'scheduled':
      return cn(baseStyles, "bg-blue-100 text-blue-800");
    case 'completed':
      return cn(baseStyles, "bg-green-100 text-green-800");
    case 'cancelled':
      return cn(baseStyles, "bg-red-100 text-red-800");
    default:
      return cn(baseStyles, "bg-gray-100 text-gray-800");
  }
};
```

## Testes

### Estrutura de Testes
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from '../ComponentName';
import { createMockData } from '@/lib/test-utils';

describe('ComponentName', () => {
  const mockProps = {
    data: createMockData(),
    onAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<ComponentName {...mockProps} />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<ComponentName {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockProps.onAction).toHaveBeenCalledWith(expectedParam);
    });
  });

  it('should handle loading state', () => {
    render(<ComponentName {...mockProps} isLoading={true} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const errorMessage = 'Test error message';
    render(<ComponentName {...mockProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
```

### Testes de Hooks
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from '../useCustomHook';

describe('useCustomHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useCustomHook());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.performAction();
    });
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## Performance

### Otimizações Recomendadas
```typescript
// Memoização de componentes
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Renderização custosa
});

// Memoização de valores
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Memoização de callbacks
const memoizedCallback = useCallback((param: string) => {
  // Lógica do callback
}, [dependency]);

// Lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

## Acessibilidade

### Práticas Recomendadas
```typescript
// Labels e descrições
<button
  aria-label="Concluir agendamento"
  aria-describedby="appointment-description"
  onClick={handleComplete}
>
  <CheckIcon />
</button>

// Navegação por teclado
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Clique aqui
</div>

// Estados de loading
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Processando...' : 'Salvar'}
</button>
```

## Segurança

### Sanitização de Dados
```typescript
import { sanitizeInput } from '@/lib/utils/sanitization';

const handleSubmit = (formData: FormData) => {
  const sanitizedData = {
    name: sanitizeInput(formData.name),
    email: sanitizeInput(formData.email),
    // Outros campos
  };
  
  // Processar dados sanitizados
};
```

### Validação de Permissões
```typescript
const canPerformAction = (userRole: string, requiredRole: string) => {
  const roleHierarchy = ['client', 'barber', 'admin'];
  const userIndex = roleHierarchy.indexOf(userRole);
  const requiredIndex = roleHierarchy.indexOf(requiredRole);
  
  return userIndex >= requiredIndex;
};
```

## Documentação

### Comentários JSDoc
```typescript
/**
 * Hook personalizado para gerenciar agendamentos do barbeiro
 * @param barberId - ID do barbeiro
 * @param options - Opções de configuração
 * @returns Estado e ações para agendamentos
 * @example
 * ```typescript
 * const { appointments, handleComplete } = useBarberAppointments('barber-id');
 * ```
 */
export const useBarberAppointments = (
  barberId: string,
  options: UseBarberAppointmentsOptions = {}
): UseBarberAppointmentsReturn => {
  // Implementação
};
```

### README de Componentes
Cada pasta de componentes deve ter um README.md com:
- Descrição do propósito
- Props e tipos
- Exemplos de uso
- Dependências
- Testes relacionados

## Checklist de Code Review

### Antes de Commitar
- [ ] Código segue padrões de nomenclatura
- [ ] Componentes são pequenos e focados
- [ ] Hooks são reutilizáveis e bem documentados
- [ ] Tratamento de erros está implementado
- [ ] Validação de dados está presente
- [ ] Testes unitários estão escritos
- [ ] Acessibilidade foi considerada
- [ ] Performance foi otimizada quando necessário
- [ ] Documentação está atualizada

### Durante Code Review
- [ ] Lógica de negócio está correta
- [ ] Não há vazamentos de memória
- [ ] Estados são gerenciados adequadamente
- [ ] Tipos TypeScript são precisos
- [ ] Segurança foi considerada
- [ ] UX/UI está consistente
- [ ] Código é legível e maintível

Este documento deve ser atualizado conforme o projeto evolui e novas práticas são adotadas.
