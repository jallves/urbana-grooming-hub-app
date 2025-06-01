
import { sanitizeInput, validateEmail, validatePhone, validateName } from './security';

// Enhanced input validation with detailed error messages
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateClientRegistration = (data: {
  name: string;
  email: string;
  phone: string;
  birth_date?: string;
  password: string;
  confirmPassword: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Sanitize inputs
  const sanitizedName = sanitizeInput(data.name);
  const sanitizedEmail = sanitizeInput(data.email);
  const sanitizedPhone = sanitizeInput(data.phone);

  // Validate name
  if (!validateName(sanitizedName)) {
    errors.push('Nome deve ter pelo menos 2 caracteres e não conter caracteres especiais');
  }

  // Validate email
  if (!validateEmail(sanitizedEmail)) {
    errors.push('Email deve ter um formato válido');
  }

  // Validate phone
  if (!validatePhone(sanitizedPhone)) {
    errors.push('Telefone deve ter formato válido (10-20 caracteres)');
  }

  // Validate birth date if provided
  if (data.birth_date) {
    const birthDate = new Date(data.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 14) {
      errors.push('Idade mínima é de 14 anos');
    }
    
    if (age > 120) {
      errors.push('Data de nascimento inválida');
    }
  }

  // Validate passwords match
  if (data.password !== data.confirmPassword) {
    errors.push('Senhas não coincidem');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateClientLogin = (data: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: string[] = [];

  const sanitizedEmail = sanitizeInput(data.email);

  if (!validateEmail(sanitizedEmail)) {
    errors.push('Email deve ter um formato válido');
  }

  if (!data.password || data.password.length < 1) {
    errors.push('Senha é obrigatória');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateClientUpdate = (data: Partial<{
  name: string;
  email: string;
  phone: string;
  birth_date: string;
}>): ValidationResult => {
  const errors: string[] = [];

  if (data.name !== undefined) {
    const sanitizedName = sanitizeInput(data.name);
    if (!validateName(sanitizedName)) {
      errors.push('Nome deve ter pelo menos 2 caracteres e não conter caracteres especiais');
    }
  }

  if (data.email !== undefined) {
    const sanitizedEmail = sanitizeInput(data.email);
    if (!validateEmail(sanitizedEmail)) {
      errors.push('Email deve ter um formato válido');
    }
  }

  if (data.phone !== undefined) {
    const sanitizedPhone = sanitizeInput(data.phone);
    if (!validatePhone(sanitizedPhone)) {
      errors.push('Telefone deve ter formato válido');
    }
  }

  if (data.birth_date !== undefined) {
    const birthDate = new Date(data.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 14) {
      errors.push('Idade mínima é de 14 anos');
    }
    
    if (age > 120) {
      errors.push('Data de nascimento inválida');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
