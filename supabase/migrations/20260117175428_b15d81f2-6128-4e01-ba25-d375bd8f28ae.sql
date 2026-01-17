
-- Inserir dois funcionários barbeiros com 40% de comissão
INSERT INTO employees (name, email, phone, role, commission_rate, is_active, status)
VALUES 
  ('Carlos Firme Pereira Dos Santos', 'studiocarlosfirme@gmail.com', '27999913295', 'barber', 40, true, 'active'),
  ('Thomas Jefferson Andrade Conceição do Nascimento', 'ursocara2@gmail.com', '27981342735', 'barber', 40, true, 'active');

-- Também inserir na tabela staff para que apareçam como barbeiros disponíveis
INSERT INTO staff (name, email, phone, role, commission_rate, is_active)
VALUES 
  ('Carlos Firme Pereira Dos Santos', 'studiocarlosfirme@gmail.com', '27999913295', 'barber', 40, true),
  ('Thomas Jefferson Andrade Conceição do Nascimento', 'ursocara2@gmail.com', '27981342735', 'barber', 40, true);
