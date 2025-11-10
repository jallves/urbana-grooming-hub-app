-- Adicionar campo commission_rate nas tabelas de funcionários

-- Adicionar na tabela employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 40.00 
CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Adicionar na tabela staff
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 40.00 
CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Comentários
COMMENT ON COLUMN employees.commission_rate IS 'Taxa de comissão do funcionário (0-100%)';
COMMENT ON COLUMN staff.commission_rate IS 'Taxa de comissão do barbeiro (0-100%)';