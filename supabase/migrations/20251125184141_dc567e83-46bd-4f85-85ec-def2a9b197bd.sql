-- Adicionar política RLS para permitir que usuários criem seu próprio perfil durante cadastro
CREATE POLICY "Users can insert own profile"
ON public.client_profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Comentário: Esta política permite que um usuário recém-criado insira seu próprio perfil
-- O id deve corresponder ao auth.uid() do usuário autenticado