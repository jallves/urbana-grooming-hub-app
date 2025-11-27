-- Deletar barbeiros fake e todos os dados relacionados

-- 1. Deletar comissões dos barbeiros fake
DELETE FROM barber_commissions 
WHERE barber_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 2. Deletar comissões antigas
DELETE FROM comissoes 
WHERE barbeiro_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 3. Deletar horários de trabalho
DELETE FROM working_hours 
WHERE staff_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 4. Deletar folgas
DELETE FROM time_off 
WHERE staff_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 5. Deletar disponibilidade
DELETE FROM barber_availability 
WHERE barber_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 6. Deletar registros financeiros
DELETE FROM financial_records 
WHERE barber_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 7. Deletar da tabela barbers_2
DELETE FROM barbers_2 
WHERE staff_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 8. Deletar avaliações
DELETE FROM client_reviews 
WHERE staff_id IN (
  SELECT id FROM staff 
  WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves')
);

-- 9. Deletar os barbeiros da tabela staff
DELETE FROM staff 
WHERE name IN ('Carlos Barbosa', 'Guilherme Colimoide', 'Guilherme Alves');

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Barbeiros fake removidos com sucesso!';
  RAISE NOTICE '🗑️ Carlos Barbosa e Guilherme Colimoide/Alves foram deletados';
  RAISE NOTICE '📋 Todos os dados relacionados foram removidos';
END $$;