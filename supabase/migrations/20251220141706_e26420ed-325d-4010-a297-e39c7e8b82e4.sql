-- Atualizar com o hash SHA-256 correto de "7487" calculado pelo PostgreSQL
UPDATE totem_auth 
SET pin_hash = '2baab0452bed0c8f2d0ccff962de00a6e9c1eb3f6714ca64f2d24807f9bdaf21',
    updated_at = now()
WHERE id = '5a277d66-18bb-47b7-9e85-18d7857f5eb8';