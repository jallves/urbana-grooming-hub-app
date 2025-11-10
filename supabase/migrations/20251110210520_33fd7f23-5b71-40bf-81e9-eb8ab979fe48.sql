-- Atualizar barbeiros existentes com taxa de comissão padrão
UPDATE staff 
SET commission_rate = 40.00 
WHERE commission_rate IS NULL AND role = 'barber';

UPDATE employees 
SET commission_rate = 40.00 
WHERE commission_rate IS NULL AND role = 'barber';