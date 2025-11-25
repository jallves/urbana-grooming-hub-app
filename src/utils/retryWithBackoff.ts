/**
 * Retry logic robusto com backoff exponencial
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Executa uma função com retry automático e backoff exponencial
 * @param fn Função async a ser executada
 * @param options Opções de configuração do retry
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
    shouldRetry = () => true,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Se é a última tentativa ou não deve fazer retry, lança o erro
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Callback de retry
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      console.warn(
        `🔄 [Retry ${attempt + 1}/${maxRetries}] Tentando novamente em ${delay}ms...`,
        {
          error: lastError.message,
          attempt: attempt + 1,
          delay,
        }
      );

      // Aguardar antes da próxima tentativa
      await sleep(delay);

      // Calcular próximo delay com backoff exponencial
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Verifica se um erro é recuperável (pode fazer retry)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const retryableMessages = [
    'network',
    'timeout',
    'fetch',
    'connection',
    'econnrefused',
    'enotfound',
    'etimedout',
  ];

  return retryableMessages.some((msg) => message.includes(msg));
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrapper para queries do Supabase com retry
 */
export async function supabaseQueryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(
    async () => {
      const { data, error } = await queryFn();
      
      if (error) {
        throw new Error(error.message || 'Supabase query failed');
      }
      
      if (!data) {
        throw new Error('No data returned from query');
      }
      
      return data;
    },
    {
      ...options,
      shouldRetry: (error) => {
        // Não fazer retry em erros de autenticação ou permissão
        const message = error.message.toLowerCase();
        if (message.includes('auth') || message.includes('permission')) {
          return false;
        }
        return isRetryableError(error);
      },
    }
  );
}
