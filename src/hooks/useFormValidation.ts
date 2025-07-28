
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';

interface ValidationError {
  field: string;
  message: string;
}

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (errors: ValidationError[]) => void;
}

export const useFormValidation = <T>({ 
  schema, 
  onSuccess, 
  onError 
}: UseFormValidationOptions<T>) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data: unknown) => {
    setIsValidating(true);
    setErrors([]);

    try {
      const validatedData = schema.parse(data);
      
      if (onSuccess) {
        await onSuccess(validatedData);
      }
      
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        setErrors(validationErrors);
        
        if (onError) {
          onError(validationErrors);
        }
        
        // Mostrar primeiro erro como toast
        if (validationErrors.length > 0) {
          toast.error('Erro de validação', {
            description: validationErrors[0].message,
            duration: 4000,
          });
        }
        
        return { success: false, errors: validationErrors };
      }
      
      toast.error('Erro de validação', {
        description: 'Erro inesperado na validação dos dados',
        duration: 4000,
      });
      
      return { success: false, errors: [{ field: 'general', message: 'Erro inesperado' }] };
    } finally {
      setIsValidating(false);
    }
  }, [schema, onSuccess, onError]);

  const getFieldError = useCallback((field: string) => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  const hasError = useCallback((field: string) => {
    return errors.some(error => error.field === field);
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  return {
    validate,
    errors,
    isValidating,
    getFieldError,
    hasError,
    clearErrors,
    clearFieldError
  };
};
