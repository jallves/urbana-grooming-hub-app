-- Vincular usuários existentes ao staff e adicionar roles

DO $$
DECLARE
  v_carlos_user_id UUID;
  v_guilherme_user_id UUID;
BEGIN
  -- Buscar user_id do Carlos
  SELECT id INTO v_carlos_user_id
  FROM auth.users
  WHERE email = 'carlos.barbosa@barbershop.com';
  
  -- Buscar user_id do Guilherme
  SELECT id INTO v_guilherme_user_id
  FROM auth.users
  WHERE email = 'guilherme.colimoide@gmail.com';
  
  -- Vincular Carlos ao staff
  IF v_carlos_user_id IS NOT NULL THEN
    UPDATE staff
    SET user_id = v_carlos_user_id
    WHERE id = '9a672063-08f4-4af4-aa0c-469d4503c10b';
    
    -- Adicionar role barber para Carlos
    INSERT INTO user_roles (user_id, role)
    VALUES (v_carlos_user_id, 'barber'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- Vincular Guilherme ao staff
  IF v_guilherme_user_id IS NOT NULL THEN
    UPDATE staff
    SET user_id = v_guilherme_user_id
    WHERE id = 'e396adc9-c83f-432d-a5ba-f8202dd054a7';
    
    -- Adicionar role barber para Guilherme
    INSERT INTO user_roles (user_id, role)
    VALUES (v_guilherme_user_id, 'barber'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Barbeiros vinculados e roles adicionadas com sucesso!';
END $$;