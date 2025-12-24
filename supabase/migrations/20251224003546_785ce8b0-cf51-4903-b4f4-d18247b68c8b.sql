
-- ============================================
-- Limpar usuários de teste do auth.users
-- Mantendo apenas: admins, barbeiros, e clientes reais (Emily e Bruna)
-- ============================================

-- Deletar usuários de teste (isso também remove da auth.users por cascade)
DELETE FROM auth.users 
WHERE email IN (
  'belfordimports@gmail.com',
  'beltecsolucoes@gmail.com',
  'eletrismartweb@gmail.com',
  'gdlcipa@gmail.com',
  'jbcolimoides@gmail.com',
  'jhoaoallves84@gmail.com',
  'joao.alves@gdllogistica.com.br',
  'joaoosorio@gmail.com',
  'photos.colimoides@gmail.com',
  'samkcandido@gmail.com',
  'samuel.zinger@icloud.com',
  'veludinecandido@gmail.com'
);
