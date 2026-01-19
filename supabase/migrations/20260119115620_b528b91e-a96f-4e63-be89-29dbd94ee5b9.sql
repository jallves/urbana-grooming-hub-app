-- Corrigir staff_id e sincronizar fotos usando correspondência por primeiro nome
UPDATE painel_barbeiros pb
SET 
  staff_id = s.id,
  image_url = s.image_url, 
  foto_url = s.image_url
FROM staff s
WHERE LOWER(SPLIT_PART(pb.nome, ' ', 1)) = LOWER(SPLIT_PART(s.name, ' ', 1))
  AND s.image_url IS NOT NULL;