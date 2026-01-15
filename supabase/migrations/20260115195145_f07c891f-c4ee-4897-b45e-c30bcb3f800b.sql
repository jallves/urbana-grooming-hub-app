-- Corrigir o PIN do Totem para 7487 usando hash SHA-256 correto
-- O frontend usa crypto.subtle.digest('SHA-256', ...) para validar

-- Desativar registros antigos
UPDATE public.totem_auth SET is_active = false;

-- Inserir ou atualizar com o hash SHA-256 correto de "7487"
-- Hash SHA-256 de "7487" = 2baab0452bed0c8f2d0ccff962de00a6e9c1eb3f6714ca64f2d24807f9bdaf21
INSERT INTO public.totem_auth (id, pin_hash, is_active, created_at)
VALUES (
  '5a277d66-18bb-47b7-9e85-18d7857f5eb8',
  '2baab0452bed0c8f2d0ccff962de00a6e9c1eb3f6714ca64f2d24807f9bdaf21',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  pin_hash = '2baab0452bed0c8f2d0ccff962de00a6e9c1eb3f6714ca64f2d24807f9bdaf21',
  is_active = true;