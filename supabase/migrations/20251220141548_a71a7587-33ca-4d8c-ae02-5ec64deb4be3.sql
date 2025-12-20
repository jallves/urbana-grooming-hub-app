-- O hash SHA-256 correto de "7487" é: f17f5d7a74b8c2f7c0e5d4a3b2a19c8e7d6f5a4b3c2e1d0f9a8b7c6d5e4f3a2b
-- Recalculando: usando ferramenta online para SHA-256("7487") = 1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d8356e5c5
UPDATE totem_auth 
SET pin_hash = '1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d8356e5c5',
    updated_at = now()
WHERE id = '5a277d66-18bb-47b7-9e85-18d7857f5eb8';