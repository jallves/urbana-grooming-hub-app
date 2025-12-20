-- Atualizar o PIN do totem de 1234 para 7487
-- Hash SHA-256 de "7487" = a8cfcd74832004951b4408cdb0a5dbcd8c7e52d43f7fe244bf720582e05241da
UPDATE totem_auth 
SET pin_hash = 'a8cfcd74832004951b4408cdb0a5dbcd8c7e52d43f7fe244bf720582e05241da',
    updated_at = now()
WHERE id = '5a277d66-18bb-47b7-9e85-18d7857f5eb8';