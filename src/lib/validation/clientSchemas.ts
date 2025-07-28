
import { z } from 'zod';
import { sanitizeInput, validatePasswordStrength } from '@/lib/security';

// Schema para criar cliente
export const createClientSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres')
    .transform(sanitizeInput),
  email: z.string()
    .email('Email inválido')
    .transform(val => val.toLowerCase().trim()),
  whatsapp: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de WhatsApp inválido')
    .transform(sanitizeInput),
  data_nascimento: z.date()
    .refine(
      (date) => {
        const age = new Date().getFullYear() - date.getFullYear();
        return age >= 14 && age <= 120;
      },
      'Idade deve estar entre 14 e 120 anos'
    ),
  senha: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .refine(
      (password) => validatePasswordStrength(password).isValid,
      'Senha não atende aos critérios de segurança'
    ),
});

// Schema para atualizar cliente
export const updateClientSchema = z.object({
  id: z.string().uuid('ID do cliente inválido'),
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres')
    .transform(sanitizeInput)
    .optional(),
  email: z.string()
    .email('Email inválido')
    .transform(val => val.toLowerCase().trim())
    .optional(),
  whatsapp: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de WhatsApp inválido')
    .transform(sanitizeInput)
    .optional(),
  data_nascimento: z.date()
    .refine(
      (date) => {
        const age = new Date().getFullYear() - date.getFullYear();
        return age >= 14 && age <= 120;
      },
      'Idade deve estar entre 14 e 120 anos'
    )
    .optional(),
});

// Schema para login de cliente
export const clientLoginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .transform(val => val.toLowerCase().trim()),
  senha: z.string()
    .min(1, 'Senha é obrigatória'),
});

// Schema para alterar senha
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória'),
  new_password: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .refine(
      (password) => validatePasswordStrength(password).isValid,
      'Nova senha não atende aos critérios de segurança'
    ),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"],
});

// Schema para recuperar senha
export const recoverPasswordSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .transform(val => val.toLowerCase().trim()),
});

// Schema para filtros de cliente
export const clientFiltersSchema = z.object({
  search: z.string().optional().transform(val => val ? sanitizeInput(val) : undefined),
  sortBy: z.enum(['nome', 'email', 'created_at']).default('nome'),
  order: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type CreateClientData = z.infer<typeof createClientSchema>;
export type UpdateClientData = z.infer<typeof updateClientSchema>;
export type ClientLoginData = z.infer<typeof clientLoginSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type RecoverPasswordData = z.infer<typeof recoverPasswordSchema>;
export type ClientFiltersData = z.infer<typeof clientFiltersSchema>;
