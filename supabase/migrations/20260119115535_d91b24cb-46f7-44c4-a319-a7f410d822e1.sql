-- Sincronizar fotos da tabela staff para painel_barbeiros
-- Isso garante que as fotos atualizadas no admin apareçam no totem e painel do cliente

UPDATE painel_barbeiros pb
SET 
  image_url = s.image_url, 
  foto_url = s.image_url
FROM staff s
WHERE pb.staff_id = s.id 
  AND s.image_url IS NOT NULL;