
-- ============================================
-- Limpar barbeiros de teste do auth.users
-- Mantendo apenas: Carlos Firme e Thomas Jefferson
-- ============================================

-- Remover roles de barbeiro dos usuários de teste
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('carlos.barbosa@barbershop.com', 'guilherme.colimoide@gmail.com')
);

-- Deletar usuários de teste
DELETE FROM auth.users 
WHERE email IN (
  'carlos.barbosa@barbershop.com',
  'guilherme.colimoide@gmail.com'
);
