import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RetryOperationProps {
  operation: () => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
  operationName?: string;
  children?: React.ReactNode;
}

export const RetryOperation: React.FC<RetryOperationProps> = ({
  operation,
  onSuccess,
  onError,
  maxRetries = 3,
  retryDelay = 1000,
  operationName = 'operação',
  children,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const executeWithRetry = async (attemptNumber: number = 1): Promise<any> => {
    try {
      console.log(`🔄 Tentativa ${attemptNumber}/${maxRetries} - ${operationName}`);
      const result = await operation();
      
      console.log(`✅ ${operationName} executada com sucesso`);
      setLastError(null);
      setRetryCount(0);
      onSuccess?.(result);
      
      return result;
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attemptNumber}:`, error);
      const err = error instanceof Error ? error : new Error(String(error));
      setLastError(err);

      if (attemptNumber < maxRetries) {
        setRetryCount(attemptNumber);
        toast.warning(`Tentativa ${attemptNumber} falhou`, {
          description: `Tentando novamente em ${retryDelay / 1000}s...`,
        });

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return executeWithRetry(attemptNumber + 1);
      } else {
        console.error(`❌ Todas as ${maxRetries} tentativas falharam`);
        toast.error(`Erro ao executar ${operationName}`, {
          description: `Após ${maxRetries} tentativas. Tente novamente ou procure ajuda.`,
          duration: 6000,
        });
        onError?.(err);
        throw err;
      }
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await executeWithRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (children) {
    return (
      <div onClick={handleRetry} className="cursor-pointer">
        {children}
      </div>
    );
  }

  if (!lastError) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-destructive/10 border-2 border-destructive rounded-lg">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h3 className="text-xl font-bold text-destructive mb-2">
        Erro ao executar {operationName}
      </h3>
      <p className="text-muted-foreground text-center mb-4">
        {lastError.message}
      </p>
      {retryCount > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Tentativa {retryCount}/{maxRetries}
        </p>
      )}
      <Button
        onClick={handleRetry}
        disabled={isRetrying}
        variant="destructive"
        size="lg"
      >
        {isRetrying ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Tentando novamente...
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5 mr-2" />
            Tentar Novamente
          </>
        )}
      </Button>
    </div>
  );
};

/**
 * Hook para executar operações com retry
 */
export const useRetryOperation = (maxRetries: number = 3, retryDelay: number = 1000) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async <T,>(
    operation: () => Promise<T>,
    operationName: string = 'operação'
  ): Promise<T | null> => {
    setIsExecuting(true);
    setError(null);

    const executeAttempt = async (attemptNumber: number): Promise<T | null> => {
      try {
        console.log(`🔄 Tentativa ${attemptNumber}/${maxRetries} - ${operationName}`);
        const result = await operation();
        console.log(`✅ ${operationName} executada com sucesso`);
        return result;
      } catch (err) {
        console.error(`❌ Erro na tentativa ${attemptNumber}:`, err);
        const error = err instanceof Error ? err : new Error(String(err));

        if (attemptNumber < maxRetries) {
          toast.warning(`Tentativa ${attemptNumber} falhou`, {
            description: `Tentando novamente em ${retryDelay / 1000}s...`,
          });

          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return executeAttempt(attemptNumber + 1);
        } else {
          toast.error(`Erro ao executar ${operationName}`, {
            description: `Após ${maxRetries} tentativas. Tente novamente.`,
            duration: 6000,
          });
          setError(error);
          return null;
        }
      }
    };

    try {
      const result = await executeAttempt(1);
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  return { execute, isExecuting, error };
};
