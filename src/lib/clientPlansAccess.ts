// Temporário: módulo Planos liberado somente para estes e-mails de cliente.
export const PLANS_ALLOWED_EMAILS = ['belfordimports@gmail.com'];

export const canAccessClientPlans = (email?: string | null) =>
  !!email && PLANS_ALLOWED_EMAILS.includes(email.trim().toLowerCase());
