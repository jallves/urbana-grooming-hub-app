
-- Update prices and names for existing services
UPDATE painel_servicos SET nome = 'Corte e Barba', preco = 100.00, updated_at = now() WHERE id = '4d08d439-f833-4ab5-b52b-fd5c33b85570';
UPDATE painel_servicos SET nome = 'Alisamento e Corte', preco = 155.00, updated_at = now() WHERE id = '8dac5e95-3af7-421b-9928-75638a1def7b';
UPDATE painel_servicos SET preco = 110.00, updated_at = now() WHERE id = '848fe274-9aea-4c44-96fd-f3d28a3fd589';
UPDATE painel_servicos SET preco = 55.00, updated_at = now() WHERE id = '9470c60a-97c7-4275-91d2-b2d58dd0a63a';
UPDATE painel_servicos SET nome = 'Barba e Sobrancelha', preco = 80.00, updated_at = now() WHERE id = 'c9b46329-d444-4ce2-b175-82a7c0fe25c1';
UPDATE painel_servicos SET nome = 'Barba e Tonalização', preco = 130.00, updated_at = now() WHERE id = 'aa0e5064-f260-4b87-b65b-02ccac5295d4';
UPDATE painel_servicos SET preco = 90.00, updated_at = now() WHERE id = 'f6a7d24a-8753-4f7a-83ce-a294f9f29183';
UPDATE painel_servicos SET preco = 145.00, updated_at = now() WHERE id = 'deea0def-bcf7-461f-bcc5-e6c96ddf9a97';
UPDATE painel_servicos SET preco = 55.00, updated_at = now() WHERE id = '88147ab2-4f5f-4c88-98dc-226d158523a5';
UPDATE painel_servicos SET preco = 125.00, updated_at = now() WHERE id = '3c4cedc0-31b9-4ef3-8a30-2823f4a3aab1';
UPDATE painel_servicos SET nome = 'Corte e Sobrancelha', preco = 80.00, updated_at = now() WHERE id = '0e8c39bf-2405-42d9-bfb9-8b19238e0c3c';
UPDATE painel_servicos SET nome = 'Corte e Tonalização', preco = 135.00, updated_at = now() WHERE id = 'bc8e8d2c-fd01-4648-9a7b-47a62810c7a8';
UPDATE painel_servicos SET preco = 65.00, updated_at = now() WHERE id = 'b3909863-d606-44db-9aae-499a4b85e268';
UPDATE painel_servicos SET nome = 'Hidratação VO', updated_at = now() WHERE id = '1fb59dca-2a5d-4a4f-bc02-2a1d060ae748';
UPDATE painel_servicos SET preco = 145.00, updated_at = now() WHERE id = '7c610c30-7190-4c9e-a9a0-7aee5ad0520b';
UPDATE painel_servicos SET preco = 25.00, updated_at = now() WHERE id = '360c419c-d6f7-4b36-8851-ead4b153859d';
UPDATE painel_servicos SET preco = 199.99, updated_at = now() WHERE id = 'fcb47b55-f2cd-411a-8f94-280fa5f5fe0f';
UPDATE painel_servicos SET preco = 145.00, updated_at = now() WHERE id = 'b25ad9ca-40a3-482d-8c25-1d7f422972b5';
UPDATE painel_servicos SET nome = 'Selagem e Corte', preco = 185.00, updated_at = now() WHERE id = '61448d4a-4726-4355-868b-7e8bd507d169';
UPDATE painel_servicos SET preco = 30.00, updated_at = now() WHERE id = '8193e8e6-7db3-42f8-bd27-5ad2b93dedcb';
UPDATE painel_servicos SET preco = 90.00, updated_at = now() WHERE id = '85b0c1e0-6a97-4245-bbf3-bafcb0cf89bf';
UPDATE painel_servicos SET preco = 95.00, updated_at = now() WHERE id = 'f758b0d4-5722-4b51-98b2-a88a577f3a2a';

-- Deactivate 12 services not in the new list
UPDATE painel_servicos SET is_active = false, ativo = false, updated_at = now() WHERE id IN (
  'ab80fc9b-6ce4-4f56-bf7f-b27510c1bd1e',
  '4d93dbf9-7fc0-4a3b-a8f5-d400262a22a8',
  '1cd95ac3-85d8-45a3-87cd-55332c69f2d6',
  '8532271f-2491-4d2c-b9db-0df1a0d3d94a',
  '07a2c369-3c49-4047-b499-4bc067d245d6',
  '2091b549-eb3a-49ea-b7c6-890d6d27a88a',
  '6857c851-b919-4dd5-ae2b-3fda02f32af0',
  'e604ebbc-aeda-4f25-9670-5c7568e082b0',
  'f5b837fb-69ab-4655-a6de-1e43cd05b194',
  '30f52362-1483-42fc-b4fe-fe2b179e5152',
  '827d33ff-efb2-4287-8a4e-66fd6616bc8c',
  '6e02406f-55a1-4a2c-bbf2-13b31d974009'
);
