-- Garantir que o usuário master João tenha a role master na tabela user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES ('ee055e2c-1504-4c72-b3e5-fb4682f1b2db', 'master'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Garantir que ele também esteja na tabela admin_users
INSERT INTO public.admin_users (email, name, role, user_id)
VALUES ('joao.colimoides@gmail.com', 'João Coremodis', 'master', 'ee055e2c-1504-4c72-b3e5-fb4682f1b2db')
ON CONFLICT (email) DO UPDATE 
SET role = 'master', user_id = 'ee055e2c-1504-4c72-b3e5-fb4682f1b2db';