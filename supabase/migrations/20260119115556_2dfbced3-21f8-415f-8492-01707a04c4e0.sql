-- Sincronizar fotos da tabela staff para painel_barbeiros usando correspondência por nome
-- e também vincular staff_id onde possível

-- Primeiro, vincular staff_id onde há correspondência por nome
UPDATE painel_barbeiros pb
SET staff_id = s.id
FROM staff s
WHERE pb.staff_id IS NULL 
  AND (
    LOWER(pb.nome) LIKE LOWER(s.name) || '%'
    OR LOWER(s.name) LIKE LOWER(SPLIT_PART(pb.nome, ' ', 1)) || '%'
  );

-- Depois, sincronizar as fotos
UPDATE painel_barbeiros pb
SET 
  image_url = s.image_url, 
  foto_url = s.image_url
FROM staff s
WHERE pb.staff_id = s.id 
  AND s.image_url IS NOT NULL;